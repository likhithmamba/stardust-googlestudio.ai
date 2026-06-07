import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import clsx from 'clsx';
import { useStore, noteVisibleInMode, defaultNotePropsForMode } from '../store/useStore';
import { useMemo } from 'react';
import type { ViewMode } from '../constants';
import { useEngine } from '../hooks/useEngine';
import { ViewConstraints } from '../systems/ViewConstraints';
import { MiniMap } from './MiniMap';
import { PlanetNote } from './PlanetNote';
import { ConnectionLayer } from './ConnectionLayer';
import { BlackHole } from './BlackHole';
import { NOTE_STYLES, NoteType, REAL_SIZES, ALLOWED_TYPES_PER_MODE } from '../constants';
import { HierarchyOverlay } from '../features/hierarchy/HierarchyOverlay';
import { LinksOverlay } from '../features/links/LinksOverlay';
import { SearchTeleport } from './SearchTeleport';
import { ToastOverlay } from '../ui/feedback/ToastOverlay';
import { CanvasInputHandler } from '../ui/canvas/CanvasInputHandler';
import { useSettingsStore } from '../ui/settings/settingsStore';
import { SemanticZoomController } from './SemanticZoomController';
import { LayoutVisuals } from './LayoutVisuals';
import { StarfieldLayer } from './StarfieldLayer';
import { soundManager } from '../utils/sound';
import { Toolbar } from './Toolbar';
import { workerBridge } from '../workers/WorkerBridge';

// Mode Overlays
import { DecayOverlay } from './modes/DecayView';
import { NotesChoiceRing } from './NotesChoiceRing';
import { DashboardBackground } from './DashboardBackground';
import { EditorOverlay } from './EditorOverlay';
import { AppShell } from './AppShell';

// Per-mode Chrome Overlays
import { VoidChrome } from './chrome/VoidChrome';
import { OrbitalChrome } from './chrome/OrbitalChrome';
import { MatrixChrome } from './chrome/MatrixChrome';
import { PrismChrome } from './chrome/PrismChrome';
import { TimelineChrome } from './chrome/TimelineChrome';
import { ArchiveChrome } from './chrome/ArchiveChrome';

// Mode accent colors for transition announcements
const MODE_ACCENTS: Record<string, string> = {
    void: '#1919e6',
    orbital: '#6366f1',
    matrix: '#3b82f6',
    prism: '#a855f7',
    timeline: '#eebd2b',
    archive: '#10b981',
    free: '#6366f1',
};

export const CanvasViewport: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const notes = useStore((state) => state.notes);
    const connections = useStore((state) => state.connections);
    const viewport = useStore((state) => state.viewport);
    const setViewport = useStore((state) => state.setViewport);
    const addNote = useStore((state) => state.addNote);
    const addConnection = useStore((state) => state.addConnection);
    const updateNote = useStore((state) => state.updateNote);
    const deleteNote = useStore((state) => state.deleteNote);
    const softDeleteNote = useStore((state) => state.softDeleteNote);
    const selectedId = useStore((state) => state.selectedId);
    const setSelectedId = useStore((state) => state.setSelectedId);
    const selectedIds = useStore((state) => state.selectedIds);
    const setSelectedIds = useStore((state) => state.setSelectedIds);
    const takeSnapshot = useStore((state) => state.takeSnapshot);

    // Migrated: UI Toggles & Modes from SettingsStore
    const mode = useSettingsStore((state) => state.mode);
    const viewMode = useSettingsStore((state) => state.viewMode);
    const transitionPhase = useSettingsStore((state) => state.transitionPhase);
    const designSystem = useSettingsStore((state) => state.designSystem);

    // ENGINE INTEGRATION
    const engine = useEngine();

    // Derived Modes
    const proMode = mode === 'pro' || mode === 'ultra';

    // Layout Origin State
    const [layoutOrigin, setLayoutOrigin] = useState({ x: 0, y: 0 });

    // Origin Capture for Structured Modes
    useEffect(() => {
        if (viewMode !== 'free' && viewMode !== 'void') {
            setLayoutOrigin({ x: 0, y: 0 }); // Anchor to stable world origin (0,0)
        }
    }, [viewMode]);

    // Toggles
    const showHierarchy = useSettingsStore((state) => state.showHierarchy);
    const showLinks = useSettingsStore((state) => state.showLinks);
    const showMinimap = useStore((state) => state.showMinimap);
    const scaleMode = useStore((state) => state.scaleMode);

    // Interaction State
    const connectionStart = useStore((state) => state.connectionStart);
    const setConnectionStart = useStore((state) => state.setConnectionStart);
    const [tempConnectionEnd, setTempConnectionEnd] = useState<{ x: number; y: number } | null>(null);
    const [blackHoleActive, setBlackHoleActive] = useState(false);
    const [spacePressed, setSpacePressed] = useState(false);

    // Lasso Selection State
    const [lasso, setLasso] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);

    // Unified Genesis Ring (Creation) Menu State
    const [activeMenu, setActiveMenu] = useState<{ isOpen: boolean; x: number; y: number; worldX: number; worldY: number } | null>(null);

    // Track Spacebar for Panning
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
                return;
            }
            if (e.key === ' ' || e.code === 'Space') {
                setSpacePressed(true);
                e.preventDefault();
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.code === 'Space') {
                setSpacePressed(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleCreateNote = useCallback((type: NoteType, overrideX?: number, overrideY?: number) => {
        if (activeMenu || (overrideX !== undefined && overrideY !== undefined)) {
            const menu = activeMenu;

            let spawnX = overrideX !== undefined ? overrideX : menu?.worldX || 0;
            let spawnY = overrideY !== undefined ? overrideY : menu?.worldY || 0;
            let initialTags: string[] = [];

            if (viewMode !== 'free' && viewMode !== 'void') {
                const constraint = ViewConstraints.applyConstraints(
                    viewMode || 'free',
                    spawnX,
                    spawnY,
                    layoutOrigin,
                    { width: window.innerWidth, height: window.innerHeight }
                );

                spawnX = constraint.x;
                spawnY = constraint.y;

                if (constraint.dataUpdates) {
                    if (constraint.dataUpdates.tags) initialTags = constraint.dataUpdates.tags;
                }
            }

            const modeDefaults = defaultNotePropsForMode(viewMode);
            addNote({
                id: Math.random().toString(36).substr(2, 9),
                x: spawnX,
                y: spawnY,
                w: 0,
                h: 0,
                type: type,
                title: '',
                tags: initialTags,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                ...modeDefaults
            });
            soundManager.playClick();
            setActiveMenu(null);
        }
    }, [activeMenu, viewMode, layoutOrigin, addNote]);

    const handleSpawnTemplate = useCallback((targetMode: ViewMode) => {
        const CX = window.innerWidth / 2;
        const CY = window.innerHeight / 2;
        
        takeSnapshot();

        switch (targetMode) {
            case 'orbital': {
                const coreId = 'orbital-core-idea';
                const highId = 'orbital-high-action';
                const lowId = 'orbital-low-thought';
                addNote({
                    id: coreId,
                    x: CX - 50,
                    y: CY - 150,
                    w: 80,
                    h: 80,
                    type: NoteType.Sun,
                    title: 'Core Epic Theme 🌟',
                    content: 'This is the most critical item. In Orbital Mode, it stays locked near the center.',
                    priority: 'critical',
                    status: 'todo',
                    originMode: 'orbital',
                });
                addNote({
                    id: highId,
                    x: CX + 180,
                    y: CY - 80,
                    w: 64,
                    h: 64,
                    type: NoteType.Earth,
                    title: 'High Priority Task 🎯',
                    content: 'An important supporting action. Dragging it onto a different ring updates its priority.',
                    priority: 'high',
                    status: 'in-progress',
                    originMode: 'orbital',
                });
                addNote({
                    id: lowId,
                    x: CX - 220,
                    y: CY + 100,
                    w: 48,
                    h: 48,
                    type: NoteType.Moon,
                    title: 'Minor backlog item 💬',
                    content: 'A low priority nice-to-have suggestion.',
                    priority: 'low',
                    status: 'captured',
                    originMode: 'orbital',
                });
                addConnection({ id: 'orbit-c1', from: coreId, to: highId, label: 'requires' });
                addConnection({ id: 'orbit-c2', from: highId, to: lowId, label: 'suggested' });
                break;
            }
            case 'matrix': {
                addNote({
                    id: 'matrix-n1',
                    x: CX - 250,
                    y: CY - 180,
                    w: 60,
                    h: 60,
                    type: NoteType.Earth,
                    title: 'Do First 🔴',
                    content: 'Urgent and Important. Address these immediately.',
                    urgency: 'urgent',
                    importance: 'important',
                    status: 'in-progress',
                    originMode: 'matrix',
                });
                addNote({
                    id: 'matrix-n2',
                    x: CX + 150,
                    y: CY - 180,
                    w: 60,
                    h: 60,
                    type: NoteType.Jupiter,
                    title: 'Schedule / Strategy 📅',
                    content: 'Important but Not Urgent. Plan dedicated focus blocks for these.',
                    urgency: 'not-urgent',
                    importance: 'important',
                    status: 'todo',
                    originMode: 'matrix',
                });
                addNote({
                    id: 'matrix-n3',
                    x: CX - 250,
                    y: CY + 100,
                    w: 60,
                    h: 60,
                    type: NoteType.Moon,
                    title: 'Delegate 👥',
                    content: 'Urgent but Not Important. Delegate, automate, or reject.',
                    urgency: 'urgent',
                    importance: 'not-important',
                    status: 'review',
                    originMode: 'matrix',
                });
                addNote({
                    id: 'matrix-n4',
                    x: CX + 150,
                    y: CY + 100,
                    w: 60,
                    h: 60,
                    type: NoteType.Asteroid,
                    title: 'Delete / Archive 🗑️',
                    content: 'Neither Urgent nor Important. Drop them from your roadmap.',
                    urgency: 'not-urgent',
                    importance: 'not-important',
                    status: 'captured',
                    originMode: 'matrix',
                });
                break;
            }
            case 'prism': {
                addNote({
                    id: 'prism-todo',
                    x: window.innerWidth * 0.125 - 45,
                    y: window.innerHeight * 0.20,
                    w: 60,
                    h: 60,
                    type: NoteType.Asteroid,
                    title: 'Draft landing mockups 🎨',
                    content: 'Todo lane card. Drag right to promote status.',
                    status: 'todo',
                    originMode: 'prism',
                });
                addNote({
                    id: 'prism-ip',
                    x: window.innerWidth * 0.375 - 45,
                    y: window.innerHeight * 0.20,
                    w: 60,
                    h: 60,
                    type: NoteType.Earth,
                    title: 'Revamp physics formulas ⚙️',
                    content: 'Currently active work items belong in In Progress.',
                    status: 'in-progress',
                    originMode: 'prism',
                });
                addNote({
                    id: 'prism-review',
                    x: window.innerWidth * 0.625 - 45,
                    y: window.innerHeight * 0.20,
                    w: 60,
                    h: 60,
                    type: NoteType.Jupiter,
                    title: 'Peer code check 👁️',
                    content: 'Items undergoing QA review.',
                    status: 'review',
                    originMode: 'prism',
                });
                addNote({
                    id: 'prism-done',
                    x: window.innerWidth * 0.875 - 45,
                    y: window.innerHeight * 0.20,
                    w: 60,
                    h: 60,
                    type: NoteType.Sun,
                    title: 'Release update v2.5 🎉',
                    content: 'Completed objectives!',
                    status: 'done',
                    originMode: 'prism',
                });
                break;
            }
            case 'timeline': {
                const baseTime = Date.now();
                addNote({
                    id: 'time-m1',
                    x: CX - 300,
                    y: CY - 200,
                    w: 60,
                    h: 60,
                    type: NoteType.Asteroid,
                    title: 'Design Alpha 💡',
                    content: 'Initial brainstorming phase milestone.',
                    dueDate: baseTime - 4 * 24 * 60 * 60 * 1000,
                    status: 'done',
                    originMode: 'timeline',
                });
                addNote({
                    id: 'time-m2',
                    x: CX,
                    y: CY + 100,
                    w: 60,
                    h: 60,
                    type: NoteType.Earth,
                    title: 'Beta Release 🚀',
                    content: 'Stable working release milestone.',
                    dueDate: baseTime,
                    status: 'in-progress',
                    originMode: 'timeline',
                });
                addNote({
                    id: 'time-m3',
                    x: CX + 300,
                    y: CY - 200,
                    w: 60,
                    h: 60,
                    type: NoteType.Sun,
                    title: 'V1.0 Market launch 🏆',
                    content: 'Commercial public announcement and campaign.',
                    dueDate: baseTime + 6 * 24 * 60 * 60 * 1000,
                    status: 'todo',
                    originMode: 'timeline',
                });
                break;
            }
            case 'void':
            case 'free': {
                const rootId = 'void-root-brainstorm';
                const leaf1 = 'void-leaf-1';
                const leaf2 = 'void-leaf-2';
                addNote({
                    id: rootId,
                    x: CX - 50,
                    y: CY - 100,
                    w: 80,
                    h: 80,
                    type: NoteType.Nebula,
                    title: 'Organic Brainstorm 🌌',
                    content: 'Start with a central core node. Double click around it to expand ideas.',
                    status: 'captured',
                    originMode: 'void',
                });
                addNote({
                    id: leaf1,
                    x: CX - 200,
                    y: CY + 100,
                    w: 50,
                    h: 50,
                    type: NoteType.Jupiter,
                    title: 'Concept Branch A 🧩',
                    content: 'Sub-topic idea supporting the core theme.',
                    status: 'captured',
                    originMode: 'void',
                });
                addNote({
                    id: leaf2,
                    x: CX + 100,
                    y: CY + 120,
                    w: 50,
                    h: 50,
                    type: NoteType.Moon,
                    title: 'Concept Branch B 🔍',
                    content: 'Another sub-concept linked organically.',
                    status: 'captured',
                    originMode: 'void',
                });
                addConnection({ id: 'void-c1', from: rootId, to: leaf1 });
                addConnection({ id: 'void-c2', from: rootId, to: leaf2 });
                break;
            }
            default:
                break;
        }

        window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: `Spawned ${targetMode.toUpperCase()} template!`, type: 'success' } }));
    }, [addNote, addConnection, takeSnapshot]);

    // Linking System State
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; noteId: string } | null>(null);
    const [alignmentLines, setAlignmentLines] = useState<{ x?: number; y?: number } | null>(null);
    const [isDraggingNote, setIsDraggingNote] = useState(false);

    // Event Listener for CanvasInputHandler
    useEffect(() => {
        const handleOpenRadial = (e: any) => {
            const { x, y } = e.detail;
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const currentViewport = useStore.getState().viewport;
                const worldX = (x - rect.left - currentViewport.x) / currentViewport.zoom;
                const worldY = (y - rect.top - currentViewport.y) / currentViewport.zoom;

                if (viewMode === 'archive') {
                    window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Archive is read-only. Send notes here from other modes.', type: 'info' } }));
                    return;
                }

                const allowedTypes = ALLOWED_TYPES_PER_MODE[viewMode || 'void'] || ALLOWED_TYPES_PER_MODE['void'];
                if (allowedTypes.length === 1) {
                    handleCreateNote(allowedTypes[0], worldX, worldY);
                    return;
                }

                setActiveMenu({
                    isOpen: true,
                    x: x - rect.left,
                    y: y - rect.top,
                    worldX,
                    worldY
                });
                soundManager.playClick();
            }
        };

        const handleOpenSpherical = (e: any) => {
            const { x, y } = e.detail;
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const currentViewport = useStore.getState().viewport;
                const worldX = (x - rect.left - currentViewport.x) / currentViewport.zoom;
                const worldY = (y - rect.top - currentViewport.y) / currentViewport.zoom;

                if (viewMode === 'archive') {
                    window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Archive is read-only. Send notes here from other modes.', type: 'info' } }));
                    return;
                }

                const allowedTypes = ALLOWED_TYPES_PER_MODE[viewMode || 'void'] || ALLOWED_TYPES_PER_MODE['void'];
                if (allowedTypes.length === 1) {
                    handleCreateNote(allowedTypes[0], worldX, worldY);
                    return;
                }

                setActiveMenu({
                    isOpen: true,
                    x: x - rect.left,
                    y: y - rect.top,
                    worldX,
                    worldY
                });
                soundManager.playClick();
            }
        };

        const handleCreateBlackHole = (e: any) => {
            const { x, y } = e.detail;
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const currentViewport = useStore.getState().viewport;
                const worldX = (x - rect.left - currentViewport.x) / currentViewport.zoom;
                const worldY = (y - rect.top - currentViewport.y) / currentViewport.zoom;

                handleCreateNote(NoteType.BlackHole, worldX, worldY);
            }
        };

        const handleCreateStandardNote = (e: any) => {
            const { x, y } = e.detail;
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const currentViewport = useStore.getState().viewport;
                const worldX = (x - rect.left - currentViewport.x) / currentViewport.zoom;
                const worldY = (y - rect.top - currentViewport.y) / currentViewport.zoom;

                handleCreateNote(NoteType.Earth, worldX, worldY);
            }
        };

        const handleCreateNoteAtCenter = () => {
            const currentViewport = useStore.getState().viewport;
            const worldX = (-currentViewport.x + window.innerWidth / 2) / currentViewport.zoom;
            const worldY = (-currentViewport.y + window.innerHeight / 2) / currentViewport.zoom;

            const allowedTypes = ALLOWED_TYPES_PER_MODE[viewMode || 'void'] || ALLOWED_TYPES_PER_MODE['void'];
            const type = allowedTypes[0] || NoteType.Asteroid;
            handleCreateNote(type, worldX, worldY);
        };

        window.addEventListener('stardust:openRadialMenu', handleOpenRadial);
        window.addEventListener('stardust:openSphericalMenu', handleOpenSpherical);
        window.addEventListener('stardust:createBlackHole', handleCreateBlackHole);
        window.addEventListener('stardust:createNoteAtCenter', handleCreateNoteAtCenter);
        window.addEventListener('stardust:createStandardNote', handleCreateStandardNote);

        return () => {
            window.removeEventListener('stardust:openRadialMenu', handleOpenRadial);
            window.removeEventListener('stardust:openSphericalMenu', handleOpenSpherical);
            window.removeEventListener('stardust:createBlackHole', handleCreateBlackHole);
            window.removeEventListener('stardust:createNoteAtCenter', handleCreateNoteAtCenter);
            window.removeEventListener('stardust:createStandardNote', handleCreateStandardNote);
            workerBridge.terminate();
        };
    }, [viewMode, handleCreateNote]); // Stable dependencies

    // Optimized Resize Handling
    const sizeRef = useRef({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                sizeRef.current = { width, height };
                if (canvasRef.current) {
                    const dpr = window.devicePixelRatio || 1;
                    canvasRef.current.width = width * dpr;
                    canvasRef.current.height = height * dpr;
                }
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [engine]);

    useEffect(() => {
        const handleClick = () => {
            setContextMenu(null);
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    useGesture({
        onDrag: ({ delta: [dx, dy], initial: [ix, iy], xy: [cx, cy], last, event }) => {
            const target = event.target as HTMLElement;

            if (connectionStart) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    const clientX = (event as any).clientX;
                    const clientY = (event as any).clientY;
                    const worldX = (clientX - rect.left - viewport.x) / viewport.zoom;
                    const worldY = (clientY - rect.top - viewport.y) / viewport.zoom;
                    setTempConnectionEnd({ x: worldX, y: worldY });
                }
                return;
            }

            if (!spacePressed && (target.closest('[data-note-id]') || target.closest('.handle-base'))) return;

            // Shift+Drag lasso selection!
            if (event.shiftKey && !spacePressed) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    if (last) {
                        setLasso(null);
                        return;
                    }
                    const startX = (ix - rect.left - viewport.x) / viewport.zoom;
                    const startY = (iy - rect.top - viewport.y) / viewport.zoom;
                    const currentX = (cx - rect.left - viewport.x) / viewport.zoom;
                    const currentY = (cy - rect.top - viewport.y) / viewport.zoom;

                    setLasso({ start: { x: startX, y: startY }, end: { x: currentX, y: currentY } });

                    const xMin = Math.min(startX, currentX);
                    const xMax = Math.max(startX, currentX);
                    const yMin = Math.min(startY, currentY);
                    const yMax = Math.max(startY, currentY);

                    const matchedIds = visibleNotes
                        .filter(n => n.x >= xMin && n.x <= xMax && n.y >= yMin && n.y <= yMax)
                        .map(n => n.id);

                    setSelectedIds(matchedIds);
                }
                return;
            }

            setViewport({ ...viewport, x: viewport.x + dx, y: viewport.y + dy });
        },
        onWheel: ({ delta: [dx, dy], ctrlKey, event }) => {
            // Plain scroll = zoom (natural, like Figma/Miro)
            // Ctrl+scroll = pan
            if (!ctrlKey) {
                const zoomFactor = dy > 0 ? 0.95 : 1.05;
                const newZoom = Math.max(0.1, Math.min(4.0, viewport.zoom * zoomFactor));

                // Cursor-centric zoom: zoom toward mouse position
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect && event) {
                    const mouseEvent = event as WheelEvent;
                    const mx = mouseEvent.clientX - rect.left;
                    const my = mouseEvent.clientY - rect.top;
                    const scale = newZoom / viewport.zoom;
                    const newX = mx - (mx - viewport.x) * scale;
                    const newY = my - (my - viewport.y) * scale;
                    setViewport({ x: newX, y: newY, zoom: newZoom });
                } else {
                    setViewport({ ...viewport, zoom: newZoom });
                }
            } else {
                // Ctrl+scroll = pan
                setViewport({ ...viewport, x: viewport.x - dx, y: viewport.y - dy });
            }
        },
        onPointerDown: ({ event }) => {
            const target = event.target as HTMLElement;
            if (target.closest('[data-note-id]')) return;
            // Prevent deselect if this is part of a double-click (which should open the ring)
            if (event.detail > 1) return;
            setSelectedId(undefined);
            setSelectedIds([]);
        },
        onPointerUp: ({ event }) => {
            setLasso(null);
            if (connectionStart) {
                checkConnectionDrop(event);
            }
        }
    }, {
        target: containerRef,
        eventOptions: { passive: false },
        drag: { filterTaps: true, threshold: 5 }
    });

    const handleNoteDragStart = useCallback((id: string) => {
        setIsDraggingNote(true);
        const worldNote = engine.getWorld().notes.get(id);
        if (worldNote) {
            worldNote.fixed = true;
            worldNote.vx = 0;
            worldNote.vy = 0;
        }
    }, [engine]);

    const handleNoteDrag = useCallback((id: string, x: number, y: number) => {
        const worldNote = engine.getWorld().notes.get(id);
        if (worldNote) {
            worldNote.x = x;
            worldNote.y = y;
        }

        const screenX = x * viewport.zoom + viewport.x;
        const screenY = y * viewport.zoom + viewport.y;
        const bhX = window.innerWidth - 100;
        const bhY = window.innerHeight - 100;
        const dist = Math.sqrt(Math.pow(screenX - bhX, 2) + Math.pow(screenY - bhY, 2));

        if (dist < 300) {
            setBlackHoleActive(true);
        } else {
            setBlackHoleActive(false);
        }
    }, [engine, viewport.zoom, viewport.x, viewport.y]);

    const handleNoteDragEnd = (id: string, _x?: number, _y?: number) => {
        setIsDraggingNote(false);
        setAlignmentLines(null);
        if (blackHoleActive) {
            soundManager.playWarp();
            softDeleteNote(id); // Send to recoverable graveyard, not permanent delete
            setBlackHoleActive(false);
            window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Star consumed by singularity — recoverable from Event Horizon', type: 'info' } }));
            return;
        }
    };

    const checkConnectionDrop = (e: any, explicitTargetId?: string) => {
        if (!connectionStart) return;

        let hitNote: typeof notes[0] | undefined;

        if (explicitTargetId) {
            hitNote = notes.find(n => n.id === explicitTargetId);
        } else {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const worldX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
            const worldY = (e.clientY - rect.top - viewport.y) / viewport.zoom;

            hitNote = notes.find(n => {
                let width, height;
                if (scaleMode === 'real') {
                    const size = REAL_SIZES[n.type] || NOTE_STYLES[n.type]?.width || 100;
                    width = size;
                    height = size;
                } else {
                    const style = NOTE_STYLES[n.type] || NOTE_STYLES[NoteType.Asteroid];
                    width = n.w || style.width;
                    height = n.h || style.height;
                }

                const centerX = n.x + width / 2;
                const centerY = n.y + height / 2;
                const dist = Math.sqrt(Math.pow(worldX - centerX, 2) + Math.pow(worldY - centerY, 2));

                if (n.id === connectionStart.id) return false;
                return dist <= (width / 2) + 20;
            });
        }

        if (hitNote && hitNote.id !== connectionStart.id) {
            addConnection({
                id: Math.random().toString(36).substr(2, 9),
                from: connectionStart.id,
                to: hitNote.id
            });
            soundManager.playConnect();
        }
        setConnectionStart(null);
        setTempConnectionEnd(null);
    };

    const handleNoteContextMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, noteId: id });
    };



    const activeConstellation = useStore((state) => state.activeConstellation);

    // Show notes filtered by mode visibility rules
    const visibleNotes = useMemo(() => {
        return notes.filter(note => noteVisibleInMode(note, viewMode, activeConstellation));
    }, [notes, viewMode, activeConstellation]);

    // Prism strict vertical stacking
    useEffect(() => {
        if (viewMode === 'prism' && visibleNotes.length > 0 && !isDraggingNote) {
            const timeout = setTimeout(() => {
                const groups: Record<string, typeof visibleNotes> = {
                    'todo': [],
                    'in-progress': [],
                    'review': [],
                    'done': []
                };

                visibleNotes.forEach(n => {
                    const s = n.status || 'todo';
                    if (groups[s]) groups[s].push(n);
                });

                const startY = layoutOrigin.y - 300;
                const gapY = 20;

                Object.values(groups).forEach(group => {
                    group.sort((a, b) => a.y - b.y);
                    let currentY = startY;
                    group.forEach(n => {
                        const h = n.h || 80;
                        if (Math.abs(n.y - currentY) > 5) {
                            updateNote(n.id, { y: currentY });
                        }
                        currentY += h + gapY;
                    });
                });
            }, 150);
            return () => clearTimeout(timeout);
        }
    }, [viewMode, visibleNotes, layoutOrigin, isDraggingNote, updateNote]);

    // Timeline horizontal auto-distribution
    useEffect(() => {
        if (viewMode === 'timeline' && visibleNotes.length > 0 && !isDraggingNote) {
            const timeout = setTimeout(() => {
                const sorted = [...visibleNotes].sort((a, b) => a.x - b.x);
                // We shouldn't force all of them to be contiguous, only resolve overlaps
                let lastX = -Infinity;
                let lastW = 0;
                sorted.forEach(n => {
                    const w = n.w || 180;
                    // Does it overlap with the previous note?
                    if (n.x < lastX + lastW + 20) {
                        const newX = lastX + lastW + 20;
                        updateNote(n.id, { x: newX });
                        lastX = newX;
                        lastW = w;
                    } else {
                        lastX = n.x;
                        lastW = w;
                    }
                });
            }, 150);
            return () => clearTimeout(timeout);
        }
    }, [viewMode, visibleNotes, isDraggingNote, updateNote]);

    const visibleConnections = useMemo(() => {
        const visibleIds = new Set(visibleNotes.map(n => n.id));
        return connections.filter(c => visibleIds.has(c.from) && visibleIds.has(c.to));
    }, [connections, visibleNotes]);
    // Fit-all-notes pan handler
    const handleFitAll = useCallback(() => {
        if (notes.length === 0) return;
        const pad = 100;
        const minX = Math.min(...notes.map(n => n.x)) - pad;
        const minY = Math.min(...notes.map(n => n.y)) - pad;
        const maxX = Math.max(...notes.map(n => n.x + 100)) + pad;
        const maxY = Math.max(...notes.map(n => n.y + 100)) + pad;
        const scaleX = window.innerWidth / (maxX - minX);
        const scaleY = window.innerHeight / (maxY - minY);
        const zoom = Math.min(scaleX, scaleY, 1.5);
        setViewport({ x: -minX * zoom, y: -minY * zoom, zoom });
    }, [notes, setViewport]);

    return (
        <div ref={containerRef} className={clsx(
            "absolute inset-0 w-full h-full overflow-hidden bg-white dark:bg-[#020617] select-none transition-colors duration-500",
            spacePressed ? "cursor-grab active:cursor-grabbing" : ""
        )}>

            {/* Visual Layer: Starfield & Background */}
            <DashboardBackground />
            {designSystem === 'zero-point' && <StarfieldLayer />}

            {/* MODE OVERLAYS (Static Grids/Layouts) */}
            {viewMode === 'archive' && <DecayOverlay />}

            {/* Mode Announcement Overlay — shown during entering phase (600ms cinematic flash) */}
            <AnimatePresence>
                {transitionPhase === 'entering' && (
                    <motion.div
                        key={viewMode + '-announce'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse at center, ${MODE_ACCENTS[viewMode] || '#6366f1'}22 0%, transparent 70%)`,
                        }}
                    >
                        <motion.span
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            transition={{ duration: 0.4 }}
                            className="text-white/60 text-2xl font-light tracking-[0.5em] uppercase select-none"
                        >
                            {viewMode}
                        </motion.span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Canvas Content — reacts to transition phase with opacity/scale/blur */}
            <motion.div
                className="absolute inset-0"
                animate={{
                    opacity: transitionPhase === 'entering' ? 0.3 : transitionPhase === 'settling' ? 0.75 : 1,
                    scale: transitionPhase === 'entering' ? 0.97 : transitionPhase === 'settling' ? 0.99 : 1,
                    filter: transitionPhase === 'entering' ? 'blur(4px)' : transitionPhase === 'settling' ? 'blur(1px)' : 'blur(0px)',
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >

                {/* Background Interaction Layer */}
                <motion.div
                    className="absolute top-0 left-0 w-full h-full pointer-events-none origin-top-left"
                    animate={{
                        x: viewport.x,
                        y: viewport.y,
                        scale: viewport.zoom
                    }}
                    transition={{ duration: transitionPhase === 'stable' ? 0 : 0.2, ease: 'easeOut' }}
                >


                    <ConnectionLayer
                        connections={visibleConnections}
                        notes={visibleNotes}
                        tempConnection={connectionStart && tempConnectionEnd ? { startId: connectionStart.id, endX: tempConnectionEnd.x, endY: tempConnectionEnd.y } : null}
                        zoom={viewport.zoom}
                    />

                    {showHierarchy && <HierarchyOverlay notes={notes} />}
                    {showLinks && <LinksOverlay notes={notes} />}

                    {/* Layout Visual Rails */}
                    <LayoutVisuals
                        viewMode={viewMode}
                        layoutOrigin={layoutOrigin}
                        minDimension={Math.min(window.innerWidth, window.innerHeight)}
                    />

                    {/* Alignment Lines (Pro Mode) */}
                    {alignmentLines && proMode && (
                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 overflow-visible">
                            {alignmentLines.x !== undefined && (
                                <line
                                    x1={alignmentLines.x} y1={-100000}
                                    x2={alignmentLines.x} y2={100000}
                                    stroke="#a855f7" strokeWidth="1" strokeDasharray="5,5"
                                />
                            )}
                            {alignmentLines.y !== undefined && (
                                <line
                                    x1={-100000} y1={alignmentLines.y}
                                    x2={100000} y2={alignmentLines.y}
                                    stroke="#a855f7" strokeWidth="1" strokeDasharray="5,5"
                                />
                            )}
                        </svg>
                    )}



                    {/* MODE SPECIFIC BACKGROUND VISUALS */}
                    <div className="absolute inset-0 pointer-events-none select-none overflow-visible">
                        {viewMode === 'archive' && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                <div className="absolute w-[10000px] h-[10000px] bg-[url('/data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIj48cGF0aCBkPSJNMCAwbDE1MCAwaDB2MTUwaC0xNTB2LTE1MHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] bg-repeat shadow-[inset_0_0_1000px_rgba(0,0,0,1)]" />
                                <div className="absolute text-[12px] uppercase tracking-[1em] text-emerald-500/30">The Graveyard</div>
                            </div>
                        )}
                    </div>

                    <div className="pointer-events-auto">
                        <AnimatePresence mode="popLayout">
                            {visibleNotes.map(note => {
                                return (
                                    <PlanetNote
                                        key={note.id}
                                        note={note}
                                        isSelected={selectedId === note.id || selectedIds.includes(note.id)}
                                        zoom={viewport.zoom}
                                        isReadOnly={false}
                                        layoutOrigin={layoutOrigin}
                                        viewMode={viewMode === 'free' ? undefined : viewMode}
                                        onConnectStart={(id, x, y) => {
                                            setConnectionStart({ id, x, y });
                                            setTempConnectionEnd({ x, y });
                                        }}
                                        onDragStart={handleNoteDragStart}
                                        onDrag={handleNoteDrag}
                                        onDragEnd={(id, x, y) => {
                                            if (viewMode !== 'free' && viewMode !== 'void' && x !== undefined && y !== undefined) {
                                                const constraint = ViewConstraints.applyConstraints(viewMode as ViewMode, x, y, layoutOrigin, { width: window.innerWidth, height: window.innerHeight });
                                                const patch: any = { x: constraint.x, y: constraint.y };
                                                if (constraint.dataUpdates) Object.assign(patch, constraint.dataUpdates);
                                                updateNote(id, patch);
                                                if (constraint.dataUpdates?.priority) {
                                                    window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: `Priority → ${String(constraint.dataUpdates.priority).toUpperCase()}`, type: 'info' } }));
                                                }
                                            } else {
                                                updateNote(id, { x: x ?? 0, y: y ?? 0 });
                                            }
                                            handleNoteDragEnd(id, x, y);
                                        }}
                                        onContextMenu={handleNoteContextMenu}
                                        onPointerUp={(e) => checkConnectionDrop(e, note.id)}
                                    />
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {lasso && (
                        <div
                            className="absolute border border-indigo-500/50 bg-indigo-500/10 pointer-events-none rounded backdrop-blur-[0.5px]"
                            style={{
                                left: Math.min(lasso.start.x, lasso.end.x),
                                top: Math.min(lasso.start.y, lasso.end.y),
                                width: Math.abs(lasso.start.x - lasso.end.x),
                                height: Math.abs(lasso.start.y - lasso.end.y),
                                zIndex: 10000,
                            }}
                        />
                    )}
                </motion.div>
            </motion.div> {/* end canvas transition wrapper */}

            {visibleNotes.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="flex flex-col items-center gap-5 text-center px-6">
                        <span className="material-symbols-outlined text-white/20 text-4xl">
                            {viewMode === 'void' || viewMode === 'free' ? 'blur_on' :
                             viewMode === 'orbital' ? 'motion_photos_on' :
                             viewMode === 'matrix' ? 'grid_view' :
                             viewMode === 'prism' ? 'view_week' :
                             viewMode === 'timeline' ? 'calendar_today' :
                             viewMode === 'archive' ? 'archive' : 'blur_on'}
                        </span>
                        <p className="text-white/30 text-[13px] tracking-[0.25em] uppercase font-light leading-relaxed max-w-md">
                            {viewMode === 'void' || viewMode === 'free' ? "This is your void. Begin anywhere." :
                             viewMode === 'orbital' ? "Focus priority rings are empty." :
                             viewMode === 'matrix' ? "Decision matrix quadrants are clear." :
                             viewMode === 'prism' ? "Prism status lanes are clear." :
                             viewMode === 'timeline' ? "Chronological milestone timeline is clear." :
                             viewMode === 'archive' ? "Event Horizon is clear. No archived star systems." : "System workspace is clear."}
                        </p>
                        <p className="text-white/15 text-[9px] tracking-[0.2em] uppercase max-w-sm leading-relaxed">
                            {viewMode === 'archive'
                                ? "Dimmed notes will automatically drift here over time"
                                : "Double-click the canvas empty space to capture a thought"}
                        </p>
                        {viewMode !== 'archive' && (
                            <div className="flex flex-col items-center gap-3 mt-4 pointer-events-auto">
                                <p className="text-[#9393c8]/40 text-[9.5px] tracking-widest max-w-[400px] leading-relaxed italic bg-white/5 border border-white/5 p-4 rounded-2xl">
                                    {viewMode === 'orbital' && "◎ Gravitational flows capture importance: Critical elements snap closer to the CORE. Drag nodes across orbital tracks to dynamically pivot priority."}
                                    {viewMode === 'matrix' && "⊞ Strategic quadrants sort Urgency vs. Importance. Drag elements between boxes to dynamically update their prioritization status."}
                                    {viewMode === 'prism' && "▨ Status columns represent Kanban execution. Drag cards horizontally to advance tasks through the entropy distribution pipeline."}
                                    {viewMode === 'timeline' && "── The timeline streams thoughts chronologically. Drag items along the date-axis to shift due dates. Heights resolve visual overlap."}
                                    {(viewMode === 'void' || viewMode === 'free') && "∞ Freeform void allows organic association. Drag handles to connect nodes and create custom gravity linkages."}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[9px] tracking-widest uppercase hover:bg-white/10 hover:text-white/70 hover:scale-[1.03] active:scale-[0.98] transition-all"
                                        onClick={() => window.dispatchEvent(new CustomEvent('stardust:openSphericalMenu', { detail: { x: window.innerWidth / 2, y: window.innerHeight / 2 } }))}
                                    >
                                        + Create New Star
                                    </button>
                                    <button
                                        className="px-5 py-2.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-[9px] tracking-widest uppercase hover:scale-[1.03] active:scale-[0.98] transition-all font-bold"
                                        onClick={() => handleSpawnTemplate(viewMode || 'void')}
                                    >
                                        ✨ Spawn Template
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
            {viewMode === 'void' && visibleNotes.length > 0 && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={handleFitAll}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/30 text-[10px] tracking-widest hover:bg-white/10 transition-all pointer-events-auto"
                >
                    ↑ {visibleNotes.length} stars in your universe
                </motion.button>
            )}

            {contextMenu && (
                <div
                    className="fixed z-[100] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 w-48 backdrop-blur-md"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-300 hover:text-red-200 text-sm flex items-center gap-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this star system?')) {
                                deleteNote(contextMenu.noteId);
                                setContextMenu(null);
                            }
                        }}
                    >
                        <span>🗑️</span> Delete
                    </button>
                </div>
            )}

            <BlackHole isActive={blackHoleActive} isDragging={isDraggingNote} />

            <AnimatePresence>
                {activeMenu?.isOpen && (
                    <NotesChoiceRing
                        x={activeMenu.x}
                        y={activeMenu.y}
                        onSelect={handleCreateNote}
                        onClose={() => setActiveMenu(null)}
                    />
                )}
            </AnimatePresence>

            <SearchTeleport />
            <ToastOverlay />
            <SemanticZoomController />
            {showMinimap && <MiniMap />}
            <CanvasInputHandler />

            {/* ── Per-Mode Chrome Overlay ── */}
            <AnimatePresence mode="wait">
                {viewMode === 'void' && (
                    <motion.div key="void-chrome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeInOut' }} className="absolute inset-0 pointer-events-none z-40">
                        <VoidChrome />
                    </motion.div>
                )}
                {viewMode === 'orbital' && (
                    <motion.div key="orbital-chrome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeInOut' }} className="absolute inset-0 pointer-events-none z-40">
                        <OrbitalChrome />
                    </motion.div>
                )}
                {viewMode === 'matrix' && (
                    <motion.div key="matrix-chrome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeInOut' }} className="absolute inset-0 pointer-events-none z-40">
                        <MatrixChrome />
                    </motion.div>
                )}
                {viewMode === 'prism' && (
                    <motion.div key="prism-chrome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeInOut' }} className="absolute inset-0 pointer-events-none z-40">
                        <PrismChrome />
                    </motion.div>
                )}
                {viewMode === 'timeline' && (
                    <motion.div key="timeline-chrome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeInOut' }} className="absolute inset-0 pointer-events-none z-40">
                        <TimelineChrome />
                    </motion.div>
                )}
                {viewMode === 'archive' && (
                    <motion.div key="archive-chrome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeInOut' }} className="absolute inset-0 pointer-events-none z-40">
                        <ArchiveChrome />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* UNIFIED APP SHELL & EDITOR */}
            <Toolbar />
            <AppShell />
            <EditorOverlay />
        </div>
    );
};

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { useStore } from '../store/useStore';
import { EditorOverlay } from './EditorOverlay';
import { Toolbar } from './Toolbar';
import { MiniMap } from './MiniMap';
import { SettingsPanel } from './SettingsPanel';
import { soundManager } from '../utils/sound';
import { ParticleSystem } from '../utils/animations';
import { PlanetNote } from './PlanetNote';
import { ConnectionLayer } from './ConnectionLayer';
import { CreationMenu } from './CreationMenu';
import { BlackHole } from './BlackHole';
import { NOTE_STYLES, NoteType } from '../constants';

export const CanvasViewport: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const notes = useStore((state) => state.notes);
    const connections = useStore((state) => state.connections);
    const viewport = useStore((state) => state.viewport);
    const setViewport = useStore((state) => state.setViewport);
    const addNote = useStore((state) => state.addNote);
    const addConnection = useStore((state) => state.addConnection);
    const deleteNote = useStore((state) => state.deleteNote);
    const selectedId = useStore((state) => state.selectedId);
    const setSelectedId = useStore((state) => state.setSelectedId);

    // Interaction State
    const [creationMenu, setCreationMenu] = useState<{ isOpen: boolean; x: number; y: number; worldX: number; worldY: number } | null>(null);
    const [connectionStart, setConnectionStart] = useState<{ id: string; x: number; y: number } | null>(null);
    const [tempConnectionEnd, setTempConnectionEnd] = useState<{ x: number; y: number } | null>(null);
    const [blackHoleActive, setBlackHoleActive] = useState(false);

    // Starfield & Background
    const stars = useRef<{ x: number; y: number; size: number; opacity: number; speed: number }[]>([]);
    const nebulas = useRef<{ x: number; y: number; size: number; color: string; speed: number }[]>([]);
    const particleSystem = useRef<ParticleSystem | null>(null);

    useEffect(() => {
        // Generate stars
        stars.current = Array.from({ length: 300 }, () => ({
            x: Math.random() * window.innerWidth * 2,
            y: Math.random() * window.innerHeight * 2,
            size: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.8 + 0.2,
            speed: Math.random() * 0.2 + 0.05
        }));

        // Generate nebulas
        const nebulaColors = ['#4c1d95', '#312e81', '#0f172a', '#581c87'];
        nebulas.current = Array.from({ length: 6 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 400 + 300,
            color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
            speed: Math.random() * 0.05 + 0.01
        }));

        particleSystem.current = new ParticleSystem(100, { w: window.innerWidth, h: window.innerHeight });
    }, []);

    // Render Loop (Background Only)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            const { width, height } = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            // 1. Background
            const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height));
            bgGradient.addColorStop(0, '#1e1b4b');
            bgGradient.addColorStop(0.5, '#0f172a');
            bgGradient.addColorStop(1, '#020617');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            // 2. Nebulas
            ctx.globalCompositeOperation = 'screen';
            nebulas.current.forEach(nebula => {
                const parallaxX = (nebula.x - viewport.x * nebula.speed) % (width * 1.5);
                const parallaxY = (nebula.y - viewport.y * nebula.speed) % (height * 1.5);
                const drawX = parallaxX < -nebula.size ? parallaxX + width * 1.5 : parallaxX;
                const drawY = parallaxY < -nebula.size ? parallaxY + height * 1.5 : parallaxY;

                const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, nebula.size);
                grad.addColorStop(0, `${nebula.color}40`);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(drawX, drawY, nebula.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalCompositeOperation = 'source-over';

            // 3. Stars
            ctx.fillStyle = '#fff';
            stars.current.forEach(star => {
                const x = (star.x - viewport.x * star.speed) % (width * 2);
                const y = (star.y - viewport.y * star.speed) % (height * 2);
                const drawX = x < 0 ? x + width * 2 : x;
                const drawY = y < 0 ? y + height * 2 : y;

                ctx.globalAlpha = star.opacity;
                ctx.beginPath();
                ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            // 4. Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            const gridSize = 100 * viewport.zoom;
            const offsetX = (viewport.x % gridSize);
            const offsetY = (viewport.y % gridSize);
            ctx.beginPath();
            for (let x = offsetX; x < width; x += gridSize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
            }
            for (let y = offsetY; y < height; y += gridSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            ctx.stroke();

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [viewport]);

    // Gestures for Viewport
    useGesture({
        onDrag: ({ delta: [dx, dy], event }) => {
            // Only pan if clicking on background (canvas)
            if ((event.target as HTMLElement).tagName === 'CANVAS') {
                setViewport({ ...viewport, x: viewport.x + dx, y: viewport.y + dy });
            }

            // Handle Connection Dragging
            if (connectionStart) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    const clientX = (event as any).clientX;
                    const clientY = (event as any).clientY;
                    const worldX = (clientX - rect.left - viewport.x) / viewport.zoom;
                    const worldY = (clientY - rect.top - viewport.y) / viewport.zoom;
                    setTempConnectionEnd({ x: worldX, y: worldY });
                }
            }
        },
        onWheel: ({ delta: [_dx, dy], ctrlKey }) => {
            if (ctrlKey) {
                const zoomFactor = dy > 0 ? 0.9 : 1.1;
                const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * zoomFactor));
                setViewport({ ...viewport, zoom: newZoom });
            } else {
                setViewport({ ...viewport, x: viewport.x - _dx, y: viewport.y - dy });
            }
        },
        onPointerDown: ({ event }) => {
            if ((event.target as HTMLElement).tagName === 'CANVAS') {
                setSelectedId(undefined);
            }
        },
        onPointerUp: ({ event }) => {
            if (connectionStart) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    const clientX = (event as any).clientX;
                    const clientY = (event as any).clientY;
                    const worldX = (clientX - rect.left - viewport.x) / viewport.zoom;
                    const worldY = (clientY - rect.top - viewport.y) / viewport.zoom;

                    // Find hit note
                    const hitNote = notes.find(n => {
                        const style = NOTE_STYLES[n.type] || NOTE_STYLES[NoteType.Asteroid];
                        return (
                            worldX >= n.x && worldX <= n.x + style.width &&
                            worldY >= n.y && worldY <= n.y + style.height
                        );
                    });

                    if (hitNote && hitNote.id !== connectionStart.id) {
                        addConnection({
                            id: Math.random().toString(36).substr(2, 9),
                            from: connectionStart.id,
                            to: hitNote.id
                        });
                        soundManager.playConnect();
                    }
                }
                setConnectionStart(null);
                setTempConnectionEnd(null);
            }
        },
        onDoubleClick: ({ event }) => {
            const target = event.target as HTMLElement;
            // Allow double click if we hit the canvas OR the container, but not a note/ui
            const isNote = target.closest('.note-planet');
            const isUI = target.closest('.stardust-toolbar, .stardust-minimap, button');

            if (!isNote && !isUI) {
                const e = event as any;
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    const clickX = e.clientX - rect.left;
                    const clickY = e.clientY - rect.top;
                    const worldX = (clickX - viewport.x) / viewport.zoom;
                    const worldY = (clickY - viewport.y) / viewport.zoom;

                    setCreationMenu({
                        isOpen: true,
                        x: clickX,
                        y: clickY,
                        worldX,
                        worldY
                    });
                    soundManager.playClick();
                }
            }
        }
    }, {
        target: containerRef,
        eventOptions: { passive: false },
        drag: { filterTaps: true }
    });

    // Handle Note Drag for Black Hole
    const handleNoteDrag = (_id: string, x: number, y: number) => {
        // Black Hole Position (Fixed bottom right)
        // We need to convert screen coordinates to world or vice versa
        // Black Hole is fixed on screen. Note is in world.
        // Let's convert Note to Screen.
        const screenX = x * viewport.zoom + viewport.x;
        const screenY = y * viewport.zoom + viewport.y;

        const bhX = window.innerWidth - 100; // Approx center of 32x32rem box at bottom right
        const bhY = window.innerHeight - 100;

        const dist = Math.sqrt(Math.pow(screenX - bhX, 2) + Math.pow(screenY - bhY, 2));

        if (dist < 200) {
            setBlackHoleActive(true);
        } else {
            setBlackHoleActive(false);
        }
    };

    const handleNoteDragEnd = (id: string) => {
        if (blackHoleActive) {
            soundManager.playWarp(); // Or a delete sound
            deleteNote(id);
            setBlackHoleActive(false);
        }
    };

    // Handle Connection Drop
    // We need to detect if we dropped on a note.
    // Since we can't easily use the gesture's onPointerUp for this specific logic without complex hit testing,
    // let's use a simpler approach:
    // When dragging a connection, we track the mouse.
    // On mouse up, we check if we are over a note.

    // Let's refine the onPointerUp in useGesture above.
    // We need to iterate notes.
    const checkConnectionDrop = (e: PointerEvent) => {
        if (!connectionStart) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const worldX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
        const worldY = (e.clientY - rect.top - viewport.y) / viewport.zoom;

        // Find hit note
        const hitNote = notes.find(n => {
            const style = NOTE_STYLES[n.type] || NOTE_STYLES[NoteType.Asteroid];
            return (
                worldX >= n.x && worldX <= n.x + style.width &&
                worldY >= n.y && worldY <= n.y + style.height
            );
        });

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

    // Global pointer up for connections
    useEffect(() => {
        const handleUp = (e: PointerEvent) => checkConnectionDrop(e);
        window.addEventListener('pointerup', handleUp);
        return () => window.removeEventListener('pointerup', handleUp);
    }, [connectionStart, notes, viewport]);


    return (
        <div ref={containerRef} className="w-full h-screen overflow-hidden relative bg-slate-950 touch-none">
            {/* 1. Canvas Background */}
            <canvas ref={canvasRef} className="block w-full h-full absolute top-0 left-0 z-0 canvas-bg" />

            {/* 2. World Container (Transforms with Viewport) */}
            <motion.div
                className="absolute top-0 left-0 w-full h-full pointer-events-none origin-top-left"
                animate={{
                    x: viewport.x,
                    y: viewport.y,
                    scale: viewport.zoom
                }}
                transition={{ duration: 0 }} // Instant update
            >
                {/* Connections Layer */}
                <ConnectionLayer
                    connections={connections}
                    notes={notes}
                    tempConnection={connectionStart && tempConnectionEnd ? { startId: connectionStart.id, endX: tempConnectionEnd.x, endY: tempConnectionEnd.y } : null}
                    zoom={viewport.zoom}
                />

                {/* Notes Layer */}
                <div className="pointer-events-auto">
                    {notes.map(note => (
                        <PlanetNote
                            key={note.id}
                            note={note}
                            isSelected={selectedId === note.id}
                            zoom={viewport.zoom}
                            onConnectStart={(id, x, y) => {
                                setConnectionStart({ id, x, y });
                                setTempConnectionEnd({ x, y }); // Start at the handle
                            }}
                            onDrag={handleNoteDrag}
                            onDragEnd={handleNoteDragEnd}
                        />
                    ))}
                </div>
            </motion.div>

            {/* 3. UI Overlays */}
            <BlackHole isActive={blackHoleActive} />

            <CreationMenu
                isOpen={!!creationMenu?.isOpen}
                x={creationMenu?.x || 0}
                y={creationMenu?.y || 0}
                onClose={() => setCreationMenu(null)}
                onSelect={(type) => {
                    if (creationMenu) {
                        addNote({
                            id: Math.random().toString(36).substr(2, 9),
                            x: creationMenu.worldX,
                            y: creationMenu.worldY,
                            w: 0, // Width/Height determined by type in renderer
                            h: 0,
                            type: type,
                            title: '',
                        });
                        soundManager.playClick();
                    }
                }}
            />

            <EditorOverlay />
            <Toolbar />
            <MiniMap />
            <SettingsPanel />

            <div className="absolute top-4 left-4 text-white/30 pointer-events-none font-light tracking-widest text-sm uppercase z-50">
                Stardust Canvas <span className="text-xs opacity-50">v2.0</span>
            </div>
        </div>
    );
};

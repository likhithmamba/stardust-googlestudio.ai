import { useEffect } from 'react';
import { engine } from '../engine/Engine';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../ui/settings/settingsStore';
import type { LayoutMode } from '../engine/types/EngineTypes';
import { workerBridge } from '../workers/WorkerBridge';

export const useEngine = () => {
    const notes = useStore((state) => state.notes);
    const graveyard = useStore((state) => state.graveyard || []);
    const connections = useStore((state) => state.connections);
    const viewport = useStore((state) => state.viewport);
    const viewMode = useSettingsStore((state) => state.viewMode);

    useEffect(() => {
        // Initialize Engine
        engine.start();
        workerBridge.waitForReady().catch(err => {
            console.error('[useEngine] Worker failed to get ready:', err);
        });
        return () => {
            engine.stop();
        };
    }, []);

    // Sync World Data
    useEffect(() => {
        if (viewMode === 'archive') {
            engine.getWorld().syncNotes(graveyard);
        } else {
            engine.getWorld().syncNotes(notes);
        }
    }, [notes, graveyard, viewMode]);

    useEffect(() => {
        engine.getWorld().syncConnections(connections);
    }, [connections]);

    // Sync Viewport — convert translate offset to world-center coordinates
    useEffect(() => {
        engine.updateConfig({
            width: window.innerWidth,
            height: window.innerHeight,
            zoom: viewport.zoom,
            x: (window.innerWidth / 2 - viewport.x) / viewport.zoom,
            y: (window.innerHeight / 2 - viewport.y) / viewport.zoom,
        });
    }, [viewport]);

    // Sync Mode & Layout via Web Worker Bridge
    useEffect(() => {
        let active = true;

        const updateWorkerTargets = async () => {
            if (viewMode === 'free' || viewMode === 'void' || viewMode === 'archive') {
                engine.setMode(viewMode as LayoutMode);
                return;
            }

            try {
                // Strip notes to satisfy strict security requirements (NEVER send content)
                const strippedNotes = notes.map(n => ({
                    id: n.id,
                    type: n.type,
                    touchedAt: n.updatedAt || n.createdAt || Date.now(),
                    wordCount: n.content ? n.content.split(/\s+/).length : 0,
                    connectionCount: connections.filter(c => c.from === n.id || c.to === n.id).length,
                    priority: n.priority,
                    urgency: n.urgency,
                    importance: n.importance,
                    status: n.status,
                    dueDate: n.dueDate
                }));

                const center = { x: 0, y: 0 };
                let targetsObj: Record<string, { x: number; y: number }> = {};

                if (viewMode === 'orbital') {
                    const scores = await workerBridge.calculateGravityScores(strippedNotes as any);
                    targetsObj = await workerBridge.getOrbitalTargets(strippedNotes as any, center, scores);
                } else if (viewMode === 'matrix') {
                    targetsObj = await workerBridge.getMatrixTargets(strippedNotes as any, center, {
                        width: window.innerWidth,
                        height: window.innerHeight
                    });
                } else if (viewMode === 'prism') {
                    targetsObj = await workerBridge.getPrismTargets(strippedNotes as any, center);
                } else if (viewMode === 'timeline') {
                    targetsObj = await workerBridge.getTimelineTargets(strippedNotes as any, center);
                }

                if (!active) return;

                // Convert Record back to a Map
                const targetsMap = new Map<string, { x: number; y: number }>();
                Object.entries(targetsObj).forEach(([id, pos]) => {
                    targetsMap.set(id, { x: pos.x, y: pos.y });
                });

                engine.setMode(viewMode as LayoutMode, targetsMap);
            } catch (e) {
                console.error('[Engine Worker Bridge] Worker layout failed, falling back to heuristic:', e);
                if (!active) return;
                // Fallback to local heuristic calculations on failure
                engine.setMode(viewMode as LayoutMode);
            }
        };

        updateWorkerTargets();

        return () => {
            active = false;
        };
    }, [viewMode, notes, connections]);

    // Listen for Engine Deletions
    useEffect(() => {
        const handleDelete = (e: CustomEvent<{ id: string }>) => {
            // We need to remove it from the Store, which will sync back to World.
            // But World might have already deleted it partially.
            // Crucially, we need Zustand to update so React unmounts it.
            useStore.getState().deleteNote(e.detail.id);
        };
        window.addEventListener('stardust:delete-note', handleDelete as EventListener);

        const handleUpdateLink = (e: CustomEvent<{ id: string; label: string }>) => {
            // Handle store update
            useStore.getState().updateConnection(e.detail.id, { label: e.detail.label } as any);
        };
        window.addEventListener('stardust:update-link', handleUpdateLink as EventListener);

        return () => {
            window.removeEventListener('stardust:delete-note', handleDelete as EventListener);
            window.removeEventListener('stardust:update-link', handleUpdateLink as EventListener);
        };
    }, []);

    // ─── requestAnimationFrame Write-Back Loop ───
    useEffect(() => {
        let frameId: number;

        const tick = () => {
            const world = engine.getWorld();
            const currentMode = useSettingsStore.getState().viewMode;
            const isArchive = currentMode === 'archive';
            const currentNotes = isArchive ? useStore.getState().graveyard : useStore.getState().notes;
            const updates: { id: string; x: number; y: number }[] = [];

            world.notes.forEach((wnote, id) => {
                if (wnote.fixed) return; // Skip updating notes that are currently locked/dragged!
                const snote = currentNotes.find(n => n.id === id);
                if (snote) {
                    const dx = Math.abs(snote.x - wnote.x);
                    const dy = Math.abs(snote.y - wnote.y);
                    // 0.3px threshold reduces unnecessary renders
                    if (dx > 0.3 || dy > 0.3) {
                        updates.push({ id, x: wnote.x, y: wnote.y });
                    }
                }
            });

            if (updates.length > 0) {
                useStore.getState().updateNotePositions(updates);
            }

            frameId = requestAnimationFrame(tick);
        };

        frameId = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(frameId);
        };
    }, []);

    return engine;
};

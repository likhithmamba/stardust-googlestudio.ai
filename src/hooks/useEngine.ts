import { useEffect, useMemo } from 'react';
import { engine } from '../engine/Engine';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../ui/settings/settingsStore';
import type { LayoutMode } from '../engine/types/EngineTypes';
import { workerBridge } from '../workers/WorkerBridge';

/**
 * Compute a stable identity hash for the notes collection.
 * This changes when notes are added, removed, or their layout-relevant
 * metadata changes — but NOT when x/y positions change.
 * Used to prevent worker recalculations on position-only updates.
 */
function computeNotesIdentity(notes: any[]): string {
    // Intentionally excludes x, y, vx, vy, w, h, luminance, lastAccessedAt
    return notes.map(n =>
        `${n.id}|${n.type}|${n.priority}|${n.urgency}|${n.importance}|${n.status}|${n.dueDate}|${n.constellation}|${n.originMode}`
    ).join(';');
}

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

    // ─── Fix #6: Stable identity hash for worker layout ───
    // Only recalculate layout when notes are added/removed or their
    // layout-relevant metadata changes — NOT on position-only updates.
    const notesIdentity = useMemo(() => computeNotesIdentity(notes), [notes]);
    const connectionsIdentity = useMemo(
        () => connections.map(c => `${c.id}|${c.from}|${c.to}`).join(';'),
        [connections]
    );

    // Sync Mode & Layout via Web Worker Bridge
    // Depends on stable identity hashes, not raw array references
    useEffect(() => {
        let active = true;

        const updateWorkerTargets = async () => {
            if (viewMode === 'free' || viewMode === 'void' || viewMode === 'archive') {
                engine.setMode(viewMode as LayoutMode);
                return;
            }

            // Read latest notes from store (we need the actual data, not the stale closure)
            const currentNotes = useStore.getState().notes;
            const currentConnections = useStore.getState().connections;

            try {
                // Strip notes to satisfy strict security requirements (NEVER send content)
                const strippedNotes = currentNotes.map(n => ({
                    id: n.id,
                    type: n.type,
                    touchedAt: n.updatedAt || n.createdAt || Date.now(),
                    wordCount: n.content ? n.content.split(/\s+/).length : 0,
                    connectionCount: currentConnections.filter(c => c.from === n.id || c.to === n.id).length,
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
    }, [viewMode, notesIdentity, connectionsIdentity]);

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

    // ─── Fix #1: Throttled Write-Back Loop (10fps instead of 60fps) ───
    // DOM positioning is handled at 60fps by visualRegistry.updatePosition()
    // in Engine.ts. This loop only syncs engine→React for state persistence,
    // so 10fps (100ms interval) is sufficient and eliminates frame-drop jank.
    // Fix #7: Uses Map for O(1) note lookups instead of Array.find()
    useEffect(() => {
        const SYNC_INTERVAL_MS = 100; // 10fps write-back

        const intervalId = setInterval(() => {
            const world = engine.getWorld();
            const currentMode = useSettingsStore.getState().viewMode;
            const isArchive = currentMode === 'archive';
            const currentNotes = isArchive ? useStore.getState().graveyard : useStore.getState().notes;

            // Fix #7: Build a Map for O(1) lookups instead of O(n) Array.find()
            const noteMap = new Map<string, { x: number; y: number }>();
            for (const n of currentNotes) {
                noteMap.set(n.id, { x: n.x, y: n.y });
            }

            const updates: { id: string; x: number; y: number }[] = [];

            world.notes.forEach((wnote, id) => {
                if (wnote.fixed) return; // Skip updating notes that are currently locked/dragged!
                const spos = noteMap.get(id);
                if (spos) {
                    const dx = Math.abs(spos.x - wnote.x);
                    const dy = Math.abs(spos.y - wnote.y);
                    // 1px threshold (relaxed from 0.3px since we're at 10fps now)
                    if (dx > 1 || dy > 1) {
                        updates.push({ id, x: wnote.x, y: wnote.y });
                    }
                }
            });

            if (updates.length > 0) {
                useStore.getState().updateNotePositions(updates);
            }
        }, SYNC_INTERVAL_MS);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    return engine;
};

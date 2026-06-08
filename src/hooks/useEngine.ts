import { useEffect } from 'react';
import { engine } from '../engine/Engine';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../ui/settings/settingsStore';
import type { LayoutMode } from '../engine/types/EngineTypes';

export const useEngine = () => {
    const notes = useStore((state) => state.notes);
    const graveyard = useStore((state) => state.graveyard || []);
    const connections = useStore((state) => state.connections);
    const viewport = useStore((state) => state.viewport);
    const viewMode = useSettingsStore((state) => state.viewMode);

    useEffect(() => {
        // Initialize Engine
        engine.start();
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

    // Sync Mode
    useEffect(() => {
        engine.setMode(viewMode as LayoutMode);
    }, [viewMode]);

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

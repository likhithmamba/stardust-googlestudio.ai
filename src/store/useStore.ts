// ─── Stardust Store — Composed from Slices ──────────────────────
// This file composes noteSlice, uiSlice, and persistenceSlice into
// a single Zustand store while preserving the exact same public API
// that all existing consumers expect.
//
// Architecture: Each slice owns its own state and actions.
// Cross-slice coordination is handled here (DB persistence, settings sync).

import { create } from 'zustand';
import { initDB } from '../db/idb';
import { NoteType } from '../constants';
import type { ViewMode } from '../constants';

// ── Re-export types & utilities so consumers don't need to change imports ──
import type { NoteSlice } from './noteSlice';
import type { UISlice } from './uiSlice';
import type { PersistenceSlice } from './persistenceSlice';
export type { Note, Connection } from './noteSlice';
export { noteVisibleInMode, defaultNotePropsForMode } from './noteSlice';

import {
    createNoteSlice,
    dirtyNoteIds,
    deletedNoteIds,
    dirtyConnectionIds,
    deletedConnectionIds,
    setDebouncedSave,
    setFullSave,
} from './noteSlice';
import { createUISlice } from './uiSlice';
import { createPersistenceSlice } from './persistenceSlice';

// ── Combined State Type ─────────────────────────────────────────
type StoreState = NoteSlice & UISlice & PersistenceSlice;

// ── Create the composed store ───────────────────────────────────
export const useStore = create<StoreState>()((...a) => ({
    ...createNoteSlice(...a),
    ...createUISlice(...a),
    ...createPersistenceSlice(...a),
}));

// ── Incremental DB Persistence ───────────────────────────────────
let graveyardDirty = false;
let saveTimeout: ReturnType<typeof setTimeout> | undefined;
const debouncedSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        try {
            const hasDirtyData = dirtyNoteIds.size > 0 || deletedNoteIds.size > 0 ||
                dirtyConnectionIds.size > 0 || deletedConnectionIds.size > 0 || graveyardDirty;
            if (!hasDirtyData) return;

            const db = await initDB();
            const stores = ['notes', 'connections'] as const;
            const needsGraveyard = graveyardDirty;
            const storeNames = needsGraveyard ? [...stores, 'graveyard' as const] : [...stores];
            const tx = db.transaction(storeNames, 'readwrite');
            const noteStore = tx.objectStore('notes');
            const connStore = tx.objectStore('connections');
            const state = useStore.getState();

            // Write dirty notes
            for (const id of dirtyNoteIds) {
                const note = state.notes.find(n => n.id === id);
                if (note) await noteStore.put(note);
            }
            // Delete removed notes
            for (const id of deletedNoteIds) {
                await noteStore.delete(id);
            }
            // Write dirty connections
            for (const id of dirtyConnectionIds) {
                const conn = state.connections.find(c => c.id === id);
                if (conn) await connStore.put(conn);
            }
            // Delete removed connections
            for (const id of deletedConnectionIds) {
                await connStore.delete(id);
            }
            // Persist graveyard (full replace — it's small)
            if (needsGraveyard) {
                const graveyardStore = tx.objectStore('graveyard');
                await graveyardStore.clear();
                for (const note of state.graveyard) {
                    await graveyardStore.put(note);
                }
                graveyardDirty = false;
            }

            dirtyNoteIds.clear();
            deletedNoteIds.clear();
            dirtyConnectionIds.clear();
            deletedConnectionIds.clear();

            await tx.done;
        } catch (e) {
            console.error('Failed to save to DB:', e);
        }
    }, 500);
};

// Track graveyard changes
useStore.subscribe((state, prevState) => {
    if (state.graveyard !== prevState.graveyard) {
        graveyardDirty = true;
        debouncedSave();
    }
});

// Full save for bulk operations (import, setContents)
const fullSaveToDB = async () => {
    try {
        const state = useStore.getState();
        const db = await initDB();
        const tx = db.transaction(['notes', 'connections', 'graveyard'], 'readwrite');
        const noteStore = tx.objectStore('notes');
        const connStore = tx.objectStore('connections');
        const graveyardStore = tx.objectStore('graveyard');
        await Promise.all([noteStore.clear(), connStore.clear(), graveyardStore.clear()]);
        await Promise.all([
            ...state.notes.map(note => noteStore.put(note)),
            ...state.connections.map(conn => connStore.put(conn)),
            ...state.graveyard.map(note => graveyardStore.put(note)),
        ]);
        await tx.done;
        dirtyNoteIds.clear();
        deletedNoteIds.clear();
        dirtyConnectionIds.clear();
        deletedConnectionIds.clear();
        graveyardDirty = false;
    } catch (e) {
        console.error('Failed to save to DB:', e);
    }
};

// Wire up the save functions to the noteSlice
setDebouncedSave(debouncedSave);
setFullSave(fullSaveToDB);

// ── Load from DB on init ────────────────────────────────────────
const loadFromDB = async () => {
    const db = await initDB();
    const notes = await db.getAll('notes');
    const connections = await db.getAll('connections');
    const graveyard = await db.getAll('graveyard');

    if (notes.length === 0) {
        // Place demo notes centered on screen so they are visible immediately
        const CX = window.innerWidth / 2;
        const CY = window.innerHeight / 2;

        const welcomeNote = {
            id: 'welcome-nebula',
            x: CX - 120,
            y: CY - 120,
            w: 0,
            h: 0,
            type: NoteType.Nebula,
            title: 'Welcome to Stardust ✨',
            content: 'Double-click anywhere to create a new planet.\n\nDrag handles to connect thoughts.\n\nSwitch modes with the dock below.',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            originMode: 'void' as ViewMode,
            status: 'captured' as const,
            visibleInModes: ['orbital' as ViewMode, 'matrix' as ViewMode],
            luminance: 1.0,
            lastAccessedAt: Date.now(),
        };
        const instructionPlanet = {
            id: 'instruction-earth',
            x: CX + 180,
            y: CY - 80,
            w: 0,
            h: 0,
            type: NoteType.Earth,
            title: 'I am a Planet!',
            content: 'Try changing my color or type in the toolbar.',
            priority: 'high' as const,
            createdAt: Date.now() - 1000,
            updatedAt: Date.now(),
            originMode: 'orbital' as ViewMode,
            luminance: 1.0,
            lastAccessedAt: Date.now(),
        };
        const sunNote = {
            id: 'demo-sun',
            x: CX - 60,
            y: CY - 300,
            w: 0,
            h: 0,
            type: NoteType.Sun,
            title: 'Core Idea',
            priority: 'critical' as const,
            fixed: true,
            createdAt: Date.now() - 2000,
            updatedAt: Date.now(),
            originMode: 'matrix' as ViewMode,
            urgency: 'urgent' as const,
            importance: 'important' as const,
            status: 'todo' as const,
            luminance: 1.0,
            lastAccessedAt: Date.now(),
        };
        const moonNote = {
            id: 'demo-moon',
            x: CX - 280,
            y: CY + 80,
            w: 0,
            h: 0,
            type: NoteType.Moon,
            title: 'Supporting thought',
            priority: 'low' as const,
            createdAt: Date.now() - 500,
            updatedAt: Date.now(),
            originMode: 'timeline' as ViewMode,
            dueDate: Date.now() + 86400000,
            status: 'todo' as const,
            luminance: 1.0,
            lastAccessedAt: Date.now(),
        };
        const archiveNote = {
            id: 'demo-archive',
            x: CX + 300,
            y: CY + 200,
            w: 0,
            h: 0,
            type: NoteType.Asteroid,
            title: 'Old idea',
            createdAt: Date.now() - 10000,
            updatedAt: Date.now(),
            originMode: 'archive' as ViewMode,
            status: 'archived' as const,
            luminance: 0.3,
            lastAccessedAt: Date.now() - 10000,
        };
        useStore.getState().setNotes([sunNote, welcomeNote, instructionPlanet, moonNote, archiveNote]);
        useStore.getState().setConnections([{
            id: 'intro-conn',
            from: 'demo-sun',
            to: 'welcome-nebula',
            label: 'Start here'
        }, {
            id: 'intro-conn-2',
            from: 'welcome-nebula',
            to: 'instruction-earth',
        }]);
        // Set viewport to show all demo notes
        useStore.getState().setViewport({ x: 0, y: 0, zoom: 0.75 });
    } else {
        // SANITIZATION: Fix NaN/Corrupted Notes from previous crashes
        const sanitizedNotes = notes.map(n => ({
            ...n,
            x: Number.isFinite(n.x) ? n.x : window.innerWidth / 2,
            y: Number.isFinite(n.y) ? n.y : window.innerHeight / 2,
            vx: 0, // Force Static Start
            vy: 0,
            originMode: n.originMode || ('void' as ViewMode),
            status: n.status || 'captured',
            luminance: n.luminance ?? 1.0,
            lastAccessedAt: n.lastAccessedAt ?? Date.now(),
        }));
        useStore.getState().setNotes(sanitizedNotes);
        useStore.getState().setConnections(connections);
        if (graveyard.length > 0) {
            useStore.setState({ graveyard });
        }
    }
};

loadFromDB().catch(err => {
    console.error('DB unavailable, starting fresh:', err);
    useStore.getState().setNotes([]);
});

// Settings persistence is handled by settingsStore (zustand/persist) and uiSlice localStorage.
// No additional subscriber needed here.

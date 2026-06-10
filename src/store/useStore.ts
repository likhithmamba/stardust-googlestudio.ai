// ─── Stardust Store — Composed from Slices ──────────────────────
// This file composes noteSlice, uiSlice, and persistenceSlice into
// a single Zustand store while preserving the exact same public API
// that all existing consumers expect.
//
// Architecture: Each slice owns its own state and actions.
// Cross-slice coordination is handled here (DB persistence, settings sync).

import { create } from 'zustand';
import { stardustDB } from '../db/StardustDB';
import { NoteType } from '../constants';
import type { ViewMode } from '../constants';
import { sanitizeNoteContent } from '../utils/sanitize';

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
    type Note,
    type Connection,
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
            const state = useStore.getState();
            const hasDirtyData = dirtyNoteIds.size > 0 || deletedNoteIds.size > 0 ||
                dirtyConnectionIds.size > 0 || deletedConnectionIds.size > 0 || graveyardDirty;
            if (!hasDirtyData) return;

            // Resolve dirty notes
            const notesToUpsert: Note[] = [];
            for (const id of dirtyNoteIds) {
                const note = state.notes.find(n => n.id === id);
                if (note) {
                    const sanitizedContent = note.content ? sanitizeNoteContent(note.content) : note.content;
                    notesToUpsert.push({ ...note, content: sanitizedContent });
                }
            }

            // Resolve dirty connections
            const connsToUpsert: Connection[] = [];
            for (const id of dirtyConnectionIds) {
                const conn = state.connections.find(c => c.id === id);
                if (conn) connsToUpsert.push(conn);
            }

            // Execute DB writes
            if (notesToUpsert.length > 0) {
                await stardustDB.bulkUpsertNotes(notesToUpsert);
            }
            if (deletedNoteIds.size > 0) {
                await stardustDB.bulkDeleteNotes(Array.from(deletedNoteIds));
            }
            if (connsToUpsert.length > 0) {
                await stardustDB.bulkUpsertConnections(connsToUpsert);
            }
            if (deletedConnectionIds.size > 0) {
                await stardustDB.bulkDeleteConnections(Array.from(deletedConnectionIds));
            }
            if (graveyardDirty) {
                await stardustDB.saveGraveyard(state.graveyard);
                graveyardDirty = false;
            }

            // Clear dirty sets ONLY after successful write
            dirtyNoteIds.clear();
            deletedNoteIds.clear();
            dirtyConnectionIds.clear();
            deletedConnectionIds.clear();
        } catch (e) {
            console.error('[Store Persistence] Failed to save to DB:', e);
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
        await stardustDB.clearAll();
        
        // Sanitize all contents before saving
        const sanitizedNotes = state.notes.map(note => ({
            ...note,
            content: note.content ? sanitizeNoteContent(note.content) : note.content
        }));

        await Promise.all([
            stardustDB.bulkUpsertNotes(sanitizedNotes),
            stardustDB.bulkUpsertConnections(state.connections),
            stardustDB.saveGraveyard(state.graveyard)
        ]);

        dirtyNoteIds.clear();
        deletedNoteIds.clear();
        dirtyConnectionIds.clear();
        deletedConnectionIds.clear();
        graveyardDirty = false;
    } catch (e) {
        console.error('[Store Persistence] Failed to full save to DB:', e);
    }
};

// Wire up the save functions to the noteSlice
setDebouncedSave(debouncedSave);
setFullSave(fullSaveToDB);

// ── Load from DB on init ────────────────────────────────────────
export const loadFromDB = async () => {
    try {
        const notes = await stardustDB.getAllNotes();
        const connections = await stardustDB.getAllConnections();
        const graveyard = await stardustDB.getAllGraveyard();

        if (notes.length === 0) {
            // Place demo notes centered on screen so they are visible immediately
            const CX = window.innerWidth / 2 || 500;
            const CY = window.innerHeight / 2 || 400;

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

            const demoNotes = [sunNote, welcomeNote, instructionPlanet, moonNote, archiveNote];
            const demoConnections = [
                { id: 'intro-conn', from: 'demo-sun', to: 'welcome-nebula', label: 'Start here' },
                { id: 'intro-conn-2', from: 'welcome-nebula', to: 'instruction-earth' }
            ];

            useStore.getState().hydrateFromDB({
                notes: demoNotes,
                connections: demoConnections,
                graveyard: []
            });
            useStore.getState().setViewport({ x: 0, y: 0, zoom: 0.75 });

            // Persist the newly created demo notes
            await Promise.all([
                stardustDB.bulkUpsertNotes(demoNotes),
                stardustDB.bulkUpsertConnections(demoConnections)
            ]);
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
            useStore.getState().hydrateFromDB({
                notes: sanitizedNotes,
                connections: connections,
                graveyard: graveyard
            });
        }
    } catch (err) {
        console.error('[Store Hydration] DB hydration failure, app still works:', err);
        useStore.getState().hydrateFromDB({ notes: [], connections: [], graveyard: [] });
        window.dispatchEvent(new CustomEvent('stardust:toast', {
            detail: { message: 'Database hydration failed. Working in memory.', type: 'error' }
        }));
    }
};

// Persist UI settings to localStorage
useStore.subscribe((state) => {
    try {
        const uiState = {
            showMinimap: state.showMinimap,
            theme: state.theme,
            activeConstellation: state.activeConstellation,
            constellations: state.constellations,
        };
        localStorage.setItem('stardust_ui_state', JSON.stringify(uiState));
    } catch (e) {
        console.error('Failed to save UI state:', e);
    }
});

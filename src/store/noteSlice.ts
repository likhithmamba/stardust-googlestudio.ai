import type { StateCreator } from 'zustand';
import type { ViewMode } from '../constants';
import { NoteType } from '../constants';

// ─── Note & Connection Types ────────────────────────────────────
export type Note = {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    type: NoteType;
    title?: string;
    createdAt?: number; // Timestamp
    updatedAt?: number; // Timestamp
    priority?: 'critical' | 'high' | 'medium' | 'low';
    status?: 'captured' | 'todo' | 'in-progress' | 'review' | 'done' | 'archived';
    parentId?: string;
    children?: string[]; // Added: Hierarchy Support
    links?: { fromId: string; toId: string; metadata?: any }[]; // Added: Link System
    contentId?: string;
    content?: string; // Serialized Lexical state
    tags?: string[];
    color?: string; // Planet Glow/Border Color
    textColor?: string; // Specific Font Color
    // Styling configurations
    fontSize?: number;
    fontFamily?: 'sans' | 'serif' | 'mono';

    // Ultra Mode Metadata
    questType?: 'main' | 'side';
    isCompleted?: boolean;
    value?: number; // For Invoice Mode (Price/Cost)
    clientName?: string; // For Invoice Mode (Target)

    // Physics Properties (Ultra Mode)
    vx?: number;
    vy?: number;
    mass?: number;
    fixed?: boolean; // For pinned elements like the "Sun"
    isDying?: boolean; // For Supernova/BlackHole animations

    // Compartmentalization (Filtering)
    originMode?: ViewMode;
    urgency?: 'urgent' | 'not-urgent';
    importance?: 'important' | 'not-important';
    dueDate?: number;
    startDate?: number;
    visibleInModes?: ViewMode[]; // strictly allow visibility in these modes

    // Decay System
    luminance?: number;        // 0.0 – 1.0, decays over time
    lastAccessedAt?: number;   // Timestamp of last user interaction
    decayPausedUntil?: number; // Timestamp until which decay is paused
};

export type Connection = {
    id: string;
    from: string;
    to: string;
    label?: string;
    color?: string; // For potentially coloring the connection line
};

// ─── Visibility & Mode Defaults ─────────────────────────────────
export function noteVisibleInMode(note: Note, mode: ViewMode | string): boolean {
    const m = mode as ViewMode;

    // Archive is a special case — only show archived/dying notes
    if (m === 'archive') return note.status === 'archived' || note.isDying === true;

    // Archived/dying notes are never shown outside archive mode
    if (note.status === 'archived' || note.isDying === true) return false;

    // Free mode shows everything non-archived
    if (m === 'free') return true;

    // Origin mode always wins — the note was created here
    if (note.originMode === m) return true;

    // Explicit cross-mode promotion whitelist
    if (note.visibleInModes && note.visibleInModes.length > 0 && note.visibleInModes.includes(m)) {
        return true;
    }

    // Heuristic filters — allow notes that have the right metadata for this mode
    switch (m) {
        case 'void':
            return !note.originMode || note.originMode === 'void' || note.status === 'captured';
        case 'orbital':
            return note.priority != null;
        case 'matrix':
            return note.urgency != null || note.importance != null;
        case 'prism':
            return note.status === 'todo' || note.status === 'in-progress' || note.status === 'review' || note.status === 'done';
        case 'timeline':
            return note.dueDate != null || note.startDate != null;
        default:
            return false;
    }
}

export function defaultNotePropsForMode(mode: ViewMode | string): Partial<Note> {
    switch (mode as ViewMode) {
        case 'orbital': return { originMode: 'orbital', priority: 'medium', status: 'todo' };
        case 'matrix': return { originMode: 'matrix', urgency: 'not-urgent', importance: 'important', status: 'todo' };
        case 'prism': return { originMode: 'prism', status: 'todo' };
        case 'timeline': return { originMode: 'timeline', dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, status: 'todo' };
        case 'archive': return { originMode: 'archive', status: 'archived' };
        default: return { originMode: 'void', status: 'captured' };
    }
}

// ─── Slice Types ────────────────────────────────────────────────
export interface NoteSlice {
    notes: Note[];
    connections: Connection[];
    graveyard: Note[]; // BlackHole recovery graveyard
    past: { notes: Note[]; connections: Connection[] }[];
    future: { notes: Note[]; connections: Connection[] }[];
    takeSnapshot: () => void;
    undo: () => void;
    redo: () => void;
    addNote: (n: Note) => void;
    updateNote: (id: string, patch: Partial<Note>) => void;
    deleteNote: (id: string) => void;
    softDeleteNote: (id: string) => void; // BlackHole: archive to graveyard
    recoverNote: (id: string) => void;    // Recover from graveyard
    purgeGraveyard: () => void;           // Permanently delete all graveyard notes
    promoteNote: (id: string, targetMode: ViewMode) => void;
    addConnection: (c: Connection) => void;
    updateConnection: (id: string, patch: Partial<Connection>) => void;
    removeConnection: (id: string) => void;
    setNotes: (notes: Note[]) => void;
    setConnections: (connections: Connection[]) => void;
    setContents: (notes: Note[], connections: Connection[]) => void;
}

// ─── Dirty Tracking for Incremental DB Saves ────────────────────
export const dirtyNoteIds = new Set<string>();
export const deletedNoteIds = new Set<string>();
export const dirtyConnectionIds = new Set<string>();
export const deletedConnectionIds = new Set<string>();

// Debounced save will be set up by the persistence slice
let _debouncedSave: () => void = () => {};
export const setDebouncedSave = (fn: () => void) => { _debouncedSave = fn; };
const triggerSave = () => _debouncedSave();

let _fullSave: () => void = () => {};
export const setFullSave = (fn: () => void) => { _fullSave = fn; };
const triggerFullSave = () => _fullSave();

// ─── Slice Creator ──────────────────────────────────────────────
export const createNoteSlice: StateCreator<NoteSlice, [], [], NoteSlice> = (set, _get) => ({
    notes: [],
    connections: [],
    graveyard: [],
    past: [],
    future: [],

    takeSnapshot: () => {
        set((s) => {
            const current = {
                notes: JSON.parse(JSON.stringify(s.notes)),
                connections: JSON.parse(JSON.stringify(s.connections))
            };
            const newPast = [...s.past, current].slice(-30);
            return {
                past: newPast,
                future: []
            };
        });
    },

    undo: () => {
        set((s) => {
            if (s.past.length === 0) return s;
            const previous = s.past[s.past.length - 1];
            const current = {
                notes: JSON.parse(JSON.stringify(s.notes)),
                connections: JSON.parse(JSON.stringify(s.connections))
            };
            const newPast = s.past.slice(0, -1);
            
            setTimeout(() => {
                triggerFullSave();
            }, 50);

            return {
                notes: previous.notes,
                connections: previous.connections,
                past: newPast,
                future: [current, ...s.future]
            };
        });
    },

    redo: () => {
        set((s) => {
            if (s.future.length === 0) return s;
            const next = s.future[0];
            const current = {
                notes: JSON.parse(JSON.stringify(s.notes)),
                connections: JSON.parse(JSON.stringify(s.connections))
            };
            const newFuture = s.future.slice(1);
            
            setTimeout(() => {
                triggerFullSave();
            }, 50);

            return {
                notes: next.notes,
                connections: next.connections,
                past: [...s.past, current],
                future: newFuture
            };
        });
    },

    addNote: (n) => {
        _get().takeSnapshot();
        const noteWithMeta = {
            ...n,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            luminance: 1.0,
            lastAccessedAt: Date.now(),
        };
        set((s) => ({ notes: [...s.notes, noteWithMeta] }));
        dirtyNoteIds.add(n.id);
        triggerSave();
    },

    updateNote: (id, patch) => {
        const isDiscreteUpdate = Object.keys(patch).some(key => 
            !['x', 'y', 'vx', 'vy', 'w', 'h', 'fixed', 'isDying', 'luminance', 'lastAccessedAt', 'title', 'content'].includes(key)
        );
        if (isDiscreteUpdate) {
            _get().takeSnapshot();
        }
        set((s) => ({
            notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
        }));
        dirtyNoteIds.add(id);
        triggerSave();
    },

    deleteNote: (id) => {
        _get().takeSnapshot();
        set((s) => {
            const notes = s.notes.filter((n) => n.id !== id);
            const connections = s.connections.filter((c) => c.from !== id && c.to !== id);
            return { notes, connections };
        });
        deletedNoteIds.add(id);
        dirtyNoteIds.delete(id);
        triggerSave();
    },

    // BlackHole Recovery: Move to graveyard instead of permanent delete
    softDeleteNote: (id) => {
        _get().takeSnapshot();
        set((s) => {
            const note = s.notes.find((n) => n.id === id);
            if (!note) return s;
            const graveyardEntry: Note = {
                ...note,
                isDying: true,
                status: 'archived',
                updatedAt: Date.now(),
            };
            return {
                notes: s.notes.filter((n) => n.id !== id),
                connections: s.connections.filter((c) => c.from !== id && c.to !== id),
                graveyard: [...s.graveyard, graveyardEntry],
            };
        });
        deletedNoteIds.add(id);
        dirtyNoteIds.delete(id);
        triggerSave();
    },

    recoverNote: (id) => {
        _get().takeSnapshot();
        set((s) => {
            const note = s.graveyard.find((n) => n.id === id);
            if (!note) return s;
            const recovered: Note = {
                ...note,
                isDying: false,
                status: 'captured',
                luminance: 1.0,
                lastAccessedAt: Date.now(),
                updatedAt: Date.now(),
            };
            return {
                graveyard: s.graveyard.filter((n) => n.id !== id),
                notes: [...s.notes, recovered],
            };
        });
        triggerSave();
    },

    purgeGraveyard: () => {
        _get().takeSnapshot();
        set({ graveyard: [] });
        triggerSave();
    },

    promoteNote: (id, targetMode) => {
        _get().takeSnapshot();
        set((s) => ({
            notes: s.notes.map((n) => {
                if (n.id !== id) return n;
                const existing = n.visibleInModes || [];
                if (existing.includes(targetMode)) return n;
                const defaults = defaultNotePropsForMode(targetMode);
                return { ...n, ...defaults, originMode: n.originMode, visibleInModes: [...existing, targetMode], updatedAt: Date.now() };
            }),
        }));
        dirtyNoteIds.add(id);
        triggerSave();
    },

    addConnection: (c) => {
        if (c.from === c.to) return; // Prevent self-loops
        
        let isDuplicate = false;
        _get().takeSnapshot();
        set((s) => {
            const exists = s.connections.some(
                (conn) => (conn.from === c.from && conn.to === c.to) || (conn.from === c.to && conn.to === c.from)
            );
            if (exists) {
                isDuplicate = true;
                return {};
            }
            return { connections: [...s.connections, c] };
        });

        if (isDuplicate) return;

        dirtyConnectionIds.add(c.id);
        triggerSave();
    },

    updateConnection: (id, patch) => {
        _get().takeSnapshot();
        set((s) => ({ connections: s.connections.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
        dirtyConnectionIds.add(id);
        triggerSave();
    },

    removeConnection: (id) => {
        _get().takeSnapshot();
        set((s) => ({ connections: s.connections.filter((c) => c.id !== id) }));
        deletedConnectionIds.add(id);
        dirtyConnectionIds.delete(id);
        triggerSave();
    },

    setNotes: (notes) => set({ notes }),
    setConnections: (connections) => set({ connections }),
    setContents: (notes, connections) => {
        set({ notes, connections });
        triggerFullSave();
    },
});

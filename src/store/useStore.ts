import { create } from 'zustand';
import { initDB } from '../db/idb';
import { NoteType } from '../constants';

export type Note = {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    type: NoteType;
    title?: string;
    parentId?: string;
    contentId?: string;
    content?: string; // Serialized Lexical state
    tags?: string[];
    color?: string;
};

export type Connection = {
    id: string;
    from: string;
    to: string;
};

type State = {
    notes: Note[];
    connections: Connection[];
    viewport: { x: number; y: number; zoom: number };
    selectedId?: string;
    isSettingsOpen: boolean;
    addNote: (n: Note) => void;
    updateNote: (id: string, patch: Partial<Note>) => void;
    deleteNote: (id: string) => void;
    addConnection: (c: Connection) => void;
    removeConnection: (id: string) => void;
    setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
    setSelectedId: (id: string | undefined) => void;
    setSettingsOpen: (isOpen: boolean) => void;
    setNotes: (notes: Note[]) => void;
    setConnections: (connections: Connection[]) => void;
    focusModeId?: string;
    setFocusModeId: (id: string | undefined) => void;

    // New UI State
    scaleMode: 'real' | 'compact';
    showMinimap: boolean;
    showConnections: boolean;
    setScaleMode: (mode: 'real' | 'compact') => void;
    setShowMinimap: (show: boolean) => void;
    setShowConnections: (show: boolean) => void;
};

export const useStore = create<State>((set, get) => ({
    notes: [],
    connections: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedId: undefined,
    focusModeId: undefined,
    isSettingsOpen: false,
    addNote: (n) => {
        set((s) => ({ notes: [...s.notes, n] }));
        saveDataToDB(get().notes, get().connections);
    },
    updateNote: (id, patch) => {
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
        saveDataToDB(get().notes, get().connections);
    },
    deleteNote: (id) => {
        set((s) => ({
            notes: s.notes.filter((n) => n.id !== id),
            connections: s.connections.filter((c) => c.from !== id && c.to !== id)
        }));
        saveDataToDB(get().notes, get().connections);
    },
    addConnection: (c) => {
        set((s) => ({ connections: [...s.connections, c] }));
        saveDataToDB(get().notes, get().connections);
    },
    removeConnection: (id) => {
        set((s) => ({ connections: s.connections.filter((c) => c.id !== id) }));
        saveDataToDB(get().notes, get().connections);
    },
    setViewport: (viewport) => set({ viewport }),
    setSelectedId: (id) => set({ selectedId: id }),
    setFocusModeId: (id) => set({ focusModeId: id }),
    setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
    setNotes: (notes) => set({ notes }),
    setConnections: (connections) => set({ connections }),

    // New UI State
    scaleMode: 'compact',
    showMinimap: true, // Default to true or as requested? Prompt says "toggle visibility... Mini-map appears top-right"
    showConnections: true,
    setScaleMode: (mode) => set({ scaleMode: mode }),
    setShowMinimap: (show) => set({ showMinimap: show }),
    setShowConnections: (show) => set({ showConnections: show }),
}));

// Debounce save
let saveTimeout: any;
const saveDataToDB = (notes: Note[], connections: Connection[]) => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        const db = await initDB();
        const tx = db.transaction(['notes', 'connections'], 'readwrite');

        const noteStore = tx.objectStore('notes');
        // Clear existing before putting new ones to handle deletions properly in this simple sync
        // In a real app, we'd delete specific IDs, but for now this ensures consistency
        await noteStore.clear();
        for (const note of notes) {
            await noteStore.put(note);
        }

        const connStore = tx.objectStore('connections');
        await connStore.clear();
        for (const conn of connections) {
            await connStore.put(conn);
        }

        await tx.done;
        console.log('Saved to IndexedDB');
    }, 1000);
};

// Load on init
const loadFromDB = async () => {
    const db = await initDB();
    const notes = await db.getAll('notes');
    const connections = await db.getAll('connections');
    useStore.getState().setNotes(notes);
    useStore.getState().setConnections(connections);
};

loadFromDB();

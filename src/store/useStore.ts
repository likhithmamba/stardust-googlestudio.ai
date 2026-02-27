import { create } from 'zustand';
import { initDB } from '../db/idb';
import { NoteType } from '../constants';
import type { ViewMode } from '../constants';
import { useSettingsStore } from '../ui/settings/settingsStore';

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
};

export type Connection = {
    id: string;
    from: string;
    to: string;
    label?: string;
    color?: string; // For potentially coloring the connection line
};

type State = {
    notes: Note[];
    connections: Connection[];
    viewport: { x: number; y: number; zoom: number };
    selectedId?: string;
    isCosmosOpen: boolean;
    isSettingsOpen: boolean;
    addNote: (n: Note) => void;
    updateNote: (id: string, patch: Partial<Note>) => void;
    deleteNote: (id: string) => void;
    promoteNote: (id: string, targetMode: ViewMode) => void;
    addConnection: (c: Connection) => void;
    updateConnection: (id: string, patch: Partial<Connection>) => void;
    removeConnection: (id: string) => void;
    setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
    setSelectedId: (id: string | undefined) => void;
    setCosmosOpen: (isOpen: boolean) => void;
    setSettingsOpen: (isOpen: boolean) => void;
    setNotes: (notes: Note[]) => void;
    setConnections: (connections: Connection[]) => void;
    focusModeId?: string;
    setFocusModeId: (id: string | undefined) => void;
    setContents: (notes: Note[], connections: Connection[]) => void;

    // New UI State
    scaleMode: 'real' | 'compact';
    showMinimap: boolean;
    showConnections: boolean;
    setScaleMode: (mode: 'real' | 'compact') => void;
    setShowMinimap: (show: boolean) => void;
    setShowConnections: (show: boolean) => void;

    // Part 2: Universal Upgrades
    showHierarchy: boolean;
    setShowHierarchy: (show: boolean) => void;

    showLinks: boolean;
    setShowLinks: (show: boolean) => void;

    toolbarSkin: boolean;
    setToolbarSkin: (enabled: boolean) => void;

    // Part 3: Pro Mode
    proMode: boolean;
    setProMode: (enabled: boolean) => void;

    // Part 4: Ultra Mode & Feature Toggles
    ultraMode: boolean;
    setUltraMode: (enabled: boolean) => void;

    showQuest: boolean;
    setShowQuest: (show: boolean) => void;

    showInvoiceUniverse: boolean;
    setShowInvoiceUniverse: (show: boolean) => void;

    showAutoMap: boolean;
    setShowAutoMap: (show: boolean) => void;

    showFocusMode: boolean;
    setShowFocusMode: (show: boolean) => void;

    isSearchOpen: boolean;
    setSearchOpen: (isOpen: boolean) => void;

    theme: 'default' | 'cyberpunk' | 'zen';
    setTheme: (theme: 'default' | 'cyberpunk' | 'zen') => void;

    // Interaction State
    connectionStart: { id: string; x: number; y: number } | null;
    setConnectionStart: (start: { id: string; x: number; y: number } | null) => void;

    // Persistence
    exportData?: () => Promise<void>;
    importData?: () => Promise<void>;
};

// Persistence Helper
const LOCAL_STORAGE_KEY = 'stardust_settings';
const loadSettings = () => {
    try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error('Failed to load settings', e);
        return {};
    }
};

const initialSettings = loadSettings();

// Incremental DB save tracking (Bug B6 fix)
const dirtyNoteIds = new Set<string>();
const deletedNoteIds = new Set<string>();
const dirtyConnectionIds = new Set<string>();
const deletedConnectionIds = new Set<string>();

export function noteVisibleInMode(note: Note, mode: ViewMode | string): boolean {
    const m = mode as ViewMode;
    if (m === 'archive') return note.status === 'archived' || note.isDying === true;
    if (note.status === 'archived' || note.isDying === true) return false;

    // Explicit visibility overrides (acts as a whitelist if defined and populated)
    if (note.visibleInModes && note.visibleInModes.length > 0) {
        if (note.visibleInModes.includes(m)) return true;
        if (m !== 'free' && note.originMode !== m) return false;
    }

    if (m === 'free') return true;
    if (note.originMode === m) return true;
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

export const useStore = create<State>((set, get) => ({
    notes: [],
    connections: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedId: undefined,
    isCosmosOpen: false,
    focusModeId: undefined,
    isSettingsOpen: false,
    addNote: (n) => {
        const noteWithMeta = { ...n, createdAt: Date.now(), updatedAt: Date.now() };
        set((s) => ({ notes: [...s.notes, noteWithMeta] }));
        dirtyNoteIds.add(n.id);
        debouncedSave();
    },
    updateNote: (id, patch) => {
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)) }));
        dirtyNoteIds.add(id);
        debouncedSave();
    },
    deleteNote: (id) => {
        set((s) => {
            const notes = s.notes.filter((n) => n.id !== id);
            const connections = s.connections.filter((c) => c.from !== id && c.to !== id);
            return { notes, connections };
        });
        deletedNoteIds.add(id);
        dirtyNoteIds.delete(id);
        debouncedSave();
    },
    promoteNote: (id, targetMode) => {
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
        debouncedSave();
    },
    addConnection: (c) => {
        set((s) => ({ connections: [...s.connections, c] }));
        dirtyConnectionIds.add(c.id);
        debouncedSave();
    },
    updateConnection: (id, patch) => {
        set((s) => ({ connections: s.connections.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
        dirtyConnectionIds.add(id);
        debouncedSave();
    },
    removeConnection: (id) => {
        set((s) => ({ connections: s.connections.filter((c) => c.id !== id) }));
        deletedConnectionIds.add(id);
        dirtyConnectionIds.delete(id);
        debouncedSave();
    },
    setViewport: (viewport) => set({ viewport }),
    setSelectedId: (id) => set({ selectedId: id }),
    setCosmosOpen: (isOpen) => set({ isCosmosOpen: isOpen }),
    setFocusModeId: (id) => set({ focusModeId: id }),
    setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
    setContents: (notes: Note[], connections: Connection[]) => {
        set({ notes, connections });
        fullSaveToDB();
    },
    setNotes: (notes) => set({ notes }),
    setConnections: (connections) => set({ connections }),

    // New UI State
    scaleMode: 'compact',
    showMinimap: initialSettings.showMinimap ?? true,
    showConnections: true,
    setScaleMode: (mode) => set({ scaleMode: mode }),
    setShowMinimap: (show) => set({ showMinimap: show }),
    setShowConnections: (show) => set({ showConnections: show }),

    // Universal Upgrades
    showHierarchy: initialSettings.showHierarchy ?? false,
    setShowHierarchy: (show) => set({ showHierarchy: show }),

    showLinks: initialSettings.showLinks ?? false,
    setShowLinks: (show) => set({ showLinks: show }),

    toolbarSkin: initialSettings.toolbarSkin ?? false,
    setToolbarSkin: (enabled) => set({ toolbarSkin: enabled }),

    // Pro Mode
    proMode: initialSettings.proMode ?? false,
    setProMode: (enabled) => set({ proMode: enabled }),

    // Ultra Mode
    ultraMode: initialSettings.ultraMode ?? false,
    setUltraMode: (enabled) => set({ ultraMode: enabled }),

    showQuest: initialSettings.showQuest ?? false,
    setShowQuest: (show) => set({ showQuest: show }),

    showInvoiceUniverse: initialSettings.showInvoiceUniverse ?? false,
    setShowInvoiceUniverse: (show) => set({ showInvoiceUniverse: show }),

    showAutoMap: initialSettings.showAutoMap ?? false,
    setShowAutoMap: (show) => set({ showAutoMap: show }),

    showFocusMode: initialSettings.showFocusMode ?? false,
    setShowFocusMode: (show) => set({ showFocusMode: show }),

    isSearchOpen: false,
    setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),

    theme: initialSettings.theme ?? 'default',
    setTheme: (theme) => set({ theme }),

    // Interaction State
    connectionStart: null,
    setConnectionStart: (connectionStart) => set({ connectionStart }),

    // REMOVED Redundant ViewMode logic (moved to settingsStore)

    // ------------------------------------------------------------
    // LOCAL FILE SYSTEM API (Unlimited Storage)
    // ------------------------------------------------------------
    exportData: async () => {
        try {
            const state = get();
            const settings = useSettingsStore.getState();
            const data = {
                version: 2,
                timestamp: Date.now(),
                notes: state.notes,
                connections: state.connections,
                viewMode: settings.viewMode,
                designSystem: settings.designSystem,
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

            // @ts-ignore - File System Access API
            const handle = await window.showSaveFilePicker({
                suggestedName: `stardust_backup_${new Date().toISOString().slice(0, 10)}.stardust`,
                types: [{
                    description: 'Stardust Universe File',
                    accept: { 'application/json': ['.stardust', '.json'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            console.log('Exported successfully');
        } catch (err: any) {
            if (err.name !== 'AbortError') console.error('Export failed:', err);
        }
    },

    importData: async () => {
        try {
            // @ts-ignore - File System Access API
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Stardust Universe File',
                    accept: { 'application/json': ['.stardust', '.json'] },
                }],
                multiple: false
            });
            const file = await handle.getFile();
            const text = await file.text();
            const data = JSON.parse(text);

            if (data.notes && Array.isArray(data.notes)) {
                set({
                    notes: data.notes,
                    connections: data.connections || [],
                });
                // Restore settings to settingsStore
                const settings = useSettingsStore.getState();
                if (data.viewMode) settings.setViewMode(data.viewMode);
                if (data.designSystem) settings.setDesignSystem(data.designSystem);
                fullSaveToDB();
                console.log('Imported successfully');
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') console.error('Import failed:', err);
        }
    },
}));

// Incremental debounced save — only writes changed records (Bug B6 fix)
let saveTimeout: ReturnType<typeof setTimeout> | undefined;
const debouncedSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        try {
            if (dirtyNoteIds.size === 0 && deletedNoteIds.size === 0 &&
                dirtyConnectionIds.size === 0 && deletedConnectionIds.size === 0) return;

            const db = await initDB();
            const tx = db.transaction(['notes', 'connections'], 'readwrite');
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

// Full save for bulk operations (import, setContents)
const fullSaveToDB = async () => {
    try {
        const state = useStore.getState();
        const db = await initDB();
        const tx = db.transaction(['notes', 'connections'], 'readwrite');
        const noteStore = tx.objectStore('notes');
        const connStore = tx.objectStore('connections');
        await Promise.all([noteStore.clear(), connStore.clear()]);
        await Promise.all([
            ...state.notes.map(note => noteStore.put(note)),
            ...state.connections.map(conn => connStore.put(conn)),
        ]);
        await tx.done;
        dirtyNoteIds.clear();
        deletedNoteIds.clear();
        dirtyConnectionIds.clear();
        deletedConnectionIds.clear();
    } catch (e) {
        console.error('Failed to save to DB:', e);
    }
};

// Fallback demo notes for when DB is unavailable (e.g., private browsing)
const DEMO_NOTES_FALLBACK: Note[] = [];

// Load on init
const loadFromDB = async () => {
    const db = await initDB();
    const notes = await db.getAll('notes');
    const connections = await db.getAll('connections');

    if (notes.length === 0) {
        // Place demo notes centered on screen so they are visible immediately
        const CX = window.innerWidth / 2;
        const CY = window.innerHeight / 2;

        const welcomeNote: Note = {
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
            originMode: 'void',
            status: 'captured',
            visibleInModes: ['orbital', 'matrix']
        };
        const instructionPlanet: Note = {
            id: 'instruction-earth',
            x: CX + 180,
            y: CY - 80,
            w: 0,
            h: 0,
            type: NoteType.Earth,
            title: 'I am a Planet!',
            content: 'Try changing my color or type in the toolbar.',
            priority: 'high',
            createdAt: Date.now() - 1000,
            updatedAt: Date.now(),
            originMode: 'orbital'
        };
        const sunNote: Note = {
            id: 'demo-sun',
            x: CX - 60,
            y: CY - 300,
            w: 0,
            h: 0,
            type: NoteType.Sun,
            title: 'Core Idea',
            priority: 'critical',
            fixed: true,
            createdAt: Date.now() - 2000,
            updatedAt: Date.now(),
            originMode: 'matrix',
            urgency: 'urgent',
            importance: 'important',
            status: 'todo'
        };
        const moonNote: Note = {
            id: 'demo-moon',
            x: CX - 280,
            y: CY + 80,
            w: 0,
            h: 0,
            type: NoteType.Moon,
            title: 'Supporting thought',
            priority: 'low',
            createdAt: Date.now() - 500,
            updatedAt: Date.now(),
            originMode: 'timeline',
            dueDate: Date.now() + 86400000,
            status: 'todo'
        };
        const archiveNote: Note = {
            id: 'demo-archive',
            x: CX + 300,
            y: CY + 200,
            w: 0,
            h: 0,
            type: NoteType.Asteroid,
            title: 'Old idea',
            createdAt: Date.now() - 10000,
            updatedAt: Date.now(),
            originMode: 'archive',
            status: 'archived'
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
        }));
        useStore.getState().setNotes(sanitizedNotes);
        useStore.getState().setConnections(connections);
    }
};

loadFromDB().catch(err => {
    console.error('DB unavailable, starting fresh:', err);
    useStore.getState().setNotes(DEMO_NOTES_FALLBACK);
});

// Subscribe to settings changes
useStore.subscribe((state) => {
    const settings = {
        proMode: state.proMode,
        showHierarchy: state.showHierarchy,
        showLinks: state.showLinks,
        showMinimap: state.showMinimap,
        toolbarSkin: state.toolbarSkin,
        theme: state.theme,
        // Upgrade Persistence
        ultraMode: state.ultraMode,
        showQuest: state.showQuest,
        showInvoiceUniverse: state.showInvoiceUniverse,
        showAutoMap: state.showAutoMap,
        showFocusMode: state.showFocusMode,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
});

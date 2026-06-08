import type { StateCreator } from 'zustand';
import { dirtyNoteIds, triggerSave } from './noteSlice';

// ─── UI State Slice ─────────────────────────────────────────────
// Extracted from the monolithic store: all UI toggles, feature flags,
// and interaction state that is NOT data.

export interface UISlice {
    viewport: { x: number; y: number; zoom: number };
    selectedId?: string;
    selectedIds: string[];
    isCosmosOpen: boolean;
    isSettingsOpen: boolean;
    focusModeId?: string;

    activeConstellation: string;
    constellations: string[];
    setActiveConstellation: (name: string) => void;
    addConstellation: (name: string) => void;
    removeConstellation: (name: string) => void;
    renameConstellation: (oldName: string, newName: string) => void;

    setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
    setSelectedId: (id: string | undefined) => void;
    setSelectedIds: (ids: string[]) => void;
    toggleSelectedId: (id: string) => void;
    setCosmosOpen: (isOpen: boolean) => void;
    setSettingsOpen: (isOpen: boolean) => void;
    savedViewport?: { x: number; y: number; zoom: number };
    setSavedViewport: (viewport: { x: number; y: number; zoom: number } | undefined) => void;
    isViewportAnimating: boolean;
    setViewportAnimating: (animating: boolean) => void;
    setFocusModeId: (id: string | undefined) => void;

    // Display toggles
    scaleMode: 'real' | 'compact';
    showMinimap: boolean;
    showConnections: boolean;
    setScaleMode: (mode: 'real' | 'compact') => void;
    setShowMinimap: (show: boolean) => void;
    setShowConnections: (show: boolean) => void;

    isSearchOpen: boolean;
    setSearchOpen: (isOpen: boolean) => void;
    theme: 'default' | 'cyberpunk' | 'zen';
    setTheme: (theme: 'default' | 'cyberpunk' | 'zen') => void;

    // Interaction State
    connectionStart: { id: string; x: number; y: number } | null;
    setConnectionStart: (start: { id: string; x: number; y: number } | null) => void;
}

// Persistence Helper
const LOCAL_STORAGE_KEY = 'stardust_ui_state';
const loadSettings = () => {
    try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error('Failed to load UI state', e);
        return {};
    }
};

const initialSettings = loadSettings();

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedId: undefined,
    selectedIds: [],
    isCosmosOpen: false,
    isSettingsOpen: false,
    focusModeId: undefined,

    activeConstellation: initialSettings.activeConstellation ?? 'General',
    constellations: initialSettings.constellations ?? ['General'],
    setActiveConstellation: (activeConstellation) => set({ activeConstellation }),
    addConstellation: (name) => set((state) => {
        if (state.constellations.includes(name)) return {};
        return {
            constellations: [...state.constellations, name],
            activeConstellation: name
        };
    }),
    removeConstellation: (name) => set((state: any) => {
        if (name === 'General') return {};
        const newConstellations = state.constellations.filter((c: string) => c !== name);
        const newNotes = state.notes.map((n: any) => {
            if (n.constellation === name) {
                dirtyNoteIds.add(n.id);
                return { ...n, constellation: 'General', updatedAt: Date.now() };
            }
            return n;
        });
        triggerSave();
        return {
            constellations: newConstellations,
            activeConstellation: state.activeConstellation === name ? 'General' : state.activeConstellation,
            notes: newNotes
        };
    }),
    renameConstellation: (oldName, newName) => set((state: any) => {
        if (oldName === 'General') return {};
        if (state.constellations.includes(newName)) return {};
        const newConstellations = state.constellations.map((c: string) => c === oldName ? newName : c);
        const newNotes = state.notes.map((n: any) => {
            if (n.constellation === oldName) {
                dirtyNoteIds.add(n.id);
                return { ...n, constellation: newName, updatedAt: Date.now() };
            }
            return n;
        });
        triggerSave();
        return {
            constellations: newConstellations,
            activeConstellation: state.activeConstellation === oldName ? newName : state.activeConstellation,
            notes: newNotes
        };
    }),

    setViewport: (viewport) => set({ viewport }),
    setSelectedId: (id) => set({
        selectedId: id,
        selectedIds: id ? [id] : []
    }),
    setSelectedIds: (ids) => set({
        selectedIds: ids,
        selectedId: ids.length > 0 ? ids[ids.length - 1] : undefined
    }),
    toggleSelectedId: (id) => set((state) => {
        const selectedIds = state.selectedIds.includes(id)
            ? state.selectedIds.filter(x => x !== id)
            : [...state.selectedIds, id];
        return {
            selectedIds,
            selectedId: selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : undefined
        };
    }),
    setCosmosOpen: (isOpen) => set({ isCosmosOpen: isOpen }),
    setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
    savedViewport: undefined,
    setSavedViewport: (savedViewport) => set({ savedViewport }),
    isViewportAnimating: false,
    setViewportAnimating: (isViewportAnimating) => set({ isViewportAnimating }),
    setFocusModeId: (id) => set({ focusModeId: id }),

    // Display toggles
    scaleMode: 'compact',
    showMinimap: initialSettings.showMinimap ?? true,
    showConnections: true,
    setScaleMode: (mode) => set({ scaleMode: mode }),
    setShowMinimap: (show) => set({ showMinimap: show }),
    setShowConnections: (show) => set({ showConnections: show }),

    isSearchOpen: false,
    setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
    theme: initialSettings.theme ?? 'default',
    setTheme: (theme) => set({ theme }),

    // Interaction State
    connectionStart: null,
    setConnectionStart: (connectionStart) => set({ connectionStart }),
});

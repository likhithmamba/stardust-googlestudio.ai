import type { StateCreator } from 'zustand';
import type { Note, Connection } from './noteSlice';
import { useSettingsStore } from '../ui/settings/settingsStore';

// ─── Persistence / IO Slice ─────────────────────────────────────
// File import/export operations extracted from the monolithic store.

export interface PersistenceSlice {
    exportData?: () => Promise<void>;
    importData?: () => Promise<void>;
}

// The full state shape is needed to access notes, connections, setNotes, etc.
// We use the intersection approach so the slice can read from other slices.
type FullState = PersistenceSlice & {
    notes: Note[];
    connections: Connection[];
    setNotes: (notes: Note[]) => void;
    setConnections: (connections: Connection[]) => void;
};

export const createPersistenceSlice: StateCreator<
    FullState,
    [],
    [],
    PersistenceSlice
> = (_set, get) => ({
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
                const state = get();
                state.setNotes(data.notes);
                state.setConnections(data.connections || []);
                // Restore settings to settingsStore
                const settings = useSettingsStore.getState();
                if (data.viewMode) settings.setViewMode(data.viewMode);
                if (data.designSystem) settings.setDesignSystem(data.designSystem);
                console.log('Imported successfully');
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') console.error('Import failed:', err);
        }
    },
});

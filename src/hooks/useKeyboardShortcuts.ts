// src/hooks/useKeyboardShortcuts.ts — Global keyboard shortcuts for Stardust
import { useEffect } from 'react';
import { useSettingsStore } from '../ui/settings/settingsStore';
import { useStore } from '../store/useStore';
import type { Note } from '../store/noteSlice';

let localClipboard: Partial<Note>[] = [];

/**
 * Global keyboard shortcuts:
 * - 1-5: Switch mode (void, matrix, prism, orbital, timeline)
 * - Ctrl+K / Cmd+K: Toggle search
 * - Ctrl+, / Cmd+,: Toggle settings
 * - Escape: Close open panels
 */
export function useKeyboardShortcuts() {
    const setViewMode = useSettingsStore((state) => state.setViewMode);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Don't fire when typing in inputs
            const target = e.target as HTMLElement;
            if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
                return;
            }

            const isMod = e.ctrlKey || e.metaKey;

            // Mode switching: 1-5
            if (!isMod && !e.altKey && !e.shiftKey) {
                switch (e.key) {
                    case '1': setViewMode('void'); e.preventDefault(); return;
                    case '2': setViewMode('matrix'); e.preventDefault(); return;
                    case '3': setViewMode('prism'); e.preventDefault(); return;
                    case '4': setViewMode('orbital'); e.preventDefault(); return;
                    case '5': setViewMode('timeline'); e.preventDefault(); return;
                    case '0': setViewMode('free'); e.preventDefault(); return;
                }
            }

            // Ctrl+C: Copy
            if (isMod && e.key === 'c') {
                const store = useStore.getState();
                const selectedIds = store.selectedIds;
                const activeId = store.selectedId;

                const targetIds = selectedIds.length > 0 ? selectedIds : (activeId ? [activeId] : []);
                if (targetIds.length > 0) {
                    const copiedNotes = store.notes
                        .filter(n => targetIds.includes(n.id))
                        .map(n => {
                            const { id, ...rest } = n;
                            return rest;
                        });

                    localClipboard = copiedNotes;
                    window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: `Copied ${copiedNotes.length} star system(s)`, type: 'success' } }));
                    e.preventDefault();
                }
                return;
            }

            // Ctrl+V: Paste
            if (isMod && e.key === 'v') {
                if (localClipboard.length > 0) {
                    const store = useStore.getState();
                    
                    store.takeSnapshot();

                    const newNotes: Note[] = [];
                    localClipboard.forEach((copiedData, idx) => {
                        const newId = Math.random().toString(36).substr(2, 9);
                        const offset = 40 + idx * 15;
                        const pastedNote: Note = {
                            ...copiedData,
                            id: newId,
                            x: (copiedData.x ?? 0) + offset,
                            y: (copiedData.y ?? 0) + offset,
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                            luminance: 1.0,
                            lastAccessedAt: Date.now()
                        } as Note;
                        store.addNote(pastedNote);
                        newNotes.push(pastedNote);
                    });

                    store.setSelectedIds(newNotes.map(n => n.id));
                    window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: `Pasted ${newNotes.length} star system(s)`, type: 'success' } }));
                    e.preventDefault();
                }
                return;
            }

            // Ctrl+Z: Undo
            if (isMod && !e.shiftKey && e.key === 'z') {
                e.preventDefault();
                useStore.getState().undo();
                window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Action Undone', type: 'info' } }));
                return;
            }

            // Ctrl+Y or Ctrl+Shift+Z: Redo
            if (isMod && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault();
                useStore.getState().redo();
                window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Action Redone', type: 'info' } }));
                return;
            }

            // Ctrl+K: Search
            if (isMod && e.key === 'k') {
                e.preventDefault();
                const store = useStore.getState();
                store.setSearchOpen(!store.isSearchOpen);
                return;
            }

            // Ctrl+,: Settings
            if (isMod && e.key === ',') {
                e.preventDefault();
                const store = useStore.getState();
                store.setSettingsOpen(!store.isSettingsOpen);
                return;
            }

            // Escape: Close panels
            if (e.key === 'Escape') {
                const store = useStore.getState();
                if (store.isSearchOpen) { store.setSearchOpen(false); return; }
                if (store.isSettingsOpen) { store.setSettingsOpen(false); return; }
                if (store.selectedId) { store.setSelectedId(undefined); return; }
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [setViewMode]);
}

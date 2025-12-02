import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { Note, CanvasState, Settings, NoteType } from '../types';
import { NOTE_STYLES } from '../constants';

interface AppState {
  notes: Record<string, Note>;
  canvasState: CanvasState;
  settings: Settings;
  isLoaded: boolean;
  focusedNoteId: string | null;
  selectedNoteIds: string[];
  isSearchOpen: boolean;
  searchBranchRootId: string | null;
  isAbsorbingNoteId: string | null;
  activeDropTargetId: string | null;
  edgePan: { x: number; y: number };

  init: () => void;
  setCanvasState: (state: Partial<CanvasState>) => void;
  setSettings: (settings: Partial<Settings>) => void;
  addNote: (note: Partial<Note>, orbital?: boolean) => void;
  updateNotePosition: (id: string, delta: { x: number; y: number }) => void;
  updateNoteContent: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
  resetCanvas: () => void;
  setFocusedNoteId: (id: string | null) => void;
  setSelectedNoteIds: (updater: (ids: string[]) => string[]) => void;
  setSearchOpen: (isOpen: boolean) => void;
  setSearchBranchRootId: (id: string | null) => void;
  createLink: (fromNoteId: string, toNoteId: string) => void;
  removeLink: (fromNoteId: string, toNoteId: string) => void;
  removeParentLink: (childId: string) => void;
  setIsAbsorbingNoteId: (id: string | null) => void;
  setNoteGroup: (noteId: string, groupId: string | null) => void;
  setActiveDropTargetId: (id: string | null) => void;
  setEdgePan: (pan: { x: number; y: number }) => void;
}

const useStore = create<AppState>()(
  (set, get) => ({
      notes: {},
      canvasState: { zoom: 1, pan: { x: 0, y: 0 } },
      settings: {
        theme: 'cosmic',
        font: 'inter',
        fontColor: '#FFFFFF',
        showConnections: true,
        showMinimap: true,
      },
      isLoaded: false,
      focusedNoteId: null,
      selectedNoteIds: [],
      isSearchOpen: false,
      searchBranchRootId: null,
      isAbsorbingNoteId: null,
      activeDropTargetId: null,
      edgePan: { x: 0, y: 0 },
      
      init: () => {
        // GUARANTEED FIX: The simplest possible initialization.
        // This just flips the 'isLoaded' flag and centers the canvas,
        // ensuring the app never gets stuck on the loading screen.
        set({
          isLoaded: true,
          canvasState: { zoom: 1, pan: { x: window.innerWidth / 2, y: window.innerHeight / 2 } },
          notes: {}
        });
      },

      setCanvasState: (state) => set((prev) => ({ canvasState: { ...prev.canvasState, ...state } })),
      setSettings: (settings) => set((prev) => ({ settings: { ...prev.settings, ...settings } })),
      
      addNote: (note, orbital = true) => {
        const id = nanoid();
        const noteType = note.type || NoteType.Earth;
        const noteSize = NOTE_STYLES[noteType].size.diameter;
        let position = note.position || { x: 0, y: 0 };
        
        if (orbital && !note.parentId) {
            const notesCount = Object.keys(get().notes).length;
            const angle = notesCount * (Math.PI * (3 - Math.sqrt(5)));
            // Increased radius factor to accommodate larger notes
            const radius = 400 * Math.sqrt(notesCount + 1);
            position = {
                x: Math.cos(angle) * radius - (noteSize / 2),
                y: Math.sin(angle) * radius - (noteSize / 2),
            };
        }

        const newNote: Note = {
          id,
          content: note.content || (noteType === NoteType.Nebula ? '<h1>Nebula Title</h1>' : `New ${noteType}`),
          position,
          type: noteType,
          parentId: note.parentId || null,
          tags: note.tags || [],
          linkedNoteIds: note.linkedNoteIds || [],
          groupId: null,
        };
        if (newNote.type === NoteType.Nebula) {
            newNote.groupId = id; // A nebula is part of its own group.
        }
        set((prev) => ({ notes: { ...prev.notes, [id]: newNote } }));
      },

      updateNotePosition: (id, delta) => {
        set((prev) => {
          const targetNote = prev.notes[id];
          if (!targetNote) return {};
      
          const newNotes = { ...prev.notes };
      
          if (targetNote.groupId) {
              Object.keys(newNotes).forEach(noteId => {
                  const note = newNotes[noteId];
                  if (note.groupId === targetNote.groupId) {
                      newNotes[noteId] = {
                          ...note,
                          position: {
                              x: note.position.x + delta.x,
                              y: note.position.y + delta.y,
                          },
                      };
                  }
              });
          } else {
              newNotes[id] = {
                  ...targetNote,
                  position: {
                      x: targetNote.position.x + delta.x,
                      y: targetNote.position.y + delta.y,
                  },
              };
          }
          return { notes: newNotes };
        });
      },

      updateNoteContent: (id, content) => {
        set((prev) => ({
          notes: { ...prev.notes, [id]: { ...prev.notes[id], content } },
        }));
      },
      
      deleteNote: (id) => {
        set((prev) => {
          const newNotes = { ...prev.notes };
          const notesToDelete = new Set<string>([id]);
          const queue = [id];
      
          // Find all descendant notes to delete them recursively
          while (queue.length > 0) {
            const currentId = queue.shift()!;
            Object.values(newNotes).forEach((note: Note) => {
              if (note.parentId === currentId) {
                notesToDelete.add(note.id);
                queue.push(note.id);
              }
            });
          }
      
          // Delete the identified notes
          notesToDelete.forEach(noteId => {
            delete newNotes[noteId];
          });
      
          // Clean up dangling references in remaining notes
          Object.keys(newNotes).forEach(key => {
            const note = newNotes[key];
            const updatedLinkedIds = note.linkedNoteIds.filter(linkId => !notesToDelete.has(linkId));
            const updatedParentId = (note.parentId && notesToDelete.has(note.parentId)) ? null : note.parentId;

            // Only update the note object if a change is needed
            if (updatedLinkedIds.length !== note.linkedNoteIds.length || updatedParentId !== note.parentId) {
              newNotes[key] = { 
                  ...note, 
                  linkedNoteIds: updatedLinkedIds,
                  parentId: updatedParentId
              };
            }
          });
      
          const newFocusedNoteId = notesToDelete.has(prev.focusedNoteId || '') ? null : prev.focusedNoteId;
          const newSelectedNoteIds = prev.selectedNoteIds.filter(noteId => !notesToDelete.has(noteId));
      
          return { 
            notes: newNotes, 
            isAbsorbingNoteId: null,
            focusedNoteId: newFocusedNoteId,
            selectedNoteIds: newSelectedNoteIds,
          };
        });
      },
      
      resetCanvas: () => {
        // A simple reset to a clean state. Does not re-call init.
        set({
          notes: {},
          canvasState: { zoom: 1, pan: { x: window.innerWidth / 2, y: window.innerHeight / 2 } },
          focusedNoteId: null,
          selectedNoteIds: [],
          searchBranchRootId: null,
        });
      },

      setFocusedNoteId: (id) => set({ focusedNoteId: id }),
      setSelectedNoteIds: (updater) => set(state => ({ selectedNoteIds: updater(state.selectedNoteIds) })),
      setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
      setSearchBranchRootId: (id) => set({ searchBranchRootId: id }),

      createLink: (fromNoteId: string, toNoteId: string) => {
          if (!fromNoteId || fromNoteId === toNoteId) {
              return;
          }

          set((prev) => {
              const fromNote = prev.notes[fromNoteId];
              const toNote = prev.notes[toNoteId];
              if (!fromNote || !toNote) return {};
              
              const fromLinkedIds = new Set(fromNote.linkedNoteIds);
              fromLinkedIds.add(toNoteId);

              const toLinkedIds = new Set(toNote.linkedNoteIds);
              toLinkedIds.add(fromNoteId);

              return {
                  notes: {
                      ...prev.notes,
                      [fromNoteId]: { ...fromNote, linkedNoteIds: Array.from(fromLinkedIds) },
                      [toNoteId]: { ...toNote, linkedNoteIds: Array.from(toLinkedIds) },
                  }
              };
          });
      },

      removeLink: (fromNoteId, toNoteId) => {
          set((prev) => {
              const fromNote = prev.notes[fromNoteId];
              const toNote = prev.notes[toNoteId];
              const updatedNotes = { ...prev.notes };

              if (fromNote) {
                  updatedNotes[fromNoteId] = {
                      ...fromNote,
                      linkedNoteIds: fromNote.linkedNoteIds.filter(id => id !== toNoteId)
                  };
              }

              if (toNote) {
                  updatedNotes[toNoteId] = {
                      ...toNote,
                      linkedNoteIds: toNote.linkedNoteIds.filter(id => id !== fromNoteId)
                  };
              }
              
              return { notes: updatedNotes };
          });
      },

      removeParentLink: (childId) => {
        set((prev) => {
            const childNote = prev.notes[childId];
            if (!childNote || !childNote.parentId) return {};

            return {
                notes: {
                    ...prev.notes,
                    [childId]: { ...childNote, parentId: null }
                },
            };
        });
      },
      
      setIsAbsorbingNoteId: (id) => set({ isAbsorbingNoteId: id }),
      setActiveDropTargetId: (id) => set({ activeDropTargetId: id }),
      setEdgePan: (pan) => set({ edgePan: pan }),
      
      setNoteGroup: (noteId, groupId) => {
        set(prev => {
            const newNotes = { ...prev.notes };
            const noteToUpdate = newNotes[noteId];
            if (!noteToUpdate) return {};

            const oldGroupId = noteToUpdate.groupId;

            // Update the note's group
            newNotes[noteId] = { ...noteToUpdate, groupId };

            // If the old group is now empty (or just contains its nebula), disband it.
            if (oldGroupId && oldGroupId !== noteId) {
                const oldGroupMembers = Object.values(newNotes).filter((n: Note) => n.groupId === oldGroupId);
                // If only the nebula itself is left in the group, it is no longer a group container.
                if (oldGroupMembers.length === 1 && newNotes[oldGroupId]?.type === NoteType.Nebula) {
                    newNotes[oldGroupId] = { ...newNotes[oldGroupId], groupId: null };
                }
            }

            // If adding to a new group, make sure the nebula itself is grouped.
            if (groupId && newNotes[groupId]?.type === NoteType.Nebula && !newNotes[groupId].groupId) {
                newNotes[groupId] = { ...newNotes[groupId], groupId: groupId };
            }

            return { notes: newNotes };
        });
      },
    })
);

export default useStore;
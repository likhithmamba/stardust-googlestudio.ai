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
        fontSize: 1,
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
        // Initialize Nebula as its own group container
        if (newNote.type === NoteType.Nebula) {
            newNote.groupId = id; 
        }
        set((prev) => ({ notes: { ...prev.notes, [id]: newNote } }));
      },

      updateNotePosition: (id, delta) => {
        set((prev) => {
          const targetNote = prev.notes[id];
          if (!targetNote) return {};
      
          // Determine if we should move the whole group or just the note.
          // Move group ONLY if dragging the Nebula itself (the container).
          // Dragging a child note should move only that note (allowing it to be dragged out).
          const isGroupContainer = targetNote.type === NoteType.Nebula && targetNote.groupId === targetNote.id;

          // Optimization: Fast path for single notes or independent child movement
          if (!targetNote.groupId || !isGroupContainer) {
             return {
                 notes: {
                     ...prev.notes,
                     [id]: {
                         ...targetNote,
                         position: {
                             x: targetNote.position.x + delta.x,
                             y: targetNote.position.y + delta.y,
                         },
                     },
                 },
             };
          }

          // Group update logic (Dragging the Nebula moves all children)
          const newNotes = { ...prev.notes };
          const ids = Object.keys(newNotes);
          // Single pass iteration is faster than filter + map
          for (let i = 0; i < ids.length; i++) {
              const noteId = ids[i];
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
      
          while (queue.length > 0) {
            const currentId = queue.shift()!;
            Object.values(newNotes).forEach((note: Note) => {
              if (note.parentId === currentId) {
                notesToDelete.add(note.id);
                queue.push(note.id);
              }
            });
          }
      
          notesToDelete.forEach(noteId => {
            delete newNotes[noteId];
          });
      
          Object.keys(newNotes).forEach(key => {
            const note = newNotes[key];
            let needsUpdate = false;
            
            const updatedLinkedIds = note.linkedNoteIds.filter(linkId => !notesToDelete.has(linkId));
            if (updatedLinkedIds.length !== note.linkedNoteIds.length) needsUpdate = true;
            
            const updatedParentId = (note.parentId && notesToDelete.has(note.parentId)) ? null : note.parentId;
            if (updatedParentId !== note.parentId) needsUpdate = true;

            if (needsUpdate) {
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
            newNotes[noteId] = { ...noteToUpdate, groupId };

            // Handle leaving a group (Nebula)
            if (oldGroupId && oldGroupId !== noteId) {
                const oldGroupMembers = Object.values(newNotes).filter((n: Note) => n.groupId === oldGroupId);
                // If only the Nebula itself remains, reset its group status so it acts empty
                if (oldGroupMembers.length === 1 && newNotes[oldGroupId]?.type === NoteType.Nebula) {
                    newNotes[oldGroupId] = { ...newNotes[oldGroupId], groupId: null };
                }
            }

            // Handle joining a group (Nebula)
            if (groupId && newNotes[groupId]?.type === NoteType.Nebula) {
                // Ensure the Nebula has its groupId set to itself to act as the container leader
                if (!newNotes[groupId].groupId) {
                    newNotes[groupId] = { ...newNotes[groupId], groupId: groupId };
                }
            }

            return { notes: newNotes };
        });
      },
    })
);

export default useStore;
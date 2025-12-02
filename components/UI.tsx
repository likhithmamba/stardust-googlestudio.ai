import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../hooks/useStore';
import { Note, NoteType, Settings } from '../types';
import { NOTE_STYLES } from '../constants';
import Fuse from 'fuse.js';
import { Map, Frame, HelpCircle, Sun, Moon, Sparkles, Search as SearchIcon, X, Link as LinkIcon, GitBranch, Brush, Plus, Download, Upload, Zap } from 'lucide-react';

// About Modal Component
const AboutModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="w-full max-w-lg bg-gray-100/80 dark:bg-cosmic-bg-dark/80 backdrop-blur-xl border border-glass-edge rounded-lg shadow-2xl overflow-hidden text-black dark:text-white"
                        initial={{ scale: 0.9, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 relative">
                            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                            <div className="flex items-center space-x-4">
                                <Sparkles className="text-purple-400" size={40} />
                                <div>
                                    <h2 className="text-2xl font-bold">Stardust Canvas</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Version 2.2.0</p>
                                </div>
                            </div>
                            <p className="mt-4 text-base text-gray-700 dark:text-gray-300">
                                An infinite canvas note-taking application powered by React and TypeScript, offering a feature-rich, offline-first experience.
                            </p>
                            <div className="mt-6">
                                <h3 className="font-semibold text-lg mb-3">Core Technologies</h3>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    <div className="flex items-center space-x-2"><GitBranch size={16} className="text-sky-400" /><span>React</span></div>
                                    <div className="flex items-center space-x-2"><Zap size={16} className="text-amber-400" /><span>Zustand</span></div>
                                    <div className="flex items-center space-x-2"><Brush size={16} className="text-rose-400" /><span>Framer Motion</span></div>
                                    <div className="flex items-center space-x-2"><X size={16} className="text-blue-400" /><span>TypeScript</span></div>
                                    <div className="flex items-center space-x-2"><Frame size={16} className="text-indigo-400" /><span>Tailwind CSS</span></div>
                                </div>
                            </div>
                             <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Crafted with cosmic dust and code.</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Settings Modal
const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const settings = useStore(state => state.settings);
    const setSettings = useStore(state => state.setSettings);

    const themes: { name: Settings['theme']; icon: React.ReactNode }[] = [
        { name: 'light', icon: <Sun /> },
        { name: 'dark', icon: <Moon /> },
        { name: 'cosmic', icon: <Sparkles /> },
    ];
    
    const fonts: { name: Settings['font']; className: string }[] = [
        { name: 'inter', className: 'font-inter' },
        { name: 'serif', className: 'font-serif' },
        { name: 'mono', className: 'font-mono' },
    ];

    const fontColors = [
        { name: 'Starlight White', hex: '#FFFFFF' },
        { name: 'Nebula Pink', hex: '#f5d0fe' },
        { name: 'Supernova Gold', hex: '#fcd34d' },
        { name: 'Andromeda Blue', hex: '#93c5fd' },
        { name: 'Galactic Green', hex: '#86efac' },
        { name: 'Solar Flare Orange', hex: '#fb923c' },
        { name: 'Cosmic Gray', hex: '#9ca3af' },
        { name: 'Void Black', hex: '#111827' },
    ];

    const specialFontColors = [
        { name: 'Cosmic Gradient', value: 'font-effect-cosmic', style: { background: 'linear-gradient(90deg, #93c5fd, #c084fc, #f472b6, #fb923c)'} },
        { name: 'Gold Glitter', value: 'font-effect-glitter-gold', style: { background: 'linear-gradient(90deg, #fcd34d, #fef08a, #fde047, #fcd34d)'} },
        { name: 'Nebula Shimmer', value: 'font-effect-shimmer-nebula', style: { background: 'linear-gradient(110deg, #f472b6, #c084fc, #93c5fd, #86efac)'} },
        { name: 'Oceanic Wave', value: 'font-effect-ocean-wave', style: { background: 'linear-gradient(90deg, #00C9FF, #92FE9D)' } },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="w-full max-w-md bg-gray-100/80 dark:bg-cosmic-bg-dark/80 backdrop-blur-xl border border-glass-edge rounded-lg shadow-2xl text-black dark:text-white"
                        initial={{ scale: 0.9, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 relative">
                            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black dark:hover:text-white transition-colors"><X size={24} /></button>
                            <h2 className="text-2xl font-bold mb-6">Settings</h2>
                            
                            <div className="mb-6">
                                <h3 className="font-semibold text-md mb-3 text-gray-700 dark:text-gray-300">Theme</h3>
                                <div className="flex space-x-2 rounded-lg bg-gray-200 dark:bg-gray-900/50 p-1">
                                    {themes.map(theme => (
                                        <button key={theme.name} onClick={() => setSettings({ theme: theme.name })} className={`w-full flex justify-center items-center space-x-2 p-2 rounded-md text-sm transition-colors ${settings.theme === theme.name ? 'bg-white dark:bg-black/50 shadow' : 'hover:bg-gray-300/50 dark:hover:bg-white/10'}`}>
                                            {theme.icon}
                                            <span className="capitalize">{theme.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-semibold text-md mb-3 text-gray-700 dark:text-gray-300">Font Style</h3>
                                <div className="flex space-x-2 rounded-lg bg-gray-200 dark:bg-gray-900/50 p-1">
                                    {fonts.map(font => (
                                        <button key={font.name} onClick={() => setSettings({ font: font.name })} className={`w-full p-2 rounded-md text-sm transition-colors ${settings.font === font.name ? 'bg-white dark:bg-black/50 shadow' : 'hover:bg-gray-300/50 dark:hover:bg-white/10'}`}>
                                            <span className={font.className}>Aa</span>
                                            <span className="capitalize ml-2">{font.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-semibold text-md mb-3 text-gray-700 dark:text-gray-300">Font Color</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {fontColors.map(color => (
                                        <button key={color.hex} onClick={() => setSettings({ fontColor: color.hex })} title={color.name} className="relative rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-400">
                                            <div style={{ backgroundColor: color.hex }} className="w-full h-10"></div>
                                            {settings.fontColor === color.hex && (
                                                <div className="absolute inset-0 bg-sky-400/30 border-2 border-sky-400 rounded-md"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-md mb-3 text-gray-700 dark:text-gray-300">Special Effects</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {specialFontColors.map(color => (
                                        <button key={color.value} onClick={() => setSettings({ fontColor: color.value })} title={color.name} className="relative rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-400">
                                            <div style={color.style} className="w-full h-10"></div>
                                            {settings.fontColor === color.value && (
                                                <div className="absolute inset-0 bg-sky-400/30 border-2 border-sky-400 rounded-md"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Toolbar Component
export const Toolbar: React.FC = () => {
  const settings = useStore(state => state.settings);
  const setSettings = useStore(state => state.setSettings);
  const addNote = useStore(state => state.addNote);
  const resetCanvas = useStore(state => state.resetCanvas);

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const handleExport = () => {
      const { notes, canvasState, settings } = useStore.getState();
      const exportData = {
          notes,
          canvasState,
          settings,
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
      const link = document.createElement('a');
      link.href = jsonString;
      link.download = `stardust-canvas-backup-${new Date().toISOString()}.json`;
      link.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const imported = JSON.parse(e.target?.result as string);
              if (imported.notes && imported.canvasState) {
                  useStore.setState(state => ({ ...state, ...imported }));
              } else {
                  alert('Invalid backup file format.');
              }
          } catch (error)
 {
              alert('Error parsing file.');
              console.error(error);
          }
      };
      reader.readAsText(file);
  };

  const IconButton: React.FC<{onClick?: any, title: string, children: React.ReactNode, as?: 'label'}> = ({onClick, title, children, as}) => {
      const Component = as || 'button';
      return (
          <Component onClick={onClick} className="p-2.5 rounded-full hover:bg-white/20 dark:hover:bg-white/10 transition-colors" title={title}>
            {children}
          </Component>
      )
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
        <motion.div
          className="flex items-center space-x-1 bg-white/30 dark:bg-black/30 backdrop-blur-lg rounded-full shadow-lg border border-glass-edge text-black dark:text-white px-2 py-1.5"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.5 }}
        >
            <IconButton onClick={() => setIsSettingsOpen(true)} title="Settings"><Brush size={20} /></IconButton>
            <IconButton onClick={() => addNote({ type: NoteType.Earth })} title="Add Note"><Plus size={20} /></IconButton>
            <IconButton onClick={resetCanvas} title="Reset Canvas"><Frame size={20} /></IconButton>
            
            <div className="w-px h-6 bg-white/30 mx-2"></div>
            
            <IconButton onClick={handleExport} title="Export Data"><Download size={20} /></IconButton>
            <IconButton as="label" title="Import Data">
                <Upload size={20} />
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </IconButton>
            
            <div className="w-px h-6 bg-white/30 mx-2"></div>
            
            <IconButton onClick={() => setSettings({ showMinimap: !settings.showMinimap })} title="Toggle Minimap"><Map size={20}/></IconButton>
            <IconButton onClick={() => setSettings({ showConnections: !settings.showConnections })} title="Toggle Connections"><LinkIcon size={20}/></IconButton>
            <IconButton onClick={() => setIsAboutOpen(true)} title="About"><HelpCircle size={20} /></IconButton>
        </motion.div>
      </div>
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

// Minimap Component
export const Minimap: React.FC = () => {
    const { notes, canvasState, setCanvasState, selectedNoteIds } = useStore();
    const mapRef = useRef<HTMLDivElement>(null);
    const mapSize = { width: 220, height: 160 };

    const bounds = useMemo(() => {
        const allNotes = Object.values(notes);
        if (allNotes.length === 0) return { minX: 0, minY: 0, width: 0, height: 0, scale: 0.01 };
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        allNotes.forEach((note: Note) => {
            const { diameter } = NOTE_STYLES[note.type].size;
            minX = Math.min(minX, note.position.x);
            minY = Math.min(minY, note.position.y);
            maxX = Math.max(maxX, note.position.x + diameter);
            maxY = Math.max(maxY, note.position.y + diameter);
        });
        
        const contentWidth = (maxX - minX) || 1;
        const contentHeight = (maxY - minY) || 1;
        
        const scale = Math.min(mapSize.width / contentWidth, mapSize.height / contentHeight) * 0.8; // More padding

        return { minX, minY, width: contentWidth, height: contentHeight, scale };
    }, [notes]);

    const minimapDotColors: Record<NoteType, string> = {
        [NoteType.Galaxy]: '#a78bfa',
        [NoteType.Nebula]: '#c084fc',
        [NoteType.Sun]: '#facc15',
        [NoteType.RedGiant]: '#f87171',
        [NoteType.WhiteDwarf]: '#e0f2fe',
        [NoteType.Pulsar]: '#67e8f9',
        [NoteType.Jupiter]: '#fb923c',
        [NoteType.Saturn]: '#fcd34d',
        [NoteType.Neptune]: '#60a5fa',
        [NoteType.Uranus]: '#5eead4',
        [NoteType.Earth]: '#38bdf8',
        [NoteType.Venus]: '#fde047',
        [NoteType.Mars]: '#fca5a5',
        [NoteType.Mercury]: '#9ca3af',
        [NoteType.Pluto]: '#d1d5db',
        [NoteType.Ceres]: '#a8a29e',
        [NoteType.Moon]: '#e5e7eb',
        [NoteType.Asteroid]: '#78716c',
        [NoteType.Comet]: '#a5f3fc',
    };

    const handleViewportDrag = (_: any, info: any) => {
        const { zoom, pan } = useStore.getState().canvasState;
        const dx = info.delta.x / bounds.scale * zoom;
        const dy = info.delta.y / bounds.scale * zoom;
        setCanvasState({ pan: { x: pan.x - dx, y: pan.y - dy } });
    };
    
    const centerOnNote = (note: Note) => {
        const { diameter } = NOTE_STYLES[note.type].size;
        setCanvasState({
            zoom: 1,
            pan: {
                x: -note.position.x + window.innerWidth / 2 - diameter / 2,
                y: -note.position.y + window.innerHeight / 2 - diameter / 2,
            }
        });
    };
    
    const viewportLeft = ((-canvasState.pan.x / canvasState.zoom) - bounds.minX) * bounds.scale + (mapSize.width - bounds.width * bounds.scale) / 2;
    const viewportTop = ((-canvasState.pan.y / canvasState.zoom) - bounds.minY) * bounds.scale + (mapSize.height - bounds.height * bounds.scale) / 2;
    const viewportWidth = (window.innerWidth / canvasState.zoom) * bounds.scale;
    const viewportHeight = (window.innerHeight / canvasState.zoom) * bounds.scale;

    return (
        <div className="fixed top-4 right-4 z-20">
            <motion.div 
                ref={mapRef} 
                style={{ width: mapSize.width, height: mapSize.height }} 
                className="relative overflow-hidden bg-gradient-to-br from-gray-900/80 to-indigo-900/80 backdrop-blur-md rounded-lg border border-glass-edge shadow-xl"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
              <svg width={mapSize.width} height={mapSize.height} className="absolute inset-0">
                  <g>
                      {Object.values(notes).flatMap((note: Note) => {
                          const parent = note.parentId ? notes[note.parentId] : null;
                          if (parent) {
                              const p1x = (parent.position.x - bounds.minX) * bounds.scale + (mapSize.width - bounds.width * bounds.scale) / 2;
                              const p1y = (parent.position.y - bounds.minY) * bounds.scale + (mapSize.height - bounds.height * bounds.scale) / 2;
                              const p2x = (note.position.x - bounds.minX) * bounds.scale + (mapSize.width - bounds.width * bounds.scale) / 2;
                              const p2y = (note.position.y - bounds.minY) * bounds.scale + (mapSize.height - bounds.height * bounds.scale) / 2;
                              return <line key={`h-${note.id}`} x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                          }
                          return note.linkedNoteIds.map(linkedId => {
                               if (note.id > linkedId) return null;
                               const target = notes[linkedId];
                               const p1x = (note.position.x - bounds.minX) * bounds.scale + (mapSize.width - bounds.width * bounds.scale) / 2;
                               const p1y = (note.position.y - bounds.minY) * bounds.scale + (mapSize.height - bounds.height * bounds.scale) / 2;
                               const p2x = (target.position.x - bounds.minX) * bounds.scale + (mapSize.width - bounds.width * bounds.scale) / 2;
                               const p2y = (target.position.y - bounds.minY) * bounds.scale + (mapSize.height - bounds.height * bounds.scale) / 2;
                               return <line key={`a-${note.id}-${linkedId}`} x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1"/>
                          });
                      })}
                  </g>
              </svg>
              {Object.values(notes).map((note: Note) => {
                  const isSelected = selectedNoteIds.includes(note.id);
                  const dotSize = Math.max(4, NOTE_STYLES[note.type].size.diameter * bounds.scale * 0.2) * (isSelected ? 1.5 : 1);
                  return (
                      <div 
                          key={note.id} 
                          className="absolute rounded-full cursor-pointer transition-transform duration-200"
                          title={note.content.replace(/<[^>]*>?/gm, '').substring(0, 50)}
                          onClick={() => centerOnNote(note)}
                          style={{
                              left: (note.position.x - bounds.minX) * bounds.scale + (mapSize.width - bounds.width * bounds.scale) / 2,
                              top: (note.position.y - bounds.minY) * bounds.scale + (mapSize.height - bounds.height * bounds.scale) / 2,
                              width: dotSize,
                              height: dotSize,
                              transform: 'translate(-50%, -50%)',
                              backgroundColor: minimapDotColors[note.type] || '#9ca3af',
                              border: isSelected ? '2px solid #facc15' : 'none',
                          }} 
                      />
                  );
              })}
              <motion.div 
                className="absolute border-2 border-yellow-300 rounded bg-yellow-400/20 cursor-grab active:cursor-grabbing" 
                animate={{
                    left: viewportLeft,
                    top: viewportTop,
                    width: viewportWidth,
                    height: viewportHeight,
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                drag
                dragConstraints={mapRef}
                dragElastic={0}
                dragTransition={{ power: 0, timeConstant: 0 }}
                onDrag={handleViewportDrag}
              />
          </motion.div>
        </div>
    );
};

// Search Component
export const Search: React.FC = () => {
    const [query, setQuery] = useState('');
    const { notes, setCanvasState, isSearchOpen, setSearchOpen, searchBranchRootId, setSearchBranchRootId } = useStore();

    const getBranchNotes = useCallback((rootId: string, allNotes: Record<string, Note>): Note[] => {
        const rootNote = allNotes[rootId];
        if (!rootNote) return [];
        
        const branchNotes: Note[] = [];
        const queue: Note[] = [rootNote];
        const visited = new Set<string>([rootId]);

        while (queue.length > 0) {
            const current = queue.shift()!;
            branchNotes.push(current);

            for (const note of (Object.values(allNotes) as Note[])) {
                if (note.parentId === current.id && !visited.has(note.id)) {
                    visited.add(note.id);
                    queue.push(note);
                }
            }
        }
        return branchNotes;
    }, []);
    
    const notesToSearch = useMemo(() => {
        if (searchBranchRootId && notes[searchBranchRootId]) {
            return getBranchNotes(searchBranchRootId, notes);
        }
        return Object.values(notes) as Note[];
    }, [searchBranchRootId, notes, getBranchNotes]);
    
    const fuse = new Fuse(notesToSearch, { keys: ['content', 'tags'] });
    const results = fuse.search(query);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') setSearchOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setSearchOpen]);

    const goToNote = (note: Note) => {
        const { diameter } = NOTE_STYLES[note.type].size;
        setCanvasState({
            zoom: 1,
            pan: {
                x: -note.position.x + (window.innerWidth / 2) - (diameter / 2),
                y: -note.position.y + (window.innerHeight / 2) - (diameter / 2),
            }
        });
        setSearchOpen(false);
    };
    
    const branchRootNote = searchBranchRootId ? notes[searchBranchRootId] : null;

    return (
        <>
            <button onClick={() => setSearchOpen(true)} className="fixed top-4 left-1/2 -translate-x-1/2 z-20 p-2 bg-white/30 dark:bg-black/30 backdrop-blur-lg rounded-lg shadow-lg border border-glass-edge text-black dark:text-white">
                <SearchIcon size={20} />
            </button>
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSearchOpen(false)}
                    >
                        <motion.div
                            className="w-full max-w-2xl bg-gray-100 dark:bg-cosmic-bg-dark rounded-lg shadow-2xl overflow-hidden"
                            initial={{ scale: 0.95, y: -20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: -20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {branchRootNote && (
                                <div className="p-2 px-4 text-sm bg-gray-200 dark:bg-gray-800 flex justify-between items-center text-black dark:text-white">
                                    <span>Searching in branch: <strong dangerouslySetInnerHTML={{ __html: branchRootNote.content.substring(0, 30) }} />...</span>
                                    <button onClick={() => setSearchBranchRootId(null)} className="flex items-center text-xs hover:underline">
                                        <X size={14} className="mr-1" /> Search All
                                    </button>
                                </div>
                            )}
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search notes..."
                                className="w-full p-4 text-lg bg-transparent focus:outline-none text-black dark:text-white"
                                autoFocus
                            />
                            <div className="max-h-96 overflow-y-auto">
                                {results.map(({ item }) => (
                                    <div key={item.id} onClick={() => goToNote(item)} className="p-4 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer text-black dark:text-white">
                                        <p className="font-bold truncate" dangerouslySetInnerHTML={{ __html: item.content.substring(0, 50) }}/>
                                        <p className="text-sm text-gray-500 truncate" dangerouslySetInnerHTML={{ __html: item.content.substring(0, 100) }}/>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

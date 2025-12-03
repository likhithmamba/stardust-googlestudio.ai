import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useStore from './hooks/useStore';
import { Note, NoteType } from './types';
import { NOTE_STYLES, ZOOM_LEVELS } from './constants';
import Starfield from './components/Starfield';
import LightModeFX from './components/LightModeFX';
import NoteComponent from './components/Note';
import BlackHole from './components/BlackHole';
import CreationMenu from './components/CreationMenu';
import { Toolbar, Minimap, Search } from './components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface CreationMenuState {
  visible: boolean;
  x: number;
  y: number;
}

interface LinkDragState {
    fromId: string;
    fromPosition: { x: number; y: number };
    toMousePos: { x: number; y: number };
}

// ---------------- Helper Functions for Connections ----------------
const getCurvePath = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    // Simple midpoint curve logic is faster than complex bezier if called frequently
    const midX = (p1.x + p2.x) / 2 - dy * 0.2;
    const midY = (p1.y + p2.y) / 2 + dx * 0.2;
    return `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;
};

const calculateEdgePoints = (noteA: Note, noteB: Note) => {
    const styleA = NOTE_STYLES[noteA.type];
    const styleB = NOTE_STYLES[noteB.type];
    const centerA = { x: noteA.position.x + styleA.size.diameter / 2, y: noteA.position.y + styleA.size.diameter / 2 };
    const centerB = { x: noteB.position.x + styleB.size.diameter / 2, y: noteB.position.y + styleB.size.diameter / 2 };
    const angle = Math.atan2(centerB.y - centerA.y, centerB.x - centerA.x);
    const p1 = { x: centerA.x + (styleA.size.diameter / 2) * Math.cos(angle), y: centerA.y + (styleA.size.diameter / 2) * Math.sin(angle) };
    const p2 = { x: centerB.x - (styleB.size.diameter / 2) * Math.cos(angle), y: centerB.y - (styleB.size.diameter / 2) * Math.sin(angle) };
    return { p1, p2 };
};

// ---------------- Isolated Connection Layer Component ----------------
// Memoized to prevent re-rendering if props are identical
const ConnectionLayer = React.memo(({ notes, visibleNoteIds, hoveredConnectionId, setHoveredConnectionId, removeParentLink, removeLink }: any) => {
    const hierarchicalConnections = useMemo(() => {
        return (Object.values(notes) as Note[])
          .filter(note => note.parentId && notes[note.parentId] && (visibleNoteIds.has(note.id) || visibleNoteIds.has(note.parentId)))
          .map(note => {
            const parent = notes[note.parentId!];
            const { p1, p2 } = calculateEdgePoints(parent, note);
            const connId = `h-conn-${parent.id}-${note.id}`;
            const isHovered = hoveredConnectionId === connId;
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            
            return (
              <g key={connId} onMouseEnter={() => setHoveredConnectionId(connId)} onMouseLeave={() => setHoveredConnectionId(null)} className="cursor-pointer">
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={isHovered ? "rgba(239, 68, 68, 0.9)" : "rgba(192, 132, 252, 0.5)"} strokeWidth={isHovered ? "4" : "2"} strokeDasharray="5,5" className="transition-all duration-200" />
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth="20" />
                 {isHovered && (
                   <foreignObject x={midX - 12} y={midY - 12} width="24" height="24">
                      <button onClick={() => removeParentLink(note.id)} className="w-6 h-6 rounded-full bg-red-500/80 text-white border border-white/50 flex items-center justify-center leading-none hover:bg-red-500 transition-colors">&times;</button>
                  </foreignObject>
                 )}
              </g>
            );
          });
    }, [notes, visibleNoteIds, hoveredConnectionId, removeParentLink]);
    
    const arbitraryLinks = useMemo(() => {
        return (Object.values(notes) as Note[]).flatMap(note => {
            if (!note.linkedNoteIds) return [];
            return note.linkedNoteIds.map(linkedId => {
                const targetNote = notes[linkedId];
                if (!targetNote || note.id > linkedId) return null;
                if (!visibleNoteIds.has(note.id) && !visibleNoteIds.has(linkedId)) return null;

                const { p1, p2 } = calculateEdgePoints(note, targetNote);
                const path = getCurvePath(p1, p2);
                const connId = `a-conn-${note.id}-${linkedId}`;
                const isHovered = hoveredConnectionId === connId;
                const controlX = ((p1.x + p2.x) / 2) - (p2.y - p1.y) * 0.2;
                const controlY = ((p1.y + p2.y) / 2) + (p2.x - p1.x) * 0.2;
                const midCurveX = 0.25 * p1.x + 0.5 * controlX + 0.25 * p2.x;
                const midCurveY = 0.25 * p1.y + 0.5 * controlY + 0.25 * p2.y;
                
                return (
                  <g key={connId} onMouseEnter={() => setHoveredConnectionId(connId)} onMouseLeave={() => setHoveredConnectionId(null)} className="cursor-pointer">
                    <path d={path} fill="none" stroke={isHovered ? "rgba(239, 68, 68, 0.9)" : "rgba(59, 130, 246, 0.7)"} strokeWidth={isHovered ? "4" : "2"} className="transition-all duration-200" />
                    <path d={path} fill="none" stroke="transparent" strokeWidth="20" />
                    {isHovered && (
                        <foreignObject x={midCurveX - 12} y={midCurveY - 12} width="24" height="24">
                            <button onClick={() => removeLink(note.id, linkedId)} className="w-6 h-6 rounded-full bg-red-500/80 text-white border border-white/50 flex items-center justify-center leading-none hover:bg-red-500 transition-colors">&times;</button>
                        </foreignObject>
                    )}
                  </g>
                );
            });
        });
    }, [notes, visibleNoteIds, hoveredConnectionId, removeLink]);

    return <g>{hierarchicalConnections}{arbitraryLinks}</g>;
});

// ---------------- Main App Component ----------------
const useWindowSize = () => {
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    useEffect(() => {
        const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return size;
};

const App: React.FC = () => {
  const notes = useStore(state => state.notes);
  const canvasState = useStore(state => state.canvasState);
  const setCanvasState = useStore(state => state.setCanvasState);
  const init = useStore(state => state.init);
  const isLoaded = useStore(state => state.isLoaded);
  const settings = useStore(state => state.settings);
  const focusedNoteId = useStore(state => state.focusedNoteId);
  const setFocusedNoteId = useStore(state => state.setFocusedNoteId);
  const updateNoteContent = useStore(state => state.updateNoteContent);
  const createLink = useStore(state => state.createLink);
  const addNote = useStore(state => state.addNote);
  const edgePan = useStore(state => state.edgePan);
  const setEdgePan = useStore(state => state.setEdgePan);
  const selectedNoteIds = useStore(state => state.selectedNoteIds);
  const setSelectedNoteIds = useStore(state => state.setSelectedNoteIds);
  const removeLink = useStore(state => state.removeLink);
  const removeParentLink = useStore(state => state.removeParentLink);

  const [creationMenu, setCreationMenu] = useState<CreationMenuState>({ visible: false, x: 0, y: 0 });
  const appRef = useRef<HTMLDivElement>(null);
  const focusedEditorRef = useRef<HTMLDivElement>(null);
  
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number; } | null>(null);
  const [linkDragState, setLinkDragState] = useState<LinkDragState | null>(null);
  const [potentialLinkTargetId, setPotentialLinkTargetId] = useState<string | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const windowSize = useWindowSize();

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    document.documentElement.className = settings.theme;
  }, [settings.theme]);

  useEffect(() => {
    document.body.className = `bg-gray-100 dark:bg-cosmic-bg-dark font-${settings.font}`;
  }, [settings.font]);

  useEffect(() => {
    const body = document.body;
    body.classList.forEach(cls => cls.startsWith('font-effect-') && body.classList.remove(cls));
    if (settings.fontColor.startsWith('font-effect-')) {
      body.classList.add(settings.fontColor);
      document.documentElement.style.removeProperty('--note-font-color');
    } else {
      document.documentElement.style.setProperty('--note-font-color', settings.fontColor);
    }
  }, [settings.fontColor]);

  // Apply Font Size setting
  useEffect(() => {
      document.documentElement.style.setProperty('--note-font-size', `${settings.fontSize}rem`);
  }, [settings.fontSize]);

  useEffect(() => {
    if (edgePan.x === 0 && edgePan.y === 0) return;
    let animationFrameId: number;
    const panLoop = () => {
        const currentPan = useStore.getState().canvasState.pan;
        useStore.getState().setCanvasState({ pan: { x: currentPan.x - edgePan.x, y: currentPan.y - edgePan.y } });
        animationFrameId = requestAnimationFrame(panLoop);
    };
    animationFrameId = requestAnimationFrame(panLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [edgePan]);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === ' ' && !e.repeat) setIsSpacePressed(true);
          if (e.key === 'Escape') {
              if (creationMenu.visible) setCreationMenu({ ...creationMenu, visible: false });
              if (linkDragState) {
                  setLinkDragState(null);
                  setPotentialLinkTargetId(null);
              }
              setSelectedNoteIds(() => []);
              if (selectionBox) setSelectionBox(null);
          }
      };
      const handleKeyUp = (e: KeyboardEvent) => {
          if (e.key === ' ') {
              setIsSpacePressed(false);
              setIsPanning(false);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, [linkDragState, creationMenu, selectionBox, setSelectedNoteIds]);

  // Optimization: Memoize visible IDs so we don't recalculate on every micro-update unless pan/zoom changes significantly
  const visibleNoteIds = useMemo(() => {
    const { pan, zoom } = canvasState;
    const { width, height } = windowSize;
    const padding = 200; 
    const viewLeft = -pan.x / zoom - padding;
    const viewTop = -pan.y / zoom - padding;
    const viewRight = (-pan.x + width) / zoom + padding;
    const viewBottom = (-pan.y + height) / zoom + padding;
    const visibleIds = new Set<string>();
    for (const note of Object.values(notes) as Note[]) {
        const style = NOTE_STYLES[note.type];
        const noteRight = note.position.x + style.size.diameter;
        const noteBottom = note.position.y + style.size.diameter;
        if (noteRight > viewLeft && note.position.x < viewRight && noteBottom > viewTop && note.position.y < viewBottom) {
            visibleIds.add(note.id);
        }
    }
    return visibleIds;
  }, [canvasState.pan.x, canvasState.pan.y, canvasState.zoom, notes, windowSize]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const { zoom, pan } = useStore.getState().canvasState;
    const scrollMultiplier = 0.001;
    const newZoom = Math.max(ZOOM_LEVELS.MIN, Math.min(ZOOM_LEVELS.MAX, zoom * (1 - e.deltaY * scrollMultiplier)));
    
    const rect = appRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);
    
    setCanvasState({ zoom: newZoom, pan: {x: newPanX, y: newPanY } });
  }, [setCanvasState]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('canvas-bg')) return;
    if (isSpacePressed) {
      setIsPanning(true);
    } else {
      setSelectionBox({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY });
      if (!e.shiftKey) setSelectedNoteIds(() => []);
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasState({ pan: { x: canvasState.pan.x + e.movementX, y: canvasState.pan.y + e.movementY }});
      return;
    } 
    
    if (selectionBox) {
      setSelectionBox({ ...selectionBox, endX: e.clientX, endY: e.clientY });
    } else if (linkDragState && appRef.current) {
      const rect = appRef.current.getBoundingClientRect();
      const rawMouseX = (e.clientX - rect.left - canvasState.pan.x) / canvasState.zoom;
      const rawMouseY = (e.clientY - rect.top - canvasState.pan.y) / canvasState.zoom;
      
      let targetId: string | null = null;
      let targetCenter = { x: rawMouseX, y: rawMouseY };

      // Optimized Snap-to-Target Detection
      for (const id of visibleNoteIds) {
          if (id === linkDragState.fromId) continue;
          const note = notes[id];
          if (!note) continue;
          
          const style = NOTE_STYLES[note.type];
          const radius = style.size.diameter / 2;
          const centerX = note.position.x + radius;
          const centerY = note.position.y + radius;
          
          // Check distance to center with a forgiveness margin
          const dist = Math.hypot(rawMouseX - centerX, rawMouseY - centerY);
          
          if (dist < radius + 30) { // +30px forgiveness margin
              targetId = id;
              targetCenter = { x: centerX, y: centerY };
              break;
          }
      }

      if (targetId !== potentialLinkTargetId) {
          setPotentialLinkTargetId(targetId);
      }
      
      setLinkDragState(prev => prev ? { ...prev, toMousePos: targetCenter } : null);
    }

    if (selectionBox || linkDragState) {
        const EDGE_MARGIN = 60;
        const MAX_PAN_SPEED = 15;
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        let panX = 0, panY = 0;
        if (clientX < EDGE_MARGIN) panX = (EDGE_MARGIN - clientX) / EDGE_MARGIN * MAX_PAN_SPEED;
        else if (clientX > innerWidth - EDGE_MARGIN) panX = -(clientX - (innerWidth - EDGE_MARGIN)) / EDGE_MARGIN * MAX_PAN_SPEED;
        if (clientY < EDGE_MARGIN) panY = (EDGE_MARGIN - clientY) / EDGE_MARGIN * MAX_PAN_SPEED;
        else if (clientY > innerHeight - EDGE_MARGIN) panY = -(clientY - (innerHeight - EDGE_MARGIN)) / EDGE_MARGIN * MAX_PAN_SPEED;
        if (panX !== edgePan.x || panY !== edgePan.y) setEdgePan({ x: panX, y: panY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setEdgePan({ x: 0, y: 0 });
    
    if (linkDragState) {
        if (potentialLinkTargetId) {
            createLink(linkDragState.fromId, potentialLinkTargetId);
        }
        setLinkDragState(null);
        setPotentialLinkTargetId(null);
    }

    if (selectionBox) {
        const { startX, startY, endX, endY } = selectionBox;
        const left = Math.min(startX, endX), right = Math.max(startX, endX);
        const top = Math.min(startY, endY), bottom = Math.max(startY, endY);
        
        if (Math.abs(startX - endX) > 5 || Math.abs(startY - endY) > 5) {
            const newlySelectedIds = (Object.values(notes) as Note[])
                .filter(note => {
                    const style = NOTE_STYLES[note.type];
                    const noteRect = {
                        left: note.position.x * canvasState.zoom + canvasState.pan.x,
                        top: note.position.y * canvasState.zoom + canvasState.pan.y,
                        right: (note.position.x + style.size.diameter) * canvasState.zoom + canvasState.pan.x,
                        bottom: (note.position.y + style.size.diameter) * canvasState.zoom + canvasState.pan.y,
                    };
                    return noteRect.left < right && noteRect.right > left && noteRect.top < bottom && noteRect.bottom > top;
                })
                .map(note => note.id);
            setSelectedNoteIds(prevIds => [...new Set([...prevIds, ...newlySelectedIds])]);
        }
        setSelectionBox(null);
    }
  };

  const handleNoteSelect = useCallback((id: string, isShiftPressed: boolean) => {
    setSelectedNoteIds(prev => {
        if (isShiftPressed) {
            const newSelection = new Set(prev);
            if (newSelection.has(id)) newSelection.delete(id);
            else newSelection.add(id);
            return Array.from(newSelection);
        }
        return prev.includes(id) && prev.length === 1 ? [] : [id];
    });
  }, [setSelectedNoteIds]);

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).classList.contains('canvas-bg')) return;
    setCreationMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  const handleCreateNoteFromMenu = useCallback((type: NoteType) => {
    if (!appRef.current) return;
    const rect = appRef.current.getBoundingClientRect();
    const noteSize = NOTE_STYLES[type].size.diameter;
    const x = (creationMenu.x - rect.left - canvasState.pan.x) / canvasState.zoom - (noteSize / 2);
    const y = (creationMenu.y - rect.top - canvasState.pan.y) / canvasState.zoom - (noteSize / 2);
    addNote({ type, position: { x, y } }, false);
    setCreationMenu({ visible: false, x: 0, y: 0 });
  }, [addNote, canvasState, creationMenu]);

  const handleStartLinkDrag = useCallback((noteId: string, fromPosition: {x: number, y: number}) => {
    setLinkDragState({ fromId: noteId, fromPosition, toMousePos: fromPosition });
  }, []);

  const handleNoteMouseUp = useCallback((noteId: string) => {
      // Kept for fallback, but main logic is now in App-level handleMouseUp
  }, []);

  const handleCloseFocusView = () => {
    if (focusedNoteId && focusedEditorRef.current) {
        const currentContent = focusedEditorRef.current.innerHTML;
        if (currentContent !== notes[focusedNoteId].content) updateNoteContent(focusedNoteId, currentContent);
    }
    setFocusedNoteId(null);
  };

  if (!isLoaded) return <div className="w-screen h-screen flex items-center justify-center bg-cosmic-bg-dark text-white">Loading Stardust Canvas...</div>;
  const focusedNote = focusedNoteId ? notes[focusedNoteId] : null;
  const selectedGroupIds = new Set(selectedNoteIds.map(id => notes[id]?.groupId).filter(Boolean));
  // Removed showConnectionTargets calculation to avoid mass re-renders

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      {settings.theme === 'cosmic' && <Starfield />}
      {settings.theme === 'light' && <LightModeFX />}
      
      <div
        ref={appRef}
        className={`w-full h-full absolute inset-0 ${linkDragState ? 'cursor-crosshair' : isSpacePressed ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : selectionBox ? 'cursor-crosshair' : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleCanvasDoubleClick}
      >
        <div className="absolute inset-0 bg-gray-200/50 dark:bg-transparent canvas-bg" />

        <div
          className="absolute top-0 left-0 will-change-transform"
          style={{
            transform: `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${canvasState.zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <svg className="absolute top-0 left-0 w-px h-px overflow-visible pointer-events-none">
              {settings.showConnections && (
                  <ConnectionLayer 
                    notes={notes} 
                    visibleNoteIds={visibleNoteIds}
                    hoveredConnectionId={hoveredConnectionId} 
                    setHoveredConnectionId={setHoveredConnectionId} 
                    removeParentLink={removeParentLink} 
                    removeLink={removeLink} 
                  />
              )}
              {linkDragState && (
                  <path d={getCurvePath(linkDragState.fromPosition, linkDragState.toMousePos)} fill="none" stroke="rgba(59, 130, 246, 0.9)" strokeWidth="3" strokeDasharray="8 4" />
              )}
          </svg>
          <AnimatePresence>
              {(Object.values(notes) as Note[])
                .filter(note => visibleNoteIds.has(note.id))
                .map((note) => (
                <NoteComponent 
                  key={note.id} 
                  note={note} 
                  onSelect={handleNoteSelect}
                  isSelected={selectedNoteIds.includes(note.id)}
                  isPartofSelectedGroup={!!note.groupId && selectedGroupIds.has(note.groupId) && !selectedNoteIds.includes(note.id)}
                  onStartLinkDrag={handleStartLinkDrag}
                  onNoteMouseUp={handleNoteMouseUp}
                  isLinking={!!linkDragState}
                  isLinkTarget={potentialLinkTargetId === note.id}
                />
              ))}
          </AnimatePresence>
        </div>

        {selectionBox && (
            <div
              className="fixed border-2 border-dashed border-blue-400 bg-blue-400/20 pointer-events-none z-50"
              style={{
                left: Math.min(selectionBox.startX, selectionBox.endX),
                top: Math.min(selectionBox.startY, selectionBox.endY),
                width: Math.abs(selectionBox.endX - selectionBox.startX),
                height: Math.abs(selectionBox.endY - selectionBox.startY),
              }}
            />
        )}
      </div>
      
      {creationMenu.visible && <CreationMenu x={creationMenu.x} y={creationMenu.y} onSelect={handleCreateNoteFromMenu} onClose={() => setCreationMenu({ ...creationMenu, visible: false })} />}

      <Toolbar />
      {settings.showMinimap && <Minimap />}
      <Search />
      <BlackHole />
      
      <AnimatePresence>
      {focusedNoteId && focusedNote && (
        <motion.div 
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md flex items-center justify-center p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseFocusView}
        >
          <motion.div 
            className="w-full max-w-4xl h-full text-white relative flex flex-col items-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={handleCloseFocusView} className="absolute top-0 right-0 text-gray-400 hover:text-white transition-colors z-50" aria-label="Close"><X size={32} /></button>
            <div className="w-full h-full flex flex-col items-center pt-12 md:pt-20">
                <h2 className="text-4xl font-bold mb-8" style={{ textShadow: '0 2px 15px rgba(0,0,0,0.8)' }}>{focusedNote.type}</h2>
                <div 
                  ref={focusedEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: focusedNote.content }}
                  className="w-full max-w-3xl h-full overflow-y-auto text-lg focus:outline-none prose prose-invert prose-lg"
                  style={{ textShadow: '0 1px 5px rgba(0,0,0,0.5)', fontSize: `calc(1.125rem * var(--note-font-size))` }}
                  onKeyDown={(e) => e.key === 'Escape' && handleCloseFocusView()}
                />
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default App;
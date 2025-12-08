
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, useDragControls, AnimatePresence, Transition, TargetAndTransition } from 'framer-motion';
import { Note as NoteType, NoteType as NoteTypeEnum } from '../types';
import useStore from '../hooks/useStore';
import { NOTE_STYLES, BLACK_HOLE_PROPERTIES, CELESTIAL_DESCRIPTIONS } from '../constants';
import { Maximize2, Search, Info, X } from 'lucide-react';
import ParticleEmitter from './Particles';

const getSelectionStyle = (noteType: NoteTypeEnum): { filter: string[] } => {
    const basePulse = [
        'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))',
        'drop-shadow(0 0 16px rgba(255, 255, 255, 0.8))',
        'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))',
    ];

    switch (noteType) {
        case NoteTypeEnum.Galaxy:
            return {
                filter: [
                    'drop-shadow(0 0 20px rgba(167, 139, 250, 0.6))',
                    'drop-shadow(0 0 40px rgba(129, 140, 248, 0.9))',
                    'drop-shadow(0 0 20px rgba(167, 139, 250, 0.6))',
                ]
            };
        case NoteTypeEnum.BlackHole:
            return {
                 filter: [
                    'drop-shadow(0 0 15px rgba(168, 85, 247, 0.6))',
                    'drop-shadow(0 0 30px rgba(147, 51, 234, 0.9))',
                    'drop-shadow(0 0 15px rgba(168, 85, 247, 0.6))',
                ]
            }
        case NoteTypeEnum.Sun:
        case NoteTypeEnum.RedGiant:
            const color = noteType === NoteTypeEnum.Sun ? '252, 211, 77' : '239, 68, 68';
            return {
                filter: [
                    `drop-shadow(0 0 15px rgba(${color}, 0.7))`,
                    `drop-shadow(0 0 30px rgba(${color}, 1))`,
                    `drop-shadow(0 0 15px rgba(${color}, 0.7))`,
                ]
            };
        case NoteTypeEnum.WhiteDwarf:
        case NoteTypeEnum.Pulsar:
             return {
                filter: [
                    'drop-shadow(0 0 12px rgba(191, 219, 254, 0.8))',
                    'drop-shadow(0 0 24px rgba(255, 255, 255, 1))',
                    'drop-shadow(0 0 12px rgba(191, 219, 254, 0.8))',
                ]
            };
        case NoteTypeEnum.Jupiter:
        case NoteTypeEnum.Saturn:
             return {
                filter: [
                    'drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))',
                    'drop-shadow(0 0 20px rgba(217, 119, 6, 0.8))',
                    'drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))',
                ]
            };
        case NoteTypeEnum.Neptune:
        case NoteTypeEnum.Uranus:
        case NoteTypeEnum.Planet:
             return {
                filter: [
                    'drop-shadow(0 0 10px rgba(99, 102, 241, 0.6))',
                    'drop-shadow(0 0 20px rgba(20, 184, 166, 0.8))',
                    'drop-shadow(0 0 10px rgba(99, 102, 241, 0.6))',
                ]
            };
        case NoteTypeEnum.Pluto:
        case NoteTypeEnum.Ceres:
        case NoteTypeEnum.Moon:
            return {
                filter: [
                    'drop-shadow(0 0 6px rgba(220, 220, 220, 0.6))',
                    'drop-shadow(0 0 12px rgba(255, 255, 255, 0.7))',
                    'drop-shadow(0 0 6px rgba(220, 220, 220, 0.6))',
                ]
            };
        case NoteTypeEnum.Asteroid:
            return {
                filter: [
                    'drop-shadow(0 0 5px rgba(120, 113, 108, 0.7))',
                    'drop-shadow(0 0 10px rgba(168, 162, 158, 0.8))',
                    'drop-shadow(0 0 5px rgba(120, 113, 108, 0.7))',
                ]
            };
        case NoteTypeEnum.Comet:
             return {
                filter: [
                    'drop-shadow(0 0 8px rgba(34, 211, 238, 0.7))',
                    'drop-shadow(0 0 16px rgba(125, 211, 252, 0.9))',
                    'drop-shadow(0 0 8px rgba(34, 211, 238, 0.7))',
                ]
            };
        default:
            return { filter: basePulse };
    }
};

interface NoteProps {
  note: NoteType;
  isSelected: boolean;
  isPartofSelectedGroup: boolean;
  onSelect: (id: string, isShiftPressed: boolean) => void;
  onStartLinkDrag: (noteId: string, portPosition: {x: number, y: number}) => void;
  onNoteMouseUp: (noteId: string) => void;
  isLinking: boolean;
  isLinkTarget: boolean; 
}

const NoteComponent: React.FC<NoteProps> = ({ note, isSelected, isPartofSelectedGroup, onSelect, onStartLinkDrag, onNoteMouseUp, isLinking, isLinkTarget }) => {
  const updateNotePosition = useStore(s => s.updateNotePosition);
  const updateNoteContent = useStore(s => s.updateNoteContent);
  const deleteNote = useStore(s => s.deleteNote);
  const setFocusedNoteId = useStore(s => s.setFocusedNoteId);
  const setIsAbsorbingNoteId = useStore(s => s.setIsAbsorbingNoteId);
  const setSearchBranchRootId = useStore(s => s.setSearchBranchRootId);
  const setSearchOpen = useStore(s => s.setSearchOpen);
  const setActiveDropTargetId = useStore(s => s.setActiveDropTargetId);
  const setNoteGroup = useStore(s => s.setNoteGroup);
  const setEdgePan = useStore(s => s.setEdgePan);
  const setGroupFilter = useStore(s => s.setGroupFilter);
  
  const isBeingAbsorbed = useStore(s => s.isAbsorbingNoteId === note.id);
  const isDropTarget = useStore(s => s.activeDropTargetId === note.id && note.type === NoteTypeEnum.Nebula);

  // Selector to get the filter string from the parent Nebula, if it exists
  const groupFilter = useStore(state => note.groupId ? state.notes[note.groupId]?.groupFilter : undefined);

  const isFilteredOut = useMemo(() => {
      // Don't filter the Nebula itself based on its own filter query
      if (note.type === NoteTypeEnum.Nebula && note.groupId === note.id) return false;
      
      if (!groupFilter || !note.groupId) return false;
      
      const query = groupFilter.toLowerCase();
      const contentMatch = note.content.toLowerCase().includes(query);
      // Assuming tags might be in the tags array; currently simple content check is robust for most
      const tagsMatch = note.tags && note.tags.some(t => t.toLowerCase().includes(query));
      
      return !contentMatch && !tagsMatch;
  }, [groupFilter, note.content, note.tags, note.groupId, note.type, note.id]);

  const dragControls = useDragControls();
  const noteRef = useRef<HTMLDivElement>(null);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const isNebula = note.type === NoteTypeEnum.Nebula;
  const isBlackHole = note.type === NoteTypeEnum.BlackHole;
  const [isExitingToBlackHole, setIsExitingToBlackHole] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const isDragUpdateScheduled = useRef(false);
  const blackHoleRect = useRef<DOMRect | null>(null);

  const style = NOTE_STYLES[note.type];
  
  // Calculate dynamic border styles based on state
  let borderClasses = `border-2 p-4 ${style.colors} ${style.glow}`;
  if (isLinkTarget) {
      borderClasses = `border-4 p-4 border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.6)] scale-105`;
  }

  const className = `absolute flex flex-col justify-center items-center text-center cursor-grab focus:outline-none transition-shadow duration-200 ${isNebula || isBlackHole ? '' : borderClasses} group`;

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsEditing(false);
    const newContent = e.currentTarget.innerHTML;
    if (newContent !== note.content) {
      updateNoteContent(note.id, newContent);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleDragStart = () => {
    const el = document.getElementById('black-hole');
    blackHoleRect.current = el ? el.getBoundingClientRect() : null;
  };

  const handleDrag = (_: any, info: any) => {
    if (isDragUpdateScheduled.current) return;
    isDragUpdateScheduled.current = true;

    requestAnimationFrame(() => {
        const state = useStore.getState();
        const { isAbsorbingNoteId, notes, canvasState, activeDropTargetId, edgePan } = state;
        
        // 1. Black Hole Pull Logic
        let isPulling = false;
        if (blackHoleRect.current) {
            const holeCenter = { x: blackHoleRect.current.left + blackHoleRect.current.width / 2, y: blackHoleRect.current.top + blackHoleRect.current.height / 2 };
            const distance = Math.hypot(info.point.x - holeCenter.x, info.point.y - holeCenter.y);
            if (distance < BLACK_HOLE_PROPERTIES.PULL_DISTANCE) {
                isPulling = true;
            }
        }

        if (!isPulling && !isBlackHole) {
             const noteCenter = {
                x: note.position.x + info.offset.x / canvasState.zoom + style.size.diameter / 2,
                y: note.position.y + info.offset.y / canvasState.zoom + style.size.diameter / 2,
            };
            
            for (const otherNote of Object.values(notes) as NoteType[]) {
                if (otherNote.type === NoteTypeEnum.BlackHole && otherNote.id !== note.id) {
                    const bhStyle = NOTE_STYLES[NoteTypeEnum.BlackHole];
                    const bhCenter = {
                        x: otherNote.position.x + bhStyle.size.diameter / 2,
                        y: otherNote.position.y + bhStyle.size.diameter / 2,
                    };
                    const dx = noteCenter.x - bhCenter.x;
                    const dy = noteCenter.y - bhCenter.y;
                    if (Math.abs(dx) < bhStyle.size.diameter && Math.abs(dy) < bhStyle.size.diameter) {
                         const dist = Math.hypot(dx, dy);
                         if (dist < bhStyle.size.diameter) {
                             isPulling = true;
                             break;
                         }
                    }
                }
            }
        }

        if (isPulling && isAbsorbingNoteId !== note.id) {
            setIsAbsorbingNoteId(note.id);
        } else if (!isPulling && isAbsorbingNoteId === note.id) {
            setIsAbsorbingNoteId(null);
        }

        // 2. Nebula Grouping Target Logic
        if (note.type !== NoteTypeEnum.Nebula) { // Nebulas cannot be dropped into other nebulas
            const { diameter } = NOTE_STYLES[note.type].size;
            const noteCenter = {
                x: note.position.x + info.offset.x / canvasState.zoom + diameter / 2,
                y: note.position.y + info.offset.y / canvasState.zoom + diameter / 2,
            };

            let targetId: string | null = null;
            for (const otherNote of Object.values(notes) as NoteType[]) {
                if (otherNote.type === NoteTypeEnum.Nebula && otherNote.id !== note.id) {
                    const nebulaStyle = NOTE_STYLES[NoteTypeEnum.Nebula];
                    const nebulaRect = {
                        left: otherNote.position.x,
                        top: otherNote.position.y,
                        right: otherNote.position.x + nebulaStyle.size.diameter,
                        bottom: otherNote.position.y + nebulaStyle.size.diameter,
                    };
                    if (noteCenter.x > nebulaRect.left && noteCenter.x < nebulaRect.right &&
                        noteCenter.y > nebulaRect.top && noteCenter.y < nebulaRect.bottom) {
                        targetId = otherNote.id;
                        break;
                    }
                }
            }
            if (targetId !== activeDropTargetId) {
                setActiveDropTargetId(targetId);
            }
        }

        // 3. Edge Panning
        const EDGE_MARGIN = 60;
        const MAX_PAN_SPEED = 15;
        const { clientX, clientY } = info.point;
        const { innerWidth, innerHeight } = window;
        let panX = 0;
        let panY = 0;

        if (clientX < EDGE_MARGIN) {
            panX = (EDGE_MARGIN - clientX) / EDGE_MARGIN * MAX_PAN_SPEED;
        } else if (clientX > innerWidth - EDGE_MARGIN) {
            panX = -(clientX - (innerWidth - EDGE_MARGIN)) / EDGE_MARGIN * MAX_PAN_SPEED;
        }

        if (clientY < EDGE_MARGIN) {
            panY = (EDGE_MARGIN - clientY) / EDGE_MARGIN * MAX_PAN_SPEED;
        } else if (clientY > innerHeight - EDGE_MARGIN) {
            panY = -(clientY - (innerHeight - EDGE_MARGIN)) / EDGE_MARGIN * MAX_PAN_SPEED;
        }
        
        if (panX !== edgePan.x || panY !== edgePan.y) {
            setEdgePan({ x: panX, y: panY });
        }
        
        isDragUpdateScheduled.current = false;
    });
  };
  
  const handleDragEnd = (_: any, info: any) => {
    blackHoleRect.current = null;
    setEdgePan({ x: 0, y: 0 }); 
    
    const { canvasState, notes } = useStore.getState();

    // 1. Black Hole Deletion Check
    const blackHoleEl = document.getElementById('black-hole');
    if (blackHoleEl) {
        const holeRect = blackHoleEl.getBoundingClientRect();
        const holeCenter = { x: holeRect.left + holeRect.width / 2, y: holeRect.top + holeRect.height / 2 };
        const distance = Math.hypot(info.point.x - holeCenter.x, info.point.y - holeCenter.y);
        if (distance < BLACK_HOLE_PROPERTIES.ABSORB_DISTANCE) {
            setIsExitingToBlackHole(true);
            return;
        }
    }

    if (!isBlackHole) {
        const { diameter } = NOTE_STYLES[note.type].size;
        const finalPosition = { 
            x: note.position.x + info.offset.x / canvasState.zoom,
            y: note.position.y + info.offset.y / canvasState.zoom
        };
        const center = { x: finalPosition.x + diameter / 2, y: finalPosition.y + diameter / 2 };

        for (const otherNote of Object.values(notes) as NoteType[]) {
             if (otherNote.type === NoteTypeEnum.BlackHole && otherNote.id !== note.id) {
                 const bhStyle = NOTE_STYLES[NoteTypeEnum.BlackHole];
                 const bhCenter = {
                     x: otherNote.position.x + bhStyle.size.diameter / 2,
                     y: otherNote.position.y + bhStyle.size.diameter / 2,
                 };
                 const dist = Math.hypot(center.x - bhCenter.x, center.y - bhCenter.y);
                 if (dist < bhStyle.size.diameter / 2) {
                     setIsExitingToBlackHole(true);
                     return;
                 }
             }
        }
    }

    setIsAbsorbingNoteId(null);
    setActiveDropTargetId(null);

    // 2. Nebula Grouping Commit
    if (note.type !== NoteTypeEnum.Nebula) {
        const { diameter } = NOTE_STYLES[note.type].size;
        const finalPosition = { 
            x: note.position.x + info.offset.x / canvasState.zoom,
            y: note.position.y + info.offset.y / canvasState.zoom
        };
        const finalCenter = {
            x: finalPosition.x + diameter / 2,
            y: finalPosition.y + diameter / 2
        };
        let newGroupId: string | null = null;
        for (const otherNote of Object.values(notes) as NoteType[]) {
            if (otherNote.type === NoteTypeEnum.Nebula && otherNote.id !== note.id) {
                const nebulaStyle = NOTE_STYLES[NoteTypeEnum.Nebula];
                const nebulaRect = {
                    left: otherNote.position.x,
                    top: otherNote.position.y,
                    right: otherNote.position.x + nebulaStyle.size.diameter,
                    bottom: otherNote.position.y + nebulaStyle.size.diameter,
                };
                if (finalCenter.x > nebulaRect.left && finalCenter.x < nebulaRect.right &&
                    finalCenter.y > nebulaRect.top && finalCenter.y < nebulaRect.bottom) {
                    newGroupId = otherNote.id;
                    break;
                }
            }
        }
        if (note.groupId !== newGroupId) {
            setNoteGroup(note.id, newGroupId);
        }
    }

    // 3. Final Position Update
    const delta = {
        x: info.offset.x / canvasState.zoom,
        y: info.offset.y / canvasState.zoom,
    };
    if (delta.x !== 0 || delta.y !== 0) {
        updateNotePosition(note.id, delta);
    }
  };
  
  const handleBranchSearch = () => {
    setSearchBranchRootId(note.id);
    setSearchOpen(true);
  };

  const getBlackHoleExitAnimation = () => {
    return {
        scale: 0,
        opacity: 0,
        rotate: 720,
        transition: { duration: 0.8, ease: 'easeIn' as const }
    };
  };

  let animateProps: TargetAndTransition = {
    scale: isFilteredOut ? 0.8 : (isBeingAbsorbed ? 0.3 : 1), 
    opacity: isFilteredOut ? 0.1 : (isBeingAbsorbed ? 0.2 : 1),
    filter: isSelected
      ? getSelectionStyle(note.type).filter
      : isPartofSelectedGroup
        ? 'drop-shadow(0 0 12px rgba(167, 139, 250, 0.8))'
        : 'drop-shadow(0 0 0px rgba(255, 255, 255, 0))',
  };

  if (isLinkTarget) {
      animateProps.scale = 1.05;
      animateProps.filter = 'drop-shadow(0 0 20px rgba(74, 222, 128, 0.6))';
  }

  if (isExitingToBlackHole) {
    animateProps = getBlackHoleExitAnimation();
  }

  const transitionProps: Transition = {
    type: 'spring', 
    stiffness: 300, 
    damping: 20,
    filter: (isSelected || isLinkTarget)
        ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        : { type: 'spring', stiffness: 400, damping: 25 },
  };

  if (!isBeingAbsorbed && !isLinkTarget && !isFilteredOut) {
    if (note.type === NoteTypeEnum.Pulsar) {
        animateProps.scale = [1, 1.08, 1];
        transitionProps.scale = { duration: 0.8, repeat: Infinity, ease: 'easeInOut' };
    } else if (note.type === NoteTypeEnum.RedGiant) {
        animateProps.scale = [1, 1.015, 1];
        transitionProps.scale = { duration: 5, repeat: Infinity, ease: 'easeInOut' };
    } else if (note.type === NoteTypeEnum.Asteroid) {
        animateProps.rotate = [0, 360];
        transitionProps.rotate = { duration: 60, repeat: Infinity, ease: 'linear' };
    } else if (note.type === NoteTypeEnum.BlackHole) {
         animateProps.scale = [1, 1.02, 1];
         transitionProps.scale = { duration: 3, repeat: Infinity, ease: 'easeInOut' };
    }
  }

  const whileHoverProps = (isSelected && !isBeingAbsorbed) || isLinking
    ? {
        scale: 1.02,
        zIndex: 5,
        transition: { type: 'spring' as const, stiffness: 400, damping: 10 }
      }
    : {};
    
  const getPortPosition = (position: 'top' | 'right' | 'bottom' | 'left') => {
      const center = style.size.diameter / 2;
      switch(position) {
          case 'top': return { top: '-8px', left: `${center - 8}px`, x: center, y: 0 };
          case 'right': return { top: `${center - 8}px`, right: '-8px', x: center * 2, y: center };
          case 'bottom': return { bottom: '-8px', left: `${center - 8}px`, x: center, y: center * 2 };
          case 'left': return { top: `${center - 8}px`, left: '-8px', x: 0, y: center };
      }
  };

  const renderConnectionPorts = () => {
    if (!isSelected || isNebula || isBlackHole) return null;
    return ['top', 'right', 'bottom', 'left'].map(pos => {
        const { top, right, bottom, left, x, y } = getPortPosition(pos as any);
        return (
            <motion.div
                key={pos}
                className="absolute w-4 h-4 bg-sky-400 rounded-full border-2 border-white/80 cursor-pointer"
                style={{ top, right, bottom, left }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileHover={{ scale: 1.5, backgroundColor: '#38bdf8' }}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    onStartLinkDrag(note.id, { x: note.position.x + x, y: note.position.y + y });
                }}
            />
        )
    });
  };
  
  const motionDivStyle: React.CSSProperties = {
    width: style.size.diameter,
    height: style.size.diameter,
    left: note.position.x,
    top: note.position.y,
    touchAction: 'none',
    zIndex: isNebula ? 0 : (isBlackHole ? 5 : (isSelected ? 15 : (isPartofSelectedGroup ? 2 : 1))),
    willChange: isSelected || isLinkTarget ? 'transform, left, top' : 'auto', 
    pointerEvents: isFilteredOut ? 'none' : 'auto',
  };
  
  if (note.type === NoteTypeEnum.Asteroid) {
    motionDivStyle.clipPath = 'polygon(20% 0%, 80% 10%, 100% 40%, 90% 80%, 50% 100%, 10% 90%, 0% 40%)';
  } else if (!isNebula) {
    motionDivStyle.borderRadius = '9999px';
  }

  // Optimize text rendering during edits by removing heavy effects
  const contentClassName = `note-content overflow-hidden leading-snug cursor-text w-full h-full focus:outline-none ${isEditing ? 'no-effects' : ''}`;

  return (
    <motion.div
      ref={noteRef}
      key={note.id}
      className={className}
      style={motionDivStyle}
      drag={(!isNebula || isSelected) && !isExitingToBlackHole}
      dragMomentum={false}
      dragControls={dragControls}
      dragListener={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      dragTransition={{ power: 0.1, timeConstant: 200 }}
      onPointerDown={(e) => {
        // Prevent drag/select when interacting with content or actions
        if ((e.target as HTMLElement).closest('.note-actions') || (e.target as HTMLElement).closest('.note-content-wrapper') || (e.target as HTMLElement).tagName === 'INPUT') {
            return;
        }
        dragControls.start(e, { snapToCursor: false });
        onSelect(note.id, e.shiftKey);
        setIsInfoVisible(false);
        e.stopPropagation();
      }}
      onMouseUp={() => onNoteMouseUp(note.id)}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={animateProps}
      onAnimationComplete={() => {
        if (isExitingToBlackHole) {
            deleteNote(note.id);
        }
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={transitionProps}
      whileHover={whileHoverProps}
      whileDrag={{ 
        zIndex: 20, 
        cursor: 'grabbing', 
        scale: 1.1,
        rotate: 2,
        opacity: 0.9,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}
    >
      {isNebula ? (
            <>
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(192, 132, 252, 0.4) 0%, transparent 60%)', filter: 'blur(100px)' }}
                    animate={{
                        scale: isDropTarget ? [1, 1.1, 1] : [1, 1.05, 1],
                        rotate: 360
                    }}
                    transition={{
                        scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
                        rotate: { duration: 180, repeat: Infinity, ease: 'linear' }
                    }}
                />
            </>
        ) : isBlackHole ? (
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="absolute w-full h-full rounded-full bg-black shadow-[inset_0_0_20px_5px_rgba(76,29,149,0.8)]" />
                 <motion.div 
                    className="absolute w-[140%] h-[140%] rounded-full opacity-60"
                    style={{
                        background: 'conic-gradient(from 0deg, transparent, #9333ea, transparent, #a855f7, transparent)',
                        filter: 'blur(10px)'
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                 />
                 <div className="absolute w-[95%] h-[95%] rounded-full bg-black z-10" />
             </div>
        ) : <ParticleEmitter diameter={style.size.diameter} />}
      
      {/* ... Effects rendered here ... */}
      
      {style.hasRings && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div 
            className="absolute w-[180%] h-[180%]"
            style={{
              borderRadius: '50%',
              transform: 'rotateX(75deg)',
              border: `${Math.max(2, style.size.diameter / 45)}px solid rgba(253, 230, 138, 0.4)`,
              boxShadow: `inset 0 0 ${style.size.diameter/45}px rgba(253, 230, 138, 0.3), 0 0 ${style.size.diameter/30}px rgba(253, 230, 138, 0.2)`,
            }}
          />
        </div>
      )}

      <AnimatePresence>
        {renderConnectionPorts()}
      </AnimatePresence>

      <div className="absolute top-4 right-4 z-30">
        <button
          className="note-actions text-white/60 hover:text-white transition-colors"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setIsInfoVisible(!isInfoVisible);
          }}
          title={`About ${note.type}`}
        >
          <Info size={16} />
        </button>
        <AnimatePresence>
          {isInfoVisible && (
            <motion.div
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max max-w-xs p-3 bg-black/70 backdrop-blur-md rounded-lg shadow-lg text-white text-xs z-30"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {CELESTIAL_DESCRIPTIONS[note.type]}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="note-actions absolute -top-10 left-1/2 -translate-x-1/2 flex justify-center items-center z-20">
        {isSelected && !isNebula && !isBlackHole && (
          <div className="flex items-center bg-black/40 backdrop-blur-md rounded-full p-1.5 shadow-lg space-x-1 text-white">
            <button className="p-1.5 hover:text-yellow-300" onClick={() => setFocusedNoteId(note.id)} title="Focus & Edit"><Maximize2 size={14} /></button>
            <button className="p-1.5 hover:text-sky-300" onClick={handleBranchSearch} title="Search Branch"><Search size={14} /></button>
          </div>
        )}
      </div>

      <div
          className="note-content-wrapper relative flex-grow w-full h-full flex items-center justify-center z-10"
          style={{
              padding: `${style.size.diameter * (isNebula ? 0.05 : 0.15)}px`,
          }}
      >
        <div
          ref={contentEditableRef}
          contentEditable
          suppressContentEditableWarning={true}
          className={contentClassName}
          dangerouslySetInnerHTML={{ __html: note.content }}
          onBlur={handleBlur}
          onFocus={handleFocus}
          style={isNebula || isBlackHole ? {
              background: 'transparent',
              padding: 0,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textShadow: '0px 2px 10px rgba(0,0,0,0.8)',
              fontSize: '2.5rem',
              fontWeight: 'bold',
          } : {
              fontSize: `var(--note-font-size, 1rem)`, 
          }}
        />
      </div>

      {isNebula && (
        <div className={`absolute bottom-[20%] left-1/2 -translate-x-1/2 w-48 z-40 transition-opacity duration-300 focus-within:opacity-100 ${!note.groupFilter ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
            <div className="flex items-center bg-black/40 backdrop-blur-md rounded-full px-3 py-1 border border-white/20 hover:bg-black/60 transition-colors">
                <Search size={12} className="text-white/60 mr-2 flex-shrink-0" />
                <input 
                    type="text"
                    placeholder="Filter nebula..."
                    className="bg-transparent border-none outline-none text-white text-xs w-full placeholder-white/40"
                    value={note.groupFilter || ''}
                    onChange={(e) => setGroupFilter(note.id, e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()} 
                />
                {note.groupFilter && (
                    <button onClick={() => setGroupFilter(note.id, '')} className="ml-1 text-white/60 hover:text-white flex-shrink-0">
                        <X size={12} />
                    </button>
                )}
            </div>
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(NoteComponent);

import React, { useRef, useEffect, useState } from 'react';
import { motion, useDragControls, AnimatePresence, useAnimation, Transition, TargetAndTransition } from 'framer-motion';
import { Note as NoteType, NoteType as NoteTypeEnum } from '../types';
import useStore from '../hooks/useStore';
import { NOTE_STYLES, BLACK_HOLE_PROPERTIES, CELESTIAL_DESCRIPTIONS } from '../constants';
import { Maximize2, Search, Info } from 'lucide-react';
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
        // Earth, Venus, Mars, Mercury, Nebula
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
  showConnectionTargets: boolean;
}

const NoteComponent: React.FC<NoteProps> = ({ note, isSelected, isPartofSelectedGroup, onSelect, onStartLinkDrag, onNoteMouseUp, isLinking, showConnectionTargets }) => {
  const { 
    updateNotePosition, 
    updateNoteContent, 
    deleteNote, 
    setFocusedNoteId, 
    setIsAbsorbingNoteId, 
    isAbsorbingNoteId,
    setSearchBranchRootId,
    setSearchOpen,
    canvasState,
    activeDropTargetId,
    setActiveDropTargetId,
    setNoteGroup,
    setEdgePan
  } = useStore();
  
  const dragControls = useDragControls();
  const noteRef = useRef<HTMLDivElement>(null);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const isNebula = note.type === NoteTypeEnum.Nebula;
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExitingToBlackHole, setIsExitingToBlackHole] = useState(false);
  const animationControls = useAnimation();
  const isDragUpdateScheduled = useRef(false);
  const blackHoleRect = useRef<DOMRect | null>(null);

  const style = NOTE_STYLES[note.type];
  const className = `absolute flex flex-col justify-center items-center text-center cursor-grab focus:outline-none transition-shadow duration-200 ${isNebula ? '' : `border-2 p-4 ${style.colors} ${style.glow}`}`;

  const isBeingAbsorbed = isAbsorbingNoteId === note.id;
  const isDropTarget = note.type === NoteTypeEnum.Nebula && activeDropTargetId === note.id;

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    if (newContent !== note.content) {
      updateNoteContent(note.id, newContent);
    }
  };

  useEffect(() => {
    const checkOverflow = () => {
        if (isNebula) return setIsOverflowing(false); // Nebula title shouldn't trigger overflow
        const element = contentEditableRef.current;
        if (element) {
            const hasOverflow = element.scrollHeight > element.clientHeight + 1;
            if (hasOverflow !== isOverflowing) {
                setIsOverflowing(hasOverflow);
            }
        }
    };
    const timeoutId = setTimeout(checkOverflow, 50);
    window.addEventListener('resize', checkOverflow);
    return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', checkOverflow);
    };
  }, [note.content, style.size.diameter, isOverflowing, isNebula]);

  const handleDragStart = () => {
    const el = document.getElementById('black-hole');
    blackHoleRect.current = el ? el.getBoundingClientRect() : null;
  };

  const handleDrag = (_: any, info: any) => {
    if (isDragUpdateScheduled.current) return;
    isDragUpdateScheduled.current = true;

    requestAnimationFrame(() => {
        const { isAbsorbingNoteId, notes, canvasState, activeDropTargetId, edgePan } = useStore.getState();
        
        if (blackHoleRect.current) {
            const holeCenter = { x: blackHoleRect.current.left + blackHoleRect.current.width / 2, y: blackHoleRect.current.top + blackHoleRect.current.height / 2 };
            const distance = Math.hypot(info.point.x - holeCenter.x, info.point.y - holeCenter.y);

            if (distance < BLACK_HOLE_PROPERTIES.PULL_DISTANCE && isAbsorbingNoteId !== note.id) {
                setIsAbsorbingNoteId(note.id);
            } else if (distance >= BLACK_HOLE_PROPERTIES.PULL_DISTANCE && isAbsorbingNoteId === note.id) {
                setIsAbsorbingNoteId(null);
            }
        }

        if (note.type === NoteTypeEnum.Nebula) {
            isDragUpdateScheduled.current = false;
            return;
        }

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
    blackHoleRect.current = null; // Clean up cached rect
    setEdgePan({ x: 0, y: 0 }); 
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

    setIsAbsorbingNoteId(null);
    setActiveDropTargetId(null);

    if (note.type !== NoteTypeEnum.Nebula) {
        const { notes } = useStore.getState();
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
    const { canvasState } = useStore.getState();
    const blackHoleSize = BLACK_HOLE_PROPERTIES.SIZE;
    const blackHoleScreenPos = {
        x: window.innerWidth - 8 - blackHoleSize / 2,
        y: window.innerHeight - 8 - blackHoleSize / 2,
    };
    const targetX = (blackHoleScreenPos.x - canvasState.pan.x) / canvasState.zoom;
    const targetY = (blackHoleScreenPos.y - canvasState.pan.y) / canvasState.zoom;

    return {
        x: targetX,
        y: targetY,
        scale: 0,
        opacity: 0,
        rotate: 360,
        // FIX: Add 'as const' to ensure TypeScript infers a literal type for 'ease',
        // which is required by Framer Motion's Transition type, resolving the assignment error.
        transition: { duration: 0.5, ease: 'easeIn' as const }
    };
  };

  let animateProps: TargetAndTransition = {
    scale: isBeingAbsorbed ? 0.3 : 1, 
    opacity: isBeingAbsorbed ? 0.2 : 1,
    filter: isSelected
      ? getSelectionStyle(note.type).filter
      : isPartofSelectedGroup
        ? 'drop-shadow(0 0 12px rgba(167, 139, 250, 0.8))'
        : 'drop-shadow(0 0 0px rgba(255, 255, 255, 0))',
  };

  if (isExitingToBlackHole) {
    animateProps = getBlackHoleExitAnimation();
  }

  const transitionProps: Transition = {
    type: 'spring', 
    stiffness: 300, 
    damping: 20,
    filter: isSelected
        ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        : { type: 'spring', stiffness: 400, damping: 25 },
  };

  if (!isBeingAbsorbed) {
    if (note.type === NoteTypeEnum.Pulsar) {
        animateProps.scale = [1, 1.08, 1];
        transitionProps.scale = { duration: 0.8, repeat: Infinity, ease: 'easeInOut' };
        if (!isSelected) {
            const glow = NOTE_STYLES[NoteTypeEnum.Pulsar].glow.match(/\[(.*?)\]/)![1].replace(/_/g, ' ');
            const [x, y, blur, spread, color] = glow.split(' ');
            const baseBlur = parseInt(blur);
            const baseSpread = parseInt(spread);
            
            animateProps.filter = [
                `drop-shadow(${x} ${y} ${baseBlur}px ${baseSpread}px ${color})`,
                `drop-shadow(${x} ${y} ${baseBlur * 1.8}px ${baseSpread * 1.4}px ${color})`,
                `drop-shadow(${x} ${y} ${baseBlur}px ${baseSpread}px ${color})`,
            ];
            transitionProps.filter = { duration: 0.8, repeat: Infinity, ease: 'easeInOut' };
        }
    } else if (note.type === NoteTypeEnum.RedGiant) {
        animateProps.scale = [1, 1.015, 1];
        transitionProps.scale = { duration: 5, repeat: Infinity, ease: 'easeInOut' };
    } else if (note.type === NoteTypeEnum.Asteroid) {
        animateProps.rotate = [0, 360];
        transitionProps.rotate = { duration: 60, repeat: Infinity, ease: 'linear' };
    }
  }

  const whileHoverProps = (isSelected && !isBeingAbsorbed) || isLinking
    ? {
        scale: 1.02,
        zIndex: 5,
        // FIX: Explicitly set the transition type to 'spring' as a const. This prevents TypeScript from inferring it as a generic 'string', which is not compatible with Framer Motion's 'AnimationGeneratorType', thus resolving the type error.
        transition: { type: 'spring' as const, stiffness: 400, damping: 10 }
      }
    : {};
    
  const getPortPosition = (position: 'top' | 'right' | 'bottom' | 'left') => {
      const center = style.size.diameter / 2;
      const radius = style.size.diameter / 2;
      switch(position) {
          case 'top': return { top: '-8px', left: `${center - 8}px`, x: center, y: 0 };
          case 'right': return { top: `${center - 8}px`, right: '-8px', x: center * 2, y: center };
          case 'bottom': return { bottom: '-8px', left: `${center - 8}px`, x: center, y: center * 2 };
          case 'left': return { top: `${center - 8}px`, left: '-8px', x: 0, y: center };
      }
  };

  const renderConnectionPorts = () => {
    if (!isSelected || isNebula) return null;
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

  const renderConnectionTargets = () => {
    if (!showConnectionTargets || isSelected || isNebula) return null;
    return ['top', 'right', 'bottom', 'left'].map(pos => {
        const { top, right, bottom, left } = getPortPosition(pos as any);
        return (
            <motion.div
                key={`target-${pos}`}
                className="absolute w-4 h-4 bg-sky-400/30 rounded-full border-2 border-sky-400/50"
                style={{ top, right, bottom, left }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.5, backgroundColor: 'rgba(56, 189, 248, 0.8)' }}
                onMouseUp={() => onNoteMouseUp(note.id)}
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
    zIndex: isNebula ? 0 : (isSelected ? 15 : (isPartofSelectedGroup ? 2 : 1)),
  };
  
  if (note.type === NoteTypeEnum.Asteroid) {
    motionDivStyle.clipPath = 'polygon(20% 0%, 80% 10%, 100% 40%, 90% 80%, 50% 100%, 10% 90%, 0% 40%)';
  } else if (!isNebula) {
    motionDivStyle.borderRadius = '9999px';
  }

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
        if ((e.target as HTMLElement).closest('.note-actions') || (e.target as HTMLElement).closest('.note-content-wrapper')) {
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
                <motion.div
                    className="absolute inset-[10%] rounded-[40%_60%_60%_40%_/_70%_30%_70%_30%]"
                    style={{ background: 'radial-gradient(circle, rgba(129, 140, 248, 0.3) 0%, transparent 65%)', filter: 'blur(80px)' }}
                    animate={{
                        scale: isDropTarget ? [1, 1.15, 1] : [1, 1.03, 1],
                        rotate: -360
                    }}
                    transition={{
                        scale: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                        rotate: { duration: 240, repeat: Infinity, ease: 'linear' }
                    }}
                />
                 <motion.div
                    className="absolute inset-[20%] rounded-[60%_40%_30%_70%_/_40%_70%_30%_60%]"
                    style={{ background: 'radial-gradient(circle, rgba(244, 114, 182, 0.2) 0%, transparent 70%)', filter: 'blur(60px)' }}
                    animate={{
                        scale: isDropTarget ? [1, 1.2, 1] : [1, 1.08, 1],
                        rotate: 360
                    }}
                    transition={{
                        scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                        rotate: { duration: 300, repeat: Infinity, ease: 'linear' }
                    }}
                />
            </>
        ) : <ParticleEmitter diameter={style.size.diameter} />}
      <AnimatePresence>
        {isSelected && note.type === NoteTypeEnum.Asteroid && (
            <motion.div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 15% 25%, rgba(255,255,255,0.07) 1px, transparent 25px),
                        radial-gradient(circle at 80% 70%, rgba(0,0,0,0.12) 1px, transparent 20px)
                    `,
                    backgroundSize: '100px 100px',
                    mixBlendMode: 'overlay',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
            />
        )}
      </AnimatePresence>
      {note.type === NoteTypeEnum.Galaxy && (
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none -z-10">
              <motion.div 
                  className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%]"
                  style={{
                      background: 'radial-gradient(circle, rgba(79, 70, 229, 0.2) 0%, rgba(79, 70, 229, 0) 60%), radial-gradient(circle, rgba(139, 92, 246, 0.1) 20%, rgba(139, 92, 246, 0) 70%)'
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
              />
          </div>
      )}
      {style.hasTail && (
        <div 
            className="absolute top-1/2 left-1/2 w-[400%] h-24 origin-left -translate-y-1/2 pointer-events-none -z-10"
            style={{
                background: 'linear-gradient(to right, rgba(125, 211, 252, 0.4) 10%, transparent 70%)',
                filter: 'blur(5px)',
                transform: `rotate(${(note.id.charCodeAt(0) * 15) % 360}deg)`,
                WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent 90%)',
                maskImage: 'linear-gradient(to right, black 30%, transparent 90%)',
            }}
        />
      )}
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
      <AnimatePresence>
        {renderConnectionTargets()}
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
        {isSelected && !isNebula && (
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
              ...(isOverflowing
                  ? {
                      maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                    }
                  : {}),
          }}
      >
        <div
          ref={contentEditableRef}
          contentEditable
          suppressContentEditableWarning={true}
          className="note-content overflow-hidden text-sm leading-snug cursor-text w-full h-full focus:outline-none"
          dangerouslySetInnerHTML={{ __html: note.content }}
          onBlur={handleBlur}
          style={isNebula ? {
              background: 'transparent',
              padding: 0,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textShadow: '0px 2px 10px rgba(0,0,0,0.8)',
              fontSize: '2.5rem',
              fontWeight: 'bold',
          } : {}}
        />
        <AnimatePresence>
          {isOverflowing && (
            <motion.div
                className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/80 text-lg font-bold pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                exit={{ opacity: 0 }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            >
                ...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default React.memo(NoteComponent);
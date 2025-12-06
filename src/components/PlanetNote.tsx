import React, { useRef, useState } from 'react';
import { useGesture } from '@use-gesture/react';
import { useStore, type Note } from '../store/useStore';
import { NOTE_STYLES, NoteType } from '../constants';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface PlanetNoteProps {
    note: Note;
    isSelected: boolean;
    zoom: number;
    onConnectStart: (id: string, x: number, y: number) => void;
    onDrag?: (id: string, x: number, y: number) => void;
    onDragEnd?: (id: string) => void;
}

const REAL_SIZES: Record<string, number> = {
    [NoteType.Sun]: 320,
    [NoteType.Jupiter]: 160,
    [NoteType.Saturn]: 140,
    [NoteType.Earth]: 64,
    [NoteType.Mars]: 56,
    [NoteType.Asteroid]: 24,
    [NoteType.Nebula]: 600,
    [NoteType.Galaxy]: 500,
    // Defaults
};

export const PlanetNote: React.FC<PlanetNoteProps> = ({ note, isSelected, zoom, onConnectStart, onDrag, onDragEnd }) => {
    const updateNote = useStore((state) => state.updateNote);
    const setSelectedId = useStore((state) => state.setSelectedId);
    const scaleMode = useStore((state) => state.scaleMode);

    const noteRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const style = NOTE_STYLES[note.type] || NOTE_STYLES[NoteType.Asteroid];
    const [isEditing, setIsEditing] = useState(false);

    // Compute Size
    const size = scaleMode === 'real'
        ? (REAL_SIZES[note.type] || 64)
        : style.width;

    const bind = useGesture({
        onDrag: ({ delta: [dx, dy], event, last }) => {
            if (isEditing) return; // Don't drag while typing
            event.stopPropagation();
            const newX = note.x + dx / zoom;
            const newY = note.y + dy / zoom;
            updateNote(note.id, {
                x: newX,
                y: newY,
                w: size, // Update width in store if needed, though w is mostly derived
                h: size
            });
            onDrag?.(note.id, newX, newY);
            if (last) {
                onDragEnd?.(note.id);
            }
        },
        onPointerDown: ({ event }) => {
            if (isEditing) return;
            event.stopPropagation();
            setSelectedId(note.id);
        }
    }, {
        drag: { filterTaps: true },
    });

    const handleBlur = () => {
        setIsEditing(false);
        if (contentRef.current) {
            updateNote(note.id, { title: contentRef.current.innerText });
        }
    };

    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
        setTimeout(() => {
            if (contentRef.current) {
                contentRef.current.focus();
            }
        }, 50);
    };

    // Connection Handles
    const renderHandle = (position: 'top' | 'right' | 'bottom' | 'left') => {
        if (!isSelected) return null;

        const handleClass = clsx("handle-base", `handle-${position}`);

        return (
            <div
                className={handleClass}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    const rect = noteRef.current?.getBoundingClientRect();
                    if (rect) {
                        onConnectStart(note.id, note.x + size / 2, note.y + size / 2);
                    }
                }}
            />
        );
    };

    return (
        <motion.div
            ref={noteRef}
            {...(bind() as any)}
            className={clsx(
                "note-planet",
                // Remove specific planet size classes if overriding style, but keep for other props
                `planet-${note.type}`,
                style.className
            )}
            style={{
                '--planet-size': `${size}px`,
                width: 'var(--planet-size)',
                height: 'var(--planet-size)',
            } as React.CSSProperties}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
                x: note.x,
                y: note.y,
                width: size,
                height: size,
                scale: 1,
                opacity: 1
            }}
            transition={{
                x: { duration: 0 },
                y: { duration: 0 },
                width: { duration: 0.4, type: "spring" },
                height: { duration: 0.4, type: "spring" },
                scale: { type: 'spring', stiffness: 200, damping: 20 },
                opacity: { duration: 0.3 }
            }}
        >
            {/* Selection Pulse Ring (Accessibility + Visual) */}
            {isSelected && (
                <motion.div
                    layoutId="selection-ring"
                    className="absolute -inset-4 rounded-full border border-white/40 pointer-events-none z-0"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-white/30" />
                </motion.div>
            )}

            {/* Saturn Ring */}
            {(style as any).hasRings && <div className="saturn-ring" />}

            {/* Content */}
            <div
                ref={contentRef}
                className={clsx(
                    "note-content",
                    "pointer-events-auto flex items-center justify-center text-center leading-tight outline-none"
                )}
                contentEditable={isEditing}
                suppressContentEditableWarning
                onBlur={handleBlur}
                onClick={handleContentClick}
                onPointerDown={(e) => isEditing && e.stopPropagation()}
                style={{
                    fontSize: 'calc(var(--planet-size) / 10)',
                    textShadow: isSelected ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
                    userSelect: isEditing ? 'text' : 'none',
                    cursor: isEditing ? 'text' : 'pointer',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    minWidth: '50%',
                    caretColor: 'white'
                }}
            >
                {note.title || style.label}
            </div>

            {/* Connection Handles */}
            {renderHandle('top')}
            {renderHandle('right')}
            {renderHandle('bottom')}
            {renderHandle('left')}
        </motion.div>
    );
};

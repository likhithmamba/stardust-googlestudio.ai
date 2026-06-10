import React, { useRef } from 'react';
import { useGesture } from '@use-gesture/react';
import { useStore, type Note } from '../store/useStore';
import { NOTE_STYLES, NoteType, REAL_SIZES } from '../constants';
import { ViewConstraints } from '../systems/ViewConstraints';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { visualRegistry } from '../engine/render/VisualRegistry';
import { useZoomLOD, type ZoomLOD } from '../hooks/useZoomLOD';
import { useSettingsStore } from '../ui/settings/settingsStore';
import { touchNote, getDecayOpacity } from '../engine/decayEngine';
import { sanitizePlainText } from '../utils/sanitize';
import { clampCoord } from '../utils/clampCoord';

interface PlanetNoteProps {
    note: Note;
    isSelected: boolean;
    zoom: number;
    isReadOnly?: boolean;
    visualColor?: string;
    layoutOrigin?: { x: number; y: number };
    viewMode?: string;
    onConnectStart: (id: string, x: number, y: number) => void;
    onDragStart?: (id: string) => void;
    onDrag?: (id: string, x: number, y: number) => void;
    onDragEnd?: (id: string, x?: number, y?: number) => void;
    onContextMenu?: (e: React.MouseEvent, id: string) => void;
    onPointerUp?: (e: React.PointerEvent) => void;
}

const extractPlainText = (contentStr?: string): string => {
    if (!contentStr) return '';
    try {
        const state = JSON.parse(contentStr);
        let text = '';
        const traverse = (node: any) => {
            if (node.text) text += node.text;
            if (node.type === 'paragraph' || node.type === 'listitem') text += '\n';
            if (node.children) node.children.forEach(traverse);
        };
        if (state.root) traverse(state.root);
        return sanitizePlainText(text.trim());
    } catch {
        return sanitizePlainText(contentStr);
    }
};

const getDecayLevel = (note: Note): number => {
    // Suns, Galaxies, Nebulae, Black Holes are immune
    if (['sun', 'galaxy', 'nebula', 'black-hole'].includes(note.type)) return 1;
    // In-progress or review items are immune
    if (note.status && ['in-progress', 'review'].includes(note.status)) return 1;
    if (note.fixed) return 1;

    const lum = note.luminance ?? 1.0;
    if (lum >= 0.8) return 1;
    if (lum >= 0.6) return 2;
    if (lum >= 0.4) return 3;
    if (lum >= 0.2) return 4;
    return 5;
};

const getNoteTextStyle = (note: any, _isSolar: boolean, baseStyle?: React.CSSProperties): React.CSSProperties => {
    const fontMapping: Record<string, string> = {
        sans: 'Inter, system-ui, -apple-system, sans-serif',
        serif: 'Lora, Georgia, serif',
        mono: 'Fira Code, monospace',
        'Space Grotesk': '"Space Grotesk", sans-serif',
        Cinzel: 'Cinzel, serif',
        Manrope: 'Manrope, sans-serif',
    };
    const fontFamily = note.fontFamily ? (fontMapping[note.fontFamily] || `'${note.fontFamily}', sans-serif`) : undefined;
    return {
        ...baseStyle,
        color: note.textColor || undefined,
        fontFamily,
    };
};

const PlanetNoteComponent: React.FC<PlanetNoteProps> = ({
    note, isSelected, zoom, isReadOnly, visualColor, layoutOrigin, viewMode,
    onConnectStart, onDragStart, onDrag, onDragEnd, onPointerUp
}) => {
    const updateNote = useStore((state) => state.updateNote);
    const setSelectedId = useStore((state) => state.setSelectedId);
    const toggleSelectedId = useStore((state) => state.toggleSelectedId);
    const setCosmosOpen = useStore((state) => state.setCosmosOpen);
    const isCosmosOpen = useStore((state) => state.isCosmosOpen);

    const designSystem = useSettingsStore((state) => state.designSystem);
    const isSolar = designSystem === 'solar';
    const mode = useSettingsStore((state) => state.mode);

    const proMode = mode === 'pro' || mode === 'ultra';
    const ultraMode = mode === 'ultra';
    const isEnhanced = proMode || ultraMode;

    const focusModeId = useStore((state) => state.focusModeId);
    const isFocused = focusModeId === note.id;
    const isDimmed = focusModeId && !isFocused;

    const effectiveType = note.type;
    const baseStyle = NOTE_STYLES[effectiveType] || NOTE_STYLES[NoteType.Asteroid];
    const lod: ZoomLOD = useZoomLOD();
    const style = { ...baseStyle };

    const dragPositionRef = useRef({ x: note.x, y: note.y });
    const isDragging = useRef(false);
    const noteRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = React.useState(false);

    // Compute Size - use REAL_SIZES for ALL modes
    let size = Math.max(40, REAL_SIZES[note.type] || style.width || 80);
    if (viewMode === 'orbital') {
        const p = note.priority || 'medium';
        if (p === 'critical') size = 100;
        else if (p === 'high') size = 80;
        else if (p === 'medium') size = 64;
        else size = 48;
    }

    const showText = zoom >= 0.3;
    // deep-galaxy: when zoom < 0.1 show as tiny 3px dot
    const showAsDeepGalaxyDot = zoom < 0.1;
    const isStructuredMode = ['matrix', 'prism', 'timeline', 'archive'].includes(viewMode || '');
    const showAsMinimalDot = !isStructuredMode && zoom < 0.3 && !showAsDeepGalaxyDot;
    const tier = [NoteType.Sun, NoteType.Galaxy, NoteType.Nebula, NoteType.Jupiter, NoteType.Saturn].includes(effectiveType as any) ? 1 : 2;
    const isMajor = tier === 1;

    // PERFORMANCE: Register with Visual Engine
    React.useLayoutEffect(() => {
        if (noteRef.current) {
            visualRegistry.register(note.id, noteRef.current);
            visualRegistry.updatePosition(note.id, note.x, note.y);
        }
        return () => {
            visualRegistry.unregister(note.id);
        };
    }, []);

    // Sync visual position only when ID changes or component mounts
    // Positioning is owned by VisualRegistry during physics/drag
    React.useLayoutEffect(() => {
        dragPositionRef.current = { x: note.x, y: note.y };
        visualRegistry.updatePosition(note.id, note.x, note.y);
    }, [note.id]);

    // Text Auto-fit Logic
    const autoFitText = React.useCallback(() => {
        if (textRef.current && showText) {
            const el = textRef.current;
            const containerSize = size * 0.70; // 70% of planet size

            // Reset styles for measurement
            el.style.webkitLineClamp = 'unset';
            el.style.display = 'block';
            el.style.overflow = 'visible';
            
            let currentSize = note.fontSize || 24;
            el.style.fontSize = `${currentSize}px`;
            el.style.lineHeight = '1.1';

            while ((el.scrollHeight > containerSize || el.scrollWidth > containerSize) && currentSize > 8) {
                currentSize -= 1;
                el.style.fontSize = `${currentSize}px`;
            }

            // Clamp if it still overflows at minimum size 8
            if (currentSize <= 8 && el.scrollHeight > containerSize) {
                const maxLines = Math.max(1, Math.floor(containerSize / (8 * 1.1)));
                el.style.webkitLineClamp = `${maxLines}`;
                el.style.display = '-webkit-box';
                el.style.webkitBoxOrient = 'vertical';
                el.style.overflow = 'hidden';
            }
        }
    }, [size, showText, note.fontSize]);

    React.useLayoutEffect(() => {
        autoFitText();
    }, [note.title, autoFitText]);

    // Focus management for inline editing
    React.useEffect(() => {
        if (isSelected && textRef.current) {
            // textRef.current.focus(); // Removed auto-focus on select to avoid jitter during drag
        }
    }, [isSelected]);

    // Focus-zoom camera movement
    const handleTitleFocus = React.useCallback(() => {
        const store = useStore.getState();
        const currentViewport = store.viewport;

        // Cache current viewport
        store.setSavedViewport(currentViewport);

        // Center on note and zoom to 1.1
        const zoom = 1.1;
        const targetX = -note.x * zoom + window.innerWidth / 2 - (size * zoom) / 2;
        const targetY = -note.y * zoom + window.innerHeight / 2 - (size * zoom) / 2;

        useStore.setState({ isViewportAnimating: true });
        store.setViewport({ x: targetX, y: targetY, zoom });
        setTimeout(() => {
            useStore.setState({ isViewportAnimating: false });
        }, 400);
    }, [note.x, note.y, size]);

    const handleTitleBlur = React.useCallback(() => {
        const store = useStore.getState();
        const savedViewport = store.savedViewport;

        if (savedViewport) {
            useStore.setState({ isViewportAnimating: true });
            store.setViewport(savedViewport);
            setTimeout(() => {
                useStore.setState({ isViewportAnimating: false });
            }, 400);
            store.setSavedViewport(undefined);
        }
        autoFitText();
    }, [autoFitText]);

    const bind = useGesture({
        onDragStart: ({ event }) => {
            if (isReadOnly) return;
            if ((event.target as HTMLElement).classList.contains('handle-base')) return;

            isDragging.current = true;
            setSelectedId(note.id);
            onDragStart?.(note.id);
            useStore.getState().takeSnapshot();
            updateNote(note.id, { fixed: true });
        },
        onDrag: ({ delta: [dx, dy], event, memo }) => {
            if (isReadOnly) return memo;
            if ((event.target as HTMLElement).classList.contains('handle-base')) return memo;
            event.stopPropagation();

            const ux = (memo && memo.ux !== undefined) ? memo.ux : dragPositionRef.current.x;
            const uy = (memo && memo.uy !== undefined) ? memo.uy : dragPositionRef.current.y;

            const newX = clampCoord(ux + dx / zoom);
            const newY = clampCoord(uy + dy / zoom);

            let displayX = newX;
            let displayY = newY;

            if (layoutOrigin && viewMode && viewMode !== 'free' && viewMode !== 'void') {
                const constraint = ViewConstraints.applyConstraints(
                    viewMode as any,
                    newX,
                    newY,
                    layoutOrigin,
                    { width: window.innerWidth, height: window.innerHeight }
                );

                const diffX = newX - constraint.x;
                const diffY = newY - constraint.y;
                const dist = Math.sqrt(diffX * diffX + diffY * diffY);

                if (dist < 150) {
                    displayX = constraint.x;
                    displayY = constraint.y;
                }

                if (constraint.dataUpdates) {
                    let needsStoreUpdate = false;
                    Object.entries(constraint.dataUpdates).forEach(([key, val]) => {
                        if ((note as any)[key] !== val) {
                            needsStoreUpdate = true;
                        }
                    });
                    if (needsStoreUpdate) {
                        updateNoteStore(note.id, constraint.dataUpdates);
                    }
                }
            }

            visualRegistry.updatePosition(note.id, displayX, displayY);
            dragPositionRef.current = { x: displayX, y: displayY };
            onDrag?.(note.id, displayX, displayY);

            return { ux: newX, uy: newY };
        },
        onDragEnd: () => {
            isDragging.current = false;
            let finalX = dragPositionRef.current.x;
            let finalY = dragPositionRef.current.y;
            let dataUpdates: Record<string, any> = {};

            if (layoutOrigin && viewMode && (viewMode !== 'free')) {
                const constraint = ViewConstraints.applyConstraints(
                    viewMode as any,
                    finalX,
                    finalY,
                    layoutOrigin,
                    { width: window.innerWidth, height: window.innerHeight }
                );
                finalX = constraint.x;
                finalY = constraint.y;
                dataUpdates = constraint.dataUpdates || {};
            }

            updateNote(note.id, {
                x: finalX,
                y: finalY,
                w: size,
                h: size,
                fixed: false,
                vx: 0,
                vy: 0,
                ...dataUpdates
            });
            onDragEnd?.(note.id, finalX, finalY);
        },
        onPointerDown: ({ event }) => {
            if (isReadOnly) return;
            event.stopPropagation();
            if (event.shiftKey) {
                toggleSelectedId(note.id);
            } else {
                setSelectedId(note.id);
            }
        }
    }, {
        drag: { filterTaps: true, threshold: 5, from: () => [dragPositionRef.current.x, dragPositionRef.current.y] },
    });

    const handleDoubleClick = () => {
        setCosmosOpen(true);
        setSelectedId(note.id);
        touchNote(note.id); // Reset decay timer on interaction
    };

    const updateNoteStore = useStore((state) => state.updateNote);

    const renderHandle = (position: 'top' | 'right' | 'bottom' | 'left') => {
        if ((!isSelected && !isHovered) || isReadOnly) return null;

        const handleColor = note.color || '#6366f1';

        return (
            <motion.div
                key={position}
                whileHover={{ scale: 1.4 }}
                className={clsx("handle-base pointer-events-auto z-[60] cursor-crosshair")}
                style={{
                    width: 14,
                    height: 14,
                    background: `${handleColor}99`,
                    border: `2px solid ${handleColor}`,
                    borderRadius: '50%',
                    position: 'absolute',
                    boxShadow: `0 0 8px ${handleColor}`,
                    top: position === 'top' ? -7 : position === 'bottom' ? size - 7 : size / 2 - 7,
                    left: position === 'left' ? -7 : position === 'right' ? size - 7 : size / 2 - 7,
                }}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    let hx = note.x + size / 2;
                    let hy = note.y + size / 2;
                    if (position === 'top') hy -= size / 2;
                    if (position === 'bottom') hy += size / 2;
                    if (position === 'left') hx -= size / 2;
                    if (position === 'right') hx += size / 2;
                    onConnectStart(note.id, hx, hy);
                }}
            />
        );
    };

    const bindHandlers = bind() as any;

    if (showAsDeepGalaxyDot) {
        return (
            <div ref={noteRef} data-note-id={note.id} className="absolute top-0 left-0">
                <div style={{
                    width: 3, height: 3, borderRadius: '50%',
                    background: note.color || baseStyle.color || '#6366f1',
                }} />
            </div>
        );
    }

    if (showAsMinimalDot) {
        return (
            <div ref={noteRef} data-note-id={note.id} className="absolute top-0 left-0 flex flex-col items-center pointer-events-none">
                <div
                    style={{
                        width: size * 0.2,
                        height: size * 0.2,
                        borderRadius: '50%',
                        background: note.color || visualColor || baseStyle.color || '#6366f1',
                        boxShadow: `0 0 10px ${note.color || visualColor || baseStyle.color || '#6366f1'}`,
                    }}
                />
                <span className="text-[8px] text-white/50 mt-1 whitespace-nowrap">{note.title || 'Unnamed'}</span>
            </div>
        );
    }

    if (viewMode === 'matrix') {
        const u = note.urgency || 'medium';
        const i = note.importance || 'medium';
        const isDoFirst = u === 'urgent' && i === 'important';
        const isEliminate = u === 'not-urgent' && i === 'not-important';
        const isSchedule = u === 'not-urgent' && i === 'important';

        const borderClass = isSelected
            ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
            : isDoFirst
                ? "border-emerald-500/50 hover:border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                : isEliminate
                    ? "border-red-500/50 hover:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                    : isSchedule
                        ? "border-blue-500/40 hover:border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                        : "border-amber-500/40 hover:border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.1)]";

        return (
            <div
                ref={noteRef}
                data-note-id={note.id}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={clsx(
                    "absolute top-0 left-0 hover:z-50",
                    !isDragging.current && "transition-transform duration-300 ease-out"
                )}
            >
                <motion.div
                    {...bindHandlers}
                    onPointerUp={(e: React.PointerEvent) => {
                        if (!isReadOnly) {
                            bindHandlers.onPointerUp?.(e);
                            onPointerUp?.(e);
                        }
                    }}
                    onDoubleClick={handleDoubleClick}
                    className={clsx(
                        "relative flex flex-col w-[160px] h-[100px] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing border",
                        "bg-[#111121]/90 backdrop-blur-md shadow-xl transition-all",
                        borderClass
                    )}
                    style={{ zIndex: isDragging.current ? 100 : 1 }}
                    animate={{ x: 0, y: 0, opacity: note.isDying ? 0 : isDimmed ? 0.3 : 1 }}
                >
                    <div className="absolute top-0 left-0 w-full h-1" style={{ background: note.color || (isDoFirst ? '#10b981' : isEliminate ? '#ef4444' : isSchedule ? '#3b82f6' : '#f59e0b') }} />
                     <div className="p-3 flex-1 flex flex-col justify-center">
                        {zoom < 0.3 ? (
                            // Zoom < 30%: Title-only
                            <div
                                contentEditable={!isReadOnly}
                                suppressContentEditableWarning
                                onInput={(e) => updateNoteStore(note.id, { title: e.currentTarget.innerText })}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="text-[12px] font-medium leading-tight text-white/90 outline-none overflow-hidden"
                                style={getNoteTextStyle(note, isSolar, { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' })}
                            >
                                {note.title || ''}
                            </div>
                        ) : zoom > 1.5 ? (
                            // Zoom > 150%: Full detail (Title + content + badges)
                            <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                                <div
                                    contentEditable={!isReadOnly}
                                    suppressContentEditableWarning
                                    onInput={(e) => updateNoteStore(note.id, { title: e.currentTarget.innerText })}
                                    onFocus={handleTitleFocus}
                                    onBlur={handleTitleBlur}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="text-[13px] font-semibold leading-tight text-white/90 outline-none"
                                    style={getNoteTextStyle(note, isSolar)}
                                >
                                    {note.title || ''}
                                </div>
                                {note.content && (
                                    <div className="text-[10px] text-white/60 leading-normal line-clamp-2 overflow-hidden"
                                         style={{ fontFamily: note.fontFamily ? getNoteTextStyle(note, isSolar).fontFamily : undefined }}>
                                        {extractPlainText(note.content)}
                                    </div>
                                )}
                                <div className="mt-auto flex items-center justify-between gap-1">
                                    <span className={clsx(
                                        "text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold",
                                        u === 'urgent' ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/40"
                                    )}>
                                        {u === 'urgent' ? 'URGENT' : 'NOT URGENT'}
                                    </span>
                                    <span className={clsx(
                                        "text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold",
                                        i === 'important' ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-white/40"
                                    )}>
                                        {i === 'important' ? 'IMPT' : 'NOT IMPT'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            // Zoom [30% - 150%]: Standard detail (Title + badges)
                            <div className="flex-1 flex flex-col">
                                <div
                                    contentEditable={!isReadOnly}
                                    suppressContentEditableWarning
                                    onInput={(e) => updateNoteStore(note.id, { title: e.currentTarget.innerText })}
                                    onFocus={handleTitleFocus}
                                    onBlur={handleTitleBlur}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="flex-1 text-[13px] font-medium leading-tight text-white/90 outline-none overflow-hidden"
                                    style={getNoteTextStyle(note, isSolar, { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' })}
                                >
                                    {note.title || ''}
                                </div>
                                <div className="mt-auto flex items-center justify-between gap-1">
                                    <span className={clsx(
                                        "text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold",
                                        u === 'urgent' ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/40"
                                    )}>
                                        {u === 'urgent' ? 'URGENT' : 'NOT URGENT'}
                                    </span>
                                    <span className={clsx(
                                        "text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold",
                                        i === 'important' ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-white/40"
                                    )}>
                                        {i === 'important' ? 'IMPT' : 'NOT IMPT'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                <AnimatePresence>
                    {isSelected && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[200] pointer-events-auto"
                            style={{ top: 110 }}
                        >
                            <div className="bg-[#111121]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col gap-2 shadow-xl whitespace-nowrap min-w-[200px]">
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Urgency</span>
                                    <div className="flex bg-black/40 rounded-lg p-0.5">
                                        <button onClick={() => updateNoteStore(note.id, { urgency: 'urgent' })} className={clsx("px-2 py-1 rounded text-[10px] font-bold transition-all", u === 'urgent' ? "bg-red-500/20 text-red-400" : "text-white/30 hover:text-white/60")}>HIGH</button>
                                        <button onClick={() => updateNoteStore(note.id, { urgency: 'not-urgent' })} className={clsx("px-2 py-1 rounded text-[10px] font-bold transition-all", u === 'not-urgent' ? "bg-blue-500/20 text-blue-400" : "text-white/30 hover:text-white/60")}>LOW</button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Importance</span>
                                    <div className="flex bg-black/40 rounded-lg p-0.5">
                                        <button onClick={() => updateNoteStore(note.id, { importance: 'important' })} className={clsx("px-2 py-1 rounded text-[10px] font-bold transition-all", i === 'important' ? "bg-amber-500/20 text-amber-400" : "text-white/30 hover:text-white/60")}>HIGH</button>
                                        <button onClick={() => updateNoteStore(note.id, { importance: 'not-important' })} className={clsx("px-2 py-1 rounded text-[10px] font-bold transition-all", i === 'not-important' ? "bg-slate-500/20 text-slate-400" : "text-white/30 hover:text-white/60")}>LOW</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Handles */}
                {renderHandle('top')}
                {renderHandle('right')}
                {renderHandle('bottom')}
                {renderHandle('left')}
            </div>
        );
    }
    if (viewMode === 'prism') {
        const statusColors: Record<string, string> = {
            'todo': '#94a3b8',
            'in-progress': '#60a5fa',
            'review': '#fbbf24',
            'done': '#34d399',
        };
        const s = note.status || 'todo';
        const barColor = note.color || statusColors[s] || '#94a3b8';

        return (
            <div
                ref={noteRef}
                data-note-id={note.id}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={clsx(
                    "absolute top-0 left-0 hover:z-50",
                    !isDragging.current && "transition-transform duration-300 ease-out"
                )}
            >
                <motion.div
                    {...bindHandlers}
                    onPointerUp={(e: React.PointerEvent) => {
                        if (!isReadOnly) {
                            bindHandlers.onPointerUp?.(e);
                            onPointerUp?.(e);
                        }
                    }}
                    onDoubleClick={handleDoubleClick}
                    className={clsx(
                        "relative flex flex-col w-[200px] min-h-[80px] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing border",
                        "bg-[#111121]/90 backdrop-blur-md shadow-xl transition-all",
                        isSelected ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "border-white/10 hover:border-white/30"
                    )}
                    style={{ zIndex: isDragging.current ? 100 : 1 }}
                    animate={{ x: 0, y: 0, opacity: note.isDying ? 0 : isDimmed ? 0.3 : 1 }}
                >
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: barColor }} />
                    <div className="p-3 pt-4 flex-1 flex flex-col justify-center">
                        {zoom < 0.3 ? (
                            // Zoom < 30%: Title-only
                            <div
                                contentEditable={!isReadOnly}
                                suppressContentEditableWarning
                                onInput={(e) => updateNoteStore(note.id, { title: e.currentTarget.innerText })}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="text-[12px] font-medium leading-tight text-white/90 outline-none overflow-hidden"
                                style={getNoteTextStyle(note, isSolar, { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' })}
                            >
                                {note.title || ''}
                            </div>
                        ) : zoom > 1.5 ? (
                            // Zoom > 150%: Full detail (Title + content + due date)
                            <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                                <div
                                    contentEditable={!isReadOnly}
                                    suppressContentEditableWarning
                                    onInput={(e) => updateNoteStore(note.id, { title: e.currentTarget.innerText })}
                                    onFocus={handleTitleFocus}
                                    onBlur={handleTitleBlur}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="text-[13px] font-semibold leading-tight text-white/90 outline-none"
                                    style={getNoteTextStyle(note, isSolar)}
                                >
                                    {note.title || ''}
                                </div>
                                {note.content && (
                                    <div className="text-[10px] text-white/60 leading-normal line-clamp-2 overflow-hidden"
                                         style={{ fontFamily: note.fontFamily ? getNoteTextStyle(note, isSolar).fontFamily : undefined }}>
                                        {extractPlainText(note.content)}
                                    </div>
                                )}
                                {note.dueDate && (
                                    <div className="mt-auto flex items-center gap-1 text-[10px] text-white/50 bg-white/5 w-fit px-1.5 py-0.5 rounded">
                                        <span>📅</span>
                                        {new Date(note.dueDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Zoom [30% - 150%]: Standard detail (Title + due date)
                            <div className="flex-1 flex flex-col">
                                <div
                                    contentEditable={!isReadOnly}
                                    suppressContentEditableWarning
                                    onInput={(e) => updateNoteStore(note.id, { title: e.currentTarget.innerText })}
                                    onFocus={handleTitleFocus}
                                    onBlur={handleTitleBlur}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="flex-1 text-[13px] font-medium leading-tight text-white/90 outline-none overflow-hidden"
                                    style={getNoteTextStyle(note, isSolar, { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' })}
                                >
                                    {note.title || ''}
                                </div>
                                {note.dueDate && (
                                    <div className="mt-auto flex items-center gap-1 text-[10px] text-white/50 bg-white/5 w-fit px-1.5 py-0.5 rounded">
                                        <span>📅</span>
                                        {new Date(note.dueDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
                <AnimatePresence>
                    {isSelected && (
                        <motion.div
                            initial={{ opacity: 0, x: -8, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -8, scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-[210px] top-0 flex flex-col gap-2 z-[200] pointer-events-auto"
                        >
                            <div className="bg-[#111121]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col gap-2 shadow-xl whitespace-nowrap">
                                <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest px-1">Move To</span>
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => updateNoteStore(note.id, { status: 'todo' })} className="text-left px-2 py-1 rounded text-[10px] font-bold text-slate-400 hover:bg-white/10">TO DO</button>
                                    <button onClick={() => updateNoteStore(note.id, { status: 'in-progress' })} className="text-left px-2 py-1 rounded text-[10px] font-bold text-blue-400 hover:bg-white/10">IN PROGRESS</button>
                                    <button onClick={() => updateNoteStore(note.id, { status: 'review' })} className="text-left px-2 py-1 rounded text-[10px] font-bold text-amber-400 hover:bg-white/10">REVIEW</button>
                                    <button onClick={() => updateNoteStore(note.id, { status: 'done' })} className="text-left px-2 py-1 rounded text-[10px] font-bold text-emerald-400 hover:bg-white/10">DONE</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Handles */}
                {renderHandle('top')}
                {renderHandle('right')}
                {renderHandle('bottom')}
                {renderHandle('left')}
            </div>
        );
    }

    if (viewMode === 'timeline') {
        const isActive = note.status === 'in-progress';
        const isStalled = (note.status === 'todo' || note.status === 'in-progress') && getDecayLevel(note) >= 3;

        const borderClass = isSelected
            ? "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
            : isActive
                ? "border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                : isStalled
                    ? "border-dashed border-amber-500/70 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse"
                    : "border-white/10 hover:border-white/30";

        return (
            <div
                ref={noteRef}
                data-note-id={note.id}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={clsx(
                    "absolute top-0 left-0 hover:z-50",
                    !isDragging.current && "transition-transform duration-300 ease-out"
                )}
            >
                <motion.div
                    {...bindHandlers}
                    onPointerUp={(e: React.PointerEvent) => {
                        if (!isReadOnly) {
                            bindHandlers.onPointerUp?.(e);
                            onPointerUp?.(e);
                        }
                    }}
                    onDoubleClick={handleDoubleClick}
                    className={clsx(
                        "relative flex flex-col w-[180px] min-h-[60px] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border",
                        "bg-[#111121]/90 backdrop-blur-md shadow-xl transition-all",
                        borderClass
                    )}
                    style={{ zIndex: isDragging.current ? 100 : 1 }}
                >
                    <div className={clsx("absolute top-0 left-0 w-1 h-full", isActive ? "bg-emerald-500" : isStalled ? "bg-amber-500" : "bg-purple-500")} />
                    <div className="p-2 pl-3 flex-1 flex flex-col justify-center">
                        {zoom < 0.3 ? (
                            // Zoom < 30%: Title-only
                            <div
                                contentEditable={!isReadOnly}
                                suppressContentEditableWarning
                                onInput={(e) => updateNoteStore(note.id, { title: e.currentTarget.innerText })}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="text-[11px] font-medium leading-tight text-white/90 outline-none overflow-hidden"
                                style={getNoteTextStyle(note, isSolar, { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' })}
                            >
                                {note.title || ''}
                            </div>
                        ) : zoom > 1.5 ? (
                            // Zoom > 150%: Full detail (Title + content + due date)
                            <div className="flex-1 flex flex-col gap-1 overflow-hidden justify-center">
                                <div
                                    contentEditable={!isReadOnly}
                                    suppressContentEditableWarning
                                    onInput={(e) => updateNoteStore(note.id, { title: e.currentTarget.innerText })}
                                    onFocus={handleTitleFocus}
                                    onBlur={handleTitleBlur}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="text-[12px] font-semibold leading-tight text-white/90 outline-none"
                                    style={getNoteTextStyle(note, isSolar)}
                                >
                                    {note.title || ''}
                                </div>
                                {note.content && (
                                    <div className="text-[9px] text-white/60 leading-normal line-clamp-2 overflow-hidden"
                                         style={{ fontFamily: note.fontFamily ? getNoteTextStyle(note, isSolar).fontFamily : undefined }}>
                                        {extractPlainText(note.content)}
                                    </div>
                                )}
                                {note.dueDate && (
                                    <div className="mt-1 flex items-center gap-1 text-[9px] text-white/40 font-mono">
                                        {new Date(note.dueDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Zoom [30% - 150%]: Standard detail (Title + due date)
                            <>
                                <div
                                    contentEditable={!isReadOnly}
                                    suppressContentEditableWarning
                                    onInput={(e) => updateNoteStore(note.id, { title: e.currentTarget.innerText })}
                                    onFocus={handleTitleFocus}
                                    onBlur={handleTitleBlur}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="text-[12px] font-medium leading-tight text-white/90 outline-none"
                                    style={getNoteTextStyle(note, isSolar)}
                                >
                                    {note.title || ''}
                                </div>
                                {note.dueDate && (
                                    <div className="mt-1 flex items-center gap-1 text-[9px] text-white/40 font-mono">
                                        {new Date(note.dueDate).toLocaleDateString()}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
                <AnimatePresence>
                    {isSelected && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.9 }}
                            className="absolute -top-10 left-1/2 -translate-x-1/2 z-[200]"
                        >
                            <div className="bg-[#111121]/90 backdrop-blur-xl border border-white/10 rounded-lg px-2 py-1 shadow-xl whitespace-nowrap text-[10px] text-purple-400 font-mono flex items-center gap-2">
                                <span>Timeline Event</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Handles */}
                {renderHandle('top')}
                {renderHandle('right')}
                {renderHandle('bottom')}
                {renderHandle('left')}
            </div>
        );
    }

    if (viewMode === 'archive') {
        const isZippedOut = zoom < 0.3;

        if (isZippedOut) {
            return (
                <div
                    ref={noteRef}
                    data-note-id={note.id}
                    className="absolute top-0 left-0 hover:z-50 opacity-30"
                >
                    <motion.div
                        className="rounded-sm bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        style={{ width: 8, height: 8 }}
                    />
                </div>
            );
        }

        return (
            <div
                ref={noteRef}
                data-note-id={note.id}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={clsx(
                    "absolute top-0 left-0 hover:z-50",
                    !isDragging.current && "transition-transform duration-300 ease-out"
                )}
            >
                <motion.div
                    {...bindHandlers}
                    onPointerUp={(e: React.PointerEvent) => {
                        if (!isReadOnly) {
                            bindHandlers.onPointerUp?.(e);
                            onPointerUp?.(e);
                        }
                    }}
                    onDoubleClick={handleDoubleClick}
                    className={clsx(
                        "relative flex flex-col w-[140px] h-[140px] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border",
                        "bg-[#05100a]/80 backdrop-blur-md shadow-lg transition-all border-emerald-900/40",
                        isSelected && "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    )}
                    style={{ zIndex: isDragging.current ? 100 : 1 }}
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-900" />
                    <div className="p-3 flex-1 flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-emerald-700/50 text-[32px]">inventory_2</span>
                        <div className="text-[10px] uppercase font-bold text-emerald-600/60 tracking-wider text-center line-clamp-2 px-1">
                            {note.title || 'ARCHIVED'}
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {isSelected && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-[200]"
                        >
                            <div className="bg-[#111121]/90 backdrop-blur-xl border border-emerald-500/30 rounded-lg px-2 py-1.5 shadow-xl flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); updateNoteStore(note.id, { originMode: 'void' }); window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Restored from Archive', type: 'success' } })); }} className="hover:bg-emerald-500/20 text-emerald-400 p-1.5 rounded transition-colors group" title="Restore">
                                    <span className="material-symbols-outlined text-[14px]">unarchive</span>
                                </button>
                                <div className="w-px h-4 bg-white/10" />
                                <button onClick={(e) => { e.stopPropagation(); useStore.getState().deleteNote(note.id); window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Permanently Deleted', type: 'error' } })); }} className="hover:bg-red-500/20 text-red-500 p-1.5 rounded transition-colors group" title="Delete Forever">
                                    <span className="material-symbols-outlined text-[14px]">delete_forever</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Handles */}
                {renderHandle('top')}
                {renderHandle('right')}
                {renderHandle('bottom')}
                {renderHandle('left')}
            </div>
        );
    }

    return (
        <div
            ref={noteRef}
            data-note-id={note.id}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={clsx(
                "absolute top-0 left-0 hover:z-50",
                viewMode === 'orbital' && !isDragging.current ? "transition-transform duration-300 ease-out" : ""
            )}
        >
            <motion.div
                {...bindHandlers}
                onPointerUp={(e: React.PointerEvent) => {
                    if (!isReadOnly) {
                        bindHandlers.onPointerUp?.(e);
                        onPointerUp?.(e);
                    }
                }}
                className={clsx(
                    "note-planet",
                    `planet-${effectiveType}`,
                    style.className,
                    isEnhanced && viewMode === 'free' && `planet-${effectiveType}-pro`,
                    isReadOnly && "pointer-events-none cursor-default"
                )}
                onDoubleClick={handleDoubleClick}
                style={{
                    '--planet-size': `${size}px`,
                    zIndex: isDragging.current ? 100 : 1,
                    // Dynamic type-specific boundary and glowing shadows
                    borderColor: note.color || (viewMode === 'orbital' ? (note.priority === 'critical' ? '#ef4444' : note.priority === 'high' ? '#fb923c' : note.priority === 'medium' ? '#3b82f6' : '#94a3b8') : baseStyle.color) || 'var(--mode-accent, rgba(255,255,255,0.2))',
                    boxShadow: `0 0 20px -5px ${note.color || (viewMode === 'orbital' ? (note.priority === 'critical' ? '#ef4444' : note.priority === 'high' ? '#fb923c' : note.priority === 'medium' ? '#3b82f6' : '#94a3b8') : baseStyle.color) || 'var(--mode-accent, transparent)'}`,
                    filter: (viewMode === 'orbital' && (note.priority === 'low' || !note.priority) && getDecayLevel(note) >= 3)
                        ? 'grayscale(100%) brightness(0.6)'
                        : getDecayLevel(note) >= 2
                            ? `saturate(${Math.max(0.2, note.luminance ?? 1)}) brightness(${Math.max(0.5, note.luminance ?? 1)})`
                            : 'none'
                } as any}
                initial={false}
                animate={{
                    width: note.isDying ? 0 : size,
                    height: note.isDying ? 0 : size,
                    opacity: note.isDying ? 0 : (isDimmed ? 0.2 : getDecayOpacity(note)),
                }}
                transition={{
                    width: { type: 'spring', stiffness: 300, damping: 25 },
                    height: { type: 'spring', stiffness: 300, damping: 25 },
                    opacity: { duration: 0.3 }
                }}
            >
                {/* Glowing Core */}
                <div
                    className="planet-core"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${note.color || (viewMode === 'orbital' ? (note.priority === 'critical' ? '#ef4444' : note.priority === 'high' ? '#fb923c' : note.priority === 'medium' ? '#3b82f6' : '#94a3b8') : baseStyle.color) || '#6366f1'} 0%, transparent 70%)`,
                        opacity: 0.6,
                        pointerEvents: 'none',
                        zIndex: 0
                    }}
                />

                {/* Archive me? badge */}
                {getDecayLevel(note) === 5 && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-red-500/90 text-white font-mono text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded shadow-[0_0_10px_rgba(239,68,68,0.5)] whitespace-nowrap pointer-events-none z-50">
                        Archive me?
                    </div>
                )}
                {/* Luminance status badge on hover */}
                {isHovered && !['sun', 'galaxy', 'nebula', 'black-hole'].includes(note.type) && (
                    <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 px-2 py-0.5 rounded text-[8.5px] font-mono text-indigo-300 pointer-events-none whitespace-nowrap z-50 shadow-md">
                        LUMINANCE: {Math.round((note.luminance ?? 1) * 100)}%
                    </div>
                )}
                {lod !== 'surface' && !isMajor && (
                    <div className="absolute inset-0 rounded-full bg-inherit" />
                )}
                {isEnhanced && (
                    <div className="absolute inset-0 pointer-events-none overflow-visible">
                        <div className="absolute inset-[-10%] rounded-full opacity-60 mix-blend-screen"
                            style={{
                                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)`
                            }}
                        />
                        {note.type === NoteType.Saturn && effectiveType === NoteType.Saturn && (
                            <>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260%] h-[260%] opacity-40 mix-blend-screen"
                                    style={{
                                        background: `radial-gradient(ellipse at center, transparent 40%, ${style.color || '#eab308'} 45%, transparent 60%)`,
                                        transform: 'rotateX(75deg) rotateY(10deg)'
                                    }}
                                />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220%] h-[220%] opacity-90"
                                    style={{
                                        background: `radial-gradient(ellipse at center, transparent 30%, ${style.color || '#eab308'} 40%, transparent 50%, ${style.color || '#eab308'} 60%, transparent 70%)`,
                                        transform: 'rotateX(75deg) rotateY(10deg)',
                                        boxShadow: `0 0 20px -5px ${style.color || '#eab308'}`
                                    }}
                                />
                            </>
                        )}
                    </div>
                )}
                 {/* TEXT CONTENT / LOD RENDERING */}
                <AnimatePresence mode="wait">
                    {zoom < 0.3 ? (
                        // Zoom < 30%: Title-only underneath the planet note
                        <motion.div
                            key="planet-under"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-[110%] left-1/2 -translate-x-1/2 text-center pointer-events-none"
                        >
                            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-lg">
                                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/80">
                                    {note.title || 'Unnamed Star'}
                                </span>
                            </div>
                        </motion.div>
                    ) : zoom > 1.5 ? (
                        // Zoom > 150%: Full detail (Title + Content) inside the planet note
                        <motion.div
                            key="surface-full"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 flex items-center justify-center text-center p-[15%] pointer-events-none"
                        >
                            <div
                                className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none flex-col"
                            >
                                <div
                                    ref={textRef}
                                    contentEditable={!isReadOnly}
                                    suppressContentEditableWarning
                                    onInput={(e) => {
                                        const newTitle = e.currentTarget.innerText;
                                        updateNoteStore(note.id, { title: newTitle });
                                        autoFitText();
                                    }}
                                    onFocus={handleTitleFocus}
                                    onBlur={handleTitleBlur}
                                    onPointerDown={(e) => e.stopPropagation()} // Allow clicking inside to focus
                                    className={clsx(
                                        "max-w-full w-full text-center font-bold tracking-tight leading-tight outline-none pointer-events-auto break-words whitespace-pre-wrap",
                                        isSolar ? "text-slate-900" : "text-white"
                                    )}
                                    style={getNoteTextStyle(note, isSolar, {
                                        textShadow: isSolar ? 'none' : '0 2px 4px rgba(0,0,0,0.5)',
                                    })}
                                >
                                    {note.title || (note.content ? '' : 'Unnamed Note')}
                                </div>
                                {note.content && (
                                    <div
                                        className={clsx(
                                            "w-full text-center mt-1.5 text-[0.45em] font-medium leading-[1.4] opacity-70 line-clamp-3 break-words whitespace-pre-wrap pointer-events-auto",
                                            isSolar ? "text-slate-700" : "text-indigo-100"
                                        )}
                                        style={getNoteTextStyle(note, isSolar, {
                                            textShadow: isSolar ? 'none' : '0 1px 2px rgba(0,0,0,0.8)',
                                        })}
                                    >
                                        {extractPlainText(note.content)}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        // Zoom [30% - 150%]: Title-only inside the planet note
                        <motion.div
                            key="surface-title"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 flex items-center justify-center text-center p-[15%] pointer-events-none"
                        >
                            <div
                                className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none"
                            >
                                <div
                                    ref={textRef}
                                    contentEditable={!isReadOnly}
                                    suppressContentEditableWarning
                                    onInput={(e) => {
                                        const newTitle = e.currentTarget.innerText;
                                        updateNoteStore(note.id, { title: newTitle });
                                        autoFitText();
                                    }}
                                    onFocus={handleTitleFocus}
                                    onBlur={handleTitleBlur}
                                    onPointerDown={(e) => e.stopPropagation()} // Allow clicking inside to focus
                                    className={clsx(
                                        "max-w-full w-full text-center font-bold tracking-tight leading-tight outline-none pointer-events-auto break-words whitespace-pre-wrap",
                                        isSolar ? "text-slate-900" : "text-white"
                                    )}
                                    style={getNoteTextStyle(note, isSolar, {
                                        textShadow: isSolar ? 'none' : '0 2px 4px rgba(0,0,0,0.5)',
                                    })}
                                >
                                    {note.title || (note.content ? '' : 'Unnamed Note')}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isSelected && (
                    <motion.div
                        className="selection-ring z-0 absolute inset-[-4px] rounded-full border-2 border-blue-400"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                    />
                )}

                {/* ACTION PANEL (Floating) */}
                <AnimatePresence>
                    {isSelected && !isCosmosOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: -size / 2 - 40, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="absolute flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 shadow-2xl border border-white/10 z-[100]"
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCosmosOpen(true);
                                }}
                                className="flex items-center gap-2 text-[10px] font-bold text-white tracking-widest uppercase px-2 hover:text-indigo-400 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                Open Universe
                            </button>
                            <div className="w-px h-3 bg-white/10 mx-1" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle color/type ring?
                                }}
                                className="p-1 text-white/50 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">palette</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isSelected && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[200] pointer-events-auto"
                            style={{ top: size + 12 }}
                        >
                            {viewMode === 'orbital' ? (
                                <div className="bg-[#111121]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 flex flex-col gap-2 shadow-xl whitespace-nowrap">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className={clsx(
                                            "text-[10px] font-black tracking-widest uppercase",
                                            note.priority === 'critical' ? 'text-red-400' :
                                                note.priority === 'high' ? 'text-amber-400' :
                                                    note.priority === 'medium' ? 'text-blue-400' : 'text-slate-400'
                                        )}>
                                            {note.priority || 'medium'} RING
                                        </span>
                                        <div className="flex gap-1">
                                            {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => updateNoteStore(note.id, { priority: p })}
                                                    className={clsx(
                                                        "w-3 h-3 rounded-full border border-white/20 transition-all hover:scale-125",
                                                        p === 'critical' ? 'bg-red-500' :
                                                            p === 'high' ? 'bg-amber-500' :
                                                                p === 'medium' ? 'bg-blue-500' : 'bg-slate-500'
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="w-full h-px bg-white/10" />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const promoteNote = useStore.getState().promoteNote;
                                                promoteNote?.(note.id, 'prism');
                                            }}
                                            className="flex-1 flex items-center justify-center gap-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 px-2 py-1 rounded text-[9px] uppercase tracking-wider transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[12px]">view_kanban</span>
                                            Prism
                                        </button>
                                        <button
                                            onClick={() => {
                                                const dateStr = window.prompt("Enter due date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
                                                if (dateStr) {
                                                    const dueDate = new Date(dateStr).getTime();
                                                    if (!isNaN(dueDate)) {
                                                        const promoteNote = useStore.getState().promoteNote;
                                                        promoteNote?.(note.id, 'timeline');
                                                        updateNoteStore(note.id, { dueDate });
                                                    }
                                                }
                                            }}
                                            className="flex-1 flex items-center justify-center gap-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 px-2 py-1 rounded text-[9px] uppercase tracking-wider transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                            Timeline
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#111121]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-2 py-1.5 flex items-center gap-1 shadow-xl whitespace-nowrap">
                                    <button
                                        onClick={() => setSelectedId(note.id)}
                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                        title="Edit Content"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onConnectStart(note.id, note.x + size / 2, note.y + size / 2);
                                        }}
                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                        title="Connect"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">link</span>
                                    </button>
                                    <div className="w-px h-4 bg-white/10 mx-0.5" />
                                    <div className="flex gap-1 px-1">
                                        {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => updateNoteStore(note.id, { priority: p })}
                                                className={clsx(
                                                    "px-2 py-1 rounded-lg text-[8px] uppercase font-bold tracking-tighter transition-all border",
                                                    note.priority === p
                                                        ? "bg-white/20 border-white/40 text-white"
                                                        : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10"
                                                )}
                                            >
                                                {p[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {renderHandle('top')}
                {renderHandle('right')}
                {renderHandle('bottom')}
                {renderHandle('left')}
            </motion.div>
        </div>
    );
};

export const PlanetNote = React.memo(PlanetNoteComponent, (prev, next) => {
    if (prev.isSelected !== next.isSelected) return false;
    if (prev.zoom !== next.zoom) return false;
    if (prev.viewMode !== next.viewMode) return false;
    const pNote = prev.note;
    const nNote = next.note;
    // CRITICAL: Skip x/y comparison for physics performance.
    // engine + visualRegistry handles the positioning.
    if (pNote.id !== nNote.id) return false;
    if (pNote.title !== nNote.title) return false;
    if (pNote.color !== nNote.color) return false;
    if (pNote.type !== nNote.type) return false;
    if (pNote.priority !== nNote.priority) return false;
    if (pNote.isDying !== nNote.isDying) return false;
    if (pNote.fixed !== nNote.fixed) return false;
    // Mode-specific fields that affect rendering
    if (pNote.status !== nNote.status) return false;
    if (pNote.urgency !== nNote.urgency) return false;
    if (pNote.importance !== nNote.importance) return false;
    if (pNote.content !== nNote.content) return false;
    if (pNote.luminance !== nNote.luminance) return false;
    if (pNote.dueDate !== nNote.dueDate) return false;
    if (pNote.textColor !== nNote.textColor) return false;
    if (pNote.fontSize !== nNote.fontSize) return false;
    if (pNote.fontFamily !== nNote.fontFamily) return false;
    return true;
});

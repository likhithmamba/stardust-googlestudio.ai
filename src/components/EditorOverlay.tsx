import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../ui/settings/settingsStore';
import { RichTextEditor } from './editor/RichTextEditor';
import { X, Trash2, BarChart, Sparkles, Zap, Lock, Unlock, Calendar, Activity, Layers } from 'lucide-react';
import clsx from 'clsx';
import { touchNote } from '../engine/decayEngine';
import type { Note } from '../store/noteSlice';

// Snapping helper for parameter changes
const getSnappedCoords = (
    note: any, 
    patch: any, 
    viewMode: string
): { x: number; y: number } | null => {
    const origin = { x: 0, y: 0 };
    const merged = { ...note, ...patch };

    if (viewMode === 'orbital') {
        const p = merged.priority || 'medium';
        const RADII_PCT = {
            critical: 0.5,
            high: 0.8,
            medium: 1.1,
            low: 1.4
        };
        const MIN_RADII = {
            critical: 280,
            high: 480,
            medium: 680,
            low: 880
        };
        const baseSize = Math.min(window.innerWidth, window.innerHeight) / 2;
        const pct = RADII_PCT[p as keyof typeof RADII_PCT] || 1.1;
        const min = MIN_RADII[p as keyof typeof MIN_RADII] || 680;
        const r = Math.max(min, baseSize * pct);

        const dx = note.x - origin.x;
        const dy = note.y - origin.y;
        const angle = (dx === 0 && dy === 0) ? Math.random() * Math.PI * 2 : Math.atan2(dy, dx);
        return {
            x: origin.x + r * Math.cos(angle),
            y: origin.y + r * Math.sin(angle)
        };
    }

    if (viewMode === 'matrix') {
        const quadrantWidth = window.innerWidth * 0.35;
        const quadrantHeight = window.innerHeight * 0.35;
        const u = merged.urgency || 'not-urgent';
        const imp = merged.importance || 'important';
        const px = u === 'urgent' ? -quadrantWidth / 2 : quadrantWidth / 2;
        const py = imp === 'important' ? -quadrantHeight / 2 : quadrantHeight / 2;
        return {
            x: origin.x + px,
            y: origin.y + py
        };
    }

    if (viewMode === 'prism') {
        const totalWidth = 350 + 50; // COL_WIDTH + GAP
        const s = merged.status || 'todo';
        const statuses = ['todo', 'in-progress', 'review', 'done'];
        let colIndex = statuses.indexOf(s);
        if (colIndex < 0) colIndex = 0;
        return {
            x: origin.x + (colIndex - 1.5) * totalWidth,
            y: note.y
        };
    }

    if (viewMode === 'timeline') {
        const PIXELS_PER_DAY = 180;
        const dueDate = merged.dueDate || Date.now();
        const diffMs = dueDate - Date.now();
        const daysOffset = Math.round(diffMs / (24 * 60 * 60 * 1000));
        const finalX = origin.x + daysOffset * PIXELS_PER_DAY;

        const totalHeight = 150 * 4;
        const startY = origin.y - totalHeight / 2;
        const s = merged.status || 'todo';
        const statuses = ['in-progress', 'todo', 'review', 'done'];
        let laneIndex = statuses.indexOf(s);
        if (laneIndex < 0) laneIndex = 1; // default to todo lane
        const finalY = startY + (laneIndex * 150) + 75;

        return {
            x: finalX,
            y: finalY
        };
    }

    return null;
};

const formatDateForInput = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

export const EditorOverlay: React.FC = () => {
    const selectedId = useStore((state) => state.selectedId);
    const setSelectedId = useStore((state) => state.setSelectedId);
    const isCosmosOpen = useStore((state) => state.isCosmosOpen);
    const setCosmosOpen = useStore((state) => state.setCosmosOpen);
    const notes = useStore((state) => state.notes);
    const graveyard = useStore((state) => state.graveyard || []);
    const updateNote = useStore((state) => state.updateNote);
    const deleteNote = useStore((state) => state.deleteNote);
    const designSystem = useSettingsStore((s) => s.designSystem);

    const [activeTab, setActiveTab] = useState<'content' | 'config'>('content');

    const note = notes.find((n) => n.id === selectedId) || graveyard.find((n) => n.id === selectedId);

    // Touch note on editor open to reset decay
    useEffect(() => {
        if (isCosmosOpen && note) touchNote(note.id);
    }, [note?.id, isCosmosOpen]);

    const handleClose = () => {
        setCosmosOpen(false);
    };

    const handleDelete = () => {
        if (note && window.confirm('Are you sure you want to delete this star from your universe?')) {
            deleteNote(note.id);
            setCosmosOpen(false);
            setSelectedId(undefined);
        }
    };

    // Smart update that adjusts canvas positioning relative to viewMode layouts
    const handleUpdateNote = (patch: Partial<Note>) => {
        if (!note) return;
        const viewMode = useSettingsStore.getState().viewMode;
        const coords = getSnappedCoords(note, patch, viewMode || 'void');
        const finalPatch = coords ? { ...patch, ...coords } : patch;
        updateNote(note.id, finalPatch);
    };

    const isSolar = designSystem === 'solar';

    const CELESTIAL_CLASSES = [
        { type: 'sun', label: 'Sun / Star', color: '#fbbf24' },
        { type: 'galaxy', label: 'Galaxy', color: '#6366f1' },
        { type: 'nebula', label: 'Nebula', color: '#a78bfa' },
        { type: 'earth', label: 'Standard', color: '#3b82f6' },
        { type: 'jupiter', label: 'Gas Giant', color: '#f59e0b' },
        { type: 'saturn', label: 'Ringed Star', color: '#eab308' },
        { type: 'mars', label: 'Secondary', color: '#ef4444' },
        { type: 'moon', label: 'Satellite', color: '#d1d5db' },
        { type: 'asteroid', label: 'Fragment', color: '#6b7280' },
        { type: 'comet', label: 'Transient', color: '#22d3ee' },
        { type: 'black-hole', label: 'Black Hole', color: '#a855f7' },
    ];

    const COSMIC_COLORS = [
        { name: 'Solar Gold', code: '#fbbf24' },
        { name: 'Indigo', code: '#6366f1' },
        { name: 'Purple', code: '#a78bfa' },
        { name: 'Blue', code: '#3b82f6' },
        { name: 'Red', code: '#ef4444' },
        { name: 'Amber', code: '#f59e0b' },
        { name: 'Yellow', code: '#eab308' },
        { name: 'Silver', code: '#d1d5db' },
        { name: 'Charcoal', code: '#6b7280' },
        { name: 'Cyan', code: '#22d3ee' },
        { name: 'Violet', code: '#a855f7' },
    ];

    return (
        <AnimatePresence>
            {isCosmosOpen && note && (
                <div 
                    className="fixed inset-0 z-[2000] flex items-center justify-center overflow-hidden editor-overlay-wrapper"
                    onClick={handleClose}
                >
                    {/* Immersive Background */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={clsx(
                            "absolute inset-0 z-0 pointer-events-none",
                            isSolar
                                ? "bg-gradient-to-br from-indigo-50/90 to-white/90"
                                : "bg-gradient-to-b from-[#020205] via-[#050514] to-black"
                        )}
                    >
                        {!isSolar && (
                            <div className="absolute inset-0 opacity-40">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_70%)]" />
                                <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse" />
                            </div>
                        )}
                    </motion.div>
 
                    {/* Content Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        className={clsx(
                            "relative z-10 w-full max-w-5xl h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.8)] border editor-overlay-container",
                            isSolar
                                ? "bg-white/60 backdrop-blur-3xl border-slate-200"
                                : "bg-[#050505]/60 backdrop-blur-3xl border-white/10"
                        )}
                    >
                        {/* Immersive Header / Toolbar */}
                        <div className="flex items-center justify-between px-10 py-8 border-b border-white/5">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={handleClose}
                                    className={clsx(
                                        "p-3 rounded-2xl transition-all",
                                        isSolar ? "hover:bg-slate-100 text-slate-400" : "hover:bg-white/10 text-white/30 hover:text-white"
                                    )}
                                >
                                    <X size={24} />
                                </button>
                                <div className="h-8 w-px bg-white/5" />
                                <div className="flex flex-col">
                                    <input
                                        value={note.title || ''}
                                        onChange={(e) => handleUpdateNote({ title: e.target.value })}
                                        className={clsx(
                                            "bg-transparent border-none outline-none text-3xl font-bold tracking-tight",
                                            isSolar ? "text-slate-900 placeholder-slate-300" : "text-white placeholder-white/20"
                                        )}
                                        placeholder="Name your star..."
                                    />
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className={clsx(
                                            "text-[10px] uppercase tracking-[0.3em] font-black px-2 py-0.5 rounded-md",
                                            isSolar ? "bg-indigo-50 text-indigo-500" : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                        )}>
                                            {note.type}
                                        </span>
                                        <span className="text-[10px] uppercase opacity-30 font-bold tracking-widest text-white">
                                            {relativeTime(note.updatedAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <TabButton
                                    active={activeTab === 'content'}
                                    icon={<Sparkles size={18} />}
                                    label="Universe"
                                    onClick={() => setActiveTab('content')}
                                    isSolar={isSolar}
                                />
                                <TabButton
                                    active={activeTab === 'config'}
                                    icon={<BarChart size={18} />}
                                    label="Cosmos Params"
                                    onClick={() => setActiveTab('config')}
                                    isSolar={isSolar}
                                />
                                <div className="w-px h-6 bg-white/10 mx-2" />
                                <button
                                    onClick={handleDelete}
                                    className="p-3 rounded-2xl text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all shadow-sm"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Editor Canvas */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-12 py-10">
                            {activeTab === 'content' ? (
                                <div className="max-w-3xl mx-auto min-h-full">
                                    <RichTextEditor
                                        key={note.id}
                                        initialContent={note.content}
                                        onChange={(editorState) => {
                                            const jsonString = JSON.stringify(editorState);
                                            handleUpdateNote({ content: jsonString });
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
                                    {/* Left Column: Entity Aesthetics */}
                                    <div className="space-y-8">
                                        <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4 flex items-center gap-2">
                                                <Layers size={14} /> Celestial Body Class
                                            </h3>
                                            <div className="grid grid-cols-3 gap-2">
                                                {CELESTIAL_CLASSES.map((c) => (
                                                    <button
                                                        key={c.type}
                                                        onClick={() => handleUpdateNote({ type: c.type as any })}
                                                        className={clsx(
                                                            "px-2.5 py-3 rounded-xl border text-[9px] uppercase tracking-wider font-bold transition-all flex flex-col items-center gap-1.5",
                                                            note.type === c.type
                                                                ? "bg-white/10 text-white border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                                                                : "bg-white/5 text-white/40 border-white/5 hover:border-white/15 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <div 
                                                            className="w-2.5 h-2.5 rounded-full" 
                                                            style={{ 
                                                                background: c.color,
                                                                boxShadow: `0 0 8px ${c.color}`
                                                            }} 
                                                        />
                                                        {c.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4 flex items-center gap-2">
                                                <Zap size={14} /> Atmospheric Energy Glow
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {COSMIC_COLORS.map((c) => (
                                                    <button
                                                        key={c.name}
                                                        onClick={() => handleUpdateNote({ color: c.code })}
                                                        title={c.name}
                                                        className={clsx(
                                                            "w-8 h-8 rounded-full border-2 transition-all duration-300 relative flex items-center justify-center",
                                                            note.color === c.code 
                                                                ? "border-white scale-110 shadow-[0_0_16px_rgba(255,255,255,0.4)]"
                                                                : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                                                        )}
                                                        style={{ 
                                                            background: `radial-gradient(circle at center, ${c.code} 0%, ${c.code}88 100%)`,
                                                            boxShadow: `0 0 10px ${c.code}40`
                                                        }}
                                                    >
                                                        {note.color === c.code && (
                                                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1 flex items-center gap-2">
                                                    <Activity size={14} /> Decay Luminance
                                                </h3>
                                                <p className="text-[9px] text-white/30">Set the starlight energy level.</p>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={Math.round((note.luminance ?? 1) * 100)}
                                                        onChange={(e) => handleUpdateNote({ luminance: parseFloat(e.target.value) / 100 })}
                                                        className="flex-1 accent-indigo-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                                                    />
                                                    <span className="text-xs font-mono text-white/70 w-8 text-right">
                                                        {Math.round((note.luminance ?? 1) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    handleUpdateNote({ luminance: 1.0 });
                                                    window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Star re-energized to 100%!', type: 'success' } }));
                                                }}
                                                className="px-4 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[9px] font-black uppercase tracking-wider hover:bg-indigo-500/35 hover:text-white transition-all shadow-sm"
                                            >
                                                ⚡ Recharge
                                            </button>
                                        </section>

                                        <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1 flex items-center gap-2">
                                                    {note.fixed ? <Lock size={14} /> : <Unlock size={14} />} Physics Anchor
                                                </h3>
                                                <p className="text-[9px] text-white/30">
                                                    {note.fixed ? "Locked at coordinates — unaffected by orbital gravity." : "Drifting — responsive to cosmic gravity fields."}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleUpdateNote({ fixed: !note.fixed })}
                                                className={clsx(
                                                    "px-4 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all",
                                                    note.fixed
                                                        ? "bg-amber-500/20 border-amber-500/30 text-amber-300"
                                                        : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                                                )}
                                            >
                                                {note.fixed ? 'Pinned' : 'Anchor'}
                                            </button>
                                        </section>
                                    </div>

                                    {/* Right Column: Layout Snapping Params */}
                                    <div className="space-y-8">
                                        <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4 flex items-center gap-2">
                                                <Activity size={14} /> Star Magnitude (Orbital Priority)
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['low', 'medium', 'high', 'critical'].map((p) => (
                                                    <button
                                                        key={p}
                                                        onClick={() => handleUpdateNote({ priority: p as any })}
                                                        className={clsx(
                                                            "py-3 rounded-xl border text-[9px] uppercase tracking-wider font-bold transition-all",
                                                            note.priority === p
                                                                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                                                : "bg-white/5 text-white/40 border-white/5 hover:border-white/15 hover:bg-white/10"
                                                        )}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4 flex items-center gap-2">
                                                <Layers size={14} /> Decision Matrix Coordinates
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Urgency</span>
                                                    <div className="flex bg-black/40 rounded-lg p-0.5">
                                                        <button 
                                                            onClick={() => handleUpdateNote({ urgency: 'urgent' })} 
                                                            className={clsx("px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all", note.urgency === 'urgent' ? "bg-red-500/20 text-red-400" : "text-white/30 hover:text-white/60")}
                                                        >
                                                            Urgent
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateNote({ urgency: 'not-urgent' })} 
                                                            className={clsx("px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all", note.urgency === 'not-urgent' ? "bg-blue-500/20 text-blue-400" : "text-white/30 hover:text-white/60")}
                                                        >
                                                            Not Urgent
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Importance</span>
                                                    <div className="flex bg-black/40 rounded-lg p-0.5">
                                                        <button 
                                                            onClick={() => handleUpdateNote({ importance: 'important' })} 
                                                            className={clsx("px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all", note.importance === 'important' ? "bg-amber-500/20 text-amber-400" : "text-white/30 hover:text-white/60")}
                                                        >
                                                            Important
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateNote({ importance: 'not-important' })} 
                                                            className={clsx("px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all", note.importance === 'not-important' ? "bg-slate-500/20 text-slate-400" : "text-white/30 hover:text-white/60")}
                                                        >
                                                            Not Important
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4 flex items-center gap-2">
                                                <Layers size={14} /> Refraction Stage (Prism Kanban)
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['todo', 'in-progress', 'review', 'done'].map((s) => (
                                                    <button
                                                        key={s}
                                                        onClick={() => handleUpdateNote({ status: s as any })}
                                                        className={clsx(
                                                            "py-3 rounded-xl border text-[9px] uppercase tracking-wider font-bold transition-all",
                                                            note.status === s
                                                                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                                                : "bg-white/5 text-white/40 border-white/5 hover:border-white/15 hover:bg-white/10"
                                                        )}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4 flex items-center gap-2">
                                                <Calendar size={14} /> Timeline Projection
                                            </h3>
                                            <div className="flex gap-2">
                                                <input
                                                    type="date"
                                                    value={formatDateForInput(note.dueDate)}
                                                    onChange={(e) => {
                                                        const dateVal = e.target.value;
                                                        if (dateVal) {
                                                            handleUpdateNote({ dueDate: new Date(dateVal).getTime() });
                                                        }
                                                    }}
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-indigo-500/50 transition-all text-white cursor-pointer"
                                                />
                                                {note.dueDate && (
                                                    <button
                                                        onClick={() => handleUpdateNote({ dueDate: undefined })}
                                                        className="px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-all"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </section>

                                        <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">Constellation Group Tags</h3>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {(note.tags || []).map((tag: string, i: number) => (
                                                    <div key={i} className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[9px] font-bold flex items-center gap-1.5">
                                                        #{tag}
                                                        <button onClick={() => handleUpdateNote({ tags: note.tags?.filter((t: string) => t !== tag) })} className="hover:text-white transition-colors">
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <input
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const val = (e.currentTarget as HTMLInputElement).value.trim();
                                                        if (val) {
                                                            handleUpdateNote({ tags: [...(note.tags || []), val] });
                                                            (e.currentTarget as HTMLInputElement).value = '';
                                                        }
                                                    }
                                                }}
                                                placeholder="Type tag and press Enter..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-indigo-500/50 transition-all text-white"
                                            />
                                        </section>

                                        <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">Explicit Mode Visibility</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['orbital', 'matrix', 'prism', 'timeline'].map((m) => {
                                                    const isVisible = (note.visibleInModes || []).includes(m as any);
                                                    return (
                                                        <button
                                                            key={m}
                                                            onClick={() => {
                                                                const current = note.visibleInModes || [];
                                                                if (current.includes(m as any)) {
                                                                    handleUpdateNote({ visibleInModes: current.filter((x: string) => x !== m) });
                                                                } else {
                                                                    handleUpdateNote({ visibleInModes: [...current, m as any] });
                                                                }
                                                            }}
                                                            className={clsx(
                                                                "px-3 py-2.5 rounded-xl border text-[9px] uppercase tracking-wider font-bold transition-all flex items-center justify-between",
                                                                isVisible
                                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                                    : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
                                                            )}
                                                        >
                                                            {m}
                                                            <div className={clsx("w-1.5 h-1.5 rounded-full", isVisible ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/20")} />
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                            <p className="text-[8px] text-white/20 mt-2.5 px-1 leading-normal">
                                                Explicit modes isolate this note from other system views. If unselected, standard creation logic applies.
                                            </p>
                                        </section>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const TabButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void; isSolar: boolean; }> = ({ active, icon, label, onClick, isSolar }) => (
    <button
        onClick={onClick}
        className={clsx(
            "flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300",
            active
                ? (isSolar ? "bg-indigo-900 text-white shadow-lg" : "bg-indigo-500 text-white shadow-[0_0_24px_rgba(99,102,241,0.3)]")
                : (isSolar ? "text-slate-400 hover:bg-slate-100" : "text-white/30 hover:bg-white/5 hover:text-white")
        )}
    >
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
);

const relativeTime = (ts?: number): string => {
    if (!ts) return 'Unknown epoch';
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString();
};

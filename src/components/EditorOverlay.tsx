import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../ui/settings/settingsStore';
import { RichTextEditor } from './editor/RichTextEditor';
import { X, Trash2, BarChart, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { touchNote } from '../engine/decayEngine';


export const EditorOverlay: React.FC = () => {
    const selectedId = useStore((state) => state.selectedId);
    const setSelectedId = useStore((state) => state.setSelectedId);
    const isCosmosOpen = useStore((state) => state.isCosmosOpen);
    const setCosmosOpen = useStore((state) => state.setCosmosOpen);
    const notes = useStore((state) => state.notes);
    const updateNote = useStore((state) => state.updateNote);
    const deleteNote = useStore((state) => state.deleteNote);
    const designSystem = useSettingsStore((s) => s.designSystem);

    const [activeTab, setActiveTab] = useState<'content' | 'config'>('content');

    const note = notes.find((n) => n.id === selectedId);

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

    const isSolar = designSystem === 'solar';

    return (
        <AnimatePresence>
            {isCosmosOpen && note && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center overflow-hidden">
                    {/* Immersive Background */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={clsx(
                            "absolute inset-0 z-0",
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
                        className={clsx(
                            "relative z-10 w-full max-w-5xl h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.8)] border",
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
                                        onChange={(e) => updateNote(note.id, { title: e.target.value })}
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
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-20 py-12">
                            {activeTab === 'content' ? (
                                <div className="max-w-3xl mx-auto min-h-full">
                                    <RichTextEditor
                                        key={note.id}
                                        initialContent={note.content}
                                        onChange={(editorState) => {
                                            const jsonString = JSON.stringify(editorState);
                                            updateNote(note.id, { content: jsonString });
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="max-w-xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <section>
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6">Star Magnitude</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['low', 'medium', 'high', 'critical'].map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => updateNote(note.id, { priority: p as any })}
                                                    className={clsx(
                                                        "px-6 py-4 rounded-2xl border text-[10px] uppercase tracking-[0.2em] font-black transition-all",
                                                        note.priority === p
                                                            ? "bg-indigo-500 text-white border-indigo-500 shadow-[0_0_32px_rgba(99,102,241,0.4)]"
                                                            : "bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:bg-white/10"
                                                    )}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4">Constellation Group</h3>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {(note.tags || []).map((tag, i) => (
                                                <div key={i} className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold flex items-center gap-2">
                                                    #{tag}
                                                    <button onClick={() => updateNote(note.id, { tags: note.tags?.filter(t => t !== tag) })} className="hover:text-white">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <input
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = (e.currentTarget as HTMLInputElement).value.trim();
                                                    if (val) {
                                                        updateNote(note.id, { tags: [...(note.tags || []), val] });
                                                        (e.currentTarget as HTMLInputElement).value = '';
                                                    }
                                                }
                                            }}
                                            placeholder="Orbiting tags..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-indigo-500/50 transition-all text-white"
                                        />
                                    </section>

                                    <section>
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4">Explicit Mode Visibility</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['orbital', 'matrix', 'prism', 'timeline'].map((m) => {
                                                const isVisible = (note.visibleInModes || []).includes(m as any);
                                                return (
                                                    <button
                                                        key={m}
                                                        onClick={() => {
                                                            const current = note.visibleInModes || [];
                                                            if (current.includes(m as any)) {
                                                                updateNote(note.id, { visibleInModes: current.filter(x => x !== m) });
                                                            } else {
                                                                updateNote(note.id, { visibleInModes: [...current, m as any] });
                                                            }
                                                        }}
                                                        className={clsx(
                                                            "px-4 py-3 rounded-xl border text-[10px] uppercase tracking-wide font-black transition-all flex items-center justify-between",
                                                            isVisible
                                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                                : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
                                                        )}
                                                    >
                                                        {m}
                                                        <div className={clsx("w-2 h-2 rounded-full", isVisible ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-white/20")} />
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <p className="text-[9px] text-white/30 mt-3 px-1">
                                            If any modes are toggled on, this note will ONLY appear in those selected modes (and Void). If none are selected, it behaves normally based on origin.
                                        </p>
                                    </section>
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

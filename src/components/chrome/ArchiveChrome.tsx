import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { useSettingsStore } from '../../ui/settings/settingsStore';

export const ArchiveChrome: React.FC = () => {
    const designSystem = useSettingsStore((state) => state.designSystem);
    const graveyard = useStore((state) => state.graveyard || []);
    const recoverNote = useStore((state: any) => state.recoverNote);
    const purgeGraveyard = useStore((state: any) => state.purgeGraveyard);

    const isSolar = designSystem === 'solar';

    const handleRestore = (id: string) => {
        recoverNote(id);
        window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Star system revived and returned to the canvas.', type: 'info' } }));
    };

    const handlePurge = () => {
        if (confirm("Are you sure you want to permanently delete all archived notes? This cannot be undone.")) {
            purgeGraveyard();
            window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Event Horizon purged completely.', type: 'info' } }));
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none font-inter select-none">
            {/* Header Title */}
            <header className="absolute top-24 left-1/2 -translate-x-1/2 text-center opacity-40">
                <h1 className={isSolar ? "font-serif text-3xl font-light tracking-[0.2em] text-slate-500 uppercase italic" : "text-white tracking-[0.2em] text-[24px] font-light leading-tight uppercase italic"}>
                    Event Horizon
                </h1>
                <p className={isSolar ? "text-[10px] tracking-[0.4em] text-slate-400 mt-2 uppercase" : "text-[#9393c8] text-[9px] tracking-[0.3em] text-white/50 mt-2 uppercase"}>
                    Stellar memory graveyard and archive
                </p>
            </header>

            {/* Floating Graveyard Drawer */}
            <div className="absolute top-24 right-8 bottom-24 w-80 pointer-events-auto flex flex-col z-50">
                <div className={isSolar 
                    ? "flex-1 flex flex-col rounded-3xl bg-white/70 border border-slate-200/50 shadow-2xl backdrop-blur-2xl p-6 overflow-hidden"
                    : "flex-1 flex flex-col rounded-3xl bg-[#0A0B14]/80 border border-white/10 shadow-[0_32px_128px_rgba(0,0,0,0.8)] backdrop-blur-3xl p-6 overflow-hidden"
                }>
                    <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                        <div className="flex flex-col">
                            <span className={isSolar ? "text-[10px] font-black uppercase tracking-wider text-slate-800" : "text-[10px] font-black uppercase tracking-wider text-white"}>
                                Graveyard Recovery
                            </span>
                            <span className="text-[9px] text-white/35 mt-0.5">{graveyard.length} stars drifted here</span>
                        </div>
                        {graveyard.length > 0 && (
                            <button
                                onClick={handlePurge}
                                className="flex items-center justify-center p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                                title="Purge Graveyard"
                            >
                                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                        <AnimatePresence initial={false}>
                            {graveyard.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-30">
                                    <span className="material-symbols-outlined text-3xl mb-2">replay</span>
                                    <span className="text-[10px] font-medium tracking-wide">No soft-deleted star systems.</span>
                                </div>
                            ) : (
                                graveyard.map((note) => (
                                    <motion.div
                                        key={note.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className={isSolar
                                            ? "flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/40 bg-slate-100/50 hover:bg-slate-200/50 transition-all group"
                                            : "flex items-center justify-between p-3.5 rounded-2xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all group"
                                        }
                                    >
                                        <div className="flex flex-col min-w-0 pr-3">
                                            <span className={isSolar ? "text-[10px] font-bold text-slate-800 truncate" : "text-[10px] font-bold text-white truncate"}>
                                                {note.title?.trim() || 'Untitled Star'}
                                            </span>
                                            <span className="text-[8px] uppercase tracking-wider text-indigo-400 font-semibold mt-1">
                                                {note.type}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleRestore(note.id)}
                                            className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-sm shrink-0"
                                            title="Revive Star"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">replay</span>
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

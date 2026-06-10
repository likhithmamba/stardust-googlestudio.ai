import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

interface ArchiveViewProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ isOpen, onClose }) => {
    const graveyard = useStore((s) => s.graveyard);
    const recoverNote = useStore((s) => s.recoverNote);
    const purgeGraveyard = useStore((s) => s.purgeGraveyard);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="graveyard-panel"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="fixed top-16 right-4 bottom-16 w-80 z-[100] pointer-events-auto flex flex-col rounded-2xl bg-zinc-900/95 border border-orange-500/20 backdrop-blur-xl shadow-2xl shadow-orange-900/20 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="size-3 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                            <h3 className="text-sm font-medium text-white tracking-wider uppercase">Event Horizon Archive</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                        {graveyard.length === 0 ? (
                            <div className="text-center text-white/20 text-xs tracking-wider py-12">
                                The event horizon is empty.
                            </div>
                        ) : (
                            graveyard.map((note) => (
                                <motion.div
                                    key={note.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-orange-500/20 hover:bg-white/[0.06] transition-all"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-white/70 font-medium truncate">
                                            {note.title || 'Untitled'}
                                        </div>
                                        <div className="text-[10px] text-white/30 mt-0.5">
                                            {note.type} · consumed {note.updatedAt ? formatTimeAgo(note.updatedAt) : 'recently'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            recoverNote(note.id);
                                            window.dispatchEvent(new CustomEvent('stardust:toast', {
                                                detail: { message: `"${note.title || 'Note'}" recovered from the void`, type: 'success' }
                                            }));
                                        }}
                                        className="shrink-0 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-[10px] font-medium tracking-wider uppercase opacity-0 group-hover:opacity-100 hover:bg-orange-500/20 transition-all cursor-pointer"
                                    >
                                        Recover
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {graveyard.length > 0 && (
                        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] text-white/20 tracking-wider">{graveyard.length} consumed</span>
                            <button
                                onClick={() => {
                                    if (confirm('Permanently destroy all consumed stars? This cannot be undone.')) {
                                        purgeGraveyard();
                                        onClose();
                                        window.dispatchEvent(new CustomEvent('stardust:toast', {
                                            detail: { message: 'All consumed stars have been annihilated', type: 'error' }
                                        }));
                                    }
                                }}
                                className="text-[10px] text-red-400/60 hover:text-red-400 tracking-wider uppercase transition-colors cursor-pointer"
                            >
                                Purge All
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ─── Helper ─────────────────────────────────────────────────────
function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

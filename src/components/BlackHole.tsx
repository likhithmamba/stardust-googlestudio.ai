import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

interface BlackHoleProps {
    isActive: boolean;
    isDragging: boolean;
}

export const BlackHole: React.FC<BlackHoleProps> = ({ isActive, isDragging }) => {
    const [showGraveyard, setShowGraveyard] = useState(false);
    const graveyard = useStore((s) => s.graveyard);
    const recoverNote = useStore((s) => s.recoverNote);
    const purgeGraveyard = useStore((s) => s.purgeGraveyard);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                    opacity: isDragging ? 1 : 0,
                    scale: isDragging ? 1 : 0.8,
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="fixed bottom-8 right-8 w-48 h-48 pointer-events-none z-40 flex items-center justify-center"
            >
                {/* Gravity Well / Distortion Field */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                        scale: isActive ? 1.5 : 1, // Stronger expansion
                        rotate: isActive ? 180 : 0 // Add some rotation to the distortion
                    }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                    style={{
                        background: 'radial-gradient(circle, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 70%)',
                        backdropFilter: 'blur(8px)', // heavier blur
                    }}
                />

                <div className={`relative flex items-center justify-center transition-transform duration-500 ${isActive ? 'scale-150' : 'scale-100'}`}>
                    {/* Accretion Disk - Glow */}
                    <div className={`absolute w-40 h-10 bg-orange-500 rounded-full blur-xl mix-blend-screen transition-all duration-300 ${isActive ? 'opacity-100 animate-pulse' : 'opacity-50'}`} />

                    {/* Accretion Disk - Rings (Spin Faster on Active) */}
                    <motion.div
                        className="absolute w-48 h-48 rounded-full"
                        style={{
                            background: 'conic-gradient(from 0deg, transparent 0%, #f97316 20%, transparent 40%, #ea580c 60%, transparent 80%)',
                            maskImage: 'radial-gradient(transparent 50%, black 55%)',
                            WebkitMaskImage: 'radial-gradient(transparent 50%, black 55%)'
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: isActive ? 2 : 8, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Event Horizon (Pure Black) */}
                    <div className="absolute w-20 h-20 bg-black rounded-full shadow-[0_0_30px_rgba(249,115,22,0.6),inset_0_0_20px_rgba(255,255,255,0.2)] z-10 transition-shadow duration-300"
                        style={{ boxShadow: isActive ? '0 0 60px rgba(249,115,22,0.9), inset 0 0 30px rgba(255,255,255,0.4)' : undefined }}
                    />

                    {/* Photon Sphere (Thin Ring) */}
                    <div className="absolute w-22 h-22 rounded-full border border-white/40 blur-[0.5px] z-20" />
                </div>

                {/* Label */}
                <div className={`absolute -top-12 text-xs font-bold tracking-[0.3em] text-orange-500/80 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    SINGULARITY
                </div>

                {/* Suction Status Text */}
                <div className={`absolute -bottom-12 text-[10px] font-mono text-orange-300/60 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                    RELEASE TO CONSUME
                </div>
            </motion.div>

            {/* Graveyard Button — always visible when graveyard has items */}
            {graveyard.length > 0 && !isActive && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setShowGraveyard(true)}
                    className="fixed bottom-6 right-56 z-50 pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] tracking-widest uppercase hover:bg-orange-500/20 hover:border-orange-500/40 transition-all backdrop-blur-sm"
                >
                    <span className="relative flex size-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full size-2 bg-orange-500"></span>
                    </span>
                    {graveyard.length} in Event Horizon
                </motion.button>
            )}

            {/* Graveyard Recovery Panel */}
            <AnimatePresence>
                {showGraveyard && (
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
                                onClick={() => setShowGraveyard(false)}
                                className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none"
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
                                            className="shrink-0 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-[10px] font-medium tracking-wider uppercase opacity-0 group-hover:opacity-100 hover:bg-orange-500/20 transition-all"
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
                                            setShowGraveyard(false);
                                            window.dispatchEvent(new CustomEvent('stardust:toast', {
                                                detail: { message: 'All consumed stars have been annihilated', type: 'error' }
                                            }));
                                        }
                                    }}
                                    className="text-[10px] text-red-400/60 hover:text-red-400 tracking-wider uppercase transition-colors"
                                >
                                    Purge All
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
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

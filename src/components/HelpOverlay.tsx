/**
 * STARDUST — Help Overlay
 * Full reference guide with mode descriptions and keyboard shortcuts.
 * Opened with H key or ? toolbar button. React Portal at z-index 9999.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MODE_HELP, KEYBOARD_SHORTCUTS } from '../constants/helpContent';

interface HelpOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpOverlay: React.FC<HelpOverlayProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(7,7,13,0.88)', backdropFilter: 'blur(12px)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="w-full max-w-3xl max-h-[85vh] mx-4 rounded-2xl border border-white/10 overflow-y-auto"
                        style={{ backgroundColor: 'rgba(12,12,20,0.98)' }}
                        initial={{ scale: 0.92, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 px-8 pt-8 pb-4" style={{ backgroundColor: 'rgba(12,12,20,0.98)' }}>
                            <div className="flex items-center justify-between mb-2">
                                <h1 className="text-white text-2xl font-bold tracking-tight">
                                    ✨ Stardust Guide
                                </h1>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                            <p className="text-white/40 text-sm">
                                A physics-based, multi-lens note-taking canvas. Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 text-xs font-mono">H</kbd> to toggle this guide.
                            </p>
                        </div>

                        <div className="px-8 pb-8">
                            {/* Modes Section */}
                            <h2 className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase mb-4 mt-4">
                                Five Cognitive Lenses
                            </h2>
                            <div className="space-y-3 mb-8">
                                {Object.values(MODE_HELP).map((mode) => (
                                    <div
                                        key={mode.id}
                                        className="rounded-xl border border-white/8 p-4 hover:border-white/15 transition-colors"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: mode.color + '20', color: mode.color }}
                                            >
                                                <span className="material-symbols-outlined text-lg">{mode.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-white font-semibold text-sm">{mode.title}</h3>
                                                    <span className="text-white/30 text-xs">— {mode.tagline}</span>
                                                </div>
                                                <p className="text-white/50 text-xs leading-relaxed mb-2">
                                                    {mode.description}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <span className="text-indigo-400/80">💡</span>
                                                    <span className="text-white/40 italic">{mode.keyInteraction}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Keyboard Shortcuts */}
                            <h2 className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase mb-4">
                                Keyboard Shortcuts
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {KEYBOARD_SHORTCUTS.map((group) => (
                                    <div key={group.title}>
                                        <h3 className="text-white/50 text-xs font-semibold mb-2">{group.title}</h3>
                                        <div className="space-y-1.5">
                                            {group.shortcuts.map((s) => (
                                                <div key={s.keys} className="flex items-center justify-between text-xs">
                                                    <span className="text-white/40">{s.description}</span>
                                                    <kbd className="px-1.5 py-0.5 rounded bg-white/8 text-white/50 font-mono text-[10px] ml-2 flex-shrink-0">
                                                        {s.keys}
                                                    </kbd>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Decay & Archive */}
                            <h2 className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase mb-3 mt-8">
                                Decay & Archive
                            </h2>
                            <div className="rounded-xl border border-white/8 p-4 text-xs text-white/50 leading-relaxed" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                <p className="mb-2">Notes naturally fade over time if you don't interact with them. This is intentional — it surfaces what matters and lets the rest drift away.</p>
                                <p className="mb-2"><strong className="text-white/70">Fresh (0–1 day):</strong> Full brightness. <strong className="text-white/70">Fading (3–7 days):</strong> Slightly dim. <strong className="text-white/70">Ghost (14–30 days):</strong> Very faint, "Archive me?" badge appears.</p>
                                <p><strong className="text-white/70">To revive:</strong> Just open or edit the note. <strong className="text-white/70">To archive:</strong> Drag to the BlackHole or right-click → Archive. Archived notes are recoverable from the Archive panel (press <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono">A</kbd>).</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

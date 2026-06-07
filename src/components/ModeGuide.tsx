/**
 * STARDUST — Mode Guide
 * First-activation overlay per mode. Shows once, dismissed with "Got it".
 * Re-accessible via ? key while in mode.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MODE_HELP } from '../constants/helpContent';
import { useFirstTime } from '../hooks/useFirstTime';

interface ModeGuideProps {
    mode: string;
}

export const ModeGuide: React.FC<ModeGuideProps> = ({ mode }) => {
    const { hasSeenModeGuide, markModeGuideSeen } = useFirstTime();
    const modeHelp = MODE_HELP[mode];

    if (!modeHelp) return null;
    if (hasSeenModeGuide(mode)) return null;

    const handleDismiss = () => {
        markModeGuideSeen(mode);
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[9990] flex items-center justify-center pointer-events-auto"
                style={{ backgroundColor: 'rgba(7,7,13,0.75)', backdropFilter: 'blur(4px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleDismiss}
            >
                <motion.div
                    className="max-w-sm mx-4 rounded-2xl border border-white/10 p-8 text-center"
                    style={{ backgroundColor: 'rgba(12,12,20,0.98)' }}
                    initial={{ scale: 0.85, opacity: 0, y: 40 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.85, opacity: 0, y: 40 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Mode icon */}
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                        style={{ backgroundColor: modeHelp.color + '20', color: modeHelp.color }}
                    >
                        <span className="material-symbols-outlined text-3xl">{modeHelp.icon}</span>
                    </div>

                    <h2 className="text-white text-xl font-bold mb-1">{modeHelp.title}</h2>
                    <p className="text-white/40 text-xs tracking-wide uppercase mb-4">{modeHelp.tagline}</p>

                    <p className="text-white/60 text-sm leading-relaxed mb-4">
                        {modeHelp.description}
                    </p>

                    <div className="rounded-lg bg-white/5 border border-white/8 p-3 mb-6">
                        <p className="text-indigo-300/80 text-xs">
                            💡 {modeHelp.firstTimeTip}
                        </p>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="px-8 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-400 transition-colors"
                    >
                        Got it
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

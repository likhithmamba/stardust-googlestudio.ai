import React from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../../ui/settings/settingsStore';

export const VoidChrome: React.FC = () => {
    const designSystem = useSettingsStore((state) => state.designSystem);
    const isSolar = designSystem === 'solar';

    if (isSolar) {
        return (
            <div className="absolute inset-0 pointer-events-none font-inter text-slate-800">
                {/* Header - Poetic title only, lower z-index or opacity */}
                <header className="absolute top-24 left-1/2 -translate-x-1/2 text-center opacity-30">
                    <h1 className="font-serif text-3xl font-light tracking-[0.2em] text-slate-400 uppercase italic">Void</h1>
                    <p className="text-[10px] tracking-[0.4em] text-slate-300 mt-2 uppercase">A space for ephemeral thoughts</p>
                </header>

                {/* Poetic Center Interaction Hint */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div className="w-[800px] h-[800px] border border-slate-100 rounded-full animate-pulse" />
                </div>
            </div>
        );
    }

    // Zero Point Theme
    return (
        <div className="absolute inset-0 pointer-events-none font-sans-alt text-white selection:bg-[#1919e6]/30">
            {/* Main Center Message */}
            <main className="absolute inset-0 flex flex-col items-center justify-center z-0 pointer-events-none">
                <div className="flex flex-col items-center max-w-[960px]">
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.1, 0.4, 0.1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="text-white tracking-[0.2em] text-[24px] md:text-[32px] font-light leading-tight px-4 text-center select-none italic"
                    >
                        Nothing is required of you.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 0.2, y: 0 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="text-[#9393c8] text-sm font-normal leading-normal pb-3 pt-6 px-4 text-center tracking-widest uppercase select-none"
                    >
                        Scroll to explore the cosmos
                    </motion.p>
                </div>
            </main>
        </div>
    );
};

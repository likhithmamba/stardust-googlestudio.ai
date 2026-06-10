import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { ArchiveView } from './ArchiveView';

interface BlackHoleProps {
    isActive: boolean;
    isDragging: boolean;
}

export const BlackHole: React.FC<BlackHoleProps> = ({ isActive, isDragging }) => {
    const [showGraveyard, setShowGraveyard] = useState(false);
    const graveyard = useStore((s) => s.graveyard);

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
            <ArchiveView isOpen={showGraveyard} onClose={() => setShowGraveyard(false)} />
        </>
    );
};

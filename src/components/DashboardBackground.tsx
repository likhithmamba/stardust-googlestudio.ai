import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../ui/settings/settingsStore';

export const DashboardBackground: React.FC = () => {
    const viewMode = useSettingsStore((s) => s.viewMode);
    const designSystem = useSettingsStore((s) => s.designSystem);
    const key = `${viewMode}-${designSystem}`;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="fixed inset-0 pointer-events-none z-0"
            >
                <BackgroundLayer viewMode={viewMode} designSystem={designSystem} />
            </motion.div>
        </AnimatePresence>
    );
};

const BackgroundLayer: React.FC<{ viewMode: string; designSystem: string }> = ({ viewMode, designSystem }) => {
    const isZP = designSystem === 'zero-point';

    // ── VOID ──────────────────────────────────────────────
    if (viewMode === 'void' && isZP) {
        return (
            <div className="absolute inset-0" style={{ background: '#050510' }}>
                {/* Nebula orbs */}
                <div className="absolute rounded-full" style={{ width: 600, height: 600, top: '20%', left: '30%', background: 'radial-gradient(circle, rgba(25,25,230,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }} />
                <div className="absolute rounded-full" style={{ width: 500, height: 500, top: '60%', left: '65%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', filter: 'blur(100px)' }} />
            </div>
        );
    }
    if (viewMode === 'void' && !isZP) {
        return (
            <div className="absolute inset-0 bg-white" style={{
                backgroundImage: 'radial-gradient(#00000008 0.5px, transparent 0.5px)',
                backgroundSize: '60px 60px',
            }} />
        );
    }

    // ── ORBITAL ──────────────────────────────────────────
    if (viewMode === 'orbital' && isZP) {
        return (
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 60%, #0a0a1a 0%, #020205 100%)' }}>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(99,102,241,0.15) 1px, transparent 1px)', backgroundSize: '300px 300px', opacity: 0.2 }} />
                <div className="absolute rounded-full" style={{ width: 800, height: 300, bottom: '-10%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
            </div>
        );
    }
    if (viewMode === 'orbital' && !isZP) {
        return (
            <div className="absolute inset-0 bg-white" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.04) 0%, #ffffff 60%)' }} />
        );
    }

    // ── MATRIX ───────────────────────────────────────────
    if (viewMode === 'matrix' && isZP) {
        return (
            <div className="absolute inset-0" style={{ background: '#05050a' }}>
                <div className="absolute rounded-full" style={{ width: 600, height: 200, bottom: '5%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
                {/* Crosshair center lines */}
                <div className="absolute top-0 bottom-0" style={{ left: '50%', width: 1, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent)' }} />
                <div className="absolute left-0 right-0" style={{ top: '50%', height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)' }} />
            </div>
        );
    }
    if (viewMode === 'matrix' && !isZP) {
        return (
            <div className="absolute inset-0 bg-[#f8f8fc]" style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
                backgroundSize: '80px 80px',
            }} />
        );
    }

    // ── PRISM ────────────────────────────────────────────
    if (viewMode === 'prism' && isZP) {
        return (
            <div className="absolute inset-0" style={{ background: '#05050A' }}>
                <div className="absolute rounded-full" style={{ width: 400, height: 400, top: '-5%', left: '-5%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', filter: 'blur(120px)' }} />
                <div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: '-5%', right: '-5%', background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)', filter: 'blur(120px)' }} />
                {/* Vertical divider lines */}
                {[20, 40, 60, 80].map(pct => (
                    <div key={pct} className="absolute top-0 bottom-0" style={{ left: `${pct}%`, width: 1, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.05), transparent)' }} />
                ))}
            </div>
        );
    }
    if (viewMode === 'prism' && !isZP) {
        return (
            <div className="absolute inset-0 bg-white">
                {/* Soft pastel column panels */}
                <div className="absolute inset-y-0" style={{ left: '0%', width: '25%', background: 'rgba(239,68,68,0.02)' }} />
                <div className="absolute inset-y-0" style={{ left: '25%', width: '25%', background: 'rgba(249,115,22,0.02)' }} />
                <div className="absolute inset-y-0" style={{ left: '50%', width: '25%', background: 'rgba(59,130,246,0.02)' }} />
                <div className="absolute inset-y-0" style={{ left: '75%', width: '25%', background: 'rgba(139,92,246,0.02)' }} />
            </div>
        );
    }

    // ── TIMELINE ─────────────────────────────────────────
    if (viewMode === 'timeline' && isZP) {
        return (
            <div className="absolute inset-0" style={{ background: '#0a0a0c' }}>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(238,189,43,0.08) 1px, transparent 1px)', backgroundSize: '200px 200px' }} />
                <div className="absolute rounded-full" style={{ width: 600, height: 600, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'radial-gradient(ellipse, rgba(238,189,43,0.05) 0%, transparent 70%)', filter: 'blur(80px)' }} />
                {/* Timeline axis line */}
                <div className="absolute left-0 right-0" style={{ top: '50%', height: 2, background: 'linear-gradient(to right, transparent, rgba(238,189,43,0.15), transparent)' }} />
            </div>
        );
    }
    if (viewMode === 'timeline' && !isZP) {
        return (
            <div className="absolute inset-0 bg-[#f8f7f6]" style={{
                backgroundImage: 'radial-gradient(rgba(0,0,0,0.07) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
            }} />
        );
    }

    // ── ARCHIVE / FREE / FALLBACK ─────────────────────────
    if (isZP) {
        return <div className="absolute inset-0" style={{ background: '#050510' }} />;
    }
    return <div className="absolute inset-0 bg-white" />;
};

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../ui/settings/settingsStore';
import { useStore } from '../store/useStore';
import { SettingsPanel } from './SettingsPanel';
import type { ViewMode } from '../constants';
import { stellarSynthesis, constellationMapper } from '../utils/ai';

// ─── Stitch-Inspired Unified UI Shell ────────────────────────────────

const MODES: { id: ViewMode; label: string; icon: string }[] = [
    { id: 'void', label: 'Void', icon: 'blur_on' },
    { id: 'matrix', label: 'Matrix', icon: 'grid_view' },
    { id: 'prism', label: 'Prism', icon: 'view_column' },
    { id: 'orbital', label: 'Orbital', icon: 'bubble_chart' },
    { id: 'timeline', label: 'Timeline', icon: 'timeline' },
    { id: 'archive', label: 'Archive', icon: 'inventory_2' },
];

// Per-mode dock background colors
const MODE_DOCK_COLORS: Record<string, string> = {
    void: '#050505',
    matrix: '#050505',
    prism: '#050505',
    orbital: '#050505',
    timeline: '#050505',
    archive: '#050505',
    free: '#050505',
};

// Stitch color palette
const PALETTE = {
    solar: {
        bg: 'bg-white/60',
        border: 'border-slate-200/40',
        text: 'text-slate-600',
        textMute: 'text-slate-400',
        hover: 'hover:bg-slate-100/80',
        active: 'bg-slate-900 text-white shadow-lg',
        accent: '#6366f1',
        glow: 'shadow-[0_8px_32px_rgba(99,102,241,0.1)]',
        create: 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_4px_24px_rgba(99,102,241,0.4)]',
    },
    'zero-point': {
        bg: 'bg-[#050505]/60',
        border: 'border-white/10',
        text: 'text-white',
        textMute: 'text-white/50',
        hover: 'hover:bg-white/10 hover:text-white',
        active: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
        accent: 'text-indigo-400',
        glow: 'shadow-[0_16px_48px_rgba(0,0,0,0.5)]',
        create: 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_4px_24px_rgba(99,102,241,0.5)]',
    },
};

export const AppShell: React.FC = () => {
    const viewMode = useSettingsStore((s) => s.viewMode);
    const setViewMode = useSettingsStore((s) => s.setViewMode);
    const designSystem = useSettingsStore((s) => s.designSystem);
    const setDesignSystem = useSettingsStore((s) => s.setDesignSystem);
    const isSettingsOpen = useStore((s) => s.isSettingsOpen);
    const setSettingsOpen = useStore((s) => s.setSettingsOpen);
    const isSearchOpen = useStore((s) => s.isSearchOpen);
    const setSearchOpen = useStore((s) => s.setSearchOpen);
    const noteCount = useStore((s) => s.notes.length);
    const [rippleMode, setRippleMode] = useState<string | null>(null);

    const isSolar = designSystem === 'solar';
    const p = PALETTE[designSystem] || PALETTE['zero-point'];

    // Wire designSystem to html element
    useEffect(() => {
        const html = document.documentElement;
        html.classList.remove('solar', 'zero-point', 'dark');
        html.classList.add(designSystem);
        if (designSystem === 'zero-point') html.classList.add('dark');
        html.setAttribute('data-mode', viewMode);
    }, [designSystem, viewMode]);

    const handleCreate = () => {
        // For structured modes, CanvasViewport short-circuits to direct note creation via the spherical event
        window.dispatchEvent(new CustomEvent('stardust:openSphericalMenu', {
            detail: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        }));
    };

    const handleModeClick = (modeId: string) => {
        setRippleMode(modeId);
        setViewMode(modeId as ViewMode);
        setTimeout(() => setRippleMode(null), 500);
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-[60]">

            {/* TOP BAR */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: 'circOut' }}
                className={clsx(
                    'absolute top-4 left-1/2 -translate-x-1/2 flex items-center justify-between',
                    'w-[min(720px,92vw)] px-5 py-2.5 rounded-full pointer-events-auto',
                    'backdrop-blur-xl transition-all duration-500',
                    p.bg, p.border, 'border', p.glow
                )}
            >
                {/* Left: Logo */}
                <div className="flex items-center gap-3">
                    <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', isSolar ? 'bg-slate-900 text-white' : 'bg-indigo-500 text-white')}>
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"FILL" 1' }}>hub</span>
                    </div>
                    <div className="flex flex-col">
                        <span className={clsx('text-[11px] font-black tracking-[0.25em] uppercase leading-none', isSolar ? 'text-slate-800' : 'text-white')}>
                            STARDUST <span className="text-[8px] font-medium opacity-30 ml-1">v2.5</span>
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={clsx('text-[9px] tracking-[0.15em] uppercase leading-none font-bold', p.accent)}>
                                {viewMode === 'orbital' ? "Gravitational Network" :
                                    viewMode === 'matrix' ? "Strategic Quadrants" :
                                        viewMode === 'timeline' ? "Temporal Stream" :
                                            viewMode === 'prism' ? "Entropy Distribution" : "Omni-directional Void"}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <span className="text-[8px] tracking-[0.15em] uppercase font-bold text-white/30">
                                {noteCount} Active Nodes
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1">
                    {/* Synthesis */}
                    <button
                        onClick={async () => {
                            const notes = useStore.getState().notes.map(n => ({ title: n.title || '', type: n.type }));
                            if (notes.length === 0) return;
                            window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Synthesizing knowledge...', type: 'info' } }));
                            try {
                                const result = await stellarSynthesis(notes);
                                window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: result, type: 'ultra' } }));
                            } catch (error: any) {
                                window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: error.message, type: 'info' } }));
                            }
                        }}
                        className={clsx('w-8 h-8 rounded-full flex items-center justify-center transition-all', p.textMute, p.hover)}
                        title="Stellar Synthesis (Summarize)"
                    >
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    </button>

                    {/* Auto-Map */}
                    <button
                        onClick={async () => {
                            const notes = useStore.getState().notes.map(n => ({ title: n.title || '', type: n.type }));
                            if (notes.length === 0) return;
                            window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Mapping constellation...', type: 'info' } }));
                            try {
                                const result = await constellationMapper(notes);
                                window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: result, type: 'ultra' } }));
                            } catch (error: any) {
                                window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: error.message, type: 'info' } }));
                            }
                        }}
                        className={clsx('w-8 h-8 rounded-full flex items-center justify-center transition-all', p.textMute, p.hover)}
                        title="Constellation Mapper (Auto-Map)"
                    >
                        <span className="material-symbols-outlined text-[18px]">account_tree</span>
                    </button>

                    {/* Search + note count badge */}
                    <button
                        onClick={() => setSearchOpen(!isSearchOpen)}
                        className={clsx('relative w-8 h-8 rounded-full flex items-center justify-center transition-all', p.textMute, p.hover)}
                        title="Search (Ctrl+K)"
                    >
                        <span className="material-symbols-outlined text-[18px]">search</span>
                        {noteCount > 0 && (
                            <span className={clsx(
                                'absolute -top-0.5 -right-0.5 px-1 py-px rounded-full text-[8px] border leading-none font-bold',
                                isSolar ? 'bg-slate-900 text-white border-slate-700' : 'bg-indigo-500 text-white border-indigo-400/40 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                            )}>
                                {noteCount}
                            </span>
                        )}
                    </button>

                    {/* Theme toggle */}
                    <button
                        onClick={() => setDesignSystem(isSolar ? 'zero-point' : 'solar')}
                        className={clsx('w-8 h-8 rounded-full flex items-center justify-center transition-all', p.textMute, p.hover)}
                        title="Toggle Theme"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {isSolar ? 'dark_mode' : 'light_mode'}
                        </span>
                    </button>

                    {/* Settings */}
                    <button
                        onClick={() => setSettingsOpen(!isSettingsOpen)}
                        className={clsx('w-8 h-8 rounded-full flex items-center justify-center transition-all', p.textMute, p.hover)}
                        title="Settings (Ctrl+,)"
                    >
                        <span className="material-symbols-outlined text-[18px]">settings</span>
                    </button>
                </div>
            </motion.header>

            {/* BOTTOM NAV */}
            <motion.nav
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: 'circOut' }}
                className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-auto"
            >
                <div
                    className={clsx('flex items-center gap-0.5 p-1.5 rounded-[20px] backdrop-blur-2xl border transition-all duration-700', p.border, p.glow)}
                    style={{ backgroundColor: isSolar ? 'rgba(255,255,255,0.75)' : `${MODE_DOCK_COLORS[viewMode] || '#050505'}CC` }}
                >
                    {/* Free Canvas button */}
                    <button
                        onClick={() => handleModeClick('free')}
                        className={clsx(
                            'relative w-[40px] h-[44px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-300 group overflow-hidden',
                            viewMode === 'free' ? p.active : clsx(p.textMute, p.hover)
                        )}
                        title="Free Canvas"
                    >
                        <span className="material-symbols-outlined text-[18px] transition-transform group-hover:scale-110">open_with</span>
                        <span className="text-[6px] font-semibold uppercase tracking-[0.08em] leading-none">Free</span>
                        {rippleMode === 'free' && (
                            <motion.span
                                className="absolute inset-0 rounded-xl"
                                style={{ background: isSolar ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)' }}
                                initial={{ scale: 0, opacity: 0.6 }}
                                animate={{ scale: 3, opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            />
                        )}
                    </button>

                    {/* Divider */}
                    <div className={clsx('w-px h-7 mx-0.5', isSolar ? 'bg-slate-200' : 'bg-white/10')} />

                    {/* Mode buttons */}
                    {MODES.map((mode) => {
                        const isActive = viewMode === mode.id;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => handleModeClick(mode.id)}
                                className={clsx(
                                    'relative flex flex-col items-center justify-center w-[52px] h-[44px] rounded-xl transition-all duration-300 group overflow-hidden',
                                    isActive
                                        ? p.active
                                        : clsx(p.textMute, p.hover, 'hover:' + (isSolar ? 'text-slate-700' : 'text-white'))
                                )}
                                title={mode.label}
                            >
                                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:scale-110">
                                    {mode.icon}
                                </span>
                                <span className="text-[7px] font-semibold uppercase tracking-[0.08em] mt-0.5 leading-none">
                                    {mode.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-mode-indicator"
                                        className={clsx('absolute -bottom-0.5 w-1 h-1 rounded-full',
                                            viewMode === 'orbital' ? 'bg-indigo-400' :
                                                viewMode === 'matrix' ? 'bg-amber-400' :
                                                    viewMode === 'timeline' ? 'bg-rose-400' :
                                                        viewMode === 'prism' ? 'bg-cyan-400' :
                                                            isSolar ? 'bg-slate-900' : 'bg-white'
                                        )}
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                {rippleMode === mode.id && (
                                    <motion.span
                                        className="absolute inset-0 rounded-xl"
                                        style={{ background: isSolar ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)' }}
                                        initial={{ scale: 0, opacity: 0.6 }}
                                        animate={{ scale: 3, opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                    />
                                )}
                            </button>
                        );
                    })}

                    {/* Divider */}
                    <div className={clsx('w-px h-7 mx-1.5', isSolar ? 'bg-slate-200' : 'bg-white/10')} />

                    {/* Create button */}
                    <motion.button
                        onClick={handleCreate}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className={clsx('w-11 h-11 rounded-xl flex items-center justify-center transition-all', p.create)}
                        title="Create Note (Double-click on canvas)"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                    </motion.button>
                </div>
            </motion.nav>

            {/* MODE BADGE */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={viewMode}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none"
                >
                    <p className={clsx('text-[10px] tracking-[0.3em] uppercase font-light select-none', isSolar ? 'text-slate-300' : 'text-[#9393c8]/30')}
                        style={{ animation: 'slowBreath 8s ease-in-out infinite' }}
                    >
                        {viewMode === 'void' && '• Nothing is required of you'}
                        {viewMode === 'matrix' && '⊞ Structured thought grid active'}
                        {viewMode === 'prism' && '▨ Multi-lens refraction'}
                        {viewMode === 'orbital' && '◎ Gravitational priority flows'}
                        {viewMode === 'timeline' && '── Temporal drift: nominal'}
                        {viewMode === 'free' && '∞ Infinite canvas'}
                        {viewMode === 'archive' && '⟳ Routine orbital decay archived'}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* Settings Panel */}
            <SettingsPanel />
        </div>
    );
};

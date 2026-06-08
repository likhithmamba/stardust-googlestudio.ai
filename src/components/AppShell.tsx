import React, { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../ui/settings/settingsStore';
import { useStore } from '../store/useStore';
import { SettingsPanel } from './SettingsPanel';
import type { ViewMode } from '../constants';
import { stellarSynthesis, constellationMapper } from '../utils/ai';
import { FeedbackModal } from './FeedbackModal';
import { useFeedbackTrigger } from '../hooks/useFeedbackTrigger';
import { HelpOverlay } from './HelpOverlay';
import { ModeGuide } from './ModeGuide';

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
        bg: 'bg-white/80 backdrop-blur-2xl',
        border: 'border-slate-200/50 hover:border-slate-300/60',
        text: 'text-slate-800',
        textMute: 'text-slate-500',
        hover: 'hover:bg-slate-100 hover:text-slate-900',
        active: 'bg-indigo-600 text-white shadow-[0_8px_20px_rgba(99,102,241,0.25)]',
        accent: '#4f46e5',
        glow: 'shadow-[0_16px_48px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.01)]',
        create: 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)]',
    },
    'zero-point': {
        bg: 'bg-[#05050C]/75 backdrop-blur-3xl',
        border: 'border-white/10 hover:border-indigo-500/20',
        text: 'text-white',
        textMute: 'text-white/40',
        hover: 'hover:bg-white/5 hover:text-white',
        active: 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-[0_0_24px_rgba(99,102,241,0.15)]',
        accent: 'text-indigo-400 font-extrabold',
        glow: 'shadow-[0_24px_64px_rgba(0,0,0,0.7),0_0_40px_rgba(99,102,241,0.02)]',
        create: 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-700 hover:from-indigo-400 hover:to-violet-600 text-white shadow-[0_6px_24px_rgba(99,102,241,0.4)]',
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

    // Constellation Workspace State
    const activeConstellation = useStore((s) => s.activeConstellation);
    const constellations = useStore((s) => s.constellations);
    const setActiveConstellation = useStore((s) => s.setActiveConstellation);
    const addConstellation = useStore((s) => s.addConstellation);
    const removeConstellation = useStore((s) => s.removeConstellation);
    const renameConstellation = useStore((s) => s.renameConstellation);

    const [folderMenuOpen, setFolderMenuOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolder, setEditingFolder] = useState<string | null>(null);
    const [editFolderName, setEditFolderName] = useState('');

    // Help & Feedback State Toggles
    const [helpOpen, setHelpOpen] = useState(false);
    const [feedbackOpen, setFeedbackOpen] = useState(false);

    // Feedback Trigger timer (30s after first note)
    useFeedbackTrigger(useCallback(() => setFeedbackOpen(true), []));

    // Keyboard shortcut ToggleHelp Listener
    useEffect(() => {
        const handleToggleHelp = () => setHelpOpen(h => !h);
        window.addEventListener('stardust:toggleHelp', handleToggleHelp);
        return () => window.removeEventListener('stardust:toggleHelp', handleToggleHelp);
    }, []);

    const isSolar = designSystem === 'solar';
    const p = PALETTE[designSystem] || PALETTE['zero-point'];

    // Wire designSystem to html element
    useEffect(() => {
        const html = document.documentElement;
        html.classList.remove('solar', 'zero-point', 'dark');
        if (designSystem && typeof designSystem === 'string') {
            html.classList.add(designSystem);
            if (designSystem === 'zero-point') html.classList.add('dark');
        }
        if (viewMode && typeof viewMode === 'string') {
            html.setAttribute('data-mode', viewMode);
        }
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
                                {noteCount} Nodes
                            </span>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <div className="relative">
                                <button
                                    onClick={() => setFolderMenuOpen(!folderMenuOpen)}
                                    className="flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg text-[8px] tracking-[0.15em] uppercase font-bold text-white/70 hover:text-white pointer-events-auto transition-all"
                                >
                                    <span className="material-symbols-outlined text-[11px] leading-none">folder</span>
                                    <span>{activeConstellation}</span>
                                    <span className="material-symbols-outlined text-[10px] leading-none">keyboard_arrow_down</span>
                                </button>

                                <AnimatePresence>
                                    {folderMenuOpen && (
                                        <>
                                            {/* Click outside backdrop */}
                                            <div className="fixed inset-0 z-40 pointer-events-auto" onClick={() => { setFolderMenuOpen(false); setEditingFolder(null); }} />

                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#090b16]/95 border border-white/10 p-4 shadow-2xl backdrop-blur-xl z-50 pointer-events-auto flex flex-col gap-3"
                                            >
                                                <div className="text-[9px] uppercase font-black tracking-widest text-white/40">Workspace Folders</div>
                                                
                                                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                                                    {constellations.map((c) => {
                                                        const isActive = c === activeConstellation;
                                                        const isEditing = editingFolder === c;

                                                        return (
                                                            <div key={c} className={clsx(
                                                                "flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl transition-all border",
                                                                isActive ? "bg-indigo-500/20 border-indigo-500/30" : "hover:bg-white/5 border-transparent"
                                                            )}>
                                                                {isEditing ? (
                                                                    <input
                                                                        type="text"
                                                                        value={editFolderName}
                                                                        onChange={(e) => setEditFolderName(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                const name = editFolderName.trim();
                                                                                if (name && name !== c) {
                                                                                    renameConstellation(c, name);
                                                                                }
                                                                                setEditingFolder(null);
                                                                            } else if (e.key === 'Escape') {
                                                                                setEditingFolder(null);
                                                                            }
                                                                        }}
                                                                        className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-0.5 text-xs text-white outline-none"
                                                                        autoFocus
                                                                        onPointerDown={(e) => e.stopPropagation()}
                                                                    />
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveConstellation(c);
                                                                            setFolderMenuOpen(false);
                                                                        }}
                                                                        className="flex-1 text-left text-xs font-semibold text-white/80 hover:text-white truncate"
                                                                    >
                                                                        {c}
                                                                    </button>
                                                                )}

                                                                {c !== 'General' && !isEditing && (
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingFolder(c);
                                                                                setEditFolderName(c);
                                                                            }}
                                                                            className="p-1 text-white/40 hover:text-white/80 transition-colors flex items-center"
                                                                            title="Rename folder"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[14px]">edit</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                if (confirm(`Delete folder "${c}"? All notes inside will be moved to "General".`)) {
                                                                                    removeConstellation(c);
                                                                                }
                                                                            }}
                                                                            className="p-1 text-red-400/50 hover:text-red-400 transition-colors flex items-center"
                                                                            title="Delete folder"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[14px]">delete</span>
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {isEditing && (
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                const name = editFolderName.trim();
                                                                                if (name && name !== c) {
                                                                                    renameConstellation(c, name);
                                                                                }
                                                                                setEditingFolder(null);
                                                                            }}
                                                                            className="p-1 text-emerald-400 hover:text-emerald-300 flex items-center"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[14px]">check</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingFolder(null)}
                                                                            className="p-1 text-white/40 hover:text-white flex items-center"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="h-px bg-white/5 my-1" />

                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newFolderName}
                                                        onChange={(e) => setNewFolderName(e.target.value)}
                                                        placeholder="New Folder..."
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const name = newFolderName.trim();
                                                                if (name) {
                                                                    addConstellation(name);
                                                                    setNewFolderName('');
                                                                }
                                                            }
                                                        }}
                                                        onPointerDown={(e) => e.stopPropagation()}
                                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const name = newFolderName.trim();
                                                            if (name) {
                                                                addConstellation(name);
                                                                setNewFolderName('');
                                                            }
                                                        }}
                                                        className="px-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">add</span>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
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

                    {/* Help Guide */}
                    <button
                        onClick={() => setHelpOpen(!helpOpen)}
                        className={clsx('w-8 h-8 rounded-full flex items-center justify-center transition-all', p.textMute, p.hover)}
                        title="Help Guide (H)"
                    >
                        <span className="material-symbols-outlined text-[18px]">help</span>
                    </button>

                    {/* Feedback */}
                    <button
                        onClick={() => setFeedbackOpen(true)}
                        className={clsx('w-8 h-8 rounded-full flex items-center justify-center transition-all', p.textMute, p.hover)}
                        title="Share Feedback"
                    >
                        <span className="material-symbols-outlined text-[18px]">rate_review</span>
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

            {/* Help Overlay */}
            <HelpOverlay isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

            {/* Mode Guide Overlay */}
            <ModeGuide mode={viewMode} />

            {/* Feedback Modal Overlay */}
            <AnimatePresence>
                {feedbackOpen && (
                    <FeedbackModal onClose={() => setFeedbackOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

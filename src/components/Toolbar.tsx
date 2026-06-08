import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../ui/settings/settingsStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Plus,
    Trash2,
    Palette,
    Layout,
    Search,
    Settings
} from 'lucide-react';
import { NoteType, NOTE_STYLES } from '../constants';
import clsx from 'clsx';

export const Toolbar: React.FC = () => {
    const addNote = useStore((state) => state.addNote);
    const viewport = useStore((state) => state.viewport);
    const setNotes = useStore((state) => state.setNotes);
    const setConnections = useStore((state) => state.setConnections);
    const toolbarMode = useSettingsStore((state) => state.toolbarMode);

    const [isHovered, setHovered] = useState(false);
    const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => {
            setHovered(true);
        }, 300); // 300ms delay to prevent accidental triggers
    };

    const handleMouseLeave = () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        // Small delay before hiding to smooth out jitter
        hoverTimer.current = setTimeout(() => {
            setHovered(false);
        }, 100);
    };

    // UI Toggles
    const scaleMode = useStore((state) => state.scaleMode);
    const setScaleMode = useStore((state) => state.setScaleMode);

    // Theme State
    const [showThemeMenu, setShowThemeMenu] = React.useState(false);

    // Search State
    const isSearchOpen = useStore((state) => state.isSearchOpen);
    const setSearchOpen = useStore((state) => state.setSearchOpen);
    const isSettingsOpen = useStore((state) => state.isSettingsOpen);

    // Keybinds (Ctrl+K)
    React.useEffect(() => {
        const handleDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setSearchOpen(!isSearchOpen);
            }
        };
        window.addEventListener('keydown', handleDown);
        return () => window.removeEventListener('keydown', handleDown);
    }, [isSearchOpen, setSearchOpen]);

    // Selection State for Theme editing
    const selectedId = useStore((state) => state.selectedId);
    const updateNote = useStore((state) => state.updateNote);
    const notes = useStore((state) => state.notes);
    const selectedNote = notes.find(n => n.id === selectedId);

    const handleAddSun = () => {
        // Center on screen
        const x = -viewport.x / viewport.zoom + window.innerWidth / (2 * viewport.zoom) - 100;
        const y = -viewport.y / viewport.zoom + window.innerHeight / (2 * viewport.zoom) - 50;

        addNote({
            id: Math.random().toString(36).substr(2, 9),
            x,
            y,
            w: 800,
            h: 800,
            type: NoteType.Sun,
            title: 'The Sun',
            color: NOTE_STYLES[NoteType.Sun].color
        });
    };

    const handleClear = () => {
        if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
            setNotes([]);
            setConnections([]);
        }
    };

    const isCollapsed = toolbarMode === 'collapsed' && !isHovered;
    const isHidden = toolbarMode === 'auto-hide' && !isHovered;

    return (
        <>
            {/* Hover Trigger for Auto-Hide Mode */}
            {toolbarMode === 'auto-hide' && (
                <div
                    className="fixed left-0 top-0 bottom-0 w-16 z-[899] bg-transparent"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                />
            )}

            <motion.div
                className="fixed left-6 top-1/2 -translate-y-1/2 z-[900] pointer-events-auto flex flex-col items-center"
                initial={false}
                animate={{
                    x: isHidden ? -120 : 0,
                    opacity: isHidden ? 0 : 1,
                    scale: isCollapsed ? 0.9 : 1,
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Theme Menu Popover - Floats to the right */}
                <div className="relative w-full flex justify-center">
                    <AnimatePresence>
                        {showThemeMenu && !isCollapsed && (
                            <motion.div
                                key="theme-menu"
                                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                className="absolute left-full ml-4 top-0 p-6 rounded-[32px] bg-[#0A0B16]/90 border border-white/10 w-80 backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.8),0_8px_24px_rgba(99,102,241,0.08)] origin-left z-[950] space-y-6"
                            >
                                <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] text-center flex items-center justify-center gap-2">
                                    <Palette size={12} className="text-indigo-400" /> Appearance Control
                                </h3>

                                {/* Global Theme */}
                                <div className="pb-4 border-b border-white/5">
                                    <label className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-2 block text-center">Global Theme</label>
                                    <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                                        {['default', 'cyberpunk', 'zen'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => useStore.getState().setTheme(t as any)}
                                                className={clsx(
                                                    "flex-1 py-1.5 text-[9px] uppercase tracking-wider font-black rounded-lg transition-all",
                                                    useStore.getState().theme === t ? "bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]" : "text-white/40 hover:text-white"
                                                )}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedNote ? (
                                    <div className="space-y-5">
                                        {/* Atmosphere Glow Picker */}
                                        <div>
                                            <label className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-2 block text-center">Atmospheric Glow</label>
                                            <div className="grid grid-cols-5 gap-2">
                                                {[
                                                    { name: 'Solar', code: '#fbbf24', bg: 'bg-[#fbbf24]' },
                                                    { name: 'Indigo', code: '#6366f1', bg: 'bg-[#6366f1]' },
                                                    { name: 'Purple', code: '#a78bfa', bg: 'bg-[#a78bfa]' },
                                                    { name: 'Blue', code: '#3b82f6', bg: 'bg-[#3b82f6]' },
                                                    { name: 'Red', code: '#ef4444', bg: 'bg-[#ef4444]' },
                                                    { name: 'Saturn', code: '#eab308', bg: 'bg-[#eab308]' },
                                                    { name: 'Moon', code: '#d1d5db', bg: 'bg-[#d1d5db]' },
                                                    { name: 'Comet', code: '#22d3ee', bg: 'bg-[#22d3ee]' },
                                                    { name: 'Deep', code: '#a855f7', bg: 'bg-[#a855f7]' },
                                                    { name: 'Void', code: '#ffffff', bg: 'bg-[#ffffff]' }
                                                ].map(c => (
                                                    <button
                                                        key={c.name}
                                                        onClick={() => updateNote(selectedNote.id, { color: c.code, textColor: c.code })}
                                                        title={c.name}
                                                        className={clsx(
                                                            "w-7 h-7 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center relative",
                                                            selectedNote.color === c.code ? "border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.6)]" : "border-transparent opacity-60 hover:opacity-100"
                                                        )}
                                                        style={{ background: c.code }}
                                                    >
                                                        {selectedNote.color === c.code && (
                                                            <div className="w-1.5 h-1.5 bg-black rounded-full" style={{ background: c.code === '#ffffff' ? '#000000' : '#ffffff' }} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Font Family */}
                                        <div>
                                            <label className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-2 block text-center">Typography Font</label>
                                            <select
                                                value={selectedNote.fontFamily || 'sans'}
                                                onChange={(e) => updateNote(selectedNote.id, { fontFamily: e.target.value as any })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white/80 focus:outline-none focus:border-indigo-500/50 cursor-pointer transition-all duration-300 font-medium"
                                                style={{ colorScheme: 'dark' }}
                                            >
                                                <option value="sans" className="bg-[#0A0B16] text-white">Inter (Sans)</option>
                                                <option value="serif" className="bg-[#0A0B16] text-white">Lora (Serif)</option>
                                                <option value="mono" className="bg-[#0A0B16] text-white">Fira Code (Mono)</option>
                                                <option value="Space Grotesk" className="bg-[#0A0B16] text-white">Space Grotesk</option>
                                                <option value="Cinzel" className="bg-[#0A0B16] text-white">Cinzel</option>
                                                <option value="Manrope" className="bg-[#0A0B16] text-white">Manrope</option>
                                            </select>
                                        </div>

                                        {/* Size & Mass Slider */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1.5 block text-center">Star Size</label>
                                                <input
                                                    type="range"
                                                    min="12"
                                                    max="64"
                                                    value={selectedNote.fontSize || 16}
                                                    onChange={(e) => updateNote(selectedNote.id, { fontSize: parseInt(e.target.value) })}
                                                    className="w-full accent-indigo-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                                                />
                                                <div className="text-[9px] text-white/50 text-center mt-1 font-mono">{selectedNote.fontSize || 16}px</div>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1.5 block text-center">Gravity Mass</label>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="20"
                                                    value={selectedNote.mass || 5}
                                                    onChange={(e) => updateNote(selectedNote.id, { mass: parseInt(e.target.value) })}
                                                    className="w-full accent-indigo-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                                                />
                                                <div className="text-[9px] text-white/50 text-center mt-1 font-mono">{selectedNote.mass || 5} G</div>
                                            </div>
                                        </div>

                                        {/* Lock Switch */}
                                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                                            <span className="text-[9px] font-black uppercase tracking-wider text-white/50">Lock Position</span>
                                            <button
                                                onClick={() => updateNote(selectedNote.id, { fixed: !selectedNote.fixed })}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all",
                                                    selectedNote.fixed
                                                        ? "bg-amber-500/20 border-amber-500/30 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                                                        : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                                                )}
                                            >
                                                {selectedNote.fixed ? 'Pinned' : 'Anchor'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[9.5px] text-white/30 text-center py-4 italic font-serif leading-relaxed">Select a planet on the canvas<br />to reveal styling cores.</p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Main Toolbar Pill */}
                <motion.div
                    layout
                    className={clsx(
                        "ui-interactive-area flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-[24px] bg-[#05050C]/75 backdrop-blur-3xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)] hover:border-indigo-500/20 transition-all duration-300 relative",
                        isCollapsed && "px-2 py-2"
                    )}
                >

                    {/* Collapsed Logic: Hide most items */}
                    {(!isCollapsed) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, height: 0 }}
                            animate={{ opacity: 1, scale: 1, height: 'auto' }}
                            exit={{ opacity: 0, scale: 0.9, height: 0 }}
                            className="flex flex-col items-center gap-2 overflow-hidden"
                        >
                            <Button
                                onClick={() => setSearchOpen(true)}
                                icon={Search}
                                title="Search"
                                active={isSearchOpen}
                            />

                            <div className="w-6 h-px bg-white/5 my-1" />

                            <Button
                                onClick={() => setShowThemeMenu(!showThemeMenu)}
                                icon={Palette}
                                title="Appearance"
                                active={showThemeMenu}
                            />

                            <Button
                                onClick={handleAddSun}
                                icon={Plus}
                                title="Add Sun"
                                highlight
                            />

                            <Button onClick={handleClear} icon={Trash2} title="Clear" />

                            <div className="w-6 h-px bg-white/5 my-1" />

                            <Button
                                onClick={() => setScaleMode(scaleMode === 'real' ? 'compact' : 'real')}
                                icon={Layout}
                                active={scaleMode === 'real'}
                                title="Layout Mode"
                            />
                        </motion.div>
                    )}

                    <Button
                        onClick={() => useStore.getState().setSettingsOpen(true)}
                        icon={Settings}
                        title="Settings"
                        active={isSettingsOpen}
                    />
                </motion.div>
            </motion.div>
        </>
    );
};

// Updated Button Component
const Button = ({ onClick, icon: Icon, title, active, highlight }: any) => (
    <button
        onClick={onClick}
        title={title}
        className={clsx(
            "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 group",
            active
                ? "bg-white/15 text-white shadow-[inset_0_1px_rgba(255,255,255,0.2)]"
                : "text-white/50 hover:text-white hover:bg-white/10",
            highlight && !active && "text-white bg-indigo-500/80 hover:bg-indigo-500 hover:shadow-[0_0_24px_rgba(99,102,241,0.4)]"
        )}
    >
        <Icon size={18} strokeWidth={highlight ? 2.5 : 2} className="group-hover:scale-105 transition-transform" />
        {active && (
            <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        )}
    </button>
);

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
                                className="absolute left-full ml-4 top-0 p-5 rounded-[28px] bg-[#0A0B10]/80 border border-white/10 w-72 backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.8)] origin-left"
                            >
                                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4 text-center">Appearance Control</h3>

                                {/* Global Theme */}
                                <div className="mb-4 pb-4 border-b border-white/10">
                                    <label className="text-[10px] text-white/40 mb-2 block text-center">Global Theme</label>
                                    <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                                        {['default', 'cyberpunk', 'zen'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => useStore.getState().setTheme(t as any)}
                                                className={clsx(
                                                    "flex-1 py-1.5 text-[10px] uppercase tracking-wide font-medium rounded-md transition-all",
                                                    useStore.getState().theme === t ? "bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]" : "text-white/40 hover:text-white"
                                                )}
                                            >
                                                {t.charAt(0).toUpperCase() + t.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedNote ? (
                                    <div className="space-y-4">
                                        {/* Object Controls */}
                                        <div>
                                            <div className="flex bg-white/5 rounded-lg p-1">
                                                {['sans', 'serif', 'mono'].map(fam => (
                                                    <button
                                                        key={fam}
                                                        onClick={() => updateNote(selectedNote.id, { fontFamily: fam as any })}
                                                        className={clsx(
                                                            "flex-1 py-1.5 text-[10px] uppercase tracking-wide font-medium rounded-md transition-all",
                                                            selectedNote.fontFamily === fam ? "bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]" : "text-white/40 hover:text-white"
                                                        )}
                                                    >
                                                        {fam}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] text-white/40 mb-2 block text-center">Size</label>
                                            <input
                                                type="range"
                                                min="12"
                                                max="64"
                                                value={selectedNote.fontSize || 16}
                                                onChange={(e) => updateNote(selectedNote.id, { fontSize: parseInt(e.target.value) })}
                                                className="w-full accent-indigo-500 h-1 bg-white/10 rounded-full appearance-none"
                                            />
                                        </div>

                                        <div className="flex justify-center gap-2">
                                            {[
                                                { name: 'White', code: '#ffffff', bg: 'bg-white' },
                                                { name: 'Red', code: '#fca5a5', bg: 'bg-red-300' },
                                                { name: 'Amber', code: '#fcd34d', bg: 'bg-amber-300' },
                                                { name: 'Blue', code: '#93c5fd', bg: 'bg-blue-300' },
                                                { name: 'Indigo', code: '#a5b4fc', bg: 'bg-indigo-300' }
                                            ].map(c => (
                                                <button
                                                    key={c.name}
                                                    onClick={() => updateNote(selectedNote.id, { textColor: c.code })}
                                                    className={clsx(
                                                        "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                                                        c.bg,
                                                        selectedNote.textColor === c.code ? "border-indigo-400 scale-110 shadow-[0_0_12px_rgba(129,140,248,0.5)]" : "border-transparent opacity-60 hover:opacity-100"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 text-center py-2 italic font-serif">Select an object to customize.</p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Main Toolbar Pill */}
                <motion.div
                    layout
                    className={clsx(
                        "ui-interactive-area flex flex-col items-center gap-1 px-2 py-2 rounded-full bg-[#050505]/60 backdrop-blur-2xl border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.5)] transition-all hover:border-white/20 hover:bg-[#050505]/80 hover:shadow-[0_16px_48px_rgba(0,0,0,0.6)]",
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

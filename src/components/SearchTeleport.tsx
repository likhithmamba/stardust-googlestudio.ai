import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { NOTE_STYLES, NoteType } from '../constants';

// Relative time formatter
const relativeTime = (ts?: number): string => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString('en', { month: 'short', day: 'numeric' });
};

// Strip HTML/Lexical markup for plain text search
const stripMarkup = (s?: string): string => {
    if (!s) return '';
    try { return JSON.parse(s).root?.children?.map((b: any) => b.children?.map((n: any) => n.text || '').join('')).join(' ') || s; }
    catch { return s.replace(/<[^>]*>/g, '') }
};

export const SearchTeleport: React.FC = () => {
    const isSearchOpen = useStore((state) => state.isSearchOpen);
    const setSearchOpen = useStore((state) => state.setSearchOpen);
    const notes = useStore((state) => state.notes);
    const viewport = useStore((state) => state.viewport);
    const setViewport = useStore((state) => state.setViewport);
    const setSelectedId = useStore((state) => state.setSelectedId);

    const [query, setQuery] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setActiveIdx(0);
        }
    }, [isSearchOpen]);

    if (!isSearchOpen) return null;

    // Recent notes (no query)
    const recentNotes = [...notes]
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 5);

    // Ranked fuzzy search
    const scored = query.trim() === ''
        ? recentNotes.map(n => ({ note: n, score: 1 }))
        : notes.map(n => {
            const q = query.toLowerCase();
            const titleMatch = (n.title || '').toLowerCase().includes(q) ? 3 : 0;
            const tagMatch = (n.tags || []).some(t => t.toLowerCase().includes(q)) ? 2 : 0;
            const typeMatch = n.type.toLowerCase().includes(q) ? 1 : 0;
            const contentMatch = stripMarkup(n.content).toLowerCase().includes(q) ? 1 : 0;
            const score = titleMatch + tagMatch + typeMatch + contentMatch;
            return { note: n, score };
        }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

    const handleTeleport = (note: typeof notes[0]) => {
        const zoom = Math.max(0.7, viewport.zoom);
        const noteSize = 80; // approximate
        const targetX = -note.x * zoom + window.innerWidth / 2 - (noteSize * zoom) / 2;
        const targetY = -note.y * zoom + window.innerHeight / 2 - (noteSize * zoom) / 2;
        // Animate viewport smoothly
        setViewport({ x: targetX, y: targetY, zoom });
        setSelectedId(note.id);
        setSearchOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { setSearchOpen(false); return; }
        if (e.key === 'ArrowDown') { setActiveIdx(i => Math.min(i + 1, scored.length - 1)); e.preventDefault(); }
        if (e.key === 'ArrowUp') { setActiveIdx(i => Math.max(i - 1, 0)); e.preventDefault(); }
        if (e.key === 'Enter' && scored[activeIdx]) { handleTeleport(scored[activeIdx].note); }
    };

    const getTypeColor = (type: string): string => {
        const colors: Record<string, string> = {
            [NoteType.Sun]: '#f59e0b', [NoteType.Earth]: '#3b82f6', [NoteType.Mars]: '#ef4444',
            [NoteType.Jupiter]: '#d97706', [NoteType.Saturn]: '#eab308', [NoteType.Moon]: '#94a3b8',
            [NoteType.Nebula]: '#a855f7', [NoteType.Asteroid]: '#6b7280', [NoteType.Galaxy]: '#6366f1',
        };
        return colors[type] || '#6366f1';
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-28">
            <div className="absolute inset-0" onClick={() => setSearchOpen(false)} />

            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.97 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative w-[600px] max-w-[90vw] bg-[#0d0d20] border border-[#1919e6]/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
                style={{ boxShadow: '0 0 60px rgba(25,25,230,0.1)' }}
            >
                {/* Input */}
                <div className="flex items-center gap-3 p-4 border-b border-white/5">
                    <span className="material-symbols-outlined text-[#9393c8]/40 text-xl">search</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search your universe..."
                        className="flex-1 bg-transparent border-none outline-none text-white text-base placeholder-[#9393c8]/30"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
                        onKeyDown={handleKeyDown}
                    />
                    <kbd className="text-xs text-[#9393c8]/30 font-mono px-1.5 py-0.5 border border-white/5 rounded">ESC</kbd>
                </div>

                {/* Section label */}
                {query.trim() === '' && (
                    <div className="px-4 pt-3 pb-1">
                        <span className="text-[9px] uppercase tracking-[0.3em] text-[#9393c8]/30">Recent</span>
                    </div>
                )}

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-2">
                    {scored.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-[#9393c8]/30 gap-2">
                            <span className="text-2xl">✦</span>
                            <span className="text-sm tracking-widest uppercase text-xs">No stars found in this sector</span>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {scored.map(({ note }, idx) => (
                                <button
                                    key={note.id}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${idx === activeIdx ? 'bg-white/5' : 'hover:bg-white/3'}`}
                                    onClick={() => handleTeleport(note)}
                                    onMouseEnter={() => setActiveIdx(idx)}
                                >
                                    {/* Color dot */}
                                    <div
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ background: note.color || getTypeColor(note.type), boxShadow: `0 0 6px ${note.color || getTypeColor(note.type)}` }}
                                    />
                                    {/* Title */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white/80 text-sm truncate">{note.title || 'Untitled'}</div>
                                    </div>
                                    {/* Type */}
                                    <span className="text-[9px] uppercase tracking-widest text-[#9393c8]/40 flex-shrink-0">{note.type}</span>
                                    {/* Time */}
                                    <span className="text-[9px] text-[#9393c8]/30 flex-shrink-0 w-12 text-right">{relativeTime(note.updatedAt)}</span>
                                    {/* Teleport icon */}
                                    <span className="material-symbols-outlined text-[14px] text-[#1919e6]/50 group-hover:text-[#1919e6] transition-colors">my_location</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 text-[9px] text-[#9393c8]/20 text-center border-t border-white/5 flex items-center justify-center gap-4">
                    <span>↑↓ Navigate</span>
                    <span>↵ Teleport</span>
                    <span>ESC Close</span>
                </div>
            </motion.div>
        </div>
    );
};

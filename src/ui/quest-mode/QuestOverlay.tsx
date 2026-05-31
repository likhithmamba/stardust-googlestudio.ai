import React from 'react';
import { useStore } from '../../store/useStore';
import { useSettingsStore } from '../../ui/settings/settingsStore';

import { motion, AnimatePresence } from 'framer-motion';

export const QuestOverlay: React.FC = () => {
    const showQuest = useSettingsStore((state) => state.ultra?.questMode);
    const notes = useStore((state) => state.notes);
    const updateNote = useStore((state) => state.updateNote);
    const setViewport = useStore((state) => state.setViewport);

    if (!showQuest) return null;

    const quests = notes.filter(n => n.questType);

    // LOGIC FIX: Hide completely if no missions
    if (quests.length === 0) return null;

    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const mainQuests = quests.filter(n => n.questType === 'main');
    const sideQuests = quests.filter(n => n.questType === 'side');

    const handleQuestClick = (noteId: string) => {
        const note = notes.find(n => n.id === noteId);
        if (note) setViewport({ x: -note.x + window.innerWidth / 2, y: -note.y + window.innerHeight / 2, zoom: 1 });
    };

    const toggleComplete = (noteId: string, current: boolean) => updateNote(noteId, { isCompleted: !current });

    return (
        <AnimatePresence>
            {isCollapsed ? (
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => setIsCollapsed(false)}
                    className="fixed top-24 left-4 bg-slate-900/50 border border-amber-500/30 p-2 rounded-lg backdrop-blur-md hover:bg-slate-800 transition-colors z-40 group shadow-lg"
                    title="Open Cosmic Log"
                >
                    <div className="w-6 h-6 rounded-full border-2 border-amber-500/50 flex items-center justify-center group-hover:border-amber-400">
                        <span className="text-xs text-amber-500 font-bold group-hover:text-amber-400">{quests.filter(q => !q.isCompleted).length}</span>
                    </div>
                </motion.button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, x: -300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed top-0 left-0 h-full w-80 bg-slate-950/80 border-r border-amber-500/10 backdrop-blur-xl shadow-2xl z-40 text-amber-50 font-serif pt-24 px-6"
                >
                    <div className="flex justify-between items-center mb-8 border-b border-amber-500/20 pb-4">
                        <h2 className="text-2xl font-bold tracking-[0.2em] text-amber-400 uppercase drop-shadow-md">Cosmic Log</h2>
                        <button onClick={() => setIsCollapsed(true)} className="text-amber-500/50 hover:text-amber-300 transition-colors p-2 hover:bg-amber-500/10 rounded-full">
                            <span className="sr-only">Collapse</span>
                            ←
                        </button>
                    </div>

                    <div className="space-y-8 overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
                        {mainQuests.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-amber-200/40 uppercase mb-4 tracking-wider">Primary Objectives</h3>
                                <ul className="space-y-3">
                                    {mainQuests.map(q => (
                                        <li key={q.id} className="flex items-start gap-3 group p-2 rounded hover:bg-amber-500/5 transition-colors">
                                            <button
                                                onClick={() => toggleComplete(q.id, !!q.isCompleted)}
                                                className={`mt-1 w-5 h-5 border border-amber-500/50 rounded flex items-center justify-center transition-all ${q.isCompleted ? 'bg-amber-500 border-amber-500' : 'hover:border-amber-400'}`}
                                            >
                                                {q.isCompleted && <span className="text-black text-xs">✓</span>}
                                            </button>
                                            <span
                                                className={`flex-1 cursor-pointer hover:text-amber-300 transition-colors leading-tight ${q.isCompleted ? 'line-through opacity-40' : 'opacity-90'}`}
                                                onClick={() => handleQuestClick(q.id)}
                                            >
                                                {q.title || 'Unknown Quest'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {sideQuests.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-slate-400/40 uppercase mb-4 tracking-wider">Secondary Objectives</h3>
                                <ul className="space-y-2">
                                    {sideQuests.map(q => (
                                        <li key={q.id} className="flex items-center gap-3 group p-2 rounded hover:bg-slate-500/5 transition-colors">
                                            <button
                                                onClick={() => toggleComplete(q.id, !!q.isCompleted)}
                                                className={`w-4 h-4 border border-slate-500/50 rounded-full flex items-center justify-center transition-all ${q.isCompleted ? 'bg-slate-500 border-slate-500' : 'hover:border-slate-400'}`}
                                            >
                                                {q.isCompleted && <span className="text-black text-[10px]">✓</span>}
                                            </button>
                                            <span
                                                className={`flex-1 cursor-pointer hover:text-slate-300 transition-colors text-sm ${q.isCompleted ? 'line-through opacity-40' : 'opacity-80'}`}
                                                onClick={() => handleQuestClick(q.id)}
                                            >
                                                {q.title || 'Unknown Task'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

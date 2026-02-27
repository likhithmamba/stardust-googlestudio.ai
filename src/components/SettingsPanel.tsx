import React from 'react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useSettingsStore } from '../ui/settings/settingsStore';

export const SettingsPanel: React.FC = () => {
    const isSettingsOpen = useStore((state: any) => state.isSettingsOpen);
    const setSettingsOpen = useStore((state: any) => state.setSettingsOpen);

    const showHierarchy = useSettingsStore((state: any) => state.showHierarchy);
    const showLinks = useSettingsStore((state: any) => state.showLinks);
    const setToggle = useSettingsStore((state: any) => state.setToggle);
    // Physics Engine Controls
    const currentViewMode = useSettingsStore((state) => state.viewMode);
    const setViewMode = useSettingsStore((state) => state.setViewMode);

    const setShowHierarchy = (val: boolean) => {
        setToggle('showHierarchy', val);
    };
    const setShowLinks = (val: boolean) => {
        setToggle('showLinks', val);
    };

    const showMinimap = useStore((state: any) => state.showMinimap);
    const setShowMinimap = useStore((state: any) => state.setShowMinimap);
    const showConnections = useStore((state: any) => state.showConnections);
    const setShowConnections = useStore((state: any) => state.setShowConnections);


    if (!isSettingsOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 pointer-events-auto">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" onClick={() => setSettingsOpen(false)} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: 30 }}
                className="relative w-full max-w-4xl h-[70vh] bg-[#0A0B14]/80 border border-white/10 rounded-[32px] shadow-[0_32px_128px_rgba(0,0,0,0.9)] backdrop-blur-3xl overflow-hidden flex"
            >
                {/* Lateral Navigation */}
                <div className="w-64 border-r border-white/5 flex flex-col p-8 gap-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                            <span className="material-symbols-outlined text-white text-xl">settings</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black tracking-[0.3em] text-white uppercase">Terminal</span>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">v2.5.0</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <SideTab
                            label="Universe"
                            icon="public"
                            isActive={true}
                            onClick={() => { }}
                        />
                    </div>

                    <div className="mt-auto pt-8 border-t border-white/5">
                        <button
                            onClick={() => setSettingsOpen(false)}
                            className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                            Return to Canvas
                        </button>
                    </div>
                </div>

                {/* Main View Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
                    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                        <section>
                            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400 mb-6">Structural Configuration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ViewCard
                                    id="free"
                                    label="Free Space"
                                    description="Infinite canvas with drifting physics."
                                    active={currentViewMode === 'free'}
                                    onClick={() => setViewMode('free')}
                                />
                                <ViewCard
                                    id="prism"
                                    label="Prism"
                                    description="Categorized columns by tags."
                                    active={currentViewMode === 'prism'}
                                    onClick={() => setViewMode('prism')}
                                />
                                <ViewCard
                                    id="stream"
                                    label="Stream"
                                    description="Temporal sequence of creation."
                                    active={currentViewMode === 'timeline'}
                                    onClick={() => setViewMode('timeline')}
                                />
                                <ViewCard
                                    id="orbital"
                                    label="Orbital"
                                    description="Radial gravity by importance."
                                    active={currentViewMode === 'orbital'}
                                    onClick={() => setViewMode('orbital')}
                                />
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400 mb-6">Overlay Systems</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Toggle
                                    label="Minimap"
                                    checked={showMinimap}
                                    onChange={setShowMinimap}
                                />
                                <Toggle
                                    label="Wire Connections"
                                    checked={showConnections}
                                    onChange={setShowConnections}
                                />
                                <Toggle
                                    label="Smart Links"
                                    checked={showLinks}
                                    onChange={setShowLinks}
                                />
                                <Toggle
                                    label="Hierarchy Lines"
                                    checked={showHierarchy}
                                    onChange={setShowHierarchy}
                                />
                            </div>
                        </section>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// Moved components outside to prevent re-renders breaking focus/clicks
const SideTab = ({ label, icon, isActive, onClick }: { label: string; icon: string; isActive: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={clsx(
            "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group",
            isActive
                ? "bg-indigo-500/15 text-indigo-400 shadow-[0_4px_16px_rgba(99,102,241,0.1)]"
                : "text-white/20 hover:text-white/40 hover:bg-white/5"
        )}
    >
        <span className={clsx(
            "material-symbols-outlined text-[20px] transition-transform",
            isActive ? "scale-110" : "group-hover:scale-110"
        )}>
            {icon}
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
);

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
    <button
        onClick={() => onChange(!checked)}
        className={clsx(
            "flex items-center justify-between p-5 rounded-3xl border transition-all text-left",
            checked
                ? "bg-indigo-500/10 border-indigo-500/30 text-white"
                : "bg-white/3 border-white/5 text-white/30 hover:bg-white/5"
        )}
    >
        <span className="text-[11px] font-black uppercase tracking-[0.15em]">{label}</span>
        <div className={clsx(
            "w-8 h-4 rounded-full relative transition-all duration-500",
            checked ? "bg-indigo-500" : "bg-white/10"
        )}>
            <div className={clsx(
                "absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-500",
                checked ? "translate-x-4" : "translate-x-0"
            )} />
        </div>
    </button>
);

const ViewCard = ({ label, description, active, onClick }: { id: string; label: string; description: string; active: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={clsx(
            "text-left flex flex-col p-6 rounded-[28px] border transition-all active:scale-[0.98]",
            active
                ? "bg-indigo-500/20 border-indigo-500 text-white shadow-[0_0_32px_rgba(99,102,241,0.2)]"
                : "bg-white/3 border-white/5 text-white/30 hover:bg-white/5 hover:border-white/10"
        )}
    >
        <div className="flex items-center justify-between w-full mb-2">
            <span className={clsx(
                "text-[11px] font-black uppercase tracking-[0.1em]",
                active ? "text-white" : "text-white/40"
            )}>
                {label}
            </span>
            {active && <span className="material-symbols-outlined text-indigo-400 text-sm">radio_button_checked</span>}
        </div>
        <span className="text-[10px] font-bold opacity-60 leading-relaxed">
            {description}
        </span>
    </button>
);

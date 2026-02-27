import { useSettingsStore } from '../../ui/settings/settingsStore';

export const OrbitalChrome: React.FC = () => {
    const designSystem = useSettingsStore((state) => state.designSystem);
    const isSolar = designSystem === 'solar';

    // Solar Theme
    if (isSolar) {
        return (
            <div className="absolute inset-0 pointer-events-none font-inter text-zinc-800">
                {/* Header - Poetic/Status only */}
                <header className="fixed top-24 left-1/2 -translate-x-1/2 p-8 flex flex-col items-center z-10 opacity-30">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">Orbital Sync: Active</span>
                    </div>
                </header>

                {/* Gravity Well Sidebar (Keep as specialized tool) */}
                <aside className="fixed left-8 top-1/2 -translate-y-1/2 bg-white/40 backdrop-blur-md border border-zinc-200/40 p-6 rounded-[2.5rem] w-24 h-[440px] flex flex-col items-center justify-between z-40 shadow-sm pointer-events-auto">
                    <span className="font-mono text-[10px] text-zinc-400 [writing-mode:vertical-lr] rotate-180 uppercase tracking-[0.3em]">Gravity Well</span>
                    <div className="flex flex-col items-center gap-4 flex-grow py-8 h-full w-full">
                        <span className="font-mono text-[8px] text-zinc-400 uppercase text-center leading-tight">Max<br />Mass</span>
                        <div className="w-1.5 h-60 bg-[#f1f1f4] rounded-full relative">
                            <div className="absolute bottom-0 w-full bg-indigo-500/30 rounded-full" style={{ height: '40%' }}></div>
                            <div className="absolute bottom-[40%] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full translate-y-1/2 cursor-pointer hover:scale-125 transition-transform shadow-sm"></div>
                        </div>
                        <span className="font-mono text-[8px] text-zinc-400 uppercase text-center leading-tight">Zero<br />G</span>
                    </div>
                </aside>

                {/* Singularity Button (Specialized) */}
                <div className="fixed bottom-24 right-10 group z-40 pointer-events-auto">
                    <button className="relative w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.1)] transition-all duration-500 hover:scale-110 hover:shadow-[0_0_30px_rgba(0,0,0,0.4)]">
                        <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]"></div>
                    </button>
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 font-mono text-[9px] text-zinc-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Singularity Pulse</span>
                </div>
            </div>
        );
    }

    // Zero Point Theme
    return (
        <div className="absolute inset-0 pointer-events-none font-sans text-slate-200 selection:bg-[#6366f1]/30">
            {/* Side Stats */}
            <div className="fixed left-8 top-1/2 -translate-y-1/2 flex flex-col gap-12 opacity-40 pointer-events-none">
                <div className="flex flex-col gap-2">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-indigo-300">Entropy</span>
                    <div className="h-32 w-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-1/3 w-full bg-indigo-500 shadow-[0_0_15px_#6366f1]"></div>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-indigo-300">Pull</span>
                    <div className="h-32 w-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-2/3 w-full bg-indigo-500 shadow-[0_0_15px_#6366f1]"></div>
                    </div>
                </div>
            </div>

            <div className="fixed right-8 bottom-32 text-right opacity-30 pointer-events-none">
                <p className="text-[10px] font-light tracking-widest uppercase text-indigo-200">Sector: Event Horizon</p>
                <p className="font-display italic text-sm text-indigo-100">Priority flows toward the center.</p>
            </div>
        </div>
    );
};

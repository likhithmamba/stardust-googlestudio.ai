import React from 'react';

export const OrbitalMode: React.FC = () => {
    return (
        <div className="absolute inset-0 w-full h-full bg-[#020205] overflow-hidden font-sans pointer-events-none z-0 text-slate-200 selection:bg-[#6366f1]/30">
            {/* Ambient Nebula Background */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_#0a0a1a_0%,_#020205_100%)]">
                <div
                    className="absolute inset-0 opacity-[0.25]"
                    style={{
                        backgroundImage: `
                            radial-gradient(1px 1px at 20% 30%, #fff 100%, transparent),
                            radial-gradient(1px 1px at 70% 10%, #fff 100%, transparent),
                            radial-gradient(1.5px 1.5px at 40% 60%, #fff 100%, transparent),
                            radial-gradient(1px 1px at 80% 80%, #fff 100%, transparent),
                            radial-gradient(1px 1px at 10% 90%, #fff 100%, transparent)
                        `,
                        backgroundSize: '300px 300px'
                    }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(99,102,241,0.06)_0%,transparent_70%)] blur-[60px] rounded-full pointer-events-none" />
            </div>

            {/* Side Stats HUD overlay */}
            <div className="fixed left-8 top-1/2 -translate-y-1/2 flex flex-col gap-12 opacity-30 z-10">
                <div className="flex flex-col gap-2">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-indigo-300">Entropy</span>
                    <div className="h-32 w-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-1/3 w-full bg-indigo-500/80"></div>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-indigo-300">Pull</span>
                    <div className="h-32 w-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-2/3 w-full bg-indigo-500/80"></div>
                    </div>
                </div>
            </div>

            {/* Bottom HUD Text */}
            <div className="fixed right-8 bottom-8 text-right opacity-30 z-10">
                <p className="text-[10px] font-light tracking-widest uppercase">Sector: Event Horizon</p>
                <p className="font-display italic text-[11px]">Priority flows toward the center.</p>
            </div>
        </div>
    );
};

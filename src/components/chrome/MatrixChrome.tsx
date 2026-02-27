import React from 'react';
import { useSettingsStore } from '../../ui/settings/settingsStore';
import { Sun, CloudLightning, Archive, Calendar } from 'lucide-react';

export const MatrixChrome: React.FC = () => {
    const designSystem = useSettingsStore((state) => state.designSystem);
    const isSolar = designSystem === 'solar';

    // Solar Theme
    if (isSolar) {
        return (
            <div className="absolute inset-0 pointer-events-none font-display text-white selection:bg-[#f27f0d]/30">
                {/* Quadrant Headers (Visual Only - Content is Canvas) */}
                <div className="absolute inset-0 pt-20 pb-10 px-6 z-0 grid grid-cols-2 grid-rows-2 gap-8 pointer-events-none opacity-20">
                    {/* Q1: Solar Core */}
                    <div className="p-8 flex flex-col gap-6 border-r border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <Sun className="text-[#f27f0d]" size={20} />
                            <h2 className="text-lg font-bold text-white/90">Solar Core</h2>
                        </div>
                    </div>

                    {/* Q2: Nebula Flow */}
                    <div className="p-8 flex flex-col gap-6 items-end text-right border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-white/90">Nebula Flow</h2>
                            <CloudLightning className="text-purple-400" size={20} />
                        </div>
                    </div>

                    {/* Q3: Deep Void */}
                    <div className="p-8 flex flex-col justify-end gap-6 border-r border-white/10">
                        <div className="flex items-center gap-3 mt-4">
                            <Archive className="text-white/40" size={20} />
                            <h2 className="text-lg font-bold text-white/60">Deep Void</h2>
                        </div>
                    </div>

                    {/* Q4: Stellar Events */}
                    <div className="p-8 flex flex-col justify-end gap-6 items-end text-right">
                        <div className="flex items-center gap-3 mt-4">
                            <h2 className="text-lg font-bold text-white/90">Stellar Events</h2>
                            <Calendar className="text-[#f27f0d]" size={20} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Zero Point Theme
    return (
        <div className="absolute inset-0 pointer-events-none font-sans-alt text-white/90">
            {/* Starlight Grid Background Elements */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 -z-10 opacity-30">
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Labels */}
            <div className="absolute top-24 left-8 text-[10px] tracking-[0.3em] uppercase opacity-20 font-bold pointer-events-none text-blue-200">Inner Belt / Alpha</div>
            <div className="absolute top-24 right-8 text-[10px] tracking-[0.3em] uppercase opacity-20 font-bold text-right pointer-events-none text-blue-200">Outer Belt / Beta</div>
            <div className="absolute bottom-32 left-8 text-[10px] tracking-[0.3em] uppercase opacity-20 font-bold pointer-events-none text-blue-200">Kuiper Fringe / Gamma</div>
            <div className="absolute bottom-32 right-32 text-[10px] tracking-[0.3em] uppercase opacity-20 font-bold text-right pointer-events-none text-blue-200">Oort Terminal / Delta</div>

            {/* Bottom HUD (Simplified) */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40 opacity-40">
                <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 px-4 py-2 rounded-lg text-[9px] tracking-widest uppercase">
                    Sector: <span className="text-[#3b82f6]">CERES-7</span>
                </div>
                <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 px-4 py-2 rounded-lg text-[9px] tracking-widest uppercase">
                    Gravity: <span className="text-[#3b82f6]">0.27G</span>
                </div>
            </div>
        </div>
    );
};

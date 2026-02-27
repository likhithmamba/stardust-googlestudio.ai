import React from 'react';
import { useSettingsStore } from '../../ui/settings/settingsStore';

export const PrismChrome: React.FC = () => {
    const designSystem = useSettingsStore((state) => state.designSystem);
    const isSolar = designSystem === 'solar';

    // Solar Theme
    if (isSolar) {
        return (
            <div className="absolute inset-0 pointer-events-none font-inter text-zinc-900 flex flex-col">
                {/* Visual Metadata Only */}
                <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center opacity-30">
                    <h1 className="font-display text-2xl font-light tracking-tight text-zinc-800 uppercase">Reflections</h1>
                    <p className="text-[10px] tracking-[0.4em] text-zinc-400 mt-2 uppercase">Prism Analysis Mode</p>
                </div>

                {/* Background Grid Lines (Visual Flair) */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10 z-0">
                    <div className="absolute top-[20%] left-[10%] w-px h-[60%] bg-gradient-to-b from-transparent via-zinc-400 to-transparent"></div>
                    <div className="absolute top-[20%] left-[36.6%] w-px h-[60%] bg-gradient-to-b from-transparent via-zinc-400 to-transparent"></div>
                    <div className="absolute top-[20%] left-[63.3%] w-px h-[60%] bg-gradient-to-b from-transparent via-zinc-400 to-transparent"></div>
                    <div className="absolute top-[20%] left-[90%] w-px h-[60%] bg-gradient-to-b from-transparent via-zinc-400 to-transparent"></div>
                </div>
            </div>
        );
    }

    // Zero Point Theme
    return (
        <div className="absolute inset-0 pointer-events-none font-sans-alt text-white/90 flex flex-col">
            {/* Deep Space Background / Environmental Visuals */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                        backgroundSize: '120px 120px'
                    }}
                />
            </div>

            <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center opacity-20">
                <h1 className="text-xs font-bold tracking-[0.4em] uppercase text-white/50">Spectral Array // Prism</h1>
            </div>
        </div>
    );
};

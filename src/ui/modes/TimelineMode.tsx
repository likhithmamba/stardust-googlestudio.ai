import React from 'react';
import { useStore } from '../../store/useStore';
import { calculateProjectVelocity } from '../../engine/cognitive/TimelineEngine';

export const TimelineMode: React.FC = () => {
    const notes = useStore((state) => state.notes);
    const velocity = calculateProjectVelocity(notes as any);

    const trendColors = {
        accelerating: 'text-emerald-400',
        stable: 'text-purple-400',
        decelerating: 'text-amber-400'
    };

    const trendLabels = {
        accelerating: 'ACCELERATING 🚀',
        stable: 'STABLE ⚖️',
        decelerating: 'DECELERATING ⏳'
    };

    return (
        <div className="absolute inset-0 w-full h-full bg-[#0a0a0c] overflow-hidden font-sans pointer-events-none z-0 text-white selection:bg-[#eebd2b]/30">
            {/* Background star grids */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.25] z-0 bg-[radial-gradient(circle_at_center,_#fff_1px,_transparent_1px)] bg-[length:200px_200px]" />
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_rgba(238,189,43,0.03),transparent_70%)] z-0" />

            {/* Project Velocity Stats HUD overlay */}
            <div className="fixed left-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 opacity-40 z-10 text-[10px] tracking-widest uppercase">
                <div className="flex flex-col gap-1">
                    <span className="text-slate-400">Creation Rate</span>
                    <span className="text-white font-mono font-bold text-sm">
                        {velocity.creationRate.toFixed(1)} <span className="text-[9px] font-normal text-white/50">/ day</span>
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-purple-400">Completion Rate</span>
                    <span className="text-white font-mono font-bold text-sm">
                        {velocity.completionRate.toFixed(1)} <span className="text-[9px] font-normal text-white/50">/ day</span>
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-slate-400">Velocity Trend</span>
                    <span className={`font-mono font-bold text-[11px] ${trendColors[velocity.trend] || 'text-purple-400'}`}>
                        {trendLabels[velocity.trend] || 'STABLE'}
                    </span>
                </div>
            </div>

            {/* Bottom HUD info */}
            <div className="fixed right-8 bottom-8 text-right opacity-30 z-10">
                <p className="text-[10px] font-light tracking-widest uppercase">Sector: Timeline Horizon</p>
                <p className="font-display italic text-[11px]">Horizontal axis organizes notes chronologically by due date.</p>
            </div>
        </div>
    );
};

import React from 'react';
import { useStore, noteVisibleInMode } from '../../store/useStore';
import { useSettingsStore } from '../../ui/settings/settingsStore';
import { Sun, CloudLightning, Archive, Calendar } from 'lucide-react';

export const MatrixChrome: React.FC = () => {
    const designSystem = useSettingsStore((state) => state.designSystem);
    const isSolar = designSystem === 'solar';

    const notes = useStore((state) => state.notes);
    const activeConstellation = useStore((state) => state.activeConstellation);
    
    // Filter notes for matrix mode
    const matrixNotes = notes.filter(n => noteVisibleInMode(n, 'matrix', activeConstellation));

    // Quadrant counts
    const doFirstCount = matrixNotes.filter(n => n.urgency === 'urgent' && n.importance === 'important').length;
    const scheduleCount = matrixNotes.filter(n => n.urgency === 'not-urgent' && n.importance === 'important').length;
    const delegateCount = matrixNotes.filter(n => n.urgency === 'urgent' && n.importance === 'not-important').length;
    const eliminateCount = matrixNotes.filter(n => n.urgency === 'not-urgent' && n.importance === 'not-important').length;

    // Solar Theme
    if (isSolar) {
        return (
            <div className="absolute inset-0 pointer-events-none font-display text-white selection:bg-[#f27f0d]/30">
                {/* Quadrant Headers & Zones */}
                <div className="absolute inset-0 pt-24 pb-28 px-8 z-0 grid grid-cols-2 grid-rows-2 gap-8 pointer-events-none">
                    {/* Q1: Do First (Solar Core) */}
                    <div className="p-6 flex flex-col justify-start border border-dashed border-emerald-500/20 rounded-2xl bg-emerald-500/[0.01] transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Sun className="text-emerald-500" size={18} />
                                <h2 className="text-sm font-bold text-emerald-400 tracking-wider uppercase">Solar Core (Do First)</h2>
                            </div>
                            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                {doFirstCount} {doFirstCount === 1 ? 'star' : 'stars'}
                            </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 max-w-xs">Urgent & Important. Highly active stellar centers requiring direct focus.</p>
                    </div>

                    {/* Q2: Schedule / Plan (Nebula Flow) */}
                    <div className="p-6 flex flex-col justify-start border border-dashed border-blue-500/20 rounded-2xl bg-blue-500/[0.01]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CloudLightning className="text-blue-400" size={18} />
                                <h2 className="text-sm font-bold text-blue-400 tracking-wider uppercase">Nebula Flow (Schedule)</h2>
                            </div>
                            <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                                {scheduleCount} {scheduleCount === 1 ? 'star' : 'stars'}
                            </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 max-w-xs">Important, Not Urgent. Long-term gravitational clusters to plan for.</p>
                    </div>

                    {/* Q3: Delegate (Deep Void) */}
                    <div className="p-6 flex flex-col justify-start border border-dashed border-amber-500/20 rounded-2xl bg-amber-500/[0.01]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Archive className="text-amber-500" size={18} />
                                <h2 className="text-sm font-bold text-amber-400 tracking-wider uppercase">Deep Void (Delegate)</h2>
                            </div>
                            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                                {delegateCount} {delegateCount === 1 ? 'star' : 'stars'}
                            </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 max-w-xs">Urgent, Not Important. Outsource or assign to auxiliary orbits.</p>
                    </div>

                    {/* Q4: Eliminate (Stellar Events) */}
                    <div className="p-6 flex flex-col justify-start border border-dashed border-red-500/20 rounded-2xl bg-red-500/[0.01]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="text-red-500" size={18} />
                                <h2 className="text-sm font-bold text-red-400 tracking-wider uppercase">Stellar Events (Eliminate)</h2>
                            </div>
                            <span className="text-[10px] font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                                {eliminateCount} {eliminateCount === 1 ? 'star' : 'stars'}
                            </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 max-w-xs">Not Urgent & Not Important. Stellar debris to prune or drop.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Zero Point Theme
    return (
        <div className="absolute inset-0 pointer-events-none font-sans text-white/90">
            {/* Center Grid Splitter */}
            <div className="absolute inset-0 -z-10 opacity-20">
                <div className="absolute left-1/2 top-24 bottom-28 w-[1px] bg-gradient-to-b from-transparent via-indigo-500/40 to-transparent" />
                <div className="absolute top-1/2 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            </div>

            {/* Matrix Zones Layout */}
            <div className="absolute inset-0 pt-24 pb-28 px-8 z-0 grid grid-cols-2 grid-rows-2 gap-8 pointer-events-none">
                
                {/* Q1: Do First */}
                <div className="p-6 flex flex-col justify-start border border-indigo-500/5 rounded-2xl bg-[#090b16]/10 backdrop-blur-[0.5px]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-emerald-400">Do First</h2>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                            {doFirstCount} Star{doFirstCount === 1 ? '' : 's'}
                        </span>
                    </div>
                    <span className="text-[8px] font-mono text-indigo-300/40 uppercase tracking-widest mt-1">Sector: Alpha-Urgent-Critical</span>
                </div>

                {/* Q2: Schedule / Plan */}
                <div className="p-6 flex flex-col justify-start border border-indigo-500/5 rounded-2xl bg-[#090b16]/10 backdrop-blur-[0.5px]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-blue-400">Schedule</h2>
                        </div>
                        <span className="text-[9px] font-mono text-blue-400 bg-blue-950/40 border border-blue-500/20 px-2 py-0.5 rounded">
                            {scheduleCount} Star{scheduleCount === 1 ? '' : 's'}
                        </span>
                    </div>
                    <span className="text-[8px] font-mono text-indigo-300/40 uppercase tracking-widest mt-1">Sector: Beta-Strategy-Orbit</span>
                </div>

                {/* Q3: Delegate */}
                <div className="p-6 flex flex-col justify-start border border-indigo-500/5 rounded-2xl bg-[#090b16]/10 backdrop-blur-[0.5px]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-amber-400">Delegate</h2>
                        </div>
                        <span className="text-[9px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded">
                            {delegateCount} Star{delegateCount === 1 ? '' : 's'}
                        </span>
                    </div>
                    <span className="text-[8px] font-mono text-indigo-300/40 uppercase tracking-widest mt-1">Sector: Gamma-Auxiliary-Flow</span>
                </div>

                {/* Q4: Eliminate / Drop */}
                <div className="p-6 flex flex-col justify-start border border-indigo-500/5 rounded-2xl bg-[#090b16]/10 backdrop-blur-[0.5px]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-red-400">Eliminate</h2>
                        </div>
                        <span className="text-[9px] font-mono text-red-400 bg-red-950/40 border border-red-500/20 px-2 py-0.5 rounded">
                            {eliminateCount} Star{eliminateCount === 1 ? '' : 's'}
                        </span>
                    </div>
                    <span className="text-[8px] font-mono text-indigo-300/40 uppercase tracking-widest mt-1">Sector: Delta-Stellar-Debris</span>
                </div>
            </div>

            {/* Bottom HUD info */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40 opacity-40">
                <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 px-4 py-2 rounded-lg text-[9px] tracking-widest uppercase font-mono">
                    System: <span className="text-[#3b82f6]">EISENHOWER</span>
                </div>
                <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 px-4 py-2 rounded-lg text-[9px] tracking-widest uppercase font-mono">
                    Total: <span className="text-[#3b82f6]">{matrixNotes.length} Stars</span>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { useStore } from '../../store/useStore';
import { noteVisibleInMode } from '../../store/noteSlice';
import { evaluateNote } from '../../engine/cognitive/MatrixEngine';

export const MatrixMode: React.FC = () => {
    const notes = useStore((state) => state.notes);
    const activeConstellation = useStore((state) => state.activeConstellation);

    // Compute live count per quadrant
    const visibleNotes = notes.filter(n => noteVisibleInMode(n, 'matrix', activeConstellation));
    const counts = {
        do: 0,
        plan: 0,
        delegate: 0,
        eliminate: 0
    };

    visibleNotes.forEach(note => {
        const coord = evaluateNote(note as any);
        if (counts[coord.quadrant] !== undefined) {
            counts[coord.quadrant]++;
        }
    });

    return (
        <div className="absolute inset-0 w-full h-full bg-[#030308] overflow-hidden font-sans pointer-events-none z-0 selection:bg-[#3b82f6]/30">
            {/* Ambient Nebula Background */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 opacity-[0.15]"
                    style={{ background: 'radial-gradient(circle at center, #1e1b4b 0%, #030308 100%)' }}
                />
                <div className="absolute top-[20%] left-[20%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(16,185,129,0.04)_0%,transparent_70%)] blur-[50px] rounded-full pointer-events-none" />
                <div className="absolute top-[20%] right-[20%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(59,130,246,0.04)_0%,transparent_70%)] blur-[50px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[20%] left-[20%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(245,158,11,0.04)_0%,transparent_70%)] blur-[50px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[20%] right-[20%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(239,68,68,0.04)_0%,transparent_70%)] blur-[50px] rounded-full pointer-events-none" />
            </div>

            {/* Grid & Quadrant Outlines */}
            <div className="absolute inset-0 z-10 grid grid-cols-2 grid-rows-2 border border-white/5">
                {/* Vertical Axis */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-white/0 via-white/10 to-white/0 shadow-[0_0_10px_rgba(255,255,255,0.05)]" />
                {/* Horizontal Axis */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0 shadow-[0_0_10px_rgba(255,255,255,0.05)]" />
            </div>

            {/* Dynamic HUD Overlay for Quadrants */}
            <div className="absolute inset-0 z-20 grid grid-cols-2 grid-rows-2 p-12 gap-12">
                {/* Top-Left: DO FIRST */}
                <div className="flex flex-col justify-start items-start p-6 rounded-2xl border border-emerald-500/5 bg-emerald-500/[0.01] backdrop-blur-[1px] transition-all">
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        <span className="text-xs font-semibold tracking-[0.2em] text-emerald-400 uppercase">Do First</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono font-bold">
                            {counts.do}
                        </span>
                    </div>
                    <span className="text-[9px] text-white/30 tracking-wider mt-1 uppercase">Urgent & Important</span>
                </div>

                {/* Top-Right: SCHEDULE */}
                <div className="flex flex-col justify-start items-end p-6 rounded-2xl border border-blue-500/5 bg-blue-500/[0.01] backdrop-blur-[1px] transition-all">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 font-mono font-bold">
                            {counts.plan}
                        </span>
                        <span className="text-xs font-semibold tracking-[0.2em] text-blue-400 uppercase">Schedule</span>
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                    </div>
                    <span className="text-[9px] text-white/30 tracking-wider mt-1 uppercase">Not Urgent & Important</span>
                </div>

                {/* Bottom-Left: DELEGATE */}
                <div className="flex flex-col justify-end items-start p-6 rounded-2xl border border-amber-500/5 bg-amber-500/[0.01] backdrop-blur-[1px] transition-all">
                    <span className="text-[9px] text-white/30 tracking-wider mb-1 uppercase">Urgent & Not Important</span>
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]" />
                        <span className="text-xs font-semibold tracking-[0.2em] text-amber-400 uppercase">Delegate</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono font-bold">
                            {counts.delegate}
                        </span>
                    </div>
                </div>

                {/* Bottom-Right: ELIMINATE */}
                <div className="flex flex-col justify-end items-end p-6 rounded-2xl border border-red-500/5 bg-red-500/[0.01] backdrop-blur-[1px] transition-all">
                    <span className="text-[9px] text-white/30 tracking-wider mb-1 uppercase">Not Urgent & Not Important</span>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 font-mono font-bold">
                            {counts.eliminate}
                        </span>
                        <span className="text-xs font-semibold tracking-[0.2em] text-red-400 uppercase">Eliminate</span>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
                    </div>
                </div>
            </div>

            {/* Bottom HUD - Read Only info */}
            <div className="fixed bottom-6 left-8 flex items-center gap-4 z-40 opacity-50">
                <div className="text-[9px] tracking-widest text-white/40 uppercase">
                    Decision Mode: <span className="text-[#3b82f6] font-mono">Eisenhower Grid</span>
                </div>
            </div>
        </div>
    );
};

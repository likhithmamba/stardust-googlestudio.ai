import React from 'react';
import { useStore } from '../../store/useStore';
import { noteVisibleInMode } from '../../store/noteSlice';

export const PrismMode: React.FC = () => {
    const notes = useStore((state) => state.notes);
    const activeConstellation = useStore((state) => state.activeConstellation);

    // Compute live count per Kanban column
    const visibleNotes = notes.filter(n => noteVisibleInMode(n, 'prism', activeConstellation));
    const counts = {
        todo: 0,
        inProgress: 0,
        review: 0,
        done: 0
    };

    visibleNotes.forEach(note => {
        let status = note.status || 'todo';
        if (status === 'captured' || status === 'archived') {
            status = 'todo';
        }
        if (status === 'todo') counts.todo++;
        else if (status === 'in-progress') counts.inProgress++;
        else if (status === 'review') counts.review++;
        else if (status === 'done') counts.done++;
    });

    return (
        <div className="absolute inset-0 w-full h-full bg-[#030206] overflow-hidden font-sans pointer-events-none z-0 text-slate-200 selection:bg-[#c084fc]/30 flex flex-col">
            {/* Deep Space Ambient Glow */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_#0b0717_0%,_#030206_100%)]">
                <div
                    className="absolute inset-0 opacity-[0.15]"
                    style={{
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
                        backgroundSize: '100px 100px'
                    }}
                />
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(96,165,250,0.03)_0%,transparent_70%)] blur-[40px] rounded-full pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(192,132,252,0.03)_0%,transparent_70%)] blur-[40px] rounded-full pointer-events-none" />
            </div>

            {/* Side Column Stats HUD */}
            <div className="fixed left-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 opacity-40 z-10 text-[10px] tracking-widest uppercase">
                <div className="flex flex-col gap-1">
                    <span className="text-slate-400">To Do</span>
                    <span className="text-white font-mono font-bold text-sm">{counts.todo}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-blue-400">Active</span>
                    <span className="text-white font-mono font-bold text-sm">{counts.inProgress}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-amber-400">Review</span>
                    <span className="text-white font-mono font-bold text-sm">{counts.review}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-emerald-400">Done</span>
                    <span className="text-white font-mono font-bold text-sm">{counts.done}</span>
                </div>
            </div>

            {/* Bottom HUD info */}
            <div className="fixed right-8 bottom-8 text-right opacity-30 z-10">
                <p className="text-[10px] font-light tracking-widest uppercase">Prism Refraction System</p>
                <p className="font-display italic text-[11px]">Columns separate notes by developmental stage.</p>
            </div>
        </div>
    );
};

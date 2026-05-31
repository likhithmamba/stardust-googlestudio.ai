import React from 'react';

const PRISM_COLUMNS = [
    { id: 'focus', label: 'Focus' },
    { id: 'active', label: 'Active' },
    { id: 'horizon', label: 'Horizon' },
    { id: 'deep_space', label: 'Deep Space' }
];

export const PrismOverlay: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none z-10 flex px-24 py-32 gap-6">
            {PRISM_COLUMNS.map((col) => (
                <div key={col.id} className="flex-1 flex flex-col items-center">
                    <div className="mb-4 text-center">
                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-500 dark:text-zinc-400">{col.label}</span>
                        <div className="h-[1px] w-8 bg-zinc-300 dark:bg-zinc-700 mx-auto mt-2"></div>
                    </div>
                    <div className="w-full flex-1 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 gravity-well"></div>
                </div>
            ))}
        </div>
    );
};

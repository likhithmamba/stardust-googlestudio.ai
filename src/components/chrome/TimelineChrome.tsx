import React from 'react';
import { useSettingsStore } from '../../ui/settings/settingsStore';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';

export const TIMELINE_PIXELS_PER_DAY = 180;
export const TIMELINE_LANE_HEIGHT = 150;
export const TIMELINE_LANES = ['Active Project', 'Backlog', 'Review', 'Archive'];

export const TimelineChrome: React.FC = () => {
    const designSystem = useSettingsStore((state) => state.designSystem);
    const viewport = useStore((state) => state.viewport);
    const isSolar = designSystem === 'solar';

    // Calculate dates to render based on viewport.x
    // Origin.x (0) is today.
    const startOffsetDays = Math.floor(-viewport.x / viewport.zoom / TIMELINE_PIXELS_PER_DAY) - 5;
    const endOffsetDays = startOffsetDays + Math.ceil((window.innerWidth / viewport.zoom) / TIMELINE_PIXELS_PER_DAY) + 10;

    const datesToRender = [];
    for (let i = startOffsetDays; i <= endOffsetDays; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        datesToRender.push({ offset: i, date: d });
    }

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden font-sans select-none">
            {/* Background Grid/Lanes */}
            <div
                className="absolute inset-x-0 w-full top-1/2 -translate-y-1/2 flex flex-col"
            >
                {TIMELINE_LANES.map((lane) => (
                    <div
                        key={lane}
                        className="relative border-b"
                        style={{
                            height: `${TIMELINE_LANE_HEIGHT}px`,
                            borderColor: isSolar ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
                        }}
                    >
                        <div className={clsx(
                            "absolute left-4 top-2 text-[10px] font-black uppercase tracking-widest",
                            isSolar ? "text-slate-400" : "text-white/30"
                        )}>
                            {lane}
                        </div>
                    </div>
                ))}
            </div>

            {/* Dynamic Scrolling Date Axis */}
            <div className={clsx(
                "absolute top-0 left-0 right-0 h-20 border-b backdrop-blur-xl z-10 flex items-end overflow-hidden",
                isSolar ? "bg-white/80 border-slate-200 shadow-sm" : "bg-[#050510]/80 border-white/10 shadow-xl"
            )}>
                <div
                    className="absolute bottom-0 w-full h-full"
                    style={{ transform: `translateX(${viewport.x}px) scale(${viewport.zoom})`, transformOrigin: '0 0' }}
                >
                    {datesToRender.map(({ offset, date }) => {
                        const isToday = offset === 0;
                        const xPos = offset * TIMELINE_PIXELS_PER_DAY;
                        const isMonthStart = date.getDate() === 1;

                        return (
                            <div
                                key={offset}
                                className="absolute bottom-0 flex flex-col items-center"
                                style={{ left: `${xPos}px`, transform: 'translateX(-50%)' }}
                            >
                                <div className={clsx(
                                    "text-[9px] font-bold mb-1 uppercase tracking-wider whitespace-nowrap",
                                    isToday ? "text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full"
                                        : (isMonthStart ? (isSolar ? "text-indigo-600" : "text-indigo-400 font-black")
                                            : (isSolar ? "text-slate-400" : "text-white/40"))
                                )}>
                                    {isMonthStart ? date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                                </div>
                                <div className={clsx(
                                    "w-px h-2",
                                    isToday ? "bg-red-500 h-4" : (isMonthStart ? "bg-indigo-500 h-3" : (isSolar ? "bg-slate-300" : "bg-white/20"))
                                )} />
                                {/* Grid Line going down */}
                                <div className={clsx(
                                    "absolute top-full w-px h-[2000px]",
                                    isToday ? "bg-red-500/20" : (isMonthStart ? (isSolar ? "bg-indigo-500/10" : "bg-indigo-500/20") : (isSolar ? "bg-slate-200/50" : "bg-white/5"))
                                )} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Ambient Label */}
            <div className="absolute top-24 right-8 pointer-events-none opacity-20 text-right">
                <h2 className={clsx(
                    "text-xs font-black leading-tight tracking-[0.5em] uppercase",
                    isSolar ? "text-slate-900" : "text-white"
                )}>
                    Timeline Array
                </h2>
                <div className={clsx("text-[9px] uppercase tracking-widest", isSolar ? "text-slate-500" : "text-white/50")}>
                    Chronological Projection
                </div>
            </div>
        </div>
    );
};

import React, { useEffect, useRef } from 'react';
import type { EngineConnection, EngineNote } from '../engine/types/EngineTypes';
import { visualRegistry } from '../engine/render/VisualRegistry';
import { useStore } from '../store/useStore';
import clsx from 'clsx';

interface SmartLinkProps {
    connection: EngineConnection;
    source: EngineNote;
    target: EngineNote;
}

export const SmartLink: React.FC<SmartLinkProps> = React.memo(({ connection, source, target }) => {
    const pathRef = useRef<SVGPathElement>(null);
    const particleRef = useRef<SVGCircleElement>(null);
    const labelRef = useRef<HTMLDivElement>(null);

    const updateConnection = useStore((state) => state.updateConnection);
    const removeConnection = useStore((state) => state.removeConnection);

    useEffect(() => {
        if (pathRef.current) {
            visualRegistry.registerConnection(connection.id, {
                path: pathRef.current,
                particle: particleRef.current || undefined,
                label: labelRef.current || undefined
            });
        }
        return () => {
            visualRegistry.unregisterConnection(connection.id);
        };
    }, [connection.id]);

    const label = connection.label || '';
    const lineColor = (connection as any).color || 'rgba(99,102,241,0.5)';
    const particleColor = (connection as any).color || 'rgba(99,102,241,0.9)';

    // Initial Path Calculation (React only does this once or on ID change)
    // The VisualRegistry will handle high-frequency updates.
    const sx = source.x + (source.w || 0) / 2;
    const sy = source.y + (source.h || 0) / 2;
    const tx = target.x + (target.w || 0) / 2;
    const ty = target.y + (target.h || 0) / 2;
    const dxC = tx - sx;
    const cp1x = sx + dxC * 0.4;
    const cp1y = sy;
    const cp2x = tx - dxC * 0.4;
    const cp2y = ty;
    const curvePath = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;

    // Duration for particle
    const pathLen = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2);
    const dur = Math.max(1.5, pathLen / 200).toFixed(1);

    return (
        <g className="smart-link group cursor-pointer">
            {/* Glow blur layer */}
            <path
                d={curvePath}
                fill="none"
                stroke={lineColor}
                strokeWidth={6}
                className="opacity-40 group-hover:opacity-80 transition-opacity duration-300 blur-[8px]"
            />

            {/* Core bezier path */}
            <path
                ref={pathRef}
                d={curvePath}
                fill="none"
                stroke={lineColor}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray="8 6"
                className="opacity-60 group-hover:opacity-100 transition-opacity duration-300"
            />

            {/* Animated particle */}
            <circle ref={particleRef} r="4" fill={particleColor} style={{ filter: `drop-shadow(0_0_8px_${particleColor})` }}>
                <animateMotion
                    dur={`${dur}s`}
                    repeatCount="indefinite"
                    path={curvePath}
                />
            </circle>

            {/* Midpoint pill label */}
            <foreignObject x="-50000" y="-50000" width="100000" height="100000" className="pointer-events-none">
                <div
                    ref={labelRef}
                    className="absolute flex items-center justify-center p-4"
                >
                    <div className={clsx(
                        'flex items-center gap-1 px-2 py-1 rounded-full text-[9px] uppercase tracking-wide pointer-events-auto',
                        'bg-[#111121]/90 backdrop-blur-xl border border-white/10 shadow-xl',
                        'transition-all duration-300 min-w-[60px]',
                        !label ? 'opacity-0 group-hover:opacity-100' : 'opacity-80 group-hover:opacity-100'
                    )}>
                        <input
                            type="text"
                            defaultValue={label}
                            placeholder="+ label"
                            onBlur={(e) => updateConnection(connection.id, { label: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    updateConnection(connection.id, { label: e.currentTarget.value });
                                    e.currentTarget.blur();
                                }
                            }}
                            className="bg-transparent text-[9px] text-white/70 hover:text-white text-center w-20 outline-none placeholder-white/20 font-medium tracking-wide"
                            onPointerDown={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); removeConnection(connection.id); }}
                            className="w-5 h-5 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                            title="Remove Link"
                        >
                            <span className="material-symbols-outlined text-[12px]">close</span>
                        </button>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
}, (prev, next) => {
    // Memoization check: Don't re-render for position changes!
    // Source/Target positions change every frame, but VisualRegistry handles them.
    return prev.connection.id === next.connection.id &&
        prev.connection.label === next.connection.label;
});

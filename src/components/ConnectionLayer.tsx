import React from 'react';
import { useStore, type Connection, type Note } from '../store/useStore';
import { NOTE_STYLES, NoteType } from '../constants';
import { SmartLink } from './SmartLink';

interface ConnectionLayerProps {
    connections: Connection[];
    notes: Note[];
    tempConnection: { startId: string, endX: number, endY: number } | null;
    zoom: number;
}

const REAL_SIZES: Record<string, number> = {
    [NoteType.Sun]: 320,
    [NoteType.Jupiter]: 160,
    [NoteType.Saturn]: 140,
    [NoteType.Earth]: 64,
    [NoteType.Mars]: 56,
    [NoteType.Asteroid]: 24,
    [NoteType.Nebula]: 600,
    [NoteType.Galaxy]: 500,
};

export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({ connections, notes, tempConnection }) => {
    const scaleMode = useStore((state) => state.scaleMode);
    const showConnections = useStore((state) => state.showConnections);

    if (!showConnections) return null;

    const updateConnection = useStore((state) => state.updateConnection);

    const getNoteSize = (type: NoteType) => {
        if (scaleMode === 'real') {
            return REAL_SIZES[type] || 64;
        }
        return (NOTE_STYLES[type] || NOTE_STYLES[NoteType.Asteroid]).width;
    };

    const getNoteCenter = (note: Note) => {
        const size = getNoteSize(note.type);
        return {
            x: note.x + size / 2,
            y: note.y + size / 2
        };
    };

    const drawCurve = (conn: Connection | null, x1: number, y1: number, x2: number, y2: number, isTemp: boolean = false) => {
        const cp1x = x1 + (x2 - x1) * 0.5;
        const cp1y = y1;
        const cp2x = x2 - (x2 - x1) * 0.5;
        const cp2y = y2;

        const path = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

        // Calculate cubic bezier midpoint (t=0.5)
        // B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
        // t = 0.5
        // Coeffs: 0.125, 0.375, 0.375, 0.125
        const midX = 0.125 * x1 + 0.375 * cp1x + 0.375 * cp2x + 0.125 * x2;
        const midY = 0.125 * y1 + 0.375 * cp1y + 0.375 * cp2y + 0.125 * y2;

        const startNote = conn ? notes.find(n => n.id === (conn as any).from) : (tempConnection ? notes.find(n => n.id === tempConnection.startId) : null);
        const strokeColor = startNote?.color || '#6366f1';

        return (
            <g key={isTemp ? 'temp' : (conn as any)?.id}>
                {/* Glow/Shadow */}
                <path
                    d={path}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isTemp ? 3 : 2}
                    className="blur-[4px]"
                    style={{ opacity: isTemp ? 0.4 : 0.2 }}
                />
                {/* Core Line */}
                <path
                    d={path}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isTemp ? 1.5 : 1}
                    strokeDasharray={isTemp ? "6 3" : "none"}
                    style={{ opacity: isTemp ? 0.7 : 0.4 }}
                />
                {/* Arrowhead (Only for temp or small dot) */}
                {isTemp && (
                    <circle cx={x2} cy={y2} r={3} fill={strokeColor} />
                )}

                {/* Connection Label Bar & Delete */}
                {!isTemp && conn && (
                    <foreignObject x={midX - 70} y={midY - 14} width={140} height={28} className="overflow-visible pointer-events-auto">
                        <div className="flex justify-center items-center gap-1">
                            <input
                                type="text"
                                value={conn.label || ''}
                                placeholder="Link..."
                                onChange={(e) => updateConnection(conn.id, { label: e.target.value })}
                                className="w-20 bg-black/60 border border-white/10 rounded-l-full text-[10px] text-center text-white placeholder-white/30 px-2 py-0.5 outline-none focus:border-purple-500 transition-colors backdrop-blur-sm shadow-lg pointer-events-auto select-none"
                                onPointerDown={(e) => e.stopPropagation()}
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    useStore.getState().removeConnection(conn.id);
                                }}
                                className="bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-200 rounded-r-full p-0.5 px-2 h-full flex items-center justify-center transition-colors backdrop-blur-sm shadow-lg pointer-events-auto"
                                title="Remove Link"
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </foreignObject>
                )}
            </g>
        );
    };

    return (
        <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-0"
        >
            {connections.map(conn => {
                const start = notes.find(n => n.id === conn.from);
                const end = notes.find(n => n.id === conn.to);
                if (!start || !end) return null;
                // Cast to Engine types (assuming compatibility for now or use 'any')
                return (
                    <SmartLink
                        key={conn.id}
                        connection={conn as any}
                        source={start as any}
                        target={end as any}
                    />
                );
            })}

            {tempConnection && (() => {
                const from = notes.find(n => n.id === tempConnection.startId);
                if (!from) return null;
                const start = getNoteCenter(from);
                return drawCurve(null, start.x, start.y, tempConnection.endX, tempConnection.endY, true);
            })()}
        </svg>
    );
};

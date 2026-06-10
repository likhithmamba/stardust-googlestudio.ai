import React, { useMemo } from 'react';
import { ORBITAL_CONFIG, MATRIX_CONFIG, TIMELINE_CONFIG, PRISM_CONFIG } from '../engine/layout/LayoutConstants';
import { detectSemanticClusters } from '../engine/cognitive/OrbitalEngine';
import type { Note } from '../store/useStore';

interface LayoutVisualsProps {
    viewMode: string;
    layoutOrigin: { x: number; y: number };
    minDimension: number;
    notes?: Note[];
}

export const LayoutVisuals: React.FC<LayoutVisualsProps> = ({ viewMode, layoutOrigin, minDimension, notes = [] }) => {

    // 1. Calculate Radii (Match LayoutEngine logic exactly via Shared Config)
    const baseSize = minDimension / 2;
    const { RADII_PCT, MIN_RADII } = ORBITAL_CONFIG;

    const radii = useMemo(() => ({
        critical: Math.max(MIN_RADII.critical, baseSize * RADII_PCT.critical),
        high: Math.max(MIN_RADII.high, baseSize * RADII_PCT.high),
        medium: Math.max(MIN_RADII.medium, baseSize * RADII_PCT.medium),
        low: Math.max(MIN_RADII.low, baseSize * RADII_PCT.low)
    }), [baseSize]);

    // Calculate Semantic Cluster Backdrops for Prism Mode
    const clusters = useMemo(() => {
        if (viewMode !== 'prism' || !notes || notes.length === 0) return [];
        
        try {
            const rawClusters = detectSemanticClusters(notes as any);
            return rawClusters.map(cluster => {
                const clusterNotes = notes.filter(n => cluster.noteIds.includes(n.id));
                if (clusterNotes.length < 2) return null;

                let minX = Infinity;
                let minY = Infinity;
                let maxX = -Infinity;
                let maxY = -Infinity;

                clusterNotes.forEach(n => {
                    const w = 200; // Prism note card width
                    const h = 100; // Average prism note card height
                    if (n.x < minX) minX = n.x;
                    if (n.y < minY) minY = n.y;
                    if (n.x + w > maxX) maxX = n.x + w;
                    if (n.y + h > maxY) maxY = n.y + h;
                });

                const padding = 20;
                const x = minX - padding;
                const y = minY - padding;
                const w = maxX - minX + padding * 2;
                const h = maxY - minY + padding * 2;

                // Hash cluster ID to generate consistent color
                const hash = cluster.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const hue = (hash * 137) % 360; // Golden ratio scatter
                const color = `hsl(${hue}, 65%, 60%)`;

                return {
                    id: cluster.id,
                    x,
                    y,
                    w,
                    h,
                    color,
                    label: cluster.sharedTags.slice(0, 3).join(' + ') || 'Topic Cluster'
                };
            }).filter(Boolean);
        } catch (err) {
            console.error('[LayoutVisuals] Failed to calculate clusters:', err);
            return [];
        }
    }, [viewMode, notes]);

    if (viewMode === 'orbital') {
        return (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
                <defs>
                    <radialGradient id="event-horizon-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#000" stopOpacity="1" />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
                        <stop offset="70%" stopColor="#ea580c" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                    </radialGradient>
                    <ellipse id="accretion-disk" rx="140" ry="25" fill="none" stroke="url(#accretion-glow)" strokeWidth="8" opacity="0.6" />
                    <linearGradient id="accretion-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="20%" stopColor="#fbbf24" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                        <stop offset="80%" stopColor="#fbbf24" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>
                <g style={{ transform: `translate(${layoutOrigin.x}px, ${layoutOrigin.y}px)` }}>
                    {/* Accretion Disk */}
                    <g style={{ transform: 'rotate(-10deg)' }}>
                        <use href="#accretion-disk" />
                    </g>

                    {/* Event Horizon */}
                    <circle r="50" fill="url(#event-horizon-glow)" />
                    <circle r="36" fill="#000" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />

                    {/* Rings - Increased Opacity for Visibility */}
                    <circle r={radii.critical} fill="none" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" strokeDasharray="6 4" />
                    <circle r={radii.high} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1" strokeDasharray="6 4" />
                    <circle r={radii.medium} fill="none" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="1" strokeDasharray="6 4" />
                    <circle r={radii.low} fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" strokeDasharray="6 4" />

                    {/* Labels */}
                    <text y={-radii.critical - 10} textAnchor="middle" fill="rgba(59, 130, 246, 0.8)" fontSize="12" fontFamily="monospace" fontWeight="bold">CRITICAL</text>
                    <text y={-radii.high - 10} textAnchor="middle" fill="rgba(59, 130, 246, 0.6)" fontSize="12" fontFamily="monospace" fontWeight="bold">HIGH</text>
                    <text y={-radii.medium - 10} textAnchor="middle" fill="rgba(59, 130, 246, 0.5)" fontSize="12" fontFamily="monospace" fontWeight="bold">MEDIUM</text>
                    <text y={-radii.low - 10} textAnchor="middle" fill="rgba(59, 130, 246, 0.4)" fontSize="12" fontFamily="monospace" fontWeight="bold">LOW</text>
                </g>
            </svg>
        );
    }

    if (viewMode === 'timeline') {
        const { LANE_HEIGHT } = TIMELINE_CONFIG;
        return (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
                <g style={{ transform: `translate(${layoutOrigin.x}px, ${layoutOrigin.y}px)` }}>
                    {/* Center Line (Time Axis) */}
                    <line x1={-5000} y1={0} x2={5000} y2={0} stroke="rgba(168, 85, 247, 0.8)" strokeWidth="2" />

                    {/* Lane Guides */}
                    <line x1={-5000} y1={-LANE_HEIGHT} x2={5000} y2={-LANE_HEIGHT} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1={-5000} y1={LANE_HEIGHT} x2={5000} y2={LANE_HEIGHT} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Lane Labels */}
                    <text x={-1200} y={-225} textAnchor="start" fill="rgba(168, 85, 247, 0.4)" fontSize="12" fontWeight="bold" letterSpacing="0.2em" fontFamily="monospace">ACTIVE PROJECT</text>
                    <text x={-1200} y={-75} textAnchor="start" fill="rgba(168, 85, 247, 0.4)" fontSize="12" fontWeight="bold" letterSpacing="0.2em" fontFamily="monospace">TO DO</text>
                    <text x={-1200} y={75} textAnchor="start" fill="rgba(168, 85, 247, 0.4)" fontSize="12" fontWeight="bold" letterSpacing="0.2em" fontFamily="monospace">QA REVIEW</text>
                    <text x={-1200} y={225} textAnchor="start" fill="rgba(168, 85, 247, 0.4)" fontSize="12" fontWeight="bold" letterSpacing="0.2em" fontFamily="monospace">DONE</text>
                </g>
            </svg>
        );
    }

    if (viewMode === 'matrix') {
        // Use Constants
        const { OFFSET_FACTOR, FALLBACK_OFFSET_X, FALLBACK_OFFSET_Y } = MATRIX_CONFIG;
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Calculate dynamic centers to place labels correctly
        const offsetX = w ? w * OFFSET_FACTOR : FALLBACK_OFFSET_X;
        const offsetY = h ? h * OFFSET_FACTOR : FALLBACK_OFFSET_Y;

        return (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
                <g style={{ transform: `translate(${layoutOrigin.x}px, ${layoutOrigin.y}px)` }}>
                    {/* Main Crosshairs */}
                    <line x1={-w} y1={0} x2={w} y2={0} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />
                    <line x1={0} y1={-h} x2={0} y2={h} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />

                    {/* Labels Centered in Quadrants */}
                    <text x={-offsetX} y={-offsetY - 200} textAnchor="middle" fill="rgba(255, 50, 50, 0.4)" fontSize="60" fontWeight="900" style={{ letterSpacing: '0.5em' }}>DO</text>
                    <text x={offsetX} y={-offsetY - 200} textAnchor="middle" fill="rgba(50, 100, 255, 0.4)" fontSize="60" fontWeight="900" style={{ letterSpacing: '0.5em' }}>PLAN</text>
                    <text x={-offsetX} y={offsetY + 300} textAnchor="middle" fill="rgba(255, 200, 50, 0.4)" fontSize="60" fontWeight="900" style={{ letterSpacing: '0.5em' }}>DELEGATE</text>
                    <text x={offsetX} y={offsetY + 300} textAnchor="middle" fill="rgba(100, 255, 100, 0.4)" fontSize="60" fontWeight="900" style={{ letterSpacing: '0.5em' }}>ELIMINATE</text>
                </g>
            </svg>
        );
    }

    if (viewMode === 'prism') {
        const { COL_WIDTH, GAP } = PRISM_CONFIG;
        const labels = ['TO DO', 'IN PROGRESS', 'QA REVIEW', 'DONE'];
        const colColors = [
            'rgba(148, 163, 184, 0.01)', // To Do
            'rgba(96, 165, 250, 0.01)',  // In Progress
            'rgba(251, 191, 36, 0.01)',  // QA Review
            'rgba(52, 211, 153, 0.01)'   // Done
        ];
        const borderColors = [
            'rgba(148, 163, 184, 0.15)',
            'rgba(96, 165, 250, 0.15)',
            'rgba(251, 191, 36, 0.15)',
            'rgba(52, 211, 153, 0.15)'
        ];
        const glowColors = [
            'rgba(148, 163, 184, 0.3)',
            'rgba(96, 165, 250, 0.3)',
            'rgba(251, 191, 36, 0.3)',
            'rgba(52, 211, 153, 0.3)'
        ];

        // Re-calculate total width same as LayoutEngine
        const total = labels.length;
        const totalW = (total * COL_WIDTH) + ((total - 1) * GAP);
        const startX = -(totalW / 2) + (COL_WIDTH / 2);

        return (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
                <g style={{ transform: `translate(${layoutOrigin.x}px, ${layoutOrigin.y}px)` }}>
                    {/* 1. Render Semantic Cluster Backdrops behind columns */}
                    {clusters.map((c: any) => (
                        <g key={c.id}>
                            <rect
                                x={c.x}
                                y={c.y}
                                width={c.w}
                                height={c.h}
                                fill={`${c.color}05`}
                                stroke={`${c.color}25`}
                                strokeWidth="1.5"
                                rx="16"
                                strokeDasharray="4 4"
                                style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
                            />
                            {/* Backdrop Title */}
                            <text
                                x={c.x + 10}
                                y={c.y - 6}
                                fill={c.color}
                                fontSize="9"
                                fontWeight="bold"
                                letterSpacing="0.1em"
                                fontFamily="monospace"
                                opacity="0.6"
                            >
                                {c.label.toUpperCase()}
                            </text>
                        </g>
                    ))}

                    {/* 2. Columns */}
                    {labels.map((label, i) => {
                        const x = startX + (i * (COL_WIDTH + GAP));
                        return (
                            <g key={i}>
                                {/* Column Background */}
                                <rect
                                    x={x - COL_WIDTH / 2}
                                    y={-2000}
                                    width={COL_WIDTH}
                                    height={4000}
                                    fill={colColors[i]}
                                    stroke={borderColors[i]}
                                    strokeWidth="1.5"
                                    rx="24"
                                />

                                {/* Glow circle at center of column */}
                                <circle
                                    cx={x}
                                    cy={0}
                                    r="220"
                                    fill={`radial-gradient(circle, ${glowColors[i]} 0%, transparent 70%)` as any}
                                    opacity="0.08"
                                />
                                
                                {/* Center Line for Alignment */}
                                <line x1={x} y1={-2000} x2={x} y2={4000} stroke={borderColors[i]} strokeWidth="1" strokeDasharray="5 5" opacity="0.3" />

                                {/* Header */}
                                <text
                                    x={x}
                                    y={-420}
                                    textAnchor="middle"
                                    fill={borderColors[i]}
                                    fontSize="14"
                                    fontWeight="900"
                                    letterSpacing="0.25em"
                                    fontFamily="monospace"
                                >
                                    {label}
                                </text>
                            </g>
                        )
                    })}
                </g>
            </svg>
        );
    }

    return null;
};

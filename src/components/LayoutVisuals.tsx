import React, { useMemo } from 'react';
import { ORBITAL_CONFIG, MATRIX_CONFIG, TIMELINE_CONFIG, PRISM_CONFIG } from '../engine/layout/LayoutConstants';

interface LayoutVisualsProps {
    viewMode: string;
    layoutOrigin: { x: number; y: number };
    minDimension: number;
}

export const LayoutVisuals: React.FC<LayoutVisualsProps> = ({ viewMode, layoutOrigin, minDimension }) => {

    // 1. Calculate Radii (Match LayoutEngine logic exactly via Shared Config)
    const baseSize = minDimension / 2;
    const { RADII_PCT, MIN_RADII } = ORBITAL_CONFIG;

    const radii = useMemo(() => ({
        critical: Math.max(MIN_RADII.critical, baseSize * RADII_PCT.critical),
        high: Math.max(MIN_RADII.high, baseSize * RADII_PCT.high),
        medium: Math.max(MIN_RADII.medium, baseSize * RADII_PCT.medium),
        low: Math.max(MIN_RADII.low, baseSize * RADII_PCT.low)
    }), [baseSize]);

    if (viewMode === 'orbital') {
        return (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
                <g style={{ transform: `translate(${layoutOrigin.x}px, ${layoutOrigin.y}px)` }}>
                    {/* Rings - Increased Opacity for Visibility */}
                    <circle r={radii.critical} fill="none" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" strokeDasharray="6 4" />
                    <circle r={radii.high} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1" strokeDasharray="6 4" />
                    <circle r={radii.medium} fill="none" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="1" strokeDasharray="6 4" />
                    <circle r={radii.low} fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" strokeDasharray="6 4" />

                    {/* Labels */}
                    <text y={-radii.critical - 10} textAnchor="middle" fill="rgba(59, 130, 246, 0.8)" fontSize="12" fontFamily="monospace" fontWeight="bold">CRITICAL</text>
                    <text y={-radii.high - 10} textAnchor="middle" fill="rgba(59, 130, 246, 0.6)" fontSize="12" fontFamily="monospace" fontWeight="bold">HIGH</text>
                    <text y={-radii.medium - 10} textAnchor="middle" fill="rgba(59, 130, 246, 0.5)" fontSize="12" fontFamily="monospace" fontWeight="bold">MEDIUM</text>
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
        const labels = ['URGENT', 'WORK', 'LIFE', 'IDEAS'];

        // Re-calculate total width same as LayoutEngine
        const total = labels.length;
        const totalW = (total * COL_WIDTH) + ((total - 1) * GAP);
        const startX = -(totalW / 2) + (COL_WIDTH / 2);

        return (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
                <g style={{ transform: `translate(${layoutOrigin.x}px, ${layoutOrigin.y}px)` }}>
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
                                    fill="rgba(255,255,255,0.02)"
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth="1"
                                />
                                {/* ADDED: Center Line for Alignment (User Link Points idea) */}
                                <line x1={x} y1={-2000} x2={x} y2={4000} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="4 4" />

                                {/* Header */}
                                <text
                                    x={x}
                                    y={-400}
                                    textAnchor="middle"
                                    fill="rgba(255,255,255,0.4)"
                                    fontSize="24"
                                    fontWeight="bold"
                                    letterSpacing="0.2em"
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

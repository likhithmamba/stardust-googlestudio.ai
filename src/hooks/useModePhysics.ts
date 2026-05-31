// src/hooks/useModePhysics.ts — Per-mode physics behavior configuration
// Maps each view mode to its specific physics configuration for the engine
import { useSettingsStore } from '../ui/settings/settingsStore';
import { useMemo } from 'react';

export interface ModePhysicsConfig {
    /** Gravity strength toward center or layout target */
    gravity: number;
    /** Damping/friction coefficient (0-1, higher = more friction) */
    damping: number;
    /** Repulsion force between nodes */
    repulsion: number;
    /** Whether nodes should drift with Brownian motion */
    brownianMotion: boolean;
    /** Connection spring stiffness (0 = no springs) */
    connectionSpring: number;
    /** Whether to auto-arrange nodes on mode entry */
    autoArrange: boolean;
    /** Boundary behavior: 'none' | 'soft' | 'hard' */
    boundary: 'none' | 'soft' | 'hard';
    /** Whether dragged nodes should snap to grid or positions */
    snap: boolean;
    /** Grid snap size in px (if snap is true) */
    snapSize: number;
}

const MODE_PHYSICS: Record<string, ModePhysicsConfig> = {
    void: {
        gravity: 0,
        damping: 0.98,
        repulsion: 80,
        brownianMotion: true,
        connectionSpring: 0,
        autoArrange: false,
        boundary: 'none',
        snap: false,
        snapSize: 0,
    },
    matrix: {
        gravity: 0.1,
        damping: 0.92,
        repulsion: 120,
        brownianMotion: false,
        connectionSpring: 0.5,
        autoArrange: true,
        boundary: 'soft',
        snap: true,
        snapSize: 50,
    },
    prism: {
        gravity: 0.05,
        damping: 0.95,
        repulsion: 100,
        brownianMotion: false,
        connectionSpring: 0.3,
        autoArrange: true,
        boundary: 'soft',
        snap: true,
        snapSize: 40,
    },
    orbital: {
        gravity: 0.3,
        damping: 0.9,
        repulsion: 60,
        brownianMotion: false,
        connectionSpring: 0.8,
        autoArrange: true,
        boundary: 'hard',
        snap: false,
        snapSize: 0,
    },
    timeline: {
        gravity: 0.02,
        damping: 0.96,
        repulsion: 50,
        brownianMotion: false,
        connectionSpring: 0.2,
        autoArrange: true,
        boundary: 'soft',
        snap: true,
        snapSize: 60,
    },
    free: {
        gravity: 0,
        damping: 0.99,
        repulsion: 80,
        brownianMotion: false,
        connectionSpring: 0,
        autoArrange: false,
        boundary: 'none',
        snap: false,
        snapSize: 0,
    },
};

const DEFAULT_PHYSICS: ModePhysicsConfig = MODE_PHYSICS.free;

/**
 * Hook returning physics configuration for the current view mode.
 */
export function useModePhysics(): ModePhysicsConfig {
    const viewMode = useSettingsStore((state) => state.viewMode);
    return useMemo(() => {
        switch (viewMode) {
            case 'void': return MODE_PHYSICS.void;
            case 'matrix': return MODE_PHYSICS.matrix;
            case 'prism': return MODE_PHYSICS.prism;
            case 'orbital': return MODE_PHYSICS.orbital;
            case 'timeline': return MODE_PHYSICS.timeline;
            case 'free': return MODE_PHYSICS.free;
            default: return DEFAULT_PHYSICS;
        }
    }, [viewMode]);
}

/**
 * Get physics config for a specific mode (non-hook version).
 */
export function getModePhysics(mode: string): ModePhysicsConfig {
    switch (mode) {
        case 'void': return MODE_PHYSICS.void;
        case 'matrix': return MODE_PHYSICS.matrix;
        case 'prism': return MODE_PHYSICS.prism;
        case 'orbital': return MODE_PHYSICS.orbital;
        case 'timeline': return MODE_PHYSICS.timeline;
        case 'free': return MODE_PHYSICS.free;
        default: return DEFAULT_PHYSICS;
    }
}

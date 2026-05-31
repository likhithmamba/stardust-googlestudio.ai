/**
 * Feature Flags for Stardust Engine
 * Compile-time constants to toggle systems and behavior.
 */

export const FLAGS = {
    // Core Systems
    ENABLE_PHYSICS: false,       // General N-body physics (drift, repulsion, springs) — OFF for stability
    ENABLE_SINGULARITY: true,    // Black Hole suction — vital for note deletion UX
    ENABLE_LAYOUT: true,
    ENABLE_INPUT: true,
    ENABLE_RENDER: true,

    // Specific Features
    ENABLE_PARTICLES: false,     // Future
    ENABLE_RINGS: true,
    ENABLE_MATRIX_MODE: true,
    ENABLE_DEBUG: false,

    // Performance Tuning
    USE_SPATIAL_GRID: false,     // > 30 nodes
    USE_DELTA_TIME: true,
    LIMIT_FPS: false,            // 60hz limit if needed
    ENABLE_SLEEP: true,          // Skip frames when all notes are stationary
};

// Global override for debug (can be set via console)
// @ts-ignore
if (typeof window !== 'undefined') window.STARDUST_FLAGS = FLAGS;

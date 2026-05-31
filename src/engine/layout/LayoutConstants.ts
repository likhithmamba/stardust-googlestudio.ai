export type Vector2 = { x: number; y: number };

export const ORBITAL_CONFIG = {
    // Percentage of screen half-size (minDimension / 2)
    RADII_PCT: {
        critical: 0.4,
        high: 0.65,
        medium: 0.9,
        low: 1.15
    },
    // Minimum absolute pixels to avoid cramping
    MIN_RADII: {
        critical: 200,
        high: 350,
        medium: 500,
        low: 650
    },
    DEFAULT_PRIORITY: 'default'
} as const;

export const MATRIX_CONFIG = {
    // Offset factors relative to viewport width/height (0.25 = center of quadrant)
    OFFSET_FACTOR: 0.25,
    // Fallback pixels if viewport unknown
    FALLBACK_OFFSET_X: 400,
    FALLBACK_OFFSET_Y: 300,
    GRID: {
        COLS: 3,
        SPACING: 140
    }
} as const;

export const TIMELINE_CONFIG = {
    LANE_HEIGHT: 150, // For snapping
    SNAP_THRESHOLD: 50,
    PIXELS_PER_DAY: 180
} as const;

export const PRISM_CONFIG = {
    COL_WIDTH: 350,
    GAP: 50
} as const;

/**
 * STARDUST — Coordinate Clamping Utility
 * Prevents physics instability (NaN, Infinity, extreme values) from
 * reaching the store or the DOM. Applied at canvas input and engine output.
 */

const MAX_COORD = 50_000;

/**
 * Clamp a coordinate value to the safe range [-50000, 50000].
 * Returns 0 for NaN or Infinity.
 */
export function clampCoord(v: number): number {
    if (!Number.isFinite(v)) return 0;
    return Math.max(-MAX_COORD, Math.min(MAX_COORD, v));
}

/**
 * Clamp both x and y coordinates.
 */
export function clampPosition(x: number, y: number): { x: number; y: number } {
    return { x: clampCoord(x), y: clampCoord(y) };
}

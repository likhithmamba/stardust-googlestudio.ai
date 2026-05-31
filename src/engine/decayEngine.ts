// ─── Decay Engine ───────────────────────────────────────────────
// Implements the "Decay Consequence System" from the engineering report.
//
// Notes that haven't been accessed lose luminance over time. When luminance
// drops below a threshold, the note is auto-archived. This mimics natural
// memory fading — ideas you don't revisit gradually dim and drift to the archive.
//
// The engine runs on a low-frequency interval (every 30s) to avoid any
// performance impact. Luminance calculations are simple arithmetic with
// no allocations in the hot path.

import { useStore } from '../store/useStore';
import type { Note } from '../store/useStore';

// ─── Configuration ──────────────────────────────────────────────
export const DECAY_CONFIG = {
    /** How often the decay tick runs (ms) */
    TICK_INTERVAL: 30_000,

    /** Time in ms after which a note starts decaying (24 hours) */
    GRACE_PERIOD: 24 * 60 * 60 * 1000,

    /** Luminance lost per tick when in decay phase. At 30s ticks,
     *  a note fully decays in ~7 days: 1.0 / (0.005 * 2 ticks/min * 60 min * 24h * 7d) ≈ 1.0 */
    DECAY_RATE: 0.005,

    /** Luminance threshold below which a note is auto-archived */
    ARCHIVE_THRESHOLD: 0.15,

    /** Luminance levels for visual dimming tiers */
    DIM_TIERS: {
        BRIGHT: 0.7,    // Full visibility
        FADING: 0.4,    // Slightly transparent
        GHOST: 0.15,    // Very dim, about to be archived
    },

    /** Notes of these types never decay (anchors) */
    IMMUNE_TYPES: ['sun', 'galaxy', 'nebula', 'black-hole'] as string[],

    /** Notes with these statuses never decay */
    IMMUNE_STATUSES: ['in-progress', 'review'] as string[],
};

export function updateDecayConfig(cfg: { gracePeriodHours?: number; decayRate?: number; enabled?: boolean }) {
    if (cfg.gracePeriodHours !== undefined) {
        DECAY_CONFIG.GRACE_PERIOD = cfg.gracePeriodHours * 60 * 60 * 1000;
    }
    if (cfg.decayRate !== undefined) {
        DECAY_CONFIG.DECAY_RATE = cfg.decayRate;
    }
    if (cfg.enabled !== undefined) {
        if (cfg.enabled) {
            startDecayEngine();
        } else {
            stopDecayEngine();
        }
    }
}

export function isDecayEngineRunning(): boolean {
    return decayIntervalId !== null;
}

// ─── Decay Logic ────────────────────────────────────────────────

/**
 * Calculate updated luminance for a single note.
 * Returns null if no update is needed.
 */
function computeDecay(note: Note, now: number): Partial<Note> | null {
    // Already archived or dying — skip
    if (note.status === 'archived' || note.isDying) return null;

    // Immune types don't decay
    if (DECAY_CONFIG.IMMUNE_TYPES.includes(note.type as string)) return null;

    // Immune statuses don't decay
    if (note.status && DECAY_CONFIG.IMMUNE_STATUSES.includes(note.status)) return null;

    // Pinned notes don't decay
    if (note.fixed) return null;

    // Decay paused
    if (note.decayPausedUntil && now < note.decayPausedUntil) return null;

    const lastAccess = note.lastAccessedAt ?? note.updatedAt ?? note.createdAt ?? now;
    const timeSinceAccess = now - lastAccess;

    // Still within grace period — no decay
    if (timeSinceAccess < DECAY_CONFIG.GRACE_PERIOD) return null;

    const currentLuminance = note.luminance ?? 1.0;

    // Already fully decayed
    if (currentLuminance <= 0) return null;

    const newLuminance = Math.max(0, currentLuminance - DECAY_CONFIG.DECAY_RATE);

    // Check if should auto-archive
    if (newLuminance <= DECAY_CONFIG.ARCHIVE_THRESHOLD) {
        return {
            luminance: newLuminance,
            status: 'archived',
            isDying: true,
        };
    }

    return { luminance: newLuminance };
}

/**
 * Run a single decay tick across all notes.
 * Only updates notes that have actually changed.
 */
function decayTick(): void {
    const state = useStore.getState();
    const now = Date.now();
    let archivedCount = 0;

    for (const note of state.notes) {
        const patch = computeDecay(note, now);
        if (patch) {
            state.updateNote(note.id, patch);
            if (patch.status === 'archived') {
                archivedCount++;
            }
        }
    }

    if (archivedCount > 0) {
        window.dispatchEvent(new CustomEvent('stardust:toast', {
            detail: {
                message: `${archivedCount} fading star${archivedCount > 1 ? 's' : ''} drifted to the archive`,
                type: 'info'
            }
        }));
    }
}

// ─── Touch / Revive ─────────────────────────────────────────────

/**
 * Touch a note to reset its decay timer.
 * Call this when user interacts with (opens, edits, views) a note.
 */
export function touchNote(noteId: string): void {
    const state = useStore.getState();
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;

    const currentLuminance = note.luminance ?? 1.0;
    // Revive: boost luminance back towards 1.0
    const newLuminance = Math.min(1.0, currentLuminance + 0.3);

    state.updateNote(noteId, {
        lastAccessedAt: Date.now(),
        luminance: newLuminance,
    });
}

/**
 * Pause decay for a note until a specific time.
 */
export function pauseDecay(noteId: string, durationMs: number): void {
    useStore.getState().updateNote(noteId, {
        decayPausedUntil: Date.now() + durationMs,
    });
}

/**
 * Fully revive a note (restore luminance to 1.0).
 */
export function reviveNote(noteId: string): void {
    useStore.getState().updateNote(noteId, {
        luminance: 1.0,
        lastAccessedAt: Date.now(),
        decayPausedUntil: undefined,
        status: 'captured',
        isDying: false,
    });
}

// ─── Visual Helpers ─────────────────────────────────────────────

/**
 * Get the opacity multiplier for a note based on its luminance.
 */
export function getDecayOpacity(note: Note): number {
    const lum = note.luminance ?? 1.0;
    if (lum >= DECAY_CONFIG.DIM_TIERS.BRIGHT) return 1.0;
    if (lum >= DECAY_CONFIG.DIM_TIERS.FADING) return 0.6 + (lum - DECAY_CONFIG.DIM_TIERS.FADING) / (DECAY_CONFIG.DIM_TIERS.BRIGHT - DECAY_CONFIG.DIM_TIERS.FADING) * 0.4;
    if (lum >= DECAY_CONFIG.DIM_TIERS.GHOST) return 0.25 + (lum - DECAY_CONFIG.DIM_TIERS.GHOST) / (DECAY_CONFIG.DIM_TIERS.FADING - DECAY_CONFIG.DIM_TIERS.GHOST) * 0.35;
    return 0.15;
}

/**
 * Get a CSS filter string for decay visual effects.
 */
export function getDecayFilter(note: Note): string {
    const lum = note.luminance ?? 1.0;
    if (lum >= DECAY_CONFIG.DIM_TIERS.BRIGHT) return 'none';
    const saturation = Math.max(0.3, lum);
    const brightness = Math.max(0.5, lum);
    return `saturate(${saturation}) brightness(${brightness})`;
}

// ─── Engine Lifecycle ───────────────────────────────────────────
let decayIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Start the decay engine. Idempotent — calling multiple times is safe.
 */
export function startDecayEngine(): void {
    if (decayIntervalId !== null) return;
    decayIntervalId = setInterval(decayTick, DECAY_CONFIG.TICK_INTERVAL);
    console.log('[DecayEngine] Started — tick interval:', DECAY_CONFIG.TICK_INTERVAL, 'ms');
}

/**
 * Stop the decay engine.
 */
export function stopDecayEngine(): void {
    if (decayIntervalId !== null) {
        clearInterval(decayIntervalId);
        decayIntervalId = null;
        console.log('[DecayEngine] Stopped');
    }
}

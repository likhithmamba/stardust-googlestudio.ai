import type { Note } from '../store/useStore';
import { differenceInDays } from 'date-fns';
import { ORBITAL_CONFIG, MATRIX_CONFIG, TIMELINE_CONFIG, PRISM_CONFIG } from '../engine/layout/LayoutConstants';

export type Vector2 = { x: number; y: number };

export interface LayoutConfig {
    viewport: { x: number; y: number; zoom: number; width?: number; height?: number }; // width/height added
    orbital?: { center?: Vector2; rotationOffset?: number; minDimension?: number };
}

/**
 * LAYOUT ENGINE V14 (The View Interpreter)
 * "Pure Math" Generators.
 * These functions take Data and return Coordinates.
 */

// 1. ORBITAL (Banded Gravity + Rotation)
// Logic: Concentric rings based on priority. Inner = Hot/Critical. Outer = Cold/Low.
// 1. ORBITAL (Banded Gravity + Rotation)
// Logic: Concentric rings based on priority. Inner = Hot/Critical. Outer = Cold/Low.
export const getOrbitalTargets = (
    notes: Note[],
    config: { center: Vector2; rotationOffset: number; minDimension?: number }
): Map<string, Vector2> => {
    const targets = new Map<string, Vector2>();
    const { center, rotationOffset, minDimension } = config;

    // Responsive Radii: Scale based on screen size if available (default to 1000px base)
    const baseSize = minDimension ? minDimension / 2 : 500;

    const { RADII_PCT, MIN_RADII } = ORBITAL_CONFIG;

    // Define Radii as percentages of screen half-size
    const radii: Record<string, number> = {
        critical: baseSize * RADII_PCT.critical,
        high: baseSize * RADII_PCT.high,
        medium: baseSize * RADII_PCT.medium,
        low: baseSize * RADII_PCT.low,
        default: baseSize * RADII_PCT.medium
    };
    // Clamp minimums to avoid overlap
    if (radii.critical < MIN_RADII.critical) radii.critical = MIN_RADII.critical;
    if (radii.high < MIN_RADII.high) radii.high = MIN_RADII.high;
    if (radii.medium < MIN_RADII.medium) radii.medium = MIN_RADII.medium;
    if (radii.low < MIN_RADII.low) radii.low = MIN_RADII.low;

    // Helper to determine priority if missing
    // Falls back to NoteType hierarchy for legacy/untagged notes
    const getEffectivePriority = (n: Note): string => {
        if (n.priority) return n.priority;

        // Logical Fallback based on Type
        // Stars/BlackHoles are handled separately (pinned), but just in case:
        if (n.type === 'sun' || n.type === 'black-hole' || n.type === 'galaxy') return 'critical';
        if (n.type === 'jupiter' || n.type === 'saturn') return 'high';
        if (n.type === 'earth' || n.type === 'mars' || n.type === 'venus') return 'medium';
        return 'default'; // Asteroids, etc
    };

    // Group notes by priority
    const grouped: Record<string, Note[]> = { critical: [], high: [], medium: [], low: [], default: [] };

    notes.forEach(n => {
        // SPECIAL RULE: Stars & Singularities Anchor the System
        if (n.type === 'sun' || n.type === 'black-hole' || n.type === 'galaxy' || n.type === 'nebula') {
            targets.set(n.id, center);
            return;
        }

        const p = getEffectivePriority(n);
        if (grouped[p]) grouped[p].push(n);
        else grouped.default.push(n);
    });

    Object.entries(grouped).forEach(([level, groupNotes]) => {
        const radius = radii[level] || radii.default;
        // Distribute evenly along the ring
        const stepAngle = (2 * Math.PI) / (groupNotes.length || 1);

        groupNotes.forEach((note, index) => {
            // Apply rotationOffset for spinning HUD effect
            // We stagger the offset slightly per ring for a "paralax" feel if desired, 
            // but for now, uniform rotation.
            const theta = index * stepAngle + rotationOffset + (level === 'high' ? 1 : 0);

            targets.set(note.id, {
                x: center.x + radius * Math.cos(theta),
                y: center.y + radius * Math.sin(theta)
            });
        });
    });

    return targets;
};

// 2. TIMELINE (Linear Chronology)
// Logic: X = Time (Days from Now), Y = Centered (or slightly staggered)
export const getTimelineTargets = (
    notes: Note[],
    config: { center: Vector2 }
): Map<string, Vector2> => {
    const targets = new Map<string, Vector2>();
    const { center } = config;
    const pxPerDay = TIMELINE_CONFIG.PIXELS_PER_DAY; // Scale

    const now = new Date();

    notes.forEach((note, index) => {
        const created = note.createdAt ? new Date(note.createdAt) : now;
        const daysDiff = differenceInDays(created, now);

        // Stagger Y slightly to avoid overlap if created on same day
        // Or use zig-zag
        const outputIndex = index % 2;
        const yOffset = outputIndex === 0 ? -60 : 60;

        targets.set(note.id, {
            x: center.x + (daysDiff * pxPerDay),
            y: center.y + yOffset
        });
    });

    return targets;
};

// 3. MATRIX (Eisenhower Quadrants)
// TL: Urgent/Important, TR: Not Urgent/Important, etc.
export const getMatrixTargets = (
    notes: Note[],
    config: { center: Vector2; width?: number; height?: number }
): Map<string, Vector2> => {
    const targets = new Map<string, Vector2>();
    const { center } = config;

    // Default offsets if width/height not passed (fallback to window size roughly)
    const offsetX = config.width ? config.width * MATRIX_CONFIG.OFFSET_FACTOR : MATRIX_CONFIG.FALLBACK_OFFSET_X;
    const offsetY = config.height ? config.height * MATRIX_CONFIG.OFFSET_FACTOR : MATRIX_CONFIG.FALLBACK_OFFSET_Y;

    const qOffsets = {
        do: { x: -offsetX, y: -offsetY, count: 0 },         // TL: Urgent & High/Critical
        plan: { x: offsetX, y: -offsetY, count: 0 },        // TR: Not Urgent & High/Critical
        delegate: { x: -offsetX, y: offsetY, count: 0 },    // BL: Urgent & Low/Medium
        eliminate: { x: offsetX, y: offsetY, count: 0 }     // BR: Not Urgent & Low/Medium
    };

    notes.forEach(note => {
        const tags = (note.tags || []).map(t => t.toLowerCase());
        const isUrgent = tags.some(t => t.includes('urgent'));
        const isImportant = note.priority === 'critical' || note.priority === 'high';

        let quad = 'eliminate';
        if (isUrgent && isImportant) quad = 'do';
        else if (!isUrgent && isImportant) quad = 'plan';
        else if (isUrgent && !isImportant) quad = 'delegate';

        const q = qOffsets[quad as keyof typeof qOffsets];

        // Grid Packing within Quadrant
        const { COLS, SPACING } = MATRIX_CONFIG.GRID;
        const col = q.count % COLS;
        const row = Math.floor(q.count / COLS);

        targets.set(note.id, {
            x: center.x + q.x + (col * SPACING) - SPACING,
            y: center.y + q.y + (row * SPACING) - SPACING
        });
        q.count++;
    });

    return targets;
};

// 4. PRISM (Spectral Buckets)
// Columns based on Tags
export const getPrismTargets = (
    notes: Note[],
    config: { center: Vector2; width?: number }
): Map<string, Vector2> => {
    const targets = new Map<string, Vector2>();
    const { center } = config;

    const columns = ['urgent', 'work', 'life', 'idea']; // mapped from tags
    const { COL_WIDTH: colWidth, GAP: gap } = PRISM_CONFIG;
    const totalWidth = (columns.length * colWidth) + ((columns.length - 1) * gap);
    const startX = center.x - (totalWidth / 2) + (colWidth / 2);

    const colCounts = [0, 0, 0, 0];

    notes.forEach(note => {
        const tags = (note.tags || []).join(' ').toLowerCase();

        let colIndex = 3; // Default 'idea'
        if (tags.includes('urgent')) colIndex = 0;
        else if (tags.includes('work') || tags.includes('project')) colIndex = 1;
        else if (tags.includes('life') || tags.includes('personal')) colIndex = 2;
        else if (tags.includes('idea') || tags.includes('thought')) colIndex = 3;

        const x = startX + (colIndex * (colWidth + gap));
        const y = center.y - 300 + (colCounts[colIndex] * 120); // Stack from top down

        targets.set(note.id, { x, y });
        colCounts[colIndex]++;
    });

    return targets;
};

// Main Dispatcher
export const calculateTargets = (
    mode: string,
    notes: Note[],
    viewport: { width: number; height: number },
    config?: LayoutConfig
): Map<string, Vector2> => {
    const center = config?.orbital?.center || { x: 0, y: 0 };
    const minDimension = Math.min(viewport.width, viewport.height);

    switch (mode) {
        case 'orbital':
            return getOrbitalTargets(notes, {
                center: center,
                rotationOffset: config?.orbital?.rotationOffset || 0,
                minDimension: minDimension
            });
        case 'timeline':
            return getTimelineTargets(notes, { center: center });
        case 'matrix':
            return getMatrixTargets(notes, {
                center: center,
                width: viewport.width,
                height: viewport.height
            });
        case 'prism':
            return getPrismTargets(notes, { center: center });
        default:
            return new Map();
    }
};

/**
 * MATRIX ENGINE - Strategic Evaluation
 * Impact vs Effort coordinate mapping with automated pruning
 * 
 * @module MatrixEngine
 * @author ImperialX
 */

import type { Note, MatrixCoordinate, GhostLayer } from '../../types/StardustSchema';

// === CONSTANTS ===

const MATRIX_THRESHOLDS = {
    IMPACT_MIDPOINT: 0.5,
    EFFORT_MIDPOINT: 0.5,
    PRUNE_IMPACT_MAX: 0.3,
    PRUNE_EFFORT_MIN: 0.7
};

// === QUADRANT EVALUATION ===

/**
 * Evaluates a note's position in the Impact/Effort matrix.
 * Returns quadrant assignment and pruning recommendation.
 */
export function evaluateNote(note: Note): MatrixCoordinate {
    const impact = note.impact ?? estimateImpact(note);
    const effort = note.effort ?? estimateEffort(note);

    let quadrant: MatrixCoordinate['quadrant'];
    let shouldPrune = false;

    if (impact >= MATRIX_THRESHOLDS.IMPACT_MIDPOINT &&
        effort < MATRIX_THRESHOLDS.EFFORT_MIDPOINT) {
        quadrant = 'do';        // High Impact, Low Effort (Quick Wins)
    } else if (impact >= MATRIX_THRESHOLDS.IMPACT_MIDPOINT &&
        effort >= MATRIX_THRESHOLDS.EFFORT_MIDPOINT) {
        quadrant = 'plan';      // High Impact, High Effort (Strategic)
    } else if (impact < MATRIX_THRESHOLDS.IMPACT_MIDPOINT &&
        effort < MATRIX_THRESHOLDS.EFFORT_MIDPOINT) {
        quadrant = 'delegate';  // Low Impact, Low Effort (Delegate)
    } else {
        quadrant = 'eliminate'; // Low Impact, High Effort (PRUNE!)

        // Trigger pruning event for extreme cases
        if (impact <= MATRIX_THRESHOLDS.PRUNE_IMPACT_MAX &&
            effort >= MATRIX_THRESHOLDS.PRUNE_EFFORT_MIN) {
            shouldPrune = true;
        }
    }

    return {
        noteId: note.id,
        impact,
        effort,
        quadrant,
        shouldPrune
    };
}

/**
 * Batch evaluate all notes for matrix positioning
 */
export function evaluateAllNotes(notes: Note[]): MatrixCoordinate[] {
    return notes.map(evaluateNote);
}

/**
 * Get notes that should be pruned
 */
export function getPruningCandidates(notes: Note[]): Note[] {
    return notes.filter(note => evaluateNote(note).shouldPrune);
}

// === HEURISTIC ESTIMATORS ===

/**
 * Estimate impact score based on note metadata
 * Uses priority, link count, and tags
 */
function estimateImpact(note: Note): number {
    let impact = 0.5; // Default to medium

    // Priority weight
    switch (note.priority) {
        case 'critical': impact = 0.95; break;
        case 'high': impact = 0.75; break;
        case 'medium': impact = 0.5; break;
        case 'low': impact = 0.25; break;
    }

    // Link count boost (well-connected = important)
    const linkBonus = Math.min((note.linkCount || 0) * 0.05, 0.2);
    impact = Math.min(impact + linkBonus, 1.0);

    // Tag indicators
    const tags = (note.tags || []).map(t => t.toLowerCase());
    if (tags.some(t => ['critical', 'urgent', 'important', 'key'].includes(t))) {
        impact = Math.min(impact + 0.15, 1.0);
    }
    if (tags.some(t => ['minor', 'nice-to-have', 'optional'].includes(t))) {
        impact = Math.max(impact - 0.2, 0);
    }

    return impact;
}

/**
 * Estimate effort score based on note metadata
 * Uses content length, complexity tags, and access patterns
 */
function estimateEffort(note: Note): number {
    let effort = 0.5; // Default to medium

    // Content length as proxy for complexity
    const contentLength = (note.content || '').length;
    if (contentLength > 2000) effort = 0.8;
    else if (contentLength > 1000) effort = 0.6;
    else if (contentLength < 200) effort = 0.3;

    // Tag indicators
    const tags = (note.tags || []).map(t => t.toLowerCase());
    if (tags.some(t => ['complex', 'difficult', 'long-term', 'deep-dive'].includes(t))) {
        effort = Math.min(effort + 0.2, 1.0);
    }
    if (tags.some(t => ['quick', 'easy', 'simple', 'trivial'].includes(t))) {
        effort = Math.max(effort - 0.2, 0);
    }

    // Type-based estimation
    switch (note.type) {
        case 'nebula':
        case 'galaxy':
            effort = 0.9; // Large scope = high effort
            break;
        case 'asteroid':
        case 'comet':
            effort = 0.2; // Small items = low effort
            break;
    }

    return effort;
}

// === GHOST LAYER OVERLAYS ===

/**
 * Apply a ghost layer overlay without mutating original data.
 * Returns a mapping of noteId → layer category.
 */
export function applyGhostLayer(
    notes: Note[],
    layer: GhostLayer
): Map<string, string> {
    const mapping = new Map<string, string>();

    if (layer === 'none') return mapping;

    for (const note of notes) {
        let category: string;

        switch (layer) {
            case 'moscow':
                category = classifyMoSCoW(note);
                break;
            case 'swot':
                category = classifySWOT(note);
                break;
            case 'eisenhower':
                category = classifyEisenhower(note);
                break;
            default:
                category = 'unknown';
        }

        mapping.set(note.id, category);
    }

    return mapping;
}

/**
 * MoSCoW prioritization: Must, Should, Could, Won't
 */
function classifyMoSCoW(note: Note): 'must' | 'should' | 'could' | 'wont' {
    const tags = (note.tags || []).map(t => t.toLowerCase());

    if (tags.some(t => ['must', 'required', 'essential'].includes(t)) ||
        note.priority === 'critical') {
        return 'must';
    }
    if (tags.some(t => ['should', 'important'].includes(t)) ||
        note.priority === 'high') {
        return 'should';
    }
    if (tags.some(t => ['could', 'nice-to-have', 'optional'].includes(t)) ||
        note.priority === 'medium') {
        return 'could';
    }
    if (tags.some(t => ['won\'t', 'wont', 'defer', 'backlog'].includes(t)) ||
        note.priority === 'low') {
        return 'wont';
    }

    // Default based on impact/effort
    const coord = evaluateNote(note);
    if (coord.quadrant === 'do') return 'must';
    if (coord.quadrant === 'plan') return 'should';
    if (coord.quadrant === 'delegate') return 'could';
    return 'wont';
}

/**
 * SWOT Analysis: Strength, Weakness, Opportunity, Threat
 */
function classifySWOT(note: Note): 'strength' | 'weakness' | 'opportunity' | 'threat' {
    const tags = (note.tags || []).map(t => t.toLowerCase());
    const content = (note.content || '').toLowerCase();

    // Direct tag matching
    if (tags.includes('strength') ||
        content.includes('advantage') ||
        content.includes('strength')) {
        return 'strength';
    }
    if (tags.includes('weakness') ||
        content.includes('weakness') ||
        content.includes('limitation')) {
        return 'weakness';
    }
    if (tags.includes('opportunity') ||
        content.includes('opportunity') ||
        content.includes('potential')) {
        return 'opportunity';
    }
    if (tags.includes('threat') ||
        content.includes('risk') ||
        content.includes('threat')) {
        return 'threat';
    }

    // Heuristic fallback
    const coord = evaluateNote(note);
    if (coord.impact > 0.6 && coord.effort < 0.4) return 'strength';
    if (coord.impact < 0.4 && coord.effort > 0.6) return 'weakness';
    if (coord.impact > 0.6 && coord.effort > 0.6) return 'opportunity';
    return 'threat';
}

/**
 * Eisenhower Matrix: Urgent/Important classification
 */
function classifyEisenhower(note: Note): 'do' | 'decide' | 'delegate' | 'delete' {
    const tags = (note.tags || []).map(t => t.toLowerCase());
    const isUrgent = tags.some(t => ['urgent', 'asap', 'now', 'deadline'].includes(t));
    const isImportant = note.priority === 'critical' || note.priority === 'high';

    if (isUrgent && isImportant) return 'do';
    if (!isUrgent && isImportant) return 'decide';
    if (isUrgent && !isImportant) return 'delegate';
    return 'delete';
}

// === MATRIX LAYOUT TARGETS ===

/**
 * Calculate 2D positions for notes in the Impact/Effort matrix
 */
export function getMatrixLayoutTargets(
    notes: Note[],
    center: { x: number; y: number },
    dimensions: { width: number; height: number }
): Map<string, { x: number; y: number; quadrant: string }> {
    const targets = new Map<string, { x: number; y: number; quadrant: string }>();

    const halfW = dimensions.width / 2;
    const halfH = dimensions.height / 2;

    // Track items per quadrant for grid layout
    const quadrantCounts = { do: 0, plan: 0, delegate: 0, eliminate: 0 };

    for (const note of notes) {
        const coord = evaluateNote(note);
        const qCount = quadrantCounts[coord.quadrant]++;

        // Calculate position within quadrant
        const col = qCount % 4;
        const row = Math.floor(qCount / 4);
        const spacing = 100;

        let baseX: number, baseY: number;

        switch (coord.quadrant) {
            case 'do':       // Top-left: High Impact, Low Effort
                baseX = center.x - halfW * 0.75;
                baseY = center.y - halfH * 0.5;
                break;
            case 'plan':     // Top-right: High Impact, High Effort
                baseX = center.x + halfW * 0.25;
                baseY = center.y - halfH * 0.5;
                break;
            case 'delegate': // Bottom-left: Low Impact, Low Effort
                baseX = center.x - halfW * 0.75;
                baseY = center.y + halfH * 0.25;
                break;
            case 'eliminate': // Bottom-right: Low Impact, High Effort
                baseX = center.x + halfW * 0.25;
                baseY = center.y + halfH * 0.25;
                break;
        }

        targets.set(note.id, {
            x: baseX + col * spacing,
            y: baseY + row * spacing,
            quadrant: coord.quadrant
        });
    }

    return targets;
}

// === EXPORTS ===

export const MatrixEngine = {
    evaluateNote,
    evaluateAllNotes,
    getPruningCandidates,
    applyGhostLayer,
    getMatrixLayoutTargets,
    MATRIX_THRESHOLDS
};

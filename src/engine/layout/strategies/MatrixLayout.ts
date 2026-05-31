import type { EngineNote, WorldConfig } from '../../types/EngineTypes';
import type { LayoutStrategy } from '../LayoutStrategy';
import { MATRIX_CONFIG, type Vector2 } from '../LayoutConstants';
import type { MatrixCoordinate } from '../../../types/StardustSchema';
import {
    evaluateNote,
} from '../../cognitive/MatrixEngine';

/**
 * MATRIX LAYOUT - Impact/Effort Strategic Evaluation
 * Uses cognitive engine for intelligent quadrant placement
 * Quadrants: Do (high impact/low effort), Plan, Delegate, Eliminate
 */
export class MatrixLayout implements LayoutStrategy {
    private noteEvaluations: Map<string, MatrixCoordinate> = new Map();
    private pruningCandidates: Set<string> = new Set();

    calculateTargets(notes: EngineNote[], config: WorldConfig): Map<string, Vector2> {
        const targets = new Map<string, Vector2>();
        const center = { x: config.centerX, y: config.centerY };

        // Matrix quadrant layout
        const quadrantWidth = config.width / config.zoom * 0.35;
        const quadrantHeight = config.height / config.zoom * 0.35;

        const quadOffsets = {
            do: { x: -quadrantWidth / 2, y: -quadrantHeight / 2 }, // Top-left: High Impact, Low Effort
            plan: { x: quadrantWidth / 2, y: -quadrantHeight / 2 }, // Top-right: High Impact, High Effort
            delegate: { x: -quadrantWidth / 2, y: quadrantHeight / 2 }, // Bottom-left: Low Impact, Low Effort
            eliminate: { x: quadrantWidth / 2, y: quadrantHeight / 2 } // Bottom-right: Low Impact, High Effort
        };

        const { GRID } = MATRIX_CONFIG;
        const quadrantCounts = { do: 0, plan: 0, delegate: 0, eliminate: 0 };

        // Reset pruning candidates
        this.pruningCandidates.clear();

        notes.forEach(note => {
            // Use cognitive engine for evaluation
            const evaluation = this.evaluateNotePosition(note);
            this.noteEvaluations.set(note.id, evaluation);

            if (evaluation.shouldPrune) {
                this.pruningCandidates.add(note.id);
            }

            const quad = evaluation.quadrant;
            const offset = quadOffsets[quad as keyof typeof quadOffsets];
            const count = quadrantCounts[quad as keyof typeof quadrantCounts]++;


            // Grid within quadrant
            const col = count % GRID.COLS;
            const row = Math.floor(count / GRID.COLS);

            // Position based on actual impact/effort values for fine-grained placement
            // This creates a smooth distribution within each quadrant
            const impactOffset = (evaluation.impact - 0.5) * quadrantWidth * 0.3;
            const effortOffset = (evaluation.effort - 0.5) * quadrantHeight * 0.3;

            targets.set(note.id, {
                x: center.x + offset.x + (col * GRID.SPACING) + impactOffset,
                y: center.y + offset.y + (row * GRID.SPACING) + effortOffset
            });
        });

        return targets;
    }

    private evaluateNotePosition(note: EngineNote): MatrixCoordinate {
        const tags = (note.tags || []).map(t => t.toLowerCase());

        // Estimate impact based on priority and type
        let impact = 0.5;
        if (note.priority === 'critical') impact = 0.9;
        else if (note.priority === 'high') impact = 0.75;
        else if (note.priority === 'medium') impact = 0.5;
        else if (note.priority === 'low') impact = 0.25;

        // Boost for certain types
        if (note.type === 'sun' || note.type === 'galaxy') impact = Math.min(1, impact + 0.2);
        if (tags.includes('important') || tags.includes('critical')) impact = Math.min(1, impact + 0.15);

        // Estimate effort based on type and size
        let effort = 0.5;
        if (note.type === 'nebula' || note.type === 'galaxy') effort = 0.8;
        else if (note.type === 'sun' || note.type === 'jupiter') effort = 0.7;
        else if (note.type === 'asteroid' || note.type === 'comet') effort = 0.2;

        if (tags.includes('quick') || tags.includes('easy')) effort = Math.max(0, effort - 0.2);
        if (tags.includes('complex') || tags.includes('hard')) effort = Math.min(1, effort + 0.2);

        // Create adapted note for cognitive engine
        const adaptedNote = {
            id: note.id,
            x: note.x,
            y: note.y,
            w: note.w,
            h: note.h,
            vx: 0,
            vy: 0,
            mass: 1,
            fixed: false,
            linkCount: 0,
            accessCount: 1,
            lastModified: Date.now(),
            lastAccessed: Date.now(),
            type: note.type as any,
            title: '',
            content: '',
            tags: note.tags || [],
            priority: (note.priority || 'medium') as 'critical' | 'high' | 'medium' | 'low',
            impact,
            effort,
            createdAt: note.createdAt || Date.now(),
            updatedAt: Date.now()
        };

        return evaluateNote(adaptedNote as any);
    }

    // Public API
    getEvaluation(noteId: string): MatrixCoordinate | undefined {
        return this.noteEvaluations.get(noteId);
    }

    getPruningCandidates(): string[] {
        return Array.from(this.pruningCandidates);
    }

    shouldPrune(noteId: string): boolean {
        return this.pruningCandidates.has(noteId);
    }
}

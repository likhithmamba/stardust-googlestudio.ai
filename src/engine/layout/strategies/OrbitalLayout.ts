import type { EngineNote, WorldConfig } from '../../types/EngineTypes';
import type { LayoutStrategy } from '../LayoutStrategy';
import { ORBITAL_CONFIG, type Vector2 } from '../LayoutConstants';
import type { GravityScore } from '../../../types/StardustSchema';
import {
    calculateGravityScore,
} from '../../cognitive/OrbitalEngine';

/**
 * ORBITAL LAYOUT - Gravity-Based Force-Directed Layout
 * Uses G_score = (Links × 1.5 + AccessCount × 0.5) × e^(-λt)
 * to determine orbital ring placement
 */
export class OrbitalLayout implements LayoutStrategy {
    private gravityScores: Map<string, GravityScore> = new Map();
    private rotationOffset: number = 0;
    private lastUpdate: number = 0;

    calculateTargets(notes: EngineNote[], config: WorldConfig): Map<string, Vector2> {
        const targets = new Map<string, Vector2>();
        const center = { x: config.centerX, y: config.centerY };

        // Slow rotation for visual effect (2π per 60 seconds)
        const now = Date.now();
        if (this.lastUpdate > 0) {
            const dt = (now - this.lastUpdate) / 1000;
            this.rotationOffset += dt * (Math.PI / 30); // Full rotation per minute
        }
        this.lastUpdate = now;

        const minDimension = Math.min(config.width, config.height) / config.zoom;
        const baseSize = minDimension / 2;
        const { RADII_PCT, MIN_RADII } = ORBITAL_CONFIG;

        // Calculate gravity scores for all notes
        this.updateGravityScores(notes);

        // Group notes by priority rings
        const zones: Record<'critical' | 'high' | 'medium' | 'low', EngineNote[]> = {
            critical: [],
            high: [],
            medium: [],
            low: []
        };

        notes.forEach(n => {
            // Stars/BlackHoles/Galaxies anchor at center
            if (n.type === 'sun' || n.type === 'black-hole' || n.type === 'galaxy' || n.type === 'nebula') {
                targets.set(n.id, center);
                return;
            }

            let p = n.priority;
            if (!p) {
                // Fallback to computed gravity score
                const score = this.gravityScores.get(n.id)?.score || 0;
                if (score >= 10) p = 'critical';
                else if (score >= 6) p = 'high';
                else if (score >= 2) p = 'medium';
                else p = 'low';
            }

            if (!zones[p]) p = 'medium';
            zones[p].push(n);
        });

        // Define radii for each zone based on screen size
        const radii = {
            critical: Math.max(baseSize * RADII_PCT.critical, MIN_RADII.critical),
            high: Math.max(baseSize * RADII_PCT.high, MIN_RADII.high),
            medium: Math.max(baseSize * RADII_PCT.medium, MIN_RADII.medium),
            low: Math.max(baseSize * RADII_PCT.low, MIN_RADII.low)
        };

        // Place notes in concentric rings with rotation
        Object.entries(zones).forEach(([zone, zoneNotes]) => {
            const radius = radii[zone as keyof typeof radii];
            const count = zoneNotes.length;

            if (count === 0) return;

            const angleStep = (2 * Math.PI) / count;
            // Offset each ring slightly for visual separation
            const ringOffset = zone === 'critical' ? 0 
                             : zone === 'high' ? Math.PI / 6 
                             : zone === 'medium' ? Math.PI / 3 
                             : Math.PI / 2;

            const speedMultiplier = zone === 'critical' ? 1.5 
                                  : zone === 'high' ? 1.0 
                                  : zone === 'medium' ? 0.6 
                                  : 0.25;

            zoneNotes.forEach((note, i) => {
                const angle = i * angleStep + (this.rotationOffset * speedMultiplier) + ringOffset;
                targets.set(note.id, {
                    x: center.x + radius * Math.cos(angle),
                    y: center.y + radius * Math.sin(angle)
                });
            });
        });

        return targets;
    }

    private updateGravityScores(notes: EngineNote[]): void {
        notes.forEach(note => {
            // Convert EngineNote to format expected by cognitive engine
            const adaptedNote = {
                ...note,
                linkCount: 0, // Count from connections if available
                accessCount: 1,
                lastModified: note.createdAt || Date.now(),
                lastAccessed: Date.now(),
                title: '',
                content: '',
                tags: note.tags || [],
                priority: note.priority || 'medium' as const,
                impact: 0.5,
                effort: 0.5,
                createdAt: note.createdAt || Date.now(),
                updatedAt: Date.now()
            };

            const score = calculateGravityScore(adaptedNote as any);
            this.gravityScores.set(note.id, score);
        });
    }

    // Public API for external access to gravity scores
    getGravityScores(): Map<string, GravityScore> {
        return this.gravityScores;
    }
}

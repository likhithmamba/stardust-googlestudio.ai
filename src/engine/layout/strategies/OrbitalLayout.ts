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

        // Group notes by gravity zone
        const zones: Record<string, EngineNote[]> = {
            core: [],
            active: [],
            periphery: []
        };

        notes.forEach(n => {
            // Stars/BlackHoles/Galaxies anchor at center
            if (n.type === 'sun' || n.type === 'black-hole' || n.type === 'galaxy' || n.type === 'nebula') {
                targets.set(n.id, center);
                return;
            }

            const score = this.gravityScores.get(n.id);
            const zone = score?.zone || 'periphery';
            zones[zone].push(n);
        });

        // Define radii for each zone based on screen size
        const radii = {
            core: Math.max(baseSize * RADII_PCT.critical, MIN_RADII.critical),
            active: Math.max(baseSize * RADII_PCT.medium, MIN_RADII.medium),
            periphery: Math.max(baseSize * RADII_PCT.low, MIN_RADII.low)
        };

        // Place notes in concentric rings with rotation
        Object.entries(zones).forEach(([zone, zoneNotes]) => {
            const radius = radii[zone as keyof typeof radii];
            const count = zoneNotes.length;

            if (count === 0) return;

            const angleStep = (2 * Math.PI) / count;
            // Offset each ring slightly for visual separation
            const ringOffset = zone === 'core' ? 0 : zone === 'active' ? Math.PI / 6 : Math.PI / 3;

            const speedMultiplier = zone === 'core' ? 1.5 : zone === 'active' ? 0.8 : 0.3;

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

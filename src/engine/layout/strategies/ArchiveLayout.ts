import type { EngineNote, WorldConfig } from '../../types/EngineTypes';
import type { LayoutStrategy } from '../LayoutStrategy';
import type { Vector2 } from '../LayoutConstants';

export class ArchiveLayout implements LayoutStrategy {
    private rotationOffset: number = 0;
    private lastUpdate: number = 0;

    calculateTargets(notes: EngineNote[], config: WorldConfig): Map<string, Vector2> {
        const targets = new Map<string, Vector2>();
        const center = { x: config.centerX, y: config.centerY };

        // Slow rotation for visual effect
        const now = Date.now();
        if (this.lastUpdate > 0) {
            const dt = (now - this.lastUpdate) / 1000;
            this.rotationOffset += dt * (Math.PI / 45); // Slower orbit (full rotation every 90 seconds)
        }
        this.lastUpdate = now;

        const count = notes.length;
        if (count === 0) return targets;

        // Radii matching the DecayOverlay design rings (diameter 800px and 1000px)
        const radius1 = 400; // Inner ring
        const radius2 = 500; // Outer ring

        notes.forEach((note, i) => {
            // Alternate between inner and outer rings
            const isInner = i % 2 === 0;
            const radius = isInner ? radius1 : radius2;

            // Compute angle for note, offset by rotation and staggering to prevent overlap
            const ringCount = isInner ? Math.ceil(count / 2) : Math.floor(count / 2);
            const ringIndex = Math.floor(i / 2);
            const angleStep = ringCount > 0 ? (2 * Math.PI) / ringCount : 0;
            
            const offset = isInner ? 0 : Math.PI / Math.max(1, ringCount); // staggering
            const speedMultiplier = isInner ? 0.4 : 0.25;

            const angle = ringIndex * angleStep + (this.rotationOffset * speedMultiplier) + offset;

            targets.set(note.id, {
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle)
            });
        });

        return targets;
    }
}

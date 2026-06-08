import { World } from '../World';
import type { LayoutStrategy } from './LayoutStrategy';
import { OrbitalLayout } from './strategies/OrbitalLayout';
import { MatrixLayout } from './strategies/MatrixLayout';
import { TimelineLayout } from './strategies/TimelineLayout';
import { PrismLayout } from './strategies/PrismLayout';
import { ArchiveLayout } from './strategies/ArchiveLayout';
import type { Vector2 } from './LayoutConstants';

export class LayoutManager {
    private strategies: Map<string, LayoutStrategy> = new Map();
    private world: World;

    constructor(world: World) {
        this.world = world;
        this.strategies.set('orbital', new OrbitalLayout());
        this.strategies.set('matrix', new MatrixLayout());
        this.strategies.set('timeline', new TimelineLayout());
        this.strategies.set('prism', new PrismLayout());
        this.strategies.set('archive', new ArchiveLayout());
    }

    public getTargets(): Map<string, Vector2> {
        if (this.world.mode === 'free' || this.world.mode === 'void') {
            return new Map(); // No forced targets in free mode
        }

        const strategy = this.strategies.get(this.world.mode);
        if (!strategy) return new Map();

        // Prepare simple array for strategy
        const notes = Array.from(this.world.notes.values());

        // Pass World Config (converted to simple config)
        const config = {
            width: this.world.width,
            height: this.world.height,
            zoom: this.world.zoom,
            centerX: 0, // Anchor layout to stable world origin (0,0) to prevent pan desync
            centerY: 0
        };

        return strategy.calculateTargets(notes, config);
    }
}

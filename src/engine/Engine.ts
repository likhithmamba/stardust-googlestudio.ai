import { FLAGS } from './flags/FeatureFlags';
import { World, world } from './World';
import type { LayoutMode } from './types/EngineTypes';
import { LayoutManager } from './layout/LayoutManager';
import { PhysicsSystem } from './physics/PhysicsSystem';
import { SingularitySystem } from './physics/SingularitySystem';
import { visualRegistry } from './render/VisualRegistry';

export class Engine {
    private static instance: Engine;

    private rafId: number | null = null;
    private isRunning: boolean = false;
    private world: World;

    // Callbacks for visual updates (avoiding React setState per frame)
    private onTickCallbacks: Set<() => void> = new Set();

    private layoutManager: LayoutManager;
    private physicsSystem: PhysicsSystem;
    private singularitySystem: SingularitySystem;

    private constructor() {
        this.world = world;
        this.layoutManager = new LayoutManager(this.world);
        this.physicsSystem = new PhysicsSystem(this.world);
        this.singularitySystem = new SingularitySystem(this.world, this.handleConsumption);
    }

    private handleConsumption = (victimId: string, _consumerId: string) => {
        // Remove from World immediately
        this.world.notes.delete(victimId);
        // Clean up connections — collect IDs first to avoid mutating during iteration
        const connIdsToDelete: string[] = [];
        this.world.connections.forEach((c, id) => {
            if (c.from === victimId || c.to === victimId) {
                connIdsToDelete.push(id);
            }
        });
        connIdsToDelete.forEach(id => this.world.connections.delete(id));

        // Notify React to sync the deletion
        window.dispatchEvent(new CustomEvent('stardust:delete-note', { detail: { id: victimId } }));
    };

    private lastTime: number = 0;
    private accumulator: number = 0;
    private readonly TIMESTEP: number = 1000 / 60; // 60 FPS target timestep (16.67ms)

    public static getInstance(): Engine {
        if (!Engine.instance) {
            Engine.instance = new Engine();
        }
        return Engine.instance;
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.loop();
    }

    public stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    public subscribe(callback: () => void) {
        this.onTickCallbacks.add(callback);
        return () => this.onTickCallbacks.delete(callback);
    }

    private loop = () => {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        let deltaTime = currentTime - this.lastTime;
        // Clamp deltaTime to prevent spiral of death during lag spikes
        if (deltaTime > 250) deltaTime = 250;
        this.lastTime = currentTime;

        this.accumulator += deltaTime;

        while (this.accumulator >= this.TIMESTEP) {
            // 1. Calculate Layout Targets
            let targets = new Map<string, { x: number; y: number }>();
            if (FLAGS.ENABLE_LAYOUT) {
                targets = this.layoutManager.getTargets();
            }

            // 2. Physics Step
            if (FLAGS.ENABLE_PHYSICS) {
                this.physicsSystem.step(targets);
            }

            // 3. Singularity Step
            if (FLAGS.ENABLE_SINGULARITY) {
                this.singularitySystem.step();
            }

            this.accumulator -= this.TIMESTEP;
        }

        // 4. Visual Sync (once per rendering frame)
        if (FLAGS.ENABLE_RENDER) {
            this.notifyVisuals();
        }

        this.rafId = requestAnimationFrame(this.loop);
    };

    private notifyVisuals() {
        // 1. Direct DOM Updates via Registry
        this.world.notes.forEach(note => {
            // We can check if scaling is needed, e.g. from Singularity
            const scale = (note as any)?.tempScale || 1;
            visualRegistry.updatePosition(note.id, note.x, note.y, scale);
        });

        this.world.connections.forEach(conn => {
            const source = this.world.notes.get(conn.from);
            const target = this.world.notes.get(conn.to);
            if (source && target) {
                // Get center positions (approximate if w/h not set in Engine yet, but they should be)
                // Note: EngineNote has w/h.
                const sx = source.x + (source.w || 0) / 2;
                const sy = source.y + (source.h || 0) / 2;
                const tx = target.x + (target.w || 0) / 2;
                const ty = target.y + (target.h || 0) / 2;
                visualRegistry.updateConnection(conn.id, sx, sy, tx, ty);
            }
        });

        // 2. Notify other subscribers
        this.onTickCallbacks.forEach(cb => cb());
    }

    // --- Public API for React ---

    public setMode(mode: LayoutMode, targets?: Map<string, { x: number; y: number }>) {
        this.world.setMode(mode, targets);
    }

    public updateConfig(viewport: { width: number; height: number; zoom: number; x: number; y: number }) {
        this.world.updateViewport(viewport.width, viewport.height, viewport.zoom, viewport.x, viewport.y);
    }

    public getWorld() {
        return this.world;
    }
}

export const engine = Engine.getInstance();

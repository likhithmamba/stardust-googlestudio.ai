import { World } from '../World';
import type { Vector2 } from '../layout/LayoutConstants';

const PHYSICS_CONFIG = {
    springStrength: 0.1,
    damping: 0.9,
    repulsionStrength: 200000,
    sleepThreshold: 0.001
};

export class PhysicsSystem {
    private world: World;

    constructor(world: World) {
        this.world = world;
    }

    public step(layoutTargets: Map<string, Vector2>) {
        const forces = new Map<string, { fx: number; fy: number }>();

        const addForce = (id: string, fx: number, fy: number) => {
            const current = forces.get(id) || { fx: 0, fy: 0 };
            forces.set(id, { fx: current.fx + fx, fy: current.fy + fy });
        };

        const notes = Array.from(this.world.notes.values());

        // Culling buffers
        const viewportBuffer = 1000;
        const viewL = this.world.camera.x - this.world.width / 2 / this.world.zoom - viewportBuffer;
        const viewR = this.world.camera.x + this.world.width / 2 / this.world.zoom + viewportBuffer;
        const viewT = this.world.camera.y - this.world.height / 2 / this.world.zoom - viewportBuffer;
        const viewB = this.world.camera.y + this.world.height / 2 / this.world.zoom + viewportBuffer;

        // Optimization: Filter active notes
        const activeNotes = notes.filter(note =>
            !note.fixed &&
            note.x > viewL && note.x < viewR && note.y > viewT && note.y < viewB
        );

        // 1. Layout Forces (Attractors)
        activeNotes.forEach(note => {
            const target = layoutTargets.get(note.id);
            if (target) {
                const dx = target.x - note.x;
                const dy = target.y - note.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Snap if very close to stop jitter
                if (dist < 1.0) {
                    addForce(note.id, dx * 1000, dy * 1000); // Super spring
                } else {
                    let strength = PHYSICS_CONFIG.springStrength;
                    // Mode Tuning
                    if (this.world.mode === 'prism' || this.world.mode === 'matrix') strength = 0.2;
                    else if (this.world.mode === 'timeline') strength = 0.15;
                    else if (this.world.mode === 'orbital') strength = 0.03;

                    addForce(note.id, dx * strength, dy * strength);
                }
            }

            // --- USER REQUEST: COGNITIVE PIPELINE PHYSICS ---

            // 1. VOID MODE: Brownian Drift (Chaos Engine)
            // "In Void mode, nodes should float (drift)... If you can’t be bothered to drag it, let it drift away."
            if (this.world.mode === 'void' && !note.fixed) {
                const BR_STRENGTH = 0.05; // Gentle drift
                const angle = Math.random() * Math.PI * 2;
                addForce(note.id, Math.cos(angle) * BR_STRENGTH, Math.sin(angle) * BR_STRENGTH);
            }


            // 2. MATRIX MODE: Resistance (Decision Engine)
            // "Drag a note from 'Starlight' to 'Solar Core'. It should feel heavy to move it there."
            if (this.world.mode === 'matrix') {
                // Ensure we have stable center
                const cx = 0;
                const cy = 0;

                // Solar Core is Top-Left Quadrant relative to center
                const inSolarCore = note.x < cx && note.y < cy;

                if (inSolarCore) {
                    // Apply resistance! A force pushing OUT from the center of the quadrant
                    const qCx = cx - 300; // Approx center of quadrant
                    const qCy = cy - 300;
                    const dx = note.x - qCx;
                    const dy = note.y - qCy;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 400) { // Field of resistance
                        // Push away
                        const RESISTANCE = 200 / (dist + 1);
                        addForce(note.id, (dx / dist) * RESISTANCE, (dy / dist) * RESISTANCE);
                    }
                }
            }
        });

        // 2. Link Forces (Springs)
        // Only if NOT free mode (per original spec: Free Mode links are visual only)
        // UPDATE: User wants "Gravitational Drag" in Orbital Mode.
        const effectiveMode = this.world.mode;
        if (effectiveMode !== 'free') {
            let LINK_STRENGTH = 0.05;
            const LINK_DISTANCE = 300;

            // "Gravitational Drag: An expert uses Orbit to visualize dependency."
            if (effectiveMode === 'orbital') {
                LINK_STRENGTH = 0.15; // Stronger bonds in Orbit
            }

            this.world.connections.forEach(conn => {
                const source = this.world.notes.get(conn.from);
                const target = this.world.notes.get(conn.to);

                if (source && target && (!source.fixed || !target.fixed)) {
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 0) {
                        const displacement = dist - LINK_DISTANCE;
                        const force = displacement * LINK_STRENGTH;
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;

                        if (!source.fixed) addForce(source.id, fx, fy);
                        if (!target.fixed) addForce(target.id, -fx, -fy);
                    }
                }
            });
        }

        // 3. Integration
        activeNotes.forEach(note => {
            const f = forces.get(note.id);

            // Damping for all
            if (!f) {
                let vx = note.vx * PHYSICS_CONFIG.damping;
                let vy = note.vy * PHYSICS_CONFIG.damping;
                if (Math.abs(vx) < PHYSICS_CONFIG.sleepThreshold) vx = 0;
                if (Math.abs(vy) < PHYSICS_CONFIG.sleepThreshold) vy = 0;

                note.vx = vx;
                note.vy = vy;
            } else {
                const ax = f.fx / (note.mass || 1);
                const ay = f.fy / (note.mass || 1);

                note.vx = (note.vx + ax) * PHYSICS_CONFIG.damping;
                note.vy = (note.vy + ay) * PHYSICS_CONFIG.damping;
            }

            // Apply Velocity
            note.x += note.vx;
            note.y += note.vy;

            // NaN Guard
            if (isNaN(note.x)) note.x = 0;
            if (isNaN(note.y)) note.y = 0;
        });
    }
}

/**
 * STARDUST COMPUTE WORKER
 * Handles all physics, layout, and cognitive computations off main thread
 * Communicates via MessageChannel for 60fps performance
 * 
 * @module engine.worker
 * @author ImperialX
 */

import {
    calculateAllGravityScores,
    buildQuadtree,
    calculateRepulsionForce,
    detectSemanticClusters,
    getGravityOrbitalTargets
} from '../engine/cognitive/OrbitalEngine';

import {
    evaluateAllNotes,
    getPruningCandidates,
    applyGhostLayer,
    getMatrixLayoutTargets
} from '../engine/cognitive/MatrixEngine';

import {
    calculateProjectVelocity,
    createSnapshot,
    calculateSnapshotDiff,
    getStateAtTime,
    getTimelineLayoutTargets
} from '../engine/cognitive/TimelineEngine';

import {
    refractNote,
    refractNotes,
    getPrismLayoutTargets,
    getFacetStatistics
} from '../engine/cognitive/PrismEngine';

import type {
    Note,
    Link,
    Vector2,
    Bounds,
    GravityScore,
    SpectralFacets,
    Snapshot,
    SnapshotDiff,
    WorkerMessage,
    WorkerResult,
    GhostLayer
} from '../types/StardustSchema';

// === MESSAGE HANDLERS ===

type MessageHandler = (payload: any) => any;

const handlers: Record<string, MessageHandler> = {
    // === ORBITAL ENGINE ===

    CALCULATE_GRAVITY_SCORES: (payload: { notes: Note[] }) => {
        const scores = calculateAllGravityScores(payload.notes);
        return Object.fromEntries(scores);
    },

    BUILD_QUADTREE: (payload: { notes: Note[]; bounds: Bounds }) => {
        return buildQuadtree(payload.notes, payload.bounds);
    },

    CALCULATE_REPULSION: (payload: { note: Note; quadtree: any; strength: number }) => {
        return calculateRepulsionForce(payload.note, payload.quadtree, payload.strength);
    },

    DETECT_CLUSTERS: (payload: { notes: Note[]; threshold?: number }) => {
        return detectSemanticClusters(payload.notes, payload.threshold);
    },

    GET_ORBITAL_TARGETS: (payload: {
        notes: Note[];
        center: Vector2;
        gravityScores: Record<string, GravityScore>;
        rotationOffset?: number;
    }) => {
        const scoresMap = new Map(Object.entries(payload.gravityScores));
        const targets = getGravityOrbitalTargets(
            payload.notes,
            payload.center,
            scoresMap,
            payload.rotationOffset || 0
        );
        return Object.fromEntries(targets);
    },

    // === MATRIX ENGINE ===

    EVALUATE_NOTES: (payload: { notes: Note[] }) => {
        return evaluateAllNotes(payload.notes);
    },

    GET_PRUNING_CANDIDATES: (payload: { notes: Note[] }) => {
        return getPruningCandidates(payload.notes).map(n => n.id);
    },

    APPLY_GHOST_LAYER: (payload: { notes: Note[]; layer: GhostLayer }) => {
        const mapping = applyGhostLayer(payload.notes, payload.layer);
        return Object.fromEntries(mapping);
    },

    GET_MATRIX_TARGETS: (payload: {
        notes: Note[];
        center: Vector2;
        dimensions: { width: number; height: number };
    }) => {
        const targets = getMatrixLayoutTargets(payload.notes, payload.center, payload.dimensions);
        return Object.fromEntries(targets);
    },

    // === TIMELINE ENGINE ===

    CALCULATE_VELOCITY: (payload: { notes: Note[]; windowDays?: number }) => {
        return calculateProjectVelocity(payload.notes, payload.windowDays);
    },

    CREATE_SNAPSHOT: (payload: {
        notes: Note[];
        links: Link[];
        viewport: any;
        mode: string;
    }) => {
        return createSnapshot(payload.notes, payload.links, payload.viewport, payload.mode as any);
    },

    CALCULATE_DIFF: (payload: { before: Snapshot; after: Snapshot }) => {
        return calculateSnapshotDiff(payload.before, payload.after);
    },

    GET_STATE_AT_TIME: (payload: {
        baseSnapshot: Snapshot;
        diffs: SnapshotDiff[];
        targetTimestamp: number;
    }) => {
        return getStateAtTime(payload.baseSnapshot, payload.diffs, payload.targetTimestamp);
    },

    GET_TIMELINE_TARGETS: (payload: {
        notes: Note[];
        center: Vector2;
        pixelsPerDay?: number;
    }) => {
        const targets = getTimelineLayoutTargets(payload.notes, payload.center, payload.pixelsPerDay);
        return Object.fromEntries(targets);
    },

    // === PRISM ENGINE ===

    REFRACT_NOTE: (payload: { markdown: string }) => {
        return refractNote(payload.markdown);
    },

    REFRACT_NOTES: (payload: { notes: Note[] }) => {
        const results = refractNotes(payload.notes);
        return Object.fromEntries(results);
    },

    GET_FACET_STATS: (payload: { facets: SpectralFacets }) => {
        return getFacetStatistics(payload.facets);
    },

    GET_PRISM_TARGETS: (payload: {
        notes: Note[];
        center: Vector2;
        columnWidth?: number;
    }) => {
        const targets = getPrismLayoutTargets(payload.notes, payload.center, payload.columnWidth);
        return Object.fromEntries(targets);
    },

    // === PHYSICS COMPUTATION ===

    COMPUTE_PHYSICS_STEP: (payload: {
        notes: Note[];
        targets: Record<string, Vector2>;
        mode: string;
        config: {
            springStrength: number;
            damping: number;
            repulsionStrength: number;
        };
    }) => {
        const { notes, targets, mode, config } = payload;
        const forces = new Map<string, { fx: number; fy: number }>();

        const addForce = (id: string, fx: number, fy: number) => {
            const current = forces.get(id) || { fx: 0, fy: 0 };
            forces.set(id, { fx: current.fx + fx, fy: current.fy + fy });
        };

        // 1. Layout attractor forces
        for (const note of notes) {
            if (note.fixed) continue;

            const target = targets ? Reflect.get(targets, note.id) : undefined;
            if (target) {
                const dx = target.x - note.x;
                const dy = target.y - note.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                let strength = config.springStrength;
                if (mode === 'prism' || mode === 'matrix') strength = 0.2;
                else if (mode === 'timeline') strength = 0.15;
                else if (mode === 'orbital') strength = 0.03;

                if (dist < 1.0) {
                    addForce(note.id, dx * 1000, dy * 1000);
                } else {
                    addForce(note.id, dx * strength, dy * strength);
                }
            }
        }

        // 2. Build quadtree for repulsion
        if (notes.length > 10) {
            const bounds: Bounds = {
                minX: Math.min(...notes.map(n => n.x)) - 1000,
                minY: Math.min(...notes.map(n => n.y)) - 1000,
                maxX: Math.max(...notes.map(n => n.x)) + 1000,
                maxY: Math.max(...notes.map(n => n.y)) + 1000
            };

            const quadtree = buildQuadtree(notes, bounds);
            if (quadtree) {
                for (const note of notes) {
                    if (note.fixed) continue;
                    const repulsion = calculateRepulsionForce(note, quadtree, config.repulsionStrength);
                    addForce(note.id, repulsion.x, repulsion.y);
                }
            }
        }

        // 3. Calculate new positions
        const updates: Record<string, { x: number; y: number; vx: number; vy: number }> = {};

        for (const note of notes) {
            if (note.fixed) continue;

            const f = forces.get(note.id) || { fx: 0, fy: 0 };
            const mass = note.mass || 1;

            const ax = f.fx / mass;
            const ay = f.fy / mass;

            let vx = ((note.vx || 0) + ax) * config.damping;
            let vy = ((note.vy || 0) + ay) * config.damping;

            // Sleep threshold
            if (Math.abs(vx) < 0.001) vx = 0;
            if (Math.abs(vy) < 0.001) vy = 0;

            const newX = note.x + vx;
            const newY = note.y + vy;

            Reflect.set(updates, note.id, {
                x: isNaN(newX) ? note.x : newX,
                y: isNaN(newY) ? note.y : newY,
                vx,
                vy
            });
        }

        return updates;
    }
};

// === WORKER MESSAGE LISTENER ===

const handlersMap = new Map(Object.entries(handlers));

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const { type, payload, requestId } = event.data;

    const handler = handlersMap.get(type);
    if (!handler) {
        self.postMessage({
            type: 'ERROR',
            data: { message: `Unknown message type: ${type}` },
            requestId
        } as WorkerResult);
        return;
    }

    try {
        const result = handler(payload);

        self.postMessage({
            type: `${type}_RESULT`,
            data: result,
            requestId
        } as WorkerResult);
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            data: {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            },
            requestId
        } as WorkerResult);
    }
};

// Signal ready
self.postMessage({ type: 'READY', data: null });

/**
 * WORKER BRIDGE - Main Thread Interface
 * Provides a promise-based API for communicating with the compute worker
 * 
 * @module WorkerBridge
 * @author ImperialX
 */

import type {
    Note,
    Link,
    Vector2,
    GravityScore,
    SpectralFacets,
    Snapshot,
    ProjectVelocity,
    SemanticCluster,
    MatrixCoordinate,
    GhostLayer
} from '../types/StardustSchema';
import { validateWorkerResponse } from './messageValidator';

type PendingRequest = {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: number;
};

class WorkerBridge {
    private worker: Worker | null = null;
    private pendingRequests = new Map<string, PendingRequest>();
    private requestCounter = 0;
    // @ts-expect-error — used via readyPromise/readyResolve pattern
    private _isReady = false;
    private readyPromise: Promise<void>;
    private readyResolve!: () => void;

    constructor() {
        this.readyPromise = new Promise(resolve => {
            this.readyResolve = resolve;
        });
        this.initWorker();
    }

    private initWorker() {
        try {
            this._isReady = false;
            this.readyPromise = new Promise(resolve => {
                this.readyResolve = resolve;
            });
            // Create worker using Vite's worker import syntax
            this.worker = new Worker(
                new URL('./engine.worker.ts', import.meta.url),
                { type: 'module' }
            );

            this.worker.onmessage = this.handleMessage.bind(this);
            this.worker.onerror = this.handleError.bind(this);
        } catch (error) {
            console.error('Failed to initialize worker:', error);
        }
    }

    private handleMessage(event: MessageEvent) {
        // Validate all inbound messages with Zod
        const validated = validateWorkerResponse(event.data);
        if (!validated) return; // Invalid message silently dropped

        const { type, data, requestId } = validated;

        if (type === 'READY') {
            this._isReady = true;
            this.readyResolve();
            return;
        }

        if (type === 'ERROR' && requestId) {
            const pending = this.pendingRequests.get(requestId);
            if (pending) {
                this.pendingRequests.delete(requestId);
                clearTimeout(pending.timeout);
                pending.reject(new Error(data.message));
            }
            return;
        }

        if (requestId) {
            const pending = this.pendingRequests.get(requestId);
            if (pending) {
                this.pendingRequests.delete(requestId);
                clearTimeout(pending.timeout);
                pending.resolve(data);
            }
        }
    }

    private handleError(error: ErrorEvent) {
        console.error('Worker error:', error);
    }

    private async send<T>(type: string, payload: any, timeout = 5000): Promise<T> {
        if (!this.worker) {
            this.initWorker();
        }
        await this.readyPromise;

        if (!this.worker) {
            throw new Error('Worker not initialized');
        }

        const requestId = `req-${++this.requestCounter}`;

        return new Promise((resolve, reject) => {
            const timeoutId = window.setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error(`Worker request timed out: ${type}`));
            }, timeout);

            this.pendingRequests.set(requestId, {
                resolve,
                reject,
                timeout: timeoutId
            });

            this.worker!.postMessage({ type, payload, requestId });
        });
    }

    // === PUBLIC API ===

    async waitForReady(): Promise<void> {
        return this.readyPromise;
    }

    // --- Orbital Engine ---

    async calculateGravityScores(notes: Note[]): Promise<Record<string, GravityScore>> {
        return this.send('CALCULATE_GRAVITY_SCORES', { notes });
    }

    async detectClusters(notes: Note[], threshold?: number): Promise<SemanticCluster[]> {
        return this.send('DETECT_CLUSTERS', { notes, threshold });
    }

    async getOrbitalTargets(
        notes: Note[],
        center: Vector2,
        gravityScores: Record<string, GravityScore>,
        rotationOffset?: number
    ): Promise<Record<string, Vector2>> {
        return this.send('GET_ORBITAL_TARGETS', { notes, center, gravityScores, rotationOffset });
    }

    // --- Matrix Engine ---

    async evaluateNotes(notes: Note[]): Promise<MatrixCoordinate[]> {
        return this.send('EVALUATE_NOTES', { notes });
    }

    async getPruningCandidates(notes: Note[]): Promise<string[]> {
        return this.send('GET_PRUNING_CANDIDATES', { notes });
    }

    async applyGhostLayer(notes: Note[], layer: GhostLayer): Promise<Record<string, string>> {
        return this.send('APPLY_GHOST_LAYER', { notes, layer });
    }

    async getMatrixTargets(
        notes: Note[],
        center: Vector2,
        dimensions: { width: number; height: number }
    ): Promise<Record<string, { x: number; y: number; quadrant: string }>> {
        return this.send('GET_MATRIX_TARGETS', { notes, center, dimensions });
    }

    // --- Timeline Engine ---

    async calculateVelocity(notes: Note[], windowDays?: number): Promise<ProjectVelocity> {
        return this.send('CALCULATE_VELOCITY', { notes, windowDays });
    }

    async createSnapshot(
        notes: Note[],
        links: Link[],
        viewport: any,
        mode: string
    ): Promise<Snapshot> {
        return this.send('CREATE_SNAPSHOT', { notes, links, viewport, mode });
    }

    async getTimelineTargets(
        notes: Note[],
        center: Vector2,
        pixelsPerDay?: number
    ): Promise<Record<string, { x: number; y: number; dayOffset: number }>> {
        return this.send('GET_TIMELINE_TARGETS', { notes, center, pixelsPerDay });
    }

    // --- Prism Engine ---

    async refractNote(markdown: string): Promise<SpectralFacets> {
        return this.send('REFRACT_NOTE', { markdown });
    }

    async refractNotes(notes: Note[]): Promise<Record<string, SpectralFacets>> {
        return this.send('REFRACT_NOTES', { notes });
    }

    async getPrismTargets(
        notes: Note[],
        center: Vector2,
        columnWidth?: number
    ): Promise<Record<string, { x: number; y: number; wavelength: string }>> {
        return this.send('GET_PRISM_TARGETS', { notes, center, columnWidth });
    }

    // --- Physics ---

    async computePhysicsStep(
        notes: Note[],
        targets: Record<string, Vector2>,
        mode: string,
        config?: {
            springStrength?: number;
            damping?: number;
            repulsionStrength?: number;
        }
    ): Promise<Record<string, { x: number; y: number; vx: number; vy: number }>> {
        return this.send('COMPUTE_PHYSICS_STEP', {
            notes,
            targets,
            mode,
            config: {
                springStrength: config?.springStrength ?? 0.1,
                damping: config?.damping ?? 0.9,
                repulsionStrength: config?.repulsionStrength ?? 200000
            }
        });
    }

    // --- Lifecycle ---

    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.pendingRequests.forEach(req => {
            clearTimeout(req.timeout);
            req.reject(new Error('Worker terminated'));
        });
        this.pendingRequests.clear();
    }
}

// Singleton instance
export const workerBridge = new WorkerBridge();

export { WorkerBridge };

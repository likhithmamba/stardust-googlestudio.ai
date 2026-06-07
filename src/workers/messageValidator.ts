/**
 * STARDUST — Worker Message Validator
 * Zod-based validation for all WorkerBridge message payloads.
 * Invalid messages are silently dropped with a console warning.
 */

import { z } from 'zod';

// === Inbound Result Schemas (Worker → Main Thread) ===

const Vector2Schema = z.object({
    x: z.number().finite(),
    y: z.number().finite(),
});

const GravityScoreSchema = z.object({
    noteId: z.string(),
    score: z.number(),
    decayFactor: z.number(),
    zone: z.enum(['core', 'active', 'periphery']),
});

const PhysicsResultSchema = z.record(z.string(), z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    vx: z.number().finite(),
    vy: z.number().finite(),
}));

const LayoutResultSchema = z.record(z.string(), Vector2Schema);

const MatrixCoordinateSchema = z.object({
    noteId: z.string(),
    impact: z.number(),
    effort: z.number(),
    quadrant: z.enum(['do', 'plan', 'delegate', 'eliminate']),
    shouldPrune: z.boolean(),
});

const ClusterSchema = z.object({
    id: z.string(),
    noteIds: z.array(z.string()),
    sharedTags: z.array(z.string()),
    overlapScore: z.number(),
    suggestedBridgeTitle: z.string().optional(),
});

const VelocitySchema = z.object({
    creationRate: z.number(),
    completionRate: z.number(),
    ratio: z.number(),
    trend: z.enum(['accelerating', 'stable', 'decelerating']),
});

// === Worker Response Envelope ===

const WorkerResponseSchema = z.object({
    type: z.string(),
    data: z.any(),
    requestId: z.string().optional(),
});

// === Specific Result Type Validators ===

const resultValidators: Record<string, z.ZodType<any>> = {
    'COMPUTE_PHYSICS_RESULT': PhysicsResultSchema,
    'PHYSICS_RESULT': PhysicsResultSchema,
    'LAYOUT_RESULT': LayoutResultSchema,
    'CALCULATE_LAYOUT_RESULT': LayoutResultSchema,
    'MATRIX_RESULT': z.array(MatrixCoordinateSchema),
    'EVALUATE_MATRIX_RESULT': z.array(MatrixCoordinateSchema),
    'CLUSTERS_RESULT': z.array(ClusterSchema),
    'DETECT_CLUSTERS_RESULT': z.array(ClusterSchema),
    'VELOCITY_RESULT': VelocitySchema,
    'CALCULATE_VELOCITY_RESULT': VelocitySchema,
    'GRAVITY_SCORES_RESULT': z.record(z.string(), GravityScoreSchema),
    'ORBITAL_TARGETS_RESULT': LayoutResultSchema,
    'MATRIX_TARGETS_RESULT': z.record(z.string(), z.object({
        x: z.number().finite(),
        y: z.number().finite(),
        quadrant: z.string(),
    })),
    'TIMELINE_TARGETS_RESULT': z.record(z.string(), z.object({
        x: z.number().finite(),
        y: z.number().finite(),
        dayOffset: z.number(),
    })),
    'PRISM_TARGETS_RESULT': z.record(z.string(), z.object({
        x: z.number().finite(),
        y: z.number().finite(),
        wavelength: z.string(),
    })),
    'READY': z.any(),
    'ERROR': z.any(),
};

/**
 * Validate a worker response message.
 * Returns the parsed response if valid, null if invalid.
 * Invalid messages are logged as warnings and silently dropped.
 */
export function validateWorkerResponse(data: unknown): {
    type: string;
    data: any;
    requestId?: string;
} | null {
    // Validate envelope
    const envelope = WorkerResponseSchema.safeParse(data);
    if (!envelope.success) {
        console.warn('[WorkerValidator] Invalid message envelope:', envelope.error.message);
        return null;
    }

    const { type, data: payload, requestId } = envelope.data;

    // READY and ERROR are always valid
    if (type === 'READY' || type === 'ERROR') {
        return { type, data: payload, requestId };
    }

    // Validate payload against type-specific schema
    const validator = resultValidators[type];
    if (validator) {
        const result = validator.safeParse(payload);
        if (!result.success) {
            console.warn(`[WorkerValidator] Invalid payload for ${type}:`, result.error.message);
            return null;
        }
        return { type, data: result.data, requestId };
    }

    // Unknown type — pass through with warning
    console.warn(`[WorkerValidator] Unknown message type: ${type}`);
    return { type, data: payload, requestId };
}

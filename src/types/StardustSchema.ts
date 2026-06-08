/**
 * STARDUST ULTRA - Core Type Definitions
 * ImperialX Professional Architecture
 */

import type { ViewMode, NoteType } from '../constants';

// === CORE ENTITIES ===

export interface Note {
    id: string;

    // Spatial
    x: number;
    y: number;
    w: number;
    h: number;

    // Physics
    vx: number;
    vy: number;
    mass: number;
    fixed: boolean;

    // Gravity Score Components
    linkCount: number;
    accessCount: number;
    lastModified: number;    // Unix timestamp
    lastAccessed: number;    // Unix timestamp

    // Content
    type: NoteType;
    title: string;
    content: string;         // Markdown
    tags: string[];

    // Strategic Metadata
    priority: 'critical' | 'high' | 'medium' | 'low';
    impact: number;          // [0, 1] for Matrix Mode
    effort: number;          // [0, 1] for Matrix Mode

    // State
    createdAt: number;
    updatedAt: number;
    originMode?: ViewMode;
    isCompleted?: boolean;
    isDying?: boolean;

    // Extended (optional)
    clientName?: string;
    value?: number;
    questType?: 'main' | 'side';
    fontFamily?: 'sans' | 'serif' | 'mono' | 'Space Grotesk' | 'Cinzel' | 'Manrope';
}

export interface Link {
    id: string;
    from: string;            // Note ID
    to: string;              // Note ID
    label?: string;
    color?: string;
    weight: number;          // For semantic gravity
    createdAt: number;
}

export interface Viewport {
    x: number;
    y: number;
    zoom: number;
    width: number;
    height: number;
}

export interface GlobalState {
    notes: Map<string, Note>;
    links: Map<string, Link>;
    viewport: Viewport;
    mode: ViewMode;
    layoutVersion: number;
    transitionPhase: 'entering' | 'settling' | 'stable';
}

// === SNAPSHOT SYSTEM ===

export interface NoteSnapshot {
    id: string;
    x: number;
    y: number;
    title: string;
    tags: string[];
    priority: string;
}

export interface LinkSnapshot {
    id: string;
    from: string;
    to: string;
}

export interface Snapshot {
    id: string;
    timestamp: number;
    notes: NoteSnapshot[];
    links: LinkSnapshot[];
    viewport: Viewport;
    mode: ViewMode;
}

export interface SnapshotDiff {
    timestamp: number;
    delta: any;  // jsondiffpatch delta
}

// === COGNITIVE FRAMEWORK TYPES ===

export interface GravityScore {
    noteId: string;
    score: number;
    decayFactor: number;
    zone: 'core' | 'active' | 'periphery';
}

export interface SemanticCluster {
    id: string;
    noteIds: string[];
    sharedTags: string[];
    overlapScore: number;
    suggestedBridgeTitle?: string;
}

export interface MatrixCoordinate {
    noteId: string;
    impact: number;      // [0, 1]
    effort: number;      // [0, 1]
    quadrant: 'do' | 'plan' | 'delegate' | 'eliminate';
    shouldPrune: boolean;
}

export interface SpectralFacets {
    action: string[];      // Red: Tasks, deadlines, TODOs
    strategy: string[];    // Blue: Goals, "why", high-level
    resource: string[];    // Green: Data, links, code
    counter: string[];     // Violet: Anti-note, challenges
}

export interface ProjectVelocity {
    creationRate: number;      // Notes per day
    completionRate: number;    // Completed notes per day
    ratio: number;             // completionRate / creationRate
    trend: 'accelerating' | 'stable' | 'decelerating';
}

export interface ContextSwitchEntry {
    timestamp: number;
    fromTag: string;
    toTag: string;
    cacheNote?: string;     // Optional "context switch" note
}

// === PHYSICS TYPES ===

export interface Vector2 {
    x: number;
    y: number;
}

export interface QuadNode {
    x: number;
    y: number;
    width: number;
    height: number;
    mass: number;           // Aggregate mass
    centerOfMass: Vector2;
    children: QuadNode[] | null;
    notes: Note[] | null;   // Leaf nodes only
}

export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

// === WORKER MESSAGE TYPES ===

export type WorkerMessageType =
    | 'COMPUTE_PHYSICS'
    | 'CALCULATE_LAYOUT'
    | 'REFRACT_NOTE'
    | 'CREATE_SNAPSHOT'
    | 'CALCULATE_VELOCITY'
    | 'DETECT_CLUSTERS'
    | 'EVALUATE_MATRIX';

export interface WorkerMessage {
    type: WorkerMessageType;
    payload: any;
    requestId?: string;
}

export type WorkerResultType =
    | 'PHYSICS_RESULT'
    | 'LAYOUT_RESULT'
    | 'REFRACTION_RESULT'
    | 'SNAPSHOT_RESULT'
    | 'VELOCITY_RESULT'
    | 'CLUSTERS_RESULT'
    | 'MATRIX_RESULT'
    | 'COMPUTE_PHYSICS_RESULT'
    | 'CALCULATE_LAYOUT_RESULT'
    | 'REFRACT_NOTE_RESULT'
    | 'CREATE_SNAPSHOT_RESULT'
    | 'CALCULATE_VELOCITY_RESULT'
    | 'DETECT_CLUSTERS_RESULT'
    | 'EVALUATE_MATRIX_RESULT'
    | 'ERROR';

export interface WorkerResult {
    type: WorkerResultType;
    data: any;
    requestId?: string;
}

// === GHOST LAYER TYPES ===

export type GhostLayer = 'none' | 'moscow' | 'swot' | 'eisenhower';

export interface GhostOverlay {
    layer: GhostLayer;
    mapping: Map<string, string>;  // noteId -> layerCategory
}

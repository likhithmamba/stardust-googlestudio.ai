/**
 * Engine Type Definitions
 */

export type Vector2 = { x: number; y: number };

export interface EngineNote {
    id: string;
    // Physics State (Mutable in Engine)
    x: number;
    y: number;
    vx: number;
    vy: number;

    // Config properties (Read-only for Physics, Mutable by React)
    mass: number;
    fixed: boolean;
    w: number;
    h: number;

    // Metadata for Layouts
    type: string; // 'planet', 'star', etc.
    priority?: 'critical' | 'high' | 'medium' | 'low';
    tags?: string[];
    createdAt?: number;
    originMode?: string; // which mode created this
    visibleInModes?: string[]; // strictly allow visibility in these modes
    status?: 'todo' | 'in-progress' | 'review' | 'done' | 'archived' | string;
    dueDate?: number;
}

export interface EngineConnection {
    id: string;
    from: string;
    to: string;
    strength?: number;
    label?: string; // Phase 2: Smart Linking
}

export interface WorldConfig {
    width: number;
    height: number;
    zoom: number;
    centerX: number;
    centerY: number;
}

export type LayoutMode = 'free' | 'orbital' | 'constellation' | 'nebula' | 'project' | 'matrix' | 'prism' | 'timeline' | 'void' | 'stream' | 'archive';

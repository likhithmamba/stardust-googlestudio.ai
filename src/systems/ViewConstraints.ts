
import type { ViewMode } from '../constants';
import { ORBITAL_CONFIG, TIMELINE_CONFIG, PRISM_CONFIG } from '../engine/layout/LayoutConstants';

export interface DragConstraintResult {
    x: number;
    y: number;
    dataUpdates?: {
        tags?: string[];
        priority?: 'critical' | 'high' | 'medium' | 'low';
        originMode?: ViewMode;
        urgency?: 'urgent' | 'not-urgent';
        importance?: 'important' | 'not-important';
        status?: 'captured' | 'todo' | 'in-progress' | 'review' | 'done' | 'archived';
        dueDate?: number;
    };
}

export class ViewConstraints {

    /**
     * Applies magnetic constraints based on the active View Mode.
     * @param mode Current View Mode
     * @param targetX User's desired X position (cursor/drag)
     * @param targetY User's desired Y position (cursor/drag)
     * @param origin Layout center {x,y}
     * @param viewport Viewport dimensions for scaling
     * @returns Constrained position {x,y} and any data updates (tags, etc.)
     */
    static applyConstraints(
        mode: ViewMode,
        targetX: number,
        targetY: number,
        origin: { x: number; y: number },
        viewport: { width: number; height: number }
    ): DragConstraintResult {

        if (mode === 'free') {
            // Free mode: Identity (no constraint)
            return { x: targetX, y: targetY };
        }

        if (mode === 'orbital') {
            return this.getOrbitalConstraint(targetX, targetY, origin, viewport);
        }

        if (mode === 'matrix') {
            return this.getMatrixConstraint(targetX, targetY, origin, viewport);
        }

        if (mode === 'timeline') {
            return this.getTimelineConstraint(targetX, targetY, origin);
        }

        if (mode === 'prism') {
            return this.getPrismConstraint(targetX, targetY, origin);
        }

        if (mode === 'archive') {
            return this.getArchiveConstraint(targetX, targetY, origin);
        }

        // Void/Etc - Default to free for now or add specific logic
        return { x: targetX, y: targetY };
    }

    /**
     * ORBITAL LOGIC: Magnetic Ring Snapping
     */
    private static getOrbitalConstraint(
        x: number,
        y: number,
        origin: { x: number; y: number },
        viewport: { width: number; height: number }
    ): DragConstraintResult {
        const dx = x - origin.x;
        const dy = y - origin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const minDim = Math.min(viewport.width, viewport.height);
        const baseSize = minDim / 2;

        const { RADII_PCT, MIN_RADII } = ORBITAL_CONFIG;

        // Define Rings
        const rings = [
            { r: Math.max(MIN_RADII.critical, baseSize * RADII_PCT.critical), p: 'critical' },
            { r: Math.max(MIN_RADII.high, baseSize * RADII_PCT.high), p: 'high' },
            { r: Math.max(MIN_RADII.medium, baseSize * RADII_PCT.medium), p: 'medium' },
            { r: Math.max(MIN_RADII.low, baseSize * RADII_PCT.low), p: 'low' }
        ] as const;

        // Find closest ring
        // "Magnetic" effect: Always return the snapped radius
        const closest = rings.reduce((prev, curr) =>
            Math.abs(curr.r - dist) < Math.abs(prev.r - dist) ? curr : prev
        );

        // Snap position
        const snappedX = origin.x + closest.r * Math.cos(angle);
        const snappedY = origin.y + closest.r * Math.sin(angle);

        return {
            x: snappedX,
            y: snappedY,
            dataUpdates: {
                priority: closest.p as 'critical' | 'high' | 'medium' | 'low',
                originMode: 'orbital'
            }
        };
    }

    /**
     * MATRIX LOGIC: Quadrant Detection & "Box" Constraint
     */
    private static getMatrixConstraint(
        x: number,
        y: number,
        origin: { x: number; y: number },
        viewport: { width: number; height: number }
    ): DragConstraintResult {
        const relX = x - origin.x;
        const relY = y - origin.y;

        // Define Quadrants relative to Origin (0,0)
        // TL: Urgent/Impt | TR: Not Urgent/Impt
        // BL: Urgent/Not  | BR: Not/Not

        let tags: string[] = [];
        let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
        let urgency: 'urgent' | 'not-urgent' = 'not-urgent';
        let importance: 'important' | 'not-important' = 'not-important';

        const isLeft = relX < 0;
        const isTop = relY < 0;

        if (isLeft && isTop) {
            tags = ['crisis', 'solar-core'];
            priority = 'critical';
            urgency = 'urgent';
            importance = 'important';
        } else if (!isLeft && isTop) {
            tags = ['deep-work', 'nebula'];
            priority = 'high';
            urgency = 'not-urgent';
            importance = 'important';
        } else if (isLeft && !isTop) {
            tags = ['starlight'];
            priority = 'low';
            urgency = 'urgent';
            importance = 'not-important';
        } else {
            tags = ['void-dump'];
            priority = 'low';
            urgency = 'not-urgent';
            importance = 'not-important';
        }

        // Snap to grid relative to quadrant center
        const quadrantWidth = Math.max(300, viewport.width * 0.175);
        const quadrantHeight = Math.max(200, viewport.height * 0.175);

        const qx = isLeft ? -quadrantWidth : quadrantWidth;
        const qy = isTop ? -quadrantHeight : quadrantHeight;

        const quadCenterX = origin.x + qx;
        const quadCenterY = origin.y + qy;

        const localX = x - quadCenterX;
        const localY = y - quadCenterY;
        
        // Snap to 100px grid cells inside the quadrant
        const snappedLocalX = Math.round(localX / 100) * 100;
        const snappedLocalY = Math.round(localY / 100) * 100;

        const snappedX = quadCenterX + snappedLocalX;
        const snappedY = quadCenterY + snappedLocalY;

        return {
            x: snappedX,
            y: snappedY,
            dataUpdates: {
                tags,
                priority,
                urgency,
                importance,
                originMode: 'matrix'
            }
        };
    }

    /**
     * TIMELINE LOGIC: Y-Axis Lock & X Date Snap
     */
    private static getTimelineConstraint(
        x: number,
        y: number,
        origin: { x: number; y: number }
    ): DragConstraintResult {
        const { PIXELS_PER_DAY } = TIMELINE_CONFIG;

        // Date mapping based on X coordinate
        const daysOffset = Math.round((x - origin.x) / (PIXELS_PER_DAY || 100));
        const mappedDate = new Date();
        mappedDate.setDate(mappedDate.getDate() + daysOffset);

        // Lane mapping based on Y coordinate
        const totalHeight = 150 * 4;
        const startY = origin.y - totalHeight / 2;

        let laneIndex = Math.floor((y - startY) / 150);
        if (laneIndex < 0) laneIndex = 0;
        if (laneIndex > 3) laneIndex = 3;

        const snappedY = startY + (laneIndex * 150) + 75;
        const snappedX = origin.x + daysOffset * (PIXELS_PER_DAY || 100);
        const statuses: Array<'in-progress' | 'todo' | 'review' | 'done'> = ['in-progress', 'todo', 'review', 'done'];

        return {
            x: snappedX,
            y: snappedY,
            dataUpdates: {
                originMode: 'timeline',
                dueDate: mappedDate.getTime(),
                status: statuses[laneIndex]
            }
        };
    }

    /**
     * PRISM LOGIC: Kanban Lane Snapping
     */
    private static getPrismConstraint(
        x: number,
        y: number,
        origin: { x: number; y: number }
    ): DragConstraintResult {
        const totalWidth = PRISM_CONFIG.COL_WIDTH + PRISM_CONFIG.GAP;
        const relX = x - origin.x;

        let colIndex = Math.round((relX / totalWidth) + 1.5);
        if (colIndex < 0) colIndex = 0;
        if (colIndex > 3) colIndex = 3;

        const finalX = origin.x + (colIndex - 1.5) * totalWidth;
        const snappedY = origin.y + Math.round((y - origin.y) / 120) * 120;
        const statuses: Array<'todo' | 'in-progress' | 'review' | 'done'> = ['todo', 'in-progress', 'review', 'done'];

        return {
            x: finalX,
            y: snappedY,
            dataUpdates: {
                status: statuses[colIndex],
                originMode: 'prism'
            }
        };
    }

    /**
     * ARCHIVE LOGIC: Ring Snapping
     */
    private static getArchiveConstraint(
        x: number,
        y: number,
        origin: { x: number; y: number }
    ): DragConstraintResult {
        const dx = x - origin.x;
        const dy = y - origin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Define Rings matching ArchiveLayout
        const radius1 = 400;
        const radius2 = 500;

        // Find closest ring radius
        const closestR = Math.abs(radius1 - dist) < Math.abs(radius2 - dist) ? radius1 : radius2;

        // Snap position
        const snappedX = origin.x + closestR * Math.cos(angle);
        const snappedY = origin.y + closestR * Math.sin(angle);

        return {
            x: snappedX,
            y: snappedY,
            dataUpdates: {
                status: 'archived',
                originMode: 'archive'
            }
        };
    }
}

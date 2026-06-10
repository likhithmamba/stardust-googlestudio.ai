import type { Note } from '../store/useStore';

// Simple spatial hashing or quadtree implementation can go here.
// For MVP with <500 notes, a simple filter might suffice, but we'll structure for Quadtree.

export class SpatialIndex {
    // Placeholder for Quadtree logic
    // insert(note: Note)
    // query(rect: {x, y, w, h}): Note[]

    static getVisibleNotes(notes: Note[], viewport: { x: number, y: number, zoom: number }, width: number, height: number): Note[] {
        // Simple culling for now
        const viewX = -viewport.x / viewport.zoom;
        const viewY = -viewport.y / viewport.zoom;
        const viewW = width / viewport.zoom;
        const viewH = height / viewport.zoom;

        return notes.filter(note => {
            return (
                note.x + (note.w || 100) > viewX &&
                note.x < viewX + viewW &&
                note.y + (note.h || 100) > viewY &&
                note.y < viewY + viewH
            );
        });
    }

    /**
     * Hit test a point (x, y) in world space against note bounds (with optional tolerance padding).
     */
    static hitTest(notes: Note[], x: number, y: number, padding = 10): Note | undefined {
        return notes.find(note => {
            const w = note.w || 80;
            const h = note.h || 80;
            return (
                x >= note.x - padding &&
                x <= note.x + w + padding &&
                y >= note.y - padding &&
                y <= note.y + h + padding
            );
        });
    }
}

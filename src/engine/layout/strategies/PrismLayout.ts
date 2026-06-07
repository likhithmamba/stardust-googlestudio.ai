import type { EngineNote, WorldConfig } from '../../types/EngineTypes';
import type { LayoutStrategy } from '../LayoutStrategy';
import { PRISM_CONFIG, type Vector2 } from '../LayoutConstants';


/**
 * PRISM LAYOUT - Spectral Refraction Layout
 * Splits notes into 4 wavelengths: Action (Red), Strategy (Blue), 
 * Resource (Green), Counter (Violet)
 */
export class PrismLayout implements LayoutStrategy {
    private noteStatuses: Map<string, string> = new Map();

    calculateTargets(notes: EngineNote[], config: WorldConfig): Map<string, Vector2> {
        const targets = new Map<string, Vector2>();
        const center = { x: config.centerX, y: config.centerY };

        const columns = ['todo', 'in-progress', 'review', 'done'] as const;
        const { COL_WIDTH, GAP } = PRISM_CONFIG;
        const totalWidth = (columns.length * COL_WIDTH) + ((columns.length - 1) * GAP);
        const startX = center.x - (totalWidth / 2) + (COL_WIDTH / 2);

        // Count items per column for stacking
        const colCounts = { 'todo': 0, 'in-progress': 0, 'review': 0, 'done': 0 };

        // Sort notes deterministically by createdAt (fallback to ID) to guarantee stable column stacking
        const sortedNotes = [...notes].sort((a, b) => {
            const timeA = a.createdAt || 0;
            const timeB = b.createdAt || 0;
            if (timeA !== timeB) return timeA - timeB;
            return a.id.localeCompare(b.id);
        });

        sortedNotes.forEach(note => {
            let status = note.status || 'todo';
            if (status === 'captured' || status === 'archived') {
                status = 'todo';
            }
            this.noteStatuses.set(note.id, status);

            const colIndex = columns.indexOf(status as typeof columns[number]);
            const count = colCounts[status as keyof typeof colCounts]++;

            // Stack vertically within column
            const x = startX + (colIndex * (COL_WIDTH + GAP));
            const y = center.y - 400 + (count * 140);

            targets.set(note.id, { x, y });
        });

        return targets;
    }



    getColor(noteId: string): string {
        const status = this.noteStatuses.get(noteId) || 'todo';
        const statusColors: Record<string, string> = {
            'todo': '#94a3b8',
            'in-progress': '#60a5fa',
            'review': '#fbbf24',
            'done': '#34d399',
        };
        return statusColors[status] || '#94a3b8';
    }
}

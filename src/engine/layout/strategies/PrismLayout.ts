import type { EngineNote, WorldConfig } from '../../types/EngineTypes';
import type { LayoutStrategy } from '../LayoutStrategy';
import { PRISM_CONFIG, type Vector2 } from '../LayoutConstants';
import type { SpectralFacets } from '../../../types/StardustSchema';
import {
    SPECTRAL_COLORS,
} from '../../cognitive/PrismEngine';

/**
 * PRISM LAYOUT - Spectral Refraction Layout
 * Splits notes into 4 wavelengths: Action (Red), Strategy (Blue), 
 * Resource (Green), Counter (Violet)
 */
export class PrismLayout implements LayoutStrategy {
    private noteWavelengths: Map<string, keyof SpectralFacets> = new Map();

    calculateTargets(notes: EngineNote[], config: WorldConfig): Map<string, Vector2> {
        const targets = new Map<string, Vector2>();
        const center = { x: config.centerX, y: config.centerY };

        const columns = ['action', 'strategy', 'resource', 'counter'] as const;
        const { COL_WIDTH, GAP } = PRISM_CONFIG;
        const totalWidth = (columns.length * COL_WIDTH) + ((columns.length - 1) * GAP);
        const startX = center.x - (totalWidth / 2) + (COL_WIDTH / 2);

        // Count items per column for stacking
        const colCounts = { action: 0, strategy: 0, resource: 0, counter: 0 };

        // Sort notes deterministically by createdAt (fallback to ID) to guarantee stable column stacking
        const sortedNotes = [...notes].sort((a, b) => {
            const timeA = a.createdAt || 0;
            const timeB = b.createdAt || 0;
            if (timeA !== timeB) return timeA - timeB;
            return a.id.localeCompare(b.id);
        });

        sortedNotes.forEach(note => {
            // Determine wavelength based on content analysis
            const wavelength = this.determineWavelength(note);
            this.noteWavelengths.set(note.id, wavelength);

            const colIndex = columns.indexOf(wavelength as typeof columns[number]);
            const count = colCounts[wavelength as keyof typeof colCounts]++;

            // Stack vertically within column
            const x = startX + (colIndex * (COL_WIDTH + GAP));
            const y = center.y - 400 + (count * 140);

            targets.set(note.id, { x, y });
        });

        return targets;
    }

    private determineWavelength(note: EngineNote): keyof SpectralFacets {
        const tags = (note.tags || []).map(t => t.toLowerCase());

        // Quick tag-based classification
        if (tags.some(t => ['todo', 'task', 'action', 'deadline', 'urgent'].includes(t))) {
            return 'action';
        }
        if (tags.some(t => ['resource', 'reference', 'link', 'data', 'code'].includes(t))) {
            return 'resource';
        }
        if (tags.some(t => ['risk', 'concern', 'blocker', 'issue', 'problem'].includes(t))) {
            return 'counter';
        }
        if (tags.some(t => ['goal', 'strategy', 'vision', 'plan', 'objective'].includes(t))) {
            return 'strategy';
        }

        // Type-based fallback
        switch (note.type) {
            case 'sun':
            case 'galaxy':
            case 'nebula':
                return 'strategy'; // Big-picture items
            case 'black-hole':
                return 'counter'; // Risks/sinks
            case 'jupiter':
            case 'saturn':
                return 'resource'; // Large data stores
            case 'asteroid':
            case 'comet':
                return 'action'; // Quick tasks
            default:
                return 'strategy';
        }
    }

    // Public API for UI to access wavelength info
    getWavelength(noteId: string): keyof SpectralFacets | undefined {
        return this.noteWavelengths.get(noteId);
    }

    getColor(noteId: string): string {
        const wavelength = this.noteWavelengths.get(noteId) || 'strategy';
        return SPECTRAL_COLORS[wavelength as keyof typeof SPECTRAL_COLORS];
    }
}

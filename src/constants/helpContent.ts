/**
 * STARDUST — Help Content
 * Structured data for mode descriptions, keyboard shortcuts, and tips.
 * Source of truth for all in-app help content.
 */

export interface ModeHelp {
    id: string;
    title: string;
    tagline: string;
    description: string;
    primaryUseCase: string;
    keyInteraction: string;
    firstTimeTip: string;
    icon: string;
    color: string;
}

export const MODE_HELP: Record<string, ModeHelp> = {
    void: {
        id: 'void',
        title: 'Void Mode',
        tagline: 'Freeform thinking space',
        description: 'An infinite canvas where notes drift gently with physics. No structure, no judgment — just your thoughts floating in space. Double-click anywhere to create.',
        primaryUseCase: 'Quick capture, brainstorming, free association',
        keyInteraction: 'Double-click canvas to create a note at that position',
        firstTimeTip: 'Try creating a few notes and watch them drift. Drag to reposition. This is your default home.',
        icon: 'blur_on',
        color: '#6366f1',
    },
    matrix: {
        id: 'matrix',
        title: 'Matrix Mode',
        tagline: 'Eisenhower decision grid',
        description: 'Four quadrants divide your notes by urgency and importance. Do First (urgent + important), Schedule (important), Delegate (urgent), and Eliminate (neither). Drag notes between quadrants to re-prioritize.',
        primaryUseCase: 'Priority triage, decision making, time management',
        keyInteraction: 'Drag notes between quadrants to re-categorize them',
        firstTimeTip: 'Notes are auto-sorted by urgency and importance. Drag any note to a different quadrant to change its priority.',
        icon: 'grid_view',
        color: '#3b82f6',
    },
    orbital: {
        id: 'orbital',
        title: 'Orbital Mode',
        tagline: 'Gravitational priority rings',
        description: 'Four concentric rings arrange notes by gravity score. Ring 1 (center) holds your most critical items. Ring 4 (outer) is the graveyard for decayed notes. Notes orbit slowly — inner rings faster than outer.',
        primaryUseCase: 'Priority visualization, momentum tracking, focus management',
        keyInteraction: 'Drag notes between rings to change their priority level',
        firstTimeTip: 'Watch notes orbit at different speeds. Critical items stay close to the center. Faded notes drift outward.',
        icon: 'bubble_chart',
        color: '#6366f1',
    },
    prism: {
        id: 'prism',
        title: 'Prism Mode',
        tagline: 'Semantic knowledge clusters',
        description: 'Notes are grouped into colored semantic facets based on their content. Cross-facet connections render as curved arcs, revealing hidden relationships between different areas of your thinking.',
        primaryUseCase: 'Knowledge mapping, research organization, pattern discovery',
        keyInteraction: 'Drag notes between facet zones to re-assign their cluster',
        firstTimeTip: 'Your notes are grouped by topic. Look for curved arcs between zones — those show cross-topic connections.',
        icon: 'view_column',
        color: '#a855f7',
    },
    timeline: {
        id: 'timeline',
        title: 'Timeline Mode',
        tagline: 'Temporal velocity stream',
        description: 'Four horizontal lanes — Today, This Week, This Month, Older — show when notes were last touched. Active notes glow green. Stalled notes show a dashed orange border. This mode shows momentum, not just recency.',
        primaryUseCase: 'Progress tracking, velocity monitoring, stale detection',
        keyInteraction: 'Look for green glow (active) vs orange dashes (stalled)',
        firstTimeTip: 'Notes edited today appear in the top lane. Notice which notes are actively moving vs. which are gathering dust.',
        icon: 'timeline',
        color: '#eebd2b',
    },
};

export interface ShortcutGroup {
    title: string;
    shortcuts: { keys: string; description: string }[];
}

export const KEYBOARD_SHORTCUTS: ShortcutGroup[] = [
    {
        title: 'Navigation',
        shortcuts: [
            { keys: '1–5', description: 'Switch between Void, Matrix, Prism, Orbital, Timeline' },
            { keys: '0', description: 'Free canvas mode' },
            { keys: 'Space + Drag', description: 'Pan canvas' },
            { keys: 'Scroll', description: 'Zoom in/out (cursor-centered)' },
            { keys: '+/−', description: 'Zoom in/out' },
            { keys: '0 (with Ctrl)', description: 'Reset zoom to 100%' },
        ],
    },
    {
        title: 'Notes',
        shortcuts: [
            { keys: 'C', description: 'Create note at canvas center' },
            { keys: 'Double-click', description: 'Create note at cursor position' },
            { keys: 'E / Enter', description: 'Open selected note editor' },
            { keys: 'Delete', description: 'Delete selected note (with confirmation)' },
            { keys: 'Escape', description: 'Close editor / deselect' },
        ],
    },
    {
        title: 'Edit',
        shortcuts: [
            { keys: 'Ctrl+Z', description: 'Undo' },
            { keys: 'Ctrl+Y', description: 'Redo' },
            { keys: 'Ctrl+C', description: 'Copy selected notes' },
            { keys: 'Ctrl+V', description: 'Paste copied notes' },
        ],
    },
    {
        title: 'Panels',
        shortcuts: [
            { keys: 'Ctrl+K', description: 'Toggle search' },
            { keys: 'Ctrl+,', description: 'Toggle settings' },
            { keys: 'H', description: 'Toggle help overlay' },
            { keys: 'A', description: 'Toggle archive panel' },
            { keys: 'Ctrl+N', description: 'New constellation' },
        ],
    },
];

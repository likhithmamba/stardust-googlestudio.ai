import { aiGateway } from './AIGateway';
import type { Note } from '../store/noteSlice';

export interface PipelineResult {
    content: string;
    stageUsed: 1 | 2 | 3 | 4;
}

/**
 * Run the 4-Stage Cognitive Pipeline:
 * - Stage 1: Local fast-path verification (zero-state handling)
 * - Stage 2: Mode-Engine Heuristic Context Enrichment
 * - Stage 3: Remote LLM Synthesis via AIGateway
 * - Stage 4: Local Heuristic Heuristic Fallback on network/validation failure
 */
export async function runCognitivePipeline(
    notes: Note[],
    prompt: string,
    viewMode: string
): Promise<PipelineResult> {
    // --- STAGE 1: Local Parsing/Fast-Path ---
    if (notes.length === 0) {
        return {
            content: "### Constellation Void\nNo active stars exist in this workspace. Create notes first to execute synthesis.",
            stageUsed: 1
        };
    }

    // --- STAGE 2: Mode Engine Context Enrichment ---
    let modeContext = '';
    
    if (viewMode === 'matrix') {
        const doFirst = notes.filter(n => n.priority === 'critical').map(n => n.title || 'Untitled').join(', ');
        const schedule = notes.filter(n => n.priority === 'high').map(n => n.title || 'Untitled').join(', ');
        const delegate = notes.filter(n => n.priority === 'medium').map(n => n.title || 'Untitled').join(', ');
        const eliminate = notes.filter(n => n.priority === 'low').map(n => n.title || 'Untitled').join(', ');
        
        modeContext = `Eisenhower Matrix Quadrants:
- Do First (Critical): [${doFirst || 'None'}]
- Schedule (High): [${schedule || 'None'}]
- Delegate (Medium): [${delegate || 'None'}]
- Eliminate (Low): [${eliminate || 'None'}]`;
    } else if (viewMode === 'orbital') {
        const orbits = notes.map(n => `- ${n.title || 'Untitled'} (Priority/Ring: ${n.priority || 'medium'}, Luminance: ${Math.round((n.luminance ?? 1) * 100)}%)`).join('\n');
        modeContext = `Concentric Orbital Focus Rings:\n${orbits}`;
    } else if (viewMode === 'prism') {
        const statusGroups = notes.map(n => `- ${n.title || 'Untitled'} (Column Status: ${n.status || 'todo'}, Tags: ${JSON.stringify(n.tags || [])})`).join('\n');
        modeContext = `Prism Columns (Kanban Lane) distribution:\n${statusGroups}`;
    } else if (viewMode === 'timeline') {
        const times = notes.map(n => `- ${n.title || 'Untitled'} (Status: ${n.status || 'captured'}, Created: ${n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'N/A'})`).join('\n');
        modeContext = `Chronological timeline items:\n${times}`;
    } else {
        const items = notes.map(n => `- ${n.title || 'Untitled'} (Tags: ${JSON.stringify(n.tags || [])})`).join('\n');
        modeContext = `Workspace items:\n${items}`;
    }

    const enrichedPrompt = `User Prompt: "${prompt}"

Active View Lens: ${viewMode.toUpperCase()}
${modeContext}

Provide a comprehensive insights synthesis report based on this spatial structure.`;

    const systemInstruction = `You are the Stardust Spatial Intelligence Engine.
Analyze the user's workspace notes and mode structures, and synthesize insights in clean, structured Markdown format.`;

    // --- STAGE 3: Remote LLM execution ---
    try {
        const response = await aiGateway.generate(enrichedPrompt, systemInstruction);
        return {
            content: response,
            stageUsed: 3
        };
    } catch (e: any) {
        console.warn('[CognitivePipeline] Remote LLM query failed. Initiating fallback.', e);

        // --- STAGE 4: Local Heuristic Fallback ---
        const fallbackContent = generateLocalFallback(notes, viewMode);
        return {
            content: `### ⚠️ Offline Fallback Synthesis
Stardust is running in local fallback mode (API offline or key missing).

${fallbackContent}`,
            stageUsed: 4
        };
    }
}

/**
 * Generate a local heuristic summary of the notes to act as a fallback.
 */
function generateLocalFallback(notes: Note[], viewMode: string): string {
    const total = notes.length;
    const completed = notes.filter(n => n.status === 'done' || n.isCompleted).length;
    const critical = notes.filter(n => n.priority === 'critical').length;
    const tags = Array.from(new Set(notes.flatMap(n => n.tags || [])));
    
    return `#### Constellation Diagnostics:
- **Total Stars**: ${total}
- **Completed Items**: ${completed} (${total > 0 ? Math.round((completed / total) * 100) : 0}%)
- **Critical items**: ${critical}
- **Major Tags**: ${tags.length > 0 ? tags.map(t => `#${t}`).join(', ') : 'None categorized'}

#### Local Heuristic Recommendations for "${viewMode.toUpperCase()}" mode:
${viewMode === 'matrix' ? '- Review your critical stars. Ensure you address "Do First" before other quadrants.\n- Archive low priority items to reduce clutter.' : ''}
${viewMode === 'orbital' ? '- Address central stars showing low luminance. Low luminance stars will drift to the archive.\n- Maintain connection links between moons and orbits.' : ''}
${viewMode === 'prism' ? '- Check for column bottlenecks. If "review" column has too many stars, focus on testing.\n- Group similar stars by common tags.' : ''}
${viewMode === 'timeline' ? '- Track completed items by date to compute team speed metrics.\n- Revisit oldest notes to prevent decay.' : ''}
${viewMode === 'free' ? '- Link related ideas. Free mode connections help draw structural nodes closer.' : ''}
`;
}

// src/utils/ai.ts — Client-Side Multi-Model AI Service Routing
import { aiGateway } from '../ai/AIGateway';
import { runCognitivePipeline } from '../ai/CognitivePipeline';
import { stardustDB } from '../db/StardustDB';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../ui/settings/settingsStore';

export const AI_MODELS = {
    'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
    'gpt-4o-mini': 'GPT-4o Mini',
    'claude-3-5-haiku-latest': 'Claude 3.5 Haiku',
    'llama3': 'Llama 3 (Local)'
} as const;

export type AIModelId = keyof typeof AI_MODELS;

// --- Key Management (secured in IndexedDB) ---

export const saveApiKey = async (key: string) => {
    const provider = await stardustDB.getSetting('ai_provider', 'gemini');
    await stardustDB.saveApiKey(provider, key);
};

export const getApiKey = async (): Promise<string | null> => {
    const provider = await stardustDB.getSetting('ai_provider', 'gemini');
    if (provider === 'ollama') return '';
    return stardustDB.getApiKey(provider);
};

export const clearApiKey = async () => {
    const provider = await stardustDB.getSetting('ai_provider', 'gemini');
    await stardustDB.clearApiKey(provider);
};

// --- Model Selection ---

export const saveModel = async (modelId: string) => {
    await stardustDB.saveSetting('ai_model', modelId);
};

export const getModel = async (): Promise<string> => {
    return stardustDB.getSetting('ai_model', 'gemini-2.0-flash-exp');
};

// --- Core Generation ---

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIGenerateOptions {
    messages: AIMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export const generateContent = async (prompt: string, context: string = ''): Promise<string> => {
    return aiGateway.generate(prompt, context);
};

export const generateChat = async (options: AIGenerateOptions): Promise<string> => {
    const lastUserMsg = options.messages.filter(m => m.role === 'user').pop();
    const systemMsg = options.messages.find(m => m.role === 'system');
    const prompt = lastUserMsg ? lastUserMsg.content : '';
    const system = systemMsg ? systemMsg.content : '';
    return aiGateway.generate(prompt, system);
};

// --- Stardust-Specific AI Features ---

/**
 * Stellar Synthesis: Analyze a set of notes and suggest connections/groupings
 */
export const stellarSynthesis = async (_notes: any[]): Promise<string> => {
    const fullNotes = useStore.getState().notes;
    const viewMode = useSettingsStore.getState().viewMode;
    const result = await runCognitivePipeline(
        fullNotes,
        "Analyze these notes and suggest meaningful connections, groupings, or patterns.",
        viewMode
    );
    return result.content;
};

/**
 * Planet Expander: Take a brief note and expand it with research/detail
 */
export const planetExpander = async (title: string, existingContent: string = ''): Promise<string> => {
    const prompt = existingContent
        ? `Expand this note with more detail, research, and actionable insights:\n\nTitle: ${title}\nExisting Content: ${existingContent}`
        : `Create detailed content for this note topic: "${title}". Include key points, insights, and actionable items.`;

    return aiGateway.generate(
        prompt,
        'You are Stardust AI. Expand notes with well-researched, concise content. Use bullet points where appropriate. Keep total length under 300 words.'
    );
};

/**
 * Constellation Mapper: Suggest how to organize notes into modes
 */
export const constellationMapper = async (_notes: any[]): Promise<string> => {
    const fullNotes = useStore.getState().notes;
    const viewMode = useSettingsStore.getState().viewMode;
    const result = await runCognitivePipeline(
        fullNotes,
        "Suggest which Stardust mode each note belongs to:\n- VOID: freeform brainstorm\n- MATRIX: decision grid (urgent/important)\n- PRISM: column-based prioritization\n- ORBITAL: hierarchical focus rings\n- TIMELINE: chronological events",
        viewMode
    );
    return result.content;
};

/**
 * Auto-Summarize: Generate a summary from a set of notes
 */
export const autoSummarize = async (notes: { title: string }[]): Promise<string> => {
    const noteList = notes.map(n => `- ${n.title}`).join('\n');
    return aiGateway.generate(
        `Summarize these notes into a concise paragraph:\n${noteList}`,
        'You are Stardust AI. Summarize clearly and concisely in 2-3 sentences.'
    );
};

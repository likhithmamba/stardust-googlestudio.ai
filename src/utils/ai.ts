// src/utils/ai.ts — OpenRouter BYOK Multi-Model AI Service
// Supports multiple AI providers via OpenRouter's unified API

const STORAGE_KEY = 'stardust_ai_key';
const MODEL_KEY = 'stardust_ai_model';

// Available models via OpenRouter
export const AI_MODELS = {
    'google/gemini-2.0-flash-exp:free': 'Gemini 2.0 Flash (Free)',
    'google/gemini-2.5-pro-preview': 'Gemini 2.5 Pro',
    'anthropic/claude-sonnet-4': 'Claude Sonnet 4',
    'openai/gpt-4o': 'GPT-4o',
    'openai/gpt-4o-mini': 'GPT-4o Mini',
    'meta-llama/llama-3.3-70b-instruct': 'Llama 3.3 70B',
    'deepseek/deepseek-chat-v3-0324:free': 'DeepSeek V3 (Free)',
} as const;

export type AIModelId = keyof typeof AI_MODELS;

const DEFAULT_MODEL: AIModelId = 'google/gemini-2.0-flash-exp:free';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// --- Key Management ---

export const saveApiKey = async (key: string) => {
    const encoded = btoa(key);
    localStorage.setItem(STORAGE_KEY, encoded);
};

export const getApiKey = async (): Promise<string | null> => {
    const encoded = localStorage.getItem(STORAGE_KEY);
    if (!encoded) return null;
    try {
        return atob(encoded);
    } catch {
        return null;
    }
};

export const clearApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
};

// --- Model Selection ---

export const saveModel = (modelId: AIModelId) => {
    localStorage.setItem(MODEL_KEY, modelId);
};

export const getModel = (): AIModelId => {
    const saved = localStorage.getItem(MODEL_KEY);
    if (saved && saved in AI_MODELS) return saved as AIModelId;
    return DEFAULT_MODEL;
};

// --- Core Generation ---

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIGenerateOptions {
    messages: AIMessage[];
    model?: AIModelId;
    temperature?: number;
    maxTokens?: number;
}

export const generateContent = async (prompt: string, context: string = ''): Promise<string> => {
    const messages: AIMessage[] = [];
    if (context) {
        messages.push({ role: 'system', content: context });
    }
    messages.push({ role: 'user', content: prompt });

    return generateChat({ messages });
};

export const generateChat = async (options: AIGenerateOptions): Promise<string> => {
    const key = await getApiKey();
    if (!key) throw new Error("No API Key configured. Add your OpenRouter key in Settings.");

    const model = options.model || getModel();
    const cleanKey = key.replace(/[\r\n]/g, '');
    const cleanOrigin = window.location.origin.replace(/[\r\n]/g, '');

    try {
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': cleanOrigin,
                'X-Title': 'Stardust',
            },
            body: JSON.stringify({
                model,
                messages: options.messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 2048,
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const msg = err.error?.message || err.message || `HTTP ${response.status}`;
            throw new Error(`AI Request Failed: ${msg}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    } catch (error) {
        console.error("AI Error:", error);
        throw error;
    }
};

// --- Stardust-Specific AI Features ---

/**
 * Stellar Synthesis: Analyze a set of notes and suggest connections/groupings
 */
export const stellarSynthesis = async (notes: { title: string; type: string }[]): Promise<string> => {
    const noteList = notes.map((n, i) => `${i + 1}. [${n.type}] ${n.title}`).join('\n');
    return generateContent(
        `Analyze these notes and suggest meaningful connections, groupings, or patterns. Be concise.\n\n${noteList}`,
        'You are Stardust AI, an intelligent assistant for a spatial note-taking app called Stardust. Notes are represented as celestial objects (stars, planets, moons). Analyze patterns, suggest connections, and help organize thoughts spatially. Always be concise and insightful.'
    );
};

/**
 * Planet Expander: Take a brief note and expand it with research/detail
 */
export const planetExpander = async (title: string, existingContent: string = ''): Promise<string> => {
    const prompt = existingContent
        ? `Expand this note with more detail, research, and actionable insights:\n\nTitle: ${title}\nExisting Content: ${existingContent}`
        : `Create detailed content for this note topic: "${title}". Include key points, insights, and actionable items.`;

    return generateContent(prompt,
        'You are Stardust AI. Expand notes with well-researched, concise content. Use bullet points where appropriate. Keep total length under 300 words.'
    );
};

/**
 * Constellation Mapper: Suggest how to organize notes into modes
 */
export const constellationMapper = async (notes: { title: string; type: string }[]): Promise<string> => {
    const noteList = notes.map((n, i) => `${i + 1}. [${n.type}] ${n.title}`).join('\n');
    return generateContent(
        `Suggest which Stardust mode each note belongs to:\n- VOID: freeform brainstorm\n- MATRIX: decision grid (urgent/important)\n- PRISM: column-based prioritization\n- ORBITAL: hierarchical focus rings\n- TIMELINE: chronological events\n\nNotes:\n${noteList}`,
        'You are Stardust AI. Classify notes into the most appropriate mode. For each note, output: "Note N → MODE (reason)". Be very concise.'
    );
};

/**
 * Auto-Summarize: Generate a summary from a set of notes
 */
export const autoSummarize = async (notes: { title: string }[]): Promise<string> => {
    const noteList = notes.map(n => `- ${n.title}`).join('\n');
    return generateContent(
        `Summarize these notes into a concise paragraph:\n${noteList}`,
        'You are Stardust AI. Summarize clearly and concisely in 2-3 sentences.'
    );
};

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

/**
 * Automate note generation from a PDF file client-side using pdfjs-dist
 */
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker to use the exact matching version from unpkg
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const automateNotesFromPDF = async (
    file: File, 
    viewport: { x: number; y: number; zoom: number }
): Promise<{ notes: any[], connections: any[] }> => {
    // 1. Extract text from PDF using pdfjs-dist
    let text = '';
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            text += pageText + '\n';
        }
    } catch (err: any) {
        console.error("PDF extraction error:", err);
        throw new Error(`Failed to parse PDF file: ${err.message || err}`);
    }

    if (!text || text.trim().length === 0) {
        throw new Error("Could not extract any text from the PDF file. Ensure it is not an image-only scanned document.");
    }

    // 2. Limit text length to prevent token overflow
    const maxChars = 8000;
    const truncatedText = text.substring(0, maxChars);

    // 3. Ask AI to analyze and generate a structured mind map
    const prompt = `Analyze the following document content and extract the core ideas, components, and actionable tasks.
Generate a structured set of notes that form a "whiteboard mind map" representing this document.
The output MUST be a valid JSON array of objects (and nothing else). Do not wrap the JSON in markdown code blocks.

Each object in the array represents a note and MUST have the following schema:
{
    "title": "Short descriptive title (1-5 words)",
    "type": "sun" | "jupiter" | "saturn" | "earth" | "mars" | "moon" | "asteroid" | "comet",
    "content": "A detailed 1-2 sentence description or explanation of this concept",
    "priority": "critical" | "high" | "medium" | "low",
    "status": "todo" | "in-progress" | "review" | "done",
    "urgency": "urgent" | "not-urgent",
    "importance": "important" | "not-important"
}

Ensure you create:
1. One main core node of type "sun" (representing the main startup concept, goal, or document summary).
2. 3-5 major nodes of type "jupiter" or "saturn" (representing major sections, pillars, or startup modules).
3. 5-10 supporting nodes of type "earth", "mars", or "asteroid" (representing specific features, ideas, or actionable tasks).

Here is the document content:
---
${truncatedText}
---`;

    const systemInstruction = "You are Stardust AI, an expert startup whiteboard coach and knowledge mapper. Parse documents and generate structured visual mind maps as JSON arrays of notes.";
    const responseText = await aiGateway.generate(prompt, systemInstruction);

    // Parse response JSON
    let notesData: any[] = [];
    try {
        // Clean markdown code blocks if any
        let cleanText = responseText.trim();
        if (cleanText.startsWith("```json")) {
            cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith("```")) {
            cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith("```")) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        notesData = JSON.parse(cleanText.trim());
    } catch (e) {
        console.error("AI returned invalid JSON: ", responseText, e);
        throw new Error("AI failed to generate a structured mind map. Please try again.");
    }

    if (!Array.isArray(notesData)) {
        throw new Error("AI response did not form a valid array of notes.");
    }

    // 4. Map the AI-generated notes to Stardust Note format with coordinates centered on the viewport
    const cx = -viewport.x / viewport.zoom + window.innerWidth / (2 * viewport.zoom);
    const cy = -viewport.y / viewport.zoom + window.innerHeight / (2 * viewport.zoom);

    const generatedNotes = notesData.map((n, i) => {
        const id = Math.random().toString(36).substring(2, 11);
        
        // Arrange notes in a radial cosmic constellation pattern around center
        const angle = (i / notesData.length) * Math.PI * 2;
        // Suns are closer to center, asteroids are farther out
        const baseRadius = n.type === 'sun' ? 0 : n.type === 'jupiter' || n.type === 'saturn' ? 180 : 350;
        const radius = baseRadius + (Math.random() * 80 - 40);
        
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);

        // Formulate Lexical rich text content
        const lexicalContent = JSON.stringify({
            root: {
                children: [
                    {
                        children: [{ detail: 0, format: 0, mode: "normal", style: "", text: n.content, type: "text", version: 1 }],
                        direction: "ltr",
                        format: "",
                        indent: 0,
                        type: "paragraph",
                        version: 1
                    }
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "root",
                version: 1
            }
        });

        return {
            id,
            x,
            y,
            w: 80,
            h: 80,
            type: n.type || "earth",
            title: n.title || "New Star",
            content: lexicalContent,
            priority: n.priority || "medium",
            status: n.status || "captured",
            urgency: n.urgency || "not-urgent",
            importance: n.importance || "important",
            originMode: "void",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            luminance: 1.0,
            lastAccessedAt: Date.now(),
            fixed: false
        };
    });

    // 5. Connect the generated notes in a hub-and-spoke constellation model
    // Find the 'sun' node
    const sunNode = generatedNotes.find(n => n.type === 'sun') || generatedNotes[0];
    const connections: any[] = [];

    if (sunNode) {
        generatedNotes.forEach(n => {
            if (n.id !== sunNode.id) {
                // Connect sun to major jupiter/saturn components
                if (n.type === 'jupiter' || n.type === 'saturn') {
                    connections.push({
                        id: Math.random().toString(36).substring(2, 11),
                        from: sunNode.id,
                        to: n.id,
                        label: "Core Pillar"
                    });
                } else {
                    // Connect other nodes to the closest major pillar (or default to sun)
                    const pillars = generatedNotes.filter(p => p.type === 'jupiter' || p.type === 'saturn');
                    const parent = pillars.length > 0 ? pillars[Math.floor(Math.random() * pillars.length)] : sunNode;
                    connections.push({
                        id: Math.random().toString(36).substring(2, 11),
                        from: parent.id,
                        to: n.id,
                        label: n.type === 'asteroid' ? "Action Item" : "Supporting Idea"
                    });
                }
            }
        });
    }

    return { notes: generatedNotes, connections };
};

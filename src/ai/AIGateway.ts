import { stardustDB } from '../db/StardustDB';
import { runModelRequest } from './ModelRouter';
import { maskKey } from '../utils/maskKey';

/**
 * AIGateway - Origin-secured client-side AI request pipeline.
 * Manages key loading from IndexedDB, logging sanitization, and exponential backoff retry flows.
 */
export class AIGateway {
    private static instance: AIGateway;

    private constructor() {}

    public static getInstance(): AIGateway {
        if (!AIGateway.instance) {
            AIGateway.instance = new AIGateway();
        }
        return AIGateway.instance;
    }

    /**
     * Executes content generation using active settings and keys from IndexedDB.
     */
    async generate(
        prompt: string,
        systemInstruction?: string,
        options?: { maxRetries?: number }
    ): Promise<string> {
        // Load settings from IndexedDB
        const provider = await stardustDB.getSetting('ai_provider', 'gemini');
        const model = await stardustDB.getSetting('ai_model', 'gemini-2.0-flash-exp');
        const endpoint = await stardustDB.getSetting('ai_ollama_endpoint', 'http://localhost:11434');

        let apiKey = '';
        if (provider !== 'ollama') {
            const key = await stardustDB.getApiKey(provider);
            if (!key) {
                throw new Error(`API key for provider "${provider}" is not configured. Please add it in settings.`);
            }
            apiKey = key;
        }

        console.log(`[AIGateway] Dispatching request to ${provider}/${model} (key: ${maskKey(apiKey)})`);

        const maxRetries = options?.maxRetries ?? 2;
        let attempt = 0;
        let lastError: any = null;

        while (attempt <= maxRetries) {
            try {
                return await runModelRequest({
                    provider,
                    model,
                    apiKey,
                    prompt,
                    systemInstruction,
                    endpoint
                });
            } catch (err: any) {
                attempt++;
                lastError = err;
                console.warn(`[AIGateway] Attempt ${attempt} failed: ${err.message || err}`);

                if (attempt <= maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s...
                    console.log(`[AIGateway] Retrying in ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }

        throw new Error(`AI generation failed after ${maxRetries + 1} attempts. Last error: ${lastError?.message || lastError}`);
    }
}

export const aiGateway = AIGateway.getInstance();

/**
 * ModelRouter - Client-side AI provider request routing
 * Handles api payload formats and fetching for Gemini, OpenAI, Anthropic, and Ollama.
 */

export interface RouterRequest {
    provider: string;
    model: string;
    apiKey: string;
    prompt: string;
    systemInstruction?: string;
    endpoint?: string; // For Ollama
}

export async function runModelRequest(req: RouterRequest): Promise<string> {
    const { provider, model, apiKey, prompt, systemInstruction, endpoint } = req;

    switch (provider) {
        case 'gemini': {
            // Gemini generateContent REST URL
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            
            const body: any = {
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048
                }
            };

            if (systemInstruction) {
                body.systemInstruction = {
                    parts: [{ text: systemInstruction }]
                };
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Gemini error (${res.status}): ${errText}`);
            }

            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error('No candidate content text found in Gemini response');
            return text;
        }

        case 'openai': {
            const url = 'https://api.openai.com/v1/chat/completions';
            const messages: any[] = [];

            if (systemInstruction) {
                messages.push({ role: 'system', content: systemInstruction });
            }
            messages.push({ role: 'user', content: prompt });

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: 0.7
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`OpenAI error (${res.status}): ${errText}`);
            }

            const data = await res.json();
            const text = data.choices?.[0]?.message?.content;
            if (!text) throw new Error('No choice message content in OpenAI response');
            return text;
        }

        case 'anthropic': {
            const url = 'https://api.anthropic.com/v1/messages';
            const body: any = {
                model,
                max_tokens: 2048,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            };

            if (systemInstruction) {
                body.system = systemInstruction;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                    'dangerously-allow-browser': 'true' // Client-side fetch bypass
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Anthropic error (${res.status}): ${errText}`);
            }

            const data = await res.json();
            const text = data.content?.[0]?.text;
            if (!text) throw new Error('No content parts found in Anthropic response');
            return text;
        }

        case 'ollama': {
            const target = endpoint || 'http://localhost:11434';
            const url = `${target}/api/generate`;
            
            const combinedPrompt = systemInstruction 
                ? `${systemInstruction}\n\n[Prompt]\n${prompt}` 
                : prompt;

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    prompt: combinedPrompt,
                    stream: false
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Ollama error (${res.status}): ${errText}`);
            }

            const data = await res.json();
            return data.response || '';
        }

        default:
            throw new Error(`Unsupported provider name: ${provider}`);
    }
}
export const PROVIDER_MODELS: Record<string, string[]> = {
    gemini: ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'o1-mini'],
    anthropic: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'],
    ollama: ['llama3', 'mistral', 'gemma', 'phi3']
};

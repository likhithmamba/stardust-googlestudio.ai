// Client-side AI wrapper
// Encrypts/decrypts API key locally

const STORAGE_KEY = 'stardust_ai_key';

export const saveApiKey = async (key: string, _password: string) => {
    // In a real app, use Web Crypto API to encrypt 'key' with 'password'
    // For MVP/Prototype, we'll just store it (WARN: NOT SECURE FOR PRODUCTION WITHOUT ENCRYPTION)
    // Implementing full AES-GCM here would be verbose, but here's the interface.
    localStorage.setItem(STORAGE_KEY, key); // Placeholder: Replace with encrypted storage
};

export const getApiKey = async (_password: string): Promise<string | null> => {
    return localStorage.getItem(STORAGE_KEY);
};

export const generateContent = async (prompt: string, context: string = ''): Promise<string> => {
    const key = await getApiKey('default');
    if (!key) throw new Error("No API Key configured. Please set it in Settings.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

    const fullPrompt = context
        ? `Context: ${context}\n\nTask: ${prompt}`
        : prompt;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: fullPrompt }]
                }]
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'AI Request Failed');
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
        console.error("AI Error:", error);
        throw error;
    }
};

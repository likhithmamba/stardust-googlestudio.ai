/**
 * Safe logging utility to mask API keys.
 * e.g. "sk-or-v1-abcdef123456" -> "sk-or-...3456"
 */
export function maskKey(key: string): string {
    if (!key) return '';
    const cleanKey = key.trim();
    if (cleanKey.length <= 10) return '***';
    
    // Check if it's OpenRouter or OpenAI format
    if (cleanKey.startsWith('sk-or-')) {
        return `sk-or-...${cleanKey.slice(-4)}`;
    }
    if (cleanKey.startsWith('sk-')) {
        return `sk-...${cleanKey.slice(-4)}`;
    }
    
    return `${cleanKey.slice(0, 4)}...${cleanKey.slice(-4)}`;
}

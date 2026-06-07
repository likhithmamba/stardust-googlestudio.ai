/**
 * STARDUST — Input Sanitization Pipeline
 * Defense-in-depth: sanitize at BOTH write time (before DB) AND render time (before DOM).
 * 
 * Uses DOMPurify with a strict allowlist of HTML tags from the RichTextEditor.
 * Never trust stored content — always sanitize before rendering.
 */

import DOMPurify from 'dompurify';

// Tags the RichTextEditor (Lexical) legitimately produces
const ALLOWED_TAGS = [
    'p', 'strong', 'em', 'u', 's', 'br', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'code', 'pre', 'blockquote',
    'div', 'sub', 'sup', 'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const ALLOWED_ATTR = [
    'href', 'target', 'rel', 'class', 'style',
    'data-lexical-decorator', 'data-lexical-text',
    'dir', 'spellcheck',
];

/**
 * Sanitize HTML content from notes.
 * Strips script tags, event handlers, and any non-allowlisted HTML.
 * Safe for dangerouslySetInnerHTML and IndexedDB storage.
 */
export function sanitizeNoteContent(html: string): string {
    if (!html || typeof html !== 'string') return '';

    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ALLOW_DATA_ATTR: false,
        ALLOW_ARIA_ATTR: false,
        // Strip dangerous URI schemes
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    });
}

/**
 * Strip ALL HTML and return plain text.
 * Used for export, search indexing, and AI processing.
 */
export function htmlToPlainText(html: string): string {
    if (!html || typeof html !== 'string') return '';
    // Use DOMPurify to strip everything, then extract text
    const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
    // Decode HTML entities
    const tmp = document.createElement('div');
    tmp.innerHTML = clean;
    return tmp.textContent || tmp.innerText || '';
}

/**
 * Sanitize free text input (feedback modal, constellation names, etc.).
 * Strips all HTML tags entirely — plain text only.
 */
export function sanitizePlainText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

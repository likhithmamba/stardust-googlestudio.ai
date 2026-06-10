import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { Note } from '../store/noteSlice';

/**
 * Capture the main viewport workspace container as a high-resolution PNG image,
 * temporarily hiding UI controls (such as toolbars, panels, buttons).
 */
export async function exportToPNG(containerEl: HTMLElement | null): Promise<void> {
    if (!containerEl) {
        throw new Error('Workspace container element not found');
    }

    // Capture elements to hide
    const elementsToHide = containerEl.querySelectorAll(
        '.stardust-toolbar, .ui-interactive-area, button, .settings-panel, .radial-menu, .help-overlay'
    );
    
    // Store original visibility values
    const originalStyles = new Map<Element, string>();
    elementsToHide.forEach((el) => {
        originalStyles.set(el, (el as HTMLElement).style.visibility || '');
        (el as HTMLElement).style.visibility = 'hidden';
    });

    try {
        const canvas = await html2canvas(containerEl, {
            backgroundColor: '#050510',
            useCORS: true,
            allowTaint: true,
            scale: 2, // High resolution scale multiplier
            scrollX: 0,
            scrollY: 0,
            windowWidth: containerEl.scrollWidth,
            windowHeight: containerEl.scrollHeight
        });

        return new Promise<void>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    saveAs(blob, `stardust-workspace-${Date.now()}.png`);
                    resolve();
                } else {
                    reject(new Error('Failed to generate PNG blob'));
                }
            }, 'image/png');
        });
    } catch (error) {
        console.error('[ExportEngine] PNG rendering failed:', error);
        throw error;
    } finally {
        // Restore elements visibility
        elementsToHide.forEach((el) => {
            const originalVal = originalStyles.get(el);
            (el as HTMLElement).style.visibility = originalVal || '';
        });
    }
}

/**
 * Exports all active notes to a structured ZIP file containing individual markdown files.
 */
export async function exportToMarkdownZIP(notes: Note[], connections: any[]): Promise<void> {
    const zip = new JSZip();

    notes.forEach((note) => {
        const title = note.title || `Untitled-${note.id}`;
        const sanitizedTitle = title.replace(/[/\\?%*:|"<>]/g, '-');

        // Find associated backlinks/links
        const linkedNotes = connections
            .filter((c) => c.from === note.id || c.to === note.id)
            .map((c) => {
                const targetId = c.from === note.id ? c.to : c.from;
                const targetNote = notes.find((n) => n.id === targetId);
                if (!targetNote) return null;
                const targetTitle = targetNote.title || `Untitled-${targetNote.id}`;
                return `- [[${targetTitle}]]`;
            })
            .filter(Boolean);

        // Content layout
        const mdContent = `---
id: ${note.id}
type: ${note.type}
priority: ${note.priority || 'medium'}
status: ${note.status || 'captured'}
tags: ${JSON.stringify(note.tags || [])}
constellation: ${note.constellation || 'General'}
createdAt: ${note.createdAt ? new Date(note.createdAt).toISOString() : ''}
updatedAt: ${note.updatedAt ? new Date(note.updatedAt).toISOString() : ''}
---

# ${title}

${note.content || ''}

${linkedNotes.length > 0 ? `\n## Connections\n${linkedNotes.join('\n')}\n` : ''}
`;

        zip.file(`${sanitizedTitle}.md`, mdContent);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `stardust-markdown-notes-${Date.now()}.zip`);
}

/**
 * Exports all active notes as a fully compatible Obsidian Vault structure inside a ZIP archive.
 * Includes folder hierarchy organization and a native Obsidian visual canvas file (`stardust.canvas`).
 */
export async function exportToObsidianVault(notes: Note[], connections: any[]): Promise<void> {
    const zip = new JSZip();
    const canvasNodes: any[] = [];
    const canvasEdges: any[] = [];

    notes.forEach((note) => {
        const title = note.title || `Untitled-${note.id}`;
        const sanitizedTitle = title.replace(/[/\\?%*:|"<>]/g, '-');

        // Organize into vault directories by Status/Folder
        const statusDir = note.status ? note.status.replace('-', ' ') : 'inbox';
        const folderName = statusDir.charAt(0).toUpperCase() + statusDir.slice(1);
        const vaultPath = `${folderName}/${sanitizedTitle}.md`;

        const mdContent = `---
id: ${note.id}
type: ${note.type}
priority: ${note.priority || 'medium'}
status: ${note.status || 'captured'}
tags: ${JSON.stringify(note.tags || [])}
constellation: ${note.constellation || 'General'}
createdAt: ${note.createdAt ? new Date(note.createdAt).toISOString() : ''}
updatedAt: ${note.updatedAt ? new Date(note.updatedAt).toISOString() : ''}
---

# ${title}

${note.content || ''}
`;

        zip.file(vaultPath, mdContent);

        // Add node description to Obsidian Canvas representation
        canvasNodes.push({
            id: note.id,
            type: 'file',
            file: vaultPath,
            x: Math.round(note.x),
            y: Math.round(note.y),
            width: Math.round(note.w || 200),
            height: Math.round(note.h || 120),
        });
    });

    // Add edges to Obsidian Canvas
    connections.forEach((conn) => {
        const sourceExists = notes.some((n) => n.id === conn.from);
        const targetExists = notes.some((n) => n.id === conn.to);
        
        if (sourceExists && targetExists) {
            canvasEdges.push({
                id: conn.id,
                fromNode: conn.from,
                toNode: conn.to,
                label: conn.label || undefined,
            });
        }
    });

    // Build the visual canvas payload
    const canvasPayload = {
        nodes: canvasNodes,
        edges: canvasEdges,
    };

    zip.file('stardust.canvas', JSON.stringify(canvasPayload, null, 2));

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `stardust-obsidian-vault-${Date.now()}.zip`);
}

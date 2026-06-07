import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Note } from '../store/useStore';
import type { Connection } from '../store/useStore';

// Sanitization: strip HTML tags to satisfy plain text requirement
const stripHtmlTags = (str: string): string => {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '');
};

const extractPlainText = (contentStr?: string): string => {
    if (!contentStr) return '';
    try {
        const state = JSON.parse(contentStr);
        let text = '';
        const traverse = (node: any) => {
            if (node.text) text += node.text;
            if (node.type === 'paragraph' || node.type === 'listitem') text += '\n';
            if (node.children) node.children.forEach(traverse);
        };
        if (state.root) traverse(state.root);
        return text.trim();
    } catch {
        return contentStr;
    }
};

export const exportCanvasToJSON = (notes: Note[], connections: Connection[], viewMode: string, designSystem: string) => {
    const data = {
        version: 2,
        timestamp: Date.now(),
        notes,
        connections,
        viewMode,
        designSystem
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `stardust_backup_${new Date().toISOString().slice(0, 10)}.stardust`);
};

export const exportCanvasToPNG = (notes: Note[], connections: Connection[], viewMode: string, designSystem: string) => {
    if (notes.length === 0) return;
    
    // 1. Calculate boundaries of all notes
    const pad = 100;
    const minX = Math.min(...notes.map(n => n.x)) - pad;
    const minY = Math.min(...notes.map(n => n.y)) - pad;
    const maxX = Math.max(...notes.map(n => n.x + 200)) + pad;
    const maxY = Math.max(...notes.map(n => n.y + 200)) + pad;

    const width = Math.max(800, maxX - minX);
    const height = Math.max(600, maxY - minY);

    // 2. Create dynamic canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 3. Draw background
    const isSolar = designSystem === 'solar';
    ctx.fillStyle = isSolar ? '#f8fafc' : '#020617';
    ctx.fillRect(0, 0, width, height);

    // 4. Draw connections
    connections.forEach(conn => {
        const start = notes.find(n => n.id === conn.from);
        const end = notes.find(n => n.id === conn.to);
        if (!start || !end) return;

        const getNoteSize = (type: string) => {
            const sizes: Record<string, number> = {
                sun: 320, jupiter: 160, saturn: 140, earth: 64, mars: 56, asteroid: 24, nebula: 600, galaxy: 500
            };
            return sizes[type] || 64;
        };

        const sSize = getNoteSize(start.type);
        const eSize = getNoteSize(end.type);

        const x1 = start.x + sSize / 2 - minX;
        const y1 = start.y + sSize / 2 - minY;
        const x2 = end.x + eSize / 2 - minX;
        const y2 = end.y + eSize / 2 - minY;

        const cp1x = x1 + (x2 - x1) * 0.5;
        const cp1y = y1;
        const cp2x = x2 - (x2 - x1) * 0.5;
        const cp2y = y2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
        ctx.strokeStyle = start.color || '#6366f1';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    });

    // 5. Draw notes
    notes.forEach(note => {
        const getNoteSize = (type: string) => {
            const sizes: Record<string, number> = {
                sun: 320, jupiter: 160, saturn: 140, earth: 64, mars: 56, asteroid: 24, nebula: 600, galaxy: 500
            };
            return sizes[type] || 64;
        };

        const size = getNoteSize(note.type);
        const x = note.x - minX;
        const y = note.y - minY;
        const color = note.color || '#6366f1';

        const isRect = ['matrix', 'prism', 'timeline'].includes(viewMode);
        if (isRect) {
            ctx.fillStyle = isSolar ? '#ffffff' : '#111121';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            const w = 180;
            const h = 80;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(x, y, w, h, 8) : ctx.rect(x, y, w, h);
            ctx.fill();
            ctx.stroke();

            // Text
            ctx.fillStyle = isSolar ? '#0f172a' : '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(note.title || 'Untitled', x + 12, y + 25, w - 24);
        } else {
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(note.title || 'Untitled', x + size / 2, y + size / 2 + 3, size);
        }
    });

    canvas.toBlob((blob) => {
        if (blob) {
            saveAs(blob, `stardust-universe-${new Date().toISOString().slice(0, 10)}.png`);
        }
    });
};

export const exportToMarkdownZip = async (notes: Note[]) => {
    const zip = new JSZip();

    notes.forEach(note => {
        const title = note.title || 'Untitled Note';
        // Strip any HTML tags (XSS scripts are output as plain text only)
        const cleanContent = stripHtmlTags(extractPlainText(note.content));

        const markdownContent = `# ${title}

- **Type**: ${note.type}
- **Priority**: ${note.priority || 'medium'}
- **Status**: ${note.status || 'captured'}
- **Created**: ${new Date(note.createdAt || Date.now()).toLocaleString()}

---

${cleanContent}
`;
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || note.id;
        zip.file(`${safeTitle}.md`, markdownContent);
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `stardust-markdown-notes-${new Date().toISOString().slice(0, 10)}.zip`);
};

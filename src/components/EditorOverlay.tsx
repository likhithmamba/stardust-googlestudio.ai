import React from 'react';
import { useStore } from '../store/useStore';
import { RichTextEditor } from './editor/RichTextEditor';

export const EditorOverlay: React.FC = () => {
    const selectedId = useStore((state) => state.selectedId);
    const notes = useStore((state) => state.notes);
    const updateNote = useStore((state) => state.updateNote);
    const setSelectedId = useStore((state) => state.setSelectedId);
    const viewport = useStore((state) => state.viewport);

    if (!selectedId) return null;

    const note = notes.find((n) => n.id === selectedId);
    if (!note) return null;

    // Calculate screen position
    const screenX = note.x * viewport.zoom + viewport.x;
    const screenY = note.y * viewport.zoom + viewport.y;
    const screenW = note.w * viewport.zoom;
    const screenH = note.h * viewport.zoom;

    return (
        <div
            className="absolute bg-slate-800 rounded-lg shadow-2xl border border-blue-500 flex flex-col overflow-hidden origin-top-left z-50"
            style={{
                left: screenX,
                top: screenY,
                width: Math.max(screenW, 300), // Min width for editor
                height: Math.max(screenH, 200), // Min height
            }}
        >
            <div className="bg-slate-900 p-2 flex justify-between items-center handle cursor-move">
                <input
                    value={note.title || ''}
                    onChange={(e) => updateNote(note.id, { title: e.target.value })}
                    className="bg-transparent text-white font-bold outline-none w-full"
                    placeholder="Untitled"
                />
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            try {
                                const { generateContent } = await import('../utils/ai');
                                const newContent = await generateContent(`Expand on this concept: ${note.title}. Keep it concise and cosmic.`);
                                // In a real app, we'd insert this into the editor state. 
                                // For now, we'll just append it to the title or log it, as inserting into Lexical state externally is complex without a ref.
                                // Actually, let's just alert it for MVP or update title if empty.
                                alert(`AI Insight:\n${newContent}`);
                            } catch (e: any) {
                                alert(e.message);
                            }
                        }}
                        className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded flex items-center gap-1"
                    >
                        ✨ Spark
                    </button>
                    <button onClick={() => setSelectedId(undefined)} className="text-slate-400 hover:text-white">✕</button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-800 text-slate-200 relative">
                <RichTextEditor
                    key={note.id}
                    initialContent={note.content}
                    onChange={(editorState) => {
                        const jsonString = JSON.stringify(editorState);
                        updateNote(note.id, { content: jsonString });
                    }}
                />
            </div>
        </div>
    );
};

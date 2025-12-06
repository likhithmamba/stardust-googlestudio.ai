import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import type { EditorState } from 'lexical';

import exampleTheme from './EditorTheme';

const editorConfig = {
    namespace: 'StardustEditor',
    theme: exampleTheme,
    onError(error: Error) {
        throw error;
    },
    nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        AutoLinkNode,
        LinkNode
    ]
};

interface RichTextEditorProps {
    initialContent?: string;
    onChange: (editorState: EditorState) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialContent, onChange }) => {
    const initialConfig = {
        ...editorConfig,
        editorState: initialContent
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="editor-container relative h-full flex flex-col">
                <div className="editor-inner flex-1 relative overflow-auto">
                    <RichTextPlugin
                        contentEditable={<ContentEditable className="editor-input h-full outline-none p-4" />}
                        placeholder={<div className="editor-placeholder">Start typing...</div>}
                        ErrorBoundary={({ children }) => <div>{children}</div>}
                    />
                    <HistoryPlugin />
                    <AutoFocusPlugin />
                    <ListPlugin />
                    <LinkPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    <OnChangePlugin onChange={onChange} />
                </div>
            </div>
        </LexicalComposer>
    );
};

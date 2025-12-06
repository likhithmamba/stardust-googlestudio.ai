import React from 'react';
import { useStore } from '../store/useStore';
import {
    Plus,
    Trash2,
    Palette,
    Upload,
    Download,
    Map,
    Share2,
    HelpCircle,
    Layout
} from 'lucide-react';
import { NoteType } from '../constants';

export const Toolbar: React.FC = () => {
    const addNote = useStore((state) => state.addNote);
    const viewport = useStore((state) => state.viewport);
    const setNotes = useStore((state) => state.setNotes);
    const setConnections = useStore((state) => state.setConnections);

    // UI Toggles
    const showMinimap = useStore((state) => state.showMinimap);
    const setShowMinimap = useStore((state) => state.setShowMinimap);
    const showConnections = useStore((state) => state.showConnections);
    const setShowConnections = useStore((state) => state.setShowConnections);
    const scaleMode = useStore((state) => state.scaleMode);
    const setScaleMode = useStore((state) => state.setScaleMode);

    const handleAddDefault = () => {
        // Center on screen
        const x = -viewport.x / viewport.zoom + window.innerWidth / (2 * viewport.zoom) - 100;
        const y = -viewport.y / viewport.zoom + window.innerHeight / (2 * viewport.zoom) - 50;

        addNote({
            id: Math.random().toString(36).substr(2, 9),
            x,
            y,
            w: 240,
            h: 120,
            type: NoteType.Earth, // Default to Earth/Planet
            title: 'New Planet',
            color: '#0ea5e9'
        });
    };

    const handleClear = () => {
        if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
            setNotes([]);
            setConnections([]);
        }
    };

    const Button = ({ onClick, icon: Icon, title, active }: any) => (
        <button
            onClick={onClick}
            className={`p-2 rounded-lg transition-all hover:bg-white/10 ${active ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
            title={title}
        >
            <Icon size={18} />
        </button>
    );

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-2 rounded-full glass z-50">
            {/* Theme / Font / Color (Placeholder for dropdown) */}
            <Button icon={Palette} title="Theme & Colors" />

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* New Planet (Default) */}
            <Button onClick={handleAddDefault} icon={Plus} title="New Planet (Default)" />

            {/* Clear Canvas */}
            <Button onClick={handleClear} icon={Trash2} title="Clear Canvas" />

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Import / Export */}
            <Button icon={Upload} title="Import (Coming soon)" />
            <Button icon={Download} title="Export (Coming soon)" />

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Toggles */}
            <Button
                onClick={() => setShowMinimap(!showMinimap)}
                icon={Map}
                active={showMinimap}
                title="Toggle Minimap"
            />
            <Button
                onClick={() => setShowConnections(!showConnections)}
                icon={Share2}
                active={showConnections}
                title="Toggle Connections"
            />
            <Button
                onClick={() => setScaleMode(scaleMode === 'real' ? 'compact' : 'real')}
                icon={Layout}
                active={scaleMode === 'real'}
                title={`Scale Mode: ${scaleMode}`}
            />

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Help */}
            <Button icon={HelpCircle} title="Help" />
        </div>
    );
};

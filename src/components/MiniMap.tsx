import React, { useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Minus } from 'lucide-react';

export const MiniMap: React.FC = () => {
    const notes = useStore((state) => state.notes);
    const viewport = useStore((state) => state.viewport);
    const setViewport = useStore((state) => state.setViewport);
    const showMinimap = useStore((state) => state.showMinimap);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Hide if toggled off
    if (!showMinimap) return null;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Clear and Circular Clip
        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'; // Slate-900/60
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Calculate bounds of all notes
        if (notes.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        notes.forEach(n => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + n.w);
            maxY = Math.max(maxY, n.y + n.h);
        });

        // Add some padding
        const padding = 2000;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const mapW = maxX - minX;
        const mapH = maxY - minY;

        // Fit world into circle (using smallest dim)
        const scale = Math.min(width / mapW, height / mapH);

        // Draw notes
        notes.forEach(n => {
            ctx.fillStyle = n.color || '#3b82f6';
            const x = (n.x - minX) * scale;
            const y = (n.y - minY) * scale;
            const w = Math.max(2, n.w * scale);
            const h = Math.max(2, n.h * scale);

            // Draw as circles for planets
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, Math.max(2, w / 2), 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw Viewport Rect (as a halo/rect)
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        const vx = (-viewport.x / viewport.zoom - minX) * scale;
        const vy = (-viewport.y / viewport.zoom - minY) * scale;
        const vw = (screenW / viewport.zoom) * scale;
        const vh = (screenH / viewport.zoom) * scale;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(vx, vy, vw, vh);

    }, [notes, viewport]);

    const handleZoom = (delta: number) => {
        const newZoom = Math.max(0.1, Math.min(5, viewport.zoom + delta));
        setViewport({ ...viewport, zoom: newZoom });
    };

    return (
        <div className="stardust-minimap flex flex-col items-center justify-center">
            <canvas
                ref={canvasRef}
                width={140}
                height={140}
                className="w-full h-full cursor-crosshair opacity-80 hover:opacity-100 transition-opacity absolute inset-0"
                onClick={() => {
                    // Jump logic to be implemented
                }}
            />

            {/* Zoom Controls (Overlay on minimap or separate? Image shows clean. Let's hide zoom here or make it subtle) */}
            {/* The user snippet for minimap didn't explicitly include zoom buttons styles, so we'll keep them subtle floating on top */}
            <div className="absolute bottom-2 flex gap-1 z-10">
                <button onClick={() => handleZoom(-0.1)} className="p-1 hover:bg-white/20 rounded-full text-white/50 hover:text-white transition-colors" title="Zoom Out">
                    <Minus size={12} />
                </button>
                <button onClick={() => handleZoom(0.1)} className="p-1 hover:bg-white/20 rounded-full text-white/50 hover:text-white transition-colors" title="Zoom In">
                    <Plus size={12} />
                </button>
            </div>
        </div>
    );
};

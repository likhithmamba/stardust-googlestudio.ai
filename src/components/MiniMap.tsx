import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../ui/settings/settingsStore';
import { Plus, Minus, Map as MapIcon, X } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const MiniMap: React.FC = () => {
    const notes = useStore((state) => state.notes);
    const viewport = useStore((state) => state.viewport);
    const setViewport = useStore((state) => state.setViewport);
    const showMinimap = useStore((state) => state.showMinimap);
    const setShowMinimap = useStore((state) => state.setShowMinimap);

    // Theme Integration
    const designSystem = useSettingsStore((state) => state.designSystem);
    const isSolar = designSystem === 'solar';

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Render Loop
    useEffect(() => {
        if (!showMinimap) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Styling based on Theme
        const bgColor = isSolar ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.8)';
        const borderColor = isSolar ? 'rgba(203, 213, 225, 0.8)' : 'rgba(51, 65, 85, 0.8)'; // slate-300 : slate-700
        const defaultNoteColor = isSolar ? '#94a3b8' : '#3b82f6';
        const viewportColor = isSolar ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.3)';

        // Background Circle
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, width / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (notes.length === 0) return;

        // Calculate Bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        notes.forEach(n => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + n.w);
            maxY = Math.max(maxY, n.y + n.h);
        });

        const padding = 2500;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const mapW = maxX - minX;
        const mapH = maxY - minY;
        const scale = Math.min(width / mapW, height / mapH);

        // Draw Notes
        notes.forEach(n => {
            ctx.fillStyle = n.color || defaultNoteColor;

            const x = (n.x - minX) * scale;
            const y = (n.y - minY) * scale;
            const w = Math.max(3, n.w * scale);
            const h = Math.max(3, n.h * scale);

            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, Math.max(2, w / 2), 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw Viewport Rect
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const vx = (-viewport.x / viewport.zoom - minX) * scale;
        const vy = (-viewport.y / viewport.zoom - minY) * scale;
        const vw = (screenW / viewport.zoom) * scale;
        const vh = (screenH / viewport.zoom) * scale;

        ctx.strokeStyle = viewportColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(vx, vy, vw, vh);

    }, [notes, viewport, showMinimap, isSolar]);

    const handleZoom = (delta: number) => {
        const newZoom = Math.max(0.1, Math.min(5, viewport.zoom + delta));
        setViewport({ ...viewport, zoom: newZoom });
    };

    const handleMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        if (notes.length === 0) return;

        // Re-calc bounds logic from effect
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        notes.forEach(n => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + n.w);
            maxY = Math.max(maxY, n.y + n.h);
        });
        const padding = 2500;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        const mapW = maxX - minX;
        const mapH = maxY - minY;
        const width = 140;
        const height = 140;
        const scale = Math.min(width / mapW, height / mapH);

        const targetWorldX = minX + (clickX / scale);
        const targetWorldY = minY + (clickY / scale);

        setViewport({
            ...viewport,
            x: -targetWorldX * viewport.zoom + window.innerWidth / 2,
            y: -targetWorldY * viewport.zoom + window.innerHeight / 2
        });
    };

    return (
        <div className="fixed top-24 right-6 z-50 flex flex-col items-end gap-2">

            {/* Toggle Button (When closed) */}
            {!showMinimap && (
                <button
                    onClick={() => setShowMinimap(true)}
                    className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110",
                        isSolar ? "bg-white text-slate-500 hover:text-slate-800" : "bg-slate-800 text-slate-400 hover:text-white"
                    )}
                    title="Open Map"
                >
                    <MapIcon size={18} />
                </button>
            )}

            {/* Map Container */}
            <AnimatePresence>
                {showMinimap && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="relative group"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {/* Close Button (Hover) */}
                        <button
                            onClick={() => setShowMinimap(false)}
                            className={clsx(
                                "absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-opacity",
                                isSolar ? "bg-white text-slate-400 hover:text-red-500" : "bg-slate-700 text-slate-400 hover:text-red-400",
                                isHovered ? "opacity-100" : "opacity-0"
                            )}
                        >
                            <X size={12} />
                        </button>

                        <div className={clsx(
                            "rounded-full p-1 shadow-2xl backdrop-blur-sm transition-colors",
                            isSolar ? "bg-white/50 border border-slate-200" : "bg-slate-900/50 border border-slate-700"
                        )}>
                            <canvas
                                ref={canvasRef}
                                width={140}
                                height={140}
                                onClick={handleMapClick}
                                className="block rounded-full cursor-crosshair"
                            />
                        </div>

                        {/* Zoom Controls */}
                        <div className={clsx(
                            "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex gap-1 p-1 rounded-full shadow-lg transition-opacity",
                            isSolar ? "bg-white border border-slate-100" : "bg-slate-800 border border-slate-700",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}>
                            <button onClick={() => handleZoom(-0.1)} className={clsx("p-1.5 rounded-full transition-colors", isSolar ? "hover:bg-slate-100 text-slate-400" : "hover:bg-slate-700 text-slate-400")}>
                                <Minus size={12} />
                            </button>
                            <div className="w-px h-full bg-slate-200 dark:bg-slate-700" />
                            <button onClick={() => handleZoom(0.1)} className={clsx("p-1.5 rounded-full transition-colors", isSolar ? "hover:bg-slate-100 text-slate-600" : "hover:bg-slate-700 text-slate-200")}>
                                <Plus size={12} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

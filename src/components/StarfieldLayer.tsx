import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../ui/settings/settingsStore';

export const StarfieldLayer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Subscribe only to values needed for background
    const viewport = useStore((state) => state.viewport);
    const theme = useStore((state) => state.theme);
    const mode = useSettingsStore((state) => state.mode);
    const designSystem = useSettingsStore((state) => state.designSystem);
    const proMode = mode === 'pro' || mode === 'ultra';

    const stars = useRef<{ x: number; y: number; size: number; opacity: number; speed: number; layer: 'back' | 'mid' | 'front' }[]>([]);
    const nebulas = useRef<{ x: number; y: number; size: number; color: string; speed: number }[]>([]);

    useEffect(() => {
        // Generate stars
        stars.current = Array.from({ length: 1000 }, () => {
            const layerRoll = Math.random();
            let layer: 'back' | 'mid' | 'front' = 'back';
            let speed = 0.02;
            let size = Math.random() * 1.5 + 0.5;
            let opacity = Math.random() * 0.5 + 0.1;

            if (layerRoll > 0.9) {
                layer = 'front';
                speed = 0.1;
                size = Math.random() * 2 + 1;
                opacity = Math.random() * 0.8 + 0.5;
            } else if (layerRoll > 0.6) {
                layer = 'mid';
                speed = 0.05;
                size = Math.random() * 1.5 + 0.8;
                opacity = Math.random() * 0.6 + 0.3;
            }

            return {
                x: Math.random() * window.innerWidth * 2,
                y: Math.random() * window.innerHeight * 2,
                size,
                opacity,
                speed,
                layer
            };
        });

        // Generate nebulas
        const getNebulaColor = (index: number): string => {
            switch (index) {
                case 0: return '#4c1d95';
                case 1: return '#312e81';
                case 2: return '#1e1b4b';
                case 3: return '#581c87';
                default: return '#0f172a';
            }
        };

        nebulas.current = Array.from({ length: 12 }, () => ({
            x: Math.random() * window.innerWidth * 1.5,
            y: Math.random() * window.innerHeight * 1.5,
            size: Math.random() * 600 + 400,
            color: getNebulaColor(Math.floor(Math.random() * 5)),
            speed: Math.random() * 0.03 + 0.005
        }));
    }, []);

    // Resize Observer for Background Canvas
    const sizeRef = useRef({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                sizeRef.current = { width, height };
                if (canvasRef.current) {
                    const dpr = window.devicePixelRatio || 1;
                    canvasRef.current.width = width * dpr;
                    canvasRef.current.height = height * dpr;
                }
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            const { width, height } = sizeRef.current;
            const dpr = window.devicePixelRatio || 1;

            ctx.resetTransform();
            ctx.scale(dpr, dpr);

            // 1. Background Types
            const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height));

            if (theme === 'cyberpunk') {
                bgGradient.addColorStop(0, '#1a0b2e');
                bgGradient.addColorStop(0.5, '#0f0518');
                bgGradient.addColorStop(1, '#000000');
            } else if (theme === 'zen') {
                bgGradient.addColorStop(0, '#353535');
                bgGradient.addColorStop(0.5, '#1c1c1c');
                bgGradient.addColorStop(1, '#111111');
            } else {
                bgGradient.addColorStop(0, '#0f172a');
                bgGradient.addColorStop(0.4, '#020617');
                bgGradient.addColorStop(1, '#000000');
            }

            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            // 2. Nebulas (Skip in Zen)
            if (theme !== 'zen' && proMode) {
                ctx.globalCompositeOperation = 'screen';
                nebulas.current.forEach(nebula => {
                    const parallaxX = (nebula.x - viewport.x * nebula.speed) % (width * 1.5);
                    const parallaxY = (nebula.y - viewport.y * nebula.speed) % (height * 1.5);
                    const drawX = parallaxX < -nebula.size ? parallaxX + width * 1.5 : parallaxX;
                    const drawY = parallaxY < -nebula.size ? parallaxY + height * 1.5 : parallaxY;

                    if (drawX < -nebula.size || drawX > width + nebula.size || drawY < -nebula.size || drawY > height + nebula.size) return;

                    const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, nebula.size);
                    const cyberpunkColor = nebula.color === '#4c1d95' ? '#d946ef' : '#06b6d4';

                    grad.addColorStop(0, `${theme === 'cyberpunk' ? cyberpunkColor : nebula.color}15`);
                    grad.addColorStop(0.6, 'transparent');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, nebula.size, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.globalCompositeOperation = 'source-over';
            }

            // 3. Stars - Multi-Layer Parallax
            ctx.fillStyle = theme === 'zen' ? '#aaa' : '#fff';
            stars.current.forEach(star => {
                let parallaxFactor = 1;
                if (star.layer === 'back') parallaxFactor = 0.2;
                if (star.layer === 'mid') parallaxFactor = 0.5;
                if (star.layer === 'front') parallaxFactor = 1.0;

                const x = (star.x - viewport.x * star.speed * parallaxFactor) % (width * 2);
                const y = (star.y - viewport.y * star.speed * parallaxFactor) % (height * 2);

                const drawX = x < 0 ? x + width * 2 : x;
                const drawY = y < 0 ? y + height * 2 : y;

                if (drawX < 0 || drawX > width || drawY < 0 || drawY > height) return;

                ctx.globalAlpha = star.opacity;
                ctx.beginPath();
                ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            // 4. Grid
            if (proMode) {
                ctx.strokeStyle = theme === 'cyberpunk' ? 'rgba(0, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.03)';
                ctx.lineWidth = 1;
                const gridSize = 100 * viewport.zoom;
                if (gridSize > 5) {
                    const offsetX = (viewport.x % gridSize);
                    const offsetY = (viewport.y % gridSize);
                    ctx.beginPath();
                    for (let x = offsetX; x < width; x += gridSize) {
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, height);
                    }
                    for (let y = offsetY; y < height; y += gridSize) {
                        ctx.moveTo(0, y);
                        ctx.lineTo(width, y);
                    }
                    ctx.stroke();
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [viewport, theme, proMode]); // Only reubin when these change

    if (designSystem !== 'zero-point') {
        return null;
    }

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
    );
};

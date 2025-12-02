
import React, { useRef, useEffect } from 'react';

const Starfield: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const stars: { x: number; y: number; z: number }[] = [];
        const numStars = 500;

        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                z: Math.random() * width,
            });
        }

        let animationFrameId: number;

        const draw = () => {
            ctx.fillStyle = 'rgba(15, 12, 41, 1)';
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = 'white';
            for (let i = 0; i < numStars; i++) {
                const star = stars[i];
                star.z -= 1;
                if (star.z <= 0) {
                    star.z = width;
                }
                const x = (star.x - width / 2) * (width / star.z) + width / 2;
                const y = (star.y - height / 2) * (width / star.z) + height / 2;
                const r = Math.max(0.1, (width / star.z) / 2);

                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
            animationFrameId = requestAnimationFrame(draw);
        };
        draw();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};

export default Starfield;

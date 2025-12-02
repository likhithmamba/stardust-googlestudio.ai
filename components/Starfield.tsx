import React, { useRef, useEffect } from 'react';

const Starfield: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for opaque background
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const numStars = 500;
        const stars = new Float32Array(numStars * 3); // x, y, z

        for (let i = 0; i < numStars; i++) {
            stars[i * 3] = Math.random() * width;
            stars[i * 3 + 1] = Math.random() * height;
            stars[i * 3 + 2] = Math.random() * width;
        }

        let animationFrameId: number;

        const draw = () => {
            // Fill background
            ctx.fillStyle = '#0f0c29';
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = 'white';
            ctx.beginPath(); // Batch all stars into one path

            for (let i = 0; i < numStars; i++) {
                const i3 = i * 3;
                stars[i3 + 2] -= 1; // z
                if (stars[i3 + 2] <= 0) {
                    stars[i3 + 2] = width;
                    stars[i3] = Math.random() * width; // Reset x
                    stars[i3 + 1] = Math.random() * height; // Reset y
                }

                const z = stars[i3 + 2];
                const x = (stars[i3] - width / 2) * (width / z) + width / 2;
                const y = (stars[i3 + 1] - height / 2) * (width / z) + height / 2;
                
                // Only draw if within bounds
                if (x > 0 && x < width && y > 0 && y < height) {
                    const r = Math.max(0.1, (width / z) / 2);
                    ctx.moveTo(x, y);
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                }
            }
            ctx.fill();
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
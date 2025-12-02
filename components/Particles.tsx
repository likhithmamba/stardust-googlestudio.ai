import React, { useMemo } from 'react';

// Using CSS animations instead of JS/Framer Motion to keep the main thread free
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes orbit {
    from { transform: rotate(0deg) translateX(-50%) translateY(-50%); }
    to { transform: rotate(360deg) translateX(-50%) translateY(-50%); }
  }
  @keyframes orbit-reverse {
    from { transform: rotate(360deg) translateX(-50%) translateY(-50%); }
    to { transform: rotate(0deg) translateX(-50%) translateY(-50%); }
  }
  @keyframes pulse-fade {
    0%, 100% { opacity: 0; transform: scale(0.5) translate(-50%, 0); }
    50% { opacity: 1; transform: scale(1) translate(-50%, 0); }
  }
`;
document.head.appendChild(styleSheet);

interface ParticleProps {
    size: number;
    delay: number;
    orbitRadius: number;
    duration: number;
    reverse: boolean;
}

const Particle: React.FC<ParticleProps> = ({ size, delay, orbitRadius, duration, reverse }) => {
    return (
        <div
            className="absolute top-1/2 left-1/2 origin-top-left"
            style={{ 
                width: orbitRadius * 2, 
                height: orbitRadius * 2,
                animation: `${reverse ? 'orbit-reverse' : 'orbit'} ${duration}s linear infinite`,
                animationDelay: `-${delay}s`, // Negative delay starts animation immediately at offset
            }}
        >
            <div
                className="absolute top-0 left-1/2 bg-white/70 rounded-full blur-[1px]"
                style={{
                    width: size,
                    height: size,
                    animation: `pulse-fade ${Math.random() * 3 + 2}s ease-in-out infinite`,
                }}
            />
        </div>
    );
};

interface ParticleEmitterProps {
    diameter: number;
}

const ParticleEmitter: React.FC<ParticleEmitterProps> = ({ diameter }) => {
    // Reduced particle count slightly for better performance on large canvases
    const numParticles = Math.max(3, Math.floor(diameter / 25)); 

    const particles = useMemo(() => {
        return Array.from({ length: numParticles }).map((_, i) => ({
            id: i,
            size: Math.random() * 1.5 + 0.5,
            delay: Math.random() * 20,
            orbitRadius: (diameter / 2) + 5 + (Math.random() * 20),
            duration: Math.random() * 20 + 20,
            reverse: Math.random() > 0.5
        }));
    }, [diameter, numParticles]);

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {particles.map(p => (
                <Particle 
                    key={p.id} 
                    size={p.size} 
                    delay={p.delay} 
                    orbitRadius={p.orbitRadius} 
                    duration={p.duration}
                    reverse={p.reverse}
                />
            ))}
        </div>
    );
};

export default React.memo(ParticleEmitter);
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ParticleProps {
    size: number;
    delay: number;
    orbitRadius: number;
}

const Particle: React.FC<ParticleProps> = ({ size, delay, orbitRadius }) => {
    return (
        // This outer div handles the rotation/orbit
        <motion.div
            className="absolute top-1/2 left-1/2"
            style={{ width: orbitRadius * 2, height: orbitRadius * 2, x: '-50%', y: '-50%' }}
            animate={{ rotate: Math.random() > 0.5 ? 360 : -360 }} // Random direction
            transition={{
                duration: Math.random() * 20 + 20, // 20-40 seconds duration for a full orbit
                delay,
                repeat: Infinity,
                ease: 'linear',
            }}
        >
            {/* This is the actual particle element */}
            <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 bg-white/70 rounded-full blur-[1px]"
                style={{
                    width: size,
                    height: size,
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{
                    duration: Math.random() * 3 + 2,
                    repeat: Infinity,
                    repeatType: 'loop',
                    ease: 'easeInOut',
                }}
            />
        </motion.div>
    );
};

interface ParticleEmitterProps {
    diameter: number;
}

const ParticleEmitter: React.FC<ParticleEmitterProps> = ({ diameter }) => {
    const numParticles = Math.floor(diameter / 18); // Tuned for performance and aesthetics

    const particles = useMemo(() => {
        return Array.from({ length: numParticles }).map((_, i) => ({
            id: i,
            size: Math.random() * 1.5 + 0.5,
            delay: Math.random() * 10, // Wider delay range for more randomness
            orbitRadius: (diameter / 2) + 5 + (Math.random() * 25), // Varied radius for depth
        }));
    }, [diameter, numParticles]);

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {particles.map(p => (
                <Particle key={p.id} size={p.size} delay={p.delay} orbitRadius={p.orbitRadius} />
            ))}
        </div>
    );
};

export default ParticleEmitter;

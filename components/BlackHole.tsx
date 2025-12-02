import React from 'react';
import { motion } from 'framer-motion';
import useStore from '../hooks/useStore';
import { BLACK_HOLE_PROPERTIES } from '../constants';

const BlackHole: React.FC = () => {
    const { isAbsorbingNoteId } = useStore();
    const size = BLACK_HOLE_PROPERTIES.SIZE;
    const isPulling = !!isAbsorbingNoteId;

    return (
        <div
            id="black-hole"
            className="fixed bottom-8 right-8 z-10 flex items-center justify-center"
            style={{ width: size, height: size, pointerEvents: 'none' }}
        >
            <motion.div
                className="w-full h-full relative flex items-center justify-center"
                animate={{ scale: isPulling ? 1.25 : 1 }}
                transition={{ duration: 0.3, type: 'spring' }}
            >
                <div 
                    className="absolute w-[35%] h-[35%] bg-black rounded-full z-10"
                    style={{
                         boxShadow: 'inset 0 0 20px 10px rgba(0,0,0,0.9), 0 0 15px 5px rgba(255,165,0,0.2)',
                    }}
                />

                <motion.div
                    className="absolute w-[50%] h-[50%] rounded-full"
                    style={{
                        background: 'conic-gradient(from 90deg, transparent 0%, #ffc300 10%, #ff5733 30%, transparent 40%, transparent 70%, #ffc300 80%, transparent 100%)',
                        filter: 'blur(5px)',
                    }}
                    animate={{ rotate: -360 }}
                    transition={{
                        duration: isPulling ? 4 : 8,
                        repeat: Infinity,
                        ease: 'linear'
                    }}
                />

                <motion.div
                    className="absolute w-[80%] h-[80%] rounded-full opacity-80"
                    style={{
                        background: 'conic-gradient(from 180deg, transparent 0%, #ff8d00 25%, transparent 35%, transparent 60%, #e55900 75%, transparent 85%)',
                        filter: 'blur(8px)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: isPulling ? 8 : 15,
                        repeat: Infinity,
                        ease: 'linear'
                    }}
                />

                 <motion.div
                    className="absolute w-[120%] h-[120%] rounded-full opacity-60"
                    style={{
                        background: 'conic-gradient(from 270deg, transparent 0%, #d45100 40%, transparent 50%)',
                        filter: 'blur(12px)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: isPulling ? 12 : 22,
                        repeat: Infinity,
                        ease: 'linear'
                    }}
                />
            </motion.div>
        </div>
    );
};

export default BlackHole;
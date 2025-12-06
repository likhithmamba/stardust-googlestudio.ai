import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NoteType, NOTE_STYLES } from '../constants';

interface CreationMenuProps {
    x: number;
    y: number;
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: NoteType) => void;
}

export const CreationMenu: React.FC<CreationMenuProps> = ({ x, y, isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    // Grouping bodies as per request (reduce items per ring) could be done here, 
    // but for now we list them all but widely spaced.
    // Let's use the requested radius.
    const radius = 380;
    const options = Object.values(NoteType);

    return (
        <div
            className="fixed inset-0 z-50"
            onClick={onClose}
            onContextMenu={(e) => { e.preventDefault(); onClose(); }}
        >
            <motion.div
                className="absolute"
                style={{ left: 0, top: 0 }} // We'll manage position via transform in child or just absolute
                animate={{ x, y }}
                transition={{ duration: 0 }}
            >
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Orbital Rings Visual */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 pointer-events-none"
                                style={{ width: radius * 2, height: radius * 2 }}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 pointer-events-none"
                                style={{ width: radius * 1.4, height: radius * 1.4 }}
                            />

                            {/* Spinning Orbit Container */}
                            <motion.div
                                initial={{ rotate: 0 }}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 pointer-events-none"
                            >
                                {options.map((type, index) => {
                                    const angle = (index / options.length) * Math.PI * 2;
                                    const menuRadius = 180;
                                    const itemX = Math.cos(angle) * menuRadius;
                                    const itemY = Math.sin(angle) * menuRadius;

                                    const style = NOTE_STYLES[type];
                                    const previewSize = Math.max(16, style.width / 12);

                                    return (
                                        <motion.button
                                            key={type}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="absolute -ml-8 -mt-8 w-16 h-16 rounded-full flex flex-col items-center justify-center glass hover:bg-white/10 transition-colors group pointer-events-auto"
                                            style={{
                                                left: '50%',
                                                top: '50%',
                                                x: itemX,
                                                y: itemY,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelect(type);
                                                onClose();
                                            }}
                                            title={style.label}
                                        >
                                            <div
                                                className="rounded-full shadow-lg transition-transform group-hover:scale-110"
                                                style={{
                                                    width: previewSize,
                                                    height: previewSize,
                                                    backgroundColor: style.color,
                                                    boxShadow: `0 0 20px ${style.color}`,
                                                }}
                                            />
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Center Indicator */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="w-2 h-2 bg-white rounded-full absolute -ml-1 -mt-1 opacity-50 pointer-events-none"
                />
            </motion.div>
        </div>
    );
};

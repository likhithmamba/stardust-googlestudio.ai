import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { NoteType } from '../types';
import { NOTE_STYLES } from '../constants';

interface CreationMenuProps {
    x: number;
    y: number;
    onSelect: (type: NoteType) => void;
    onClose: () => void;
}

const celestialBodies: NoteType[] = [
    NoteType.Galaxy,
    NoteType.Nebula,
    NoteType.BlackHole,
    NoteType.Sun,
    NoteType.RedGiant,
    NoteType.WhiteDwarf,
    NoteType.Pulsar,
    NoteType.Jupiter,
    NoteType.Saturn,
    NoteType.Neptune,
    NoteType.Uranus,
    NoteType.Earth,
    NoteType.Venus,
    NoteType.Mars,
    NoteType.Mercury,
    NoteType.Planet,
    NoteType.Pluto,
    NoteType.Ceres,
    NoteType.Moon,
    NoteType.Asteroid,
    NoteType.Comet,
];

const CreationMenu: React.FC<CreationMenuProps> = ({ x, y, onSelect, onClose }) => {
    const radius = 380; // Increased radius for more spacing
    const angleStep = (Math.PI * 2) / celestialBodies.length;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { scale: 0, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 15 },
        },
        hover: {
            scale: 1.2,
            zIndex: 10,
            transition: { type: 'spring', stiffness: 400, damping: 10 },
        }
    };

    return (
        <div className="fixed inset-0 z-20" onClick={onClose}>
            <AnimatePresence>
                <motion.div
                    className="fixed top-0 left-0 z-30"
                    style={{ x, y, transform: 'translate(-50%, -50%)' }} // Center the origin on the cursor
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={(e) => e.stopPropagation()} // Prevent clicks inside the radius from closing the menu
                >
                    {celestialBodies.map((type, index) => {
                        const angle = index * angleStep - Math.PI / 2;
                        const itemX = radius * Math.cos(angle);
                        const itemY = radius * Math.sin(angle);
                        const style = NOTE_STYLES[type];
                        // Scale the preview size down for the menu
                        const previewDiameter = Math.max(30, style.size.diameter / 12);

                        return (
                            <motion.div
                                key={type}
                                className="absolute"
                                style={{
                                    x: itemX - previewDiameter / 2,
                                    y: itemY - previewDiameter / 2,
                                }}
                                variants={itemVariants}
                                whileHover="hover"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(type);
                                    }}
                                    className={`transition-all duration-200 flex items-center justify-center relative group ${style.colors} ${style.glow}`}
                                    style={{
                                        width: previewDiameter,
                                        height: previewDiameter,
                                        borderRadius: type === NoteType.Nebula ? '40% 60% 60% 40% / 70% 30% 70% 30%' : '9999px',
                                        background: type === NoteType.BlackHole ? 'black' : undefined
                                    }}
                                    title={type}
                                >
                                    {style.hasRings && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-[180%] h-[180%] border-[2px] border-amber-200/70 rounded-full" style={{ transform: 'rotateX(70deg)' }} />
                                            <div className="w-[150%] h-[150%] border-[1px] border-amber-100/50 rounded-full" style={{ transform: 'rotateX(70deg)' }} />
                                        </div>
                                    )}
                                    {type === NoteType.BlackHole && (
                                        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_2px_rgba(147,51,234,0.8)]" />
                                    )}
                                    <span className="absolute -bottom-6 text-xs text-white bg-black/30 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{type}</span>
                                </button>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default CreationMenu;
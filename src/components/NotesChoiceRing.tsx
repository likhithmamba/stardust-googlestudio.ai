import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { NoteType, ALLOWED_TYPES_PER_MODE } from '../constants';
import type { NoteType as NoteTypeValue } from '../constants';
import { useSettingsStore } from '../ui/settings/settingsStore';

interface NotesChoiceRingProps {
    x: number;
    y: number;
    onSelect: (type: NoteTypeValue) => void;
    onClose: () => void;
}

// Three-orbit Genesis Ring — organized by object tier
const ORBITS = [
    {
        id: 'macro',
        label: 'STRATEGIC CORE',
        radius: 145, // +30% from 110 approx
        items: [
            { type: NoteType.Sun, label: 'Star', glow: '#fbbf24', desc: 'Central Core\nStrategic Pillar' },
            { type: NoteType.Galaxy, label: 'Galaxy', glow: '#6366f1', desc: 'Systemic\nArchitecture' },
            { type: NoteType.Nebula, label: 'Nebula', glow: '#a78bfa', desc: 'Creative Hub\nIdea Nursery' },
        ],
    },
    {
        id: 'meso',
        label: 'OPERATIONAL MID-REACH',
        radius: 260, // +30% from 200
        items: [
            { type: NoteType.Earth, label: 'Standard', glow: '#3b82f6', desc: 'Active Topic\nStandard Unit' },
            { type: NoteType.Mars, label: 'Secondary', glow: '#ef4444', desc: 'Supportive\nTask Item' },
            { type: NoteType.Jupiter, label: 'Gas Giant', glow: '#f59e0b', desc: 'Large Resource\nHeavy Weight' },
            { type: NoteType.Saturn, label: 'Ringed Star', glow: '#eab308', desc: 'Structured\nOperations' },
        ],
    },
    {
        id: 'micro',
        label: 'TACTICAL PERIPHERY',
        radius: 360, // +30% from 280
        items: [
            { type: NoteType.Moon, label: 'Satellite', glow: '#d1d5db', desc: 'Reference Node' },
            { type: NoteType.Asteroid, label: 'Fragment', glow: '#6b7280', desc: 'Minor Snippet' },
            { type: NoteType.Comet, label: 'Transient', glow: '#22d3ee', desc: 'Fleeting Note' },
        ],
    },
];

const TIER_SIZE: Record<string, number> = { star: 100, planet: 70, moon: 50, asteroid: 40 };

function getTierForSize(type: NoteTypeValue): string {
    const stars = [NoteType.Sun, NoteType.Nebula, NoteType.Galaxy];
    const moons = [NoteType.Moon, NoteType.Mercury, NoteType.Pluto];
    const fragments = [NoteType.Asteroid, NoteType.Comet];
    if ((stars as NoteTypeValue[]).includes(type)) return 'star';
    if ((moons as NoteTypeValue[]).includes(type)) return 'moon';
    if ((fragments as NoteTypeValue[]).includes(type)) return 'asteroid';
    return 'planet';
}

export const NotesChoiceRing: React.FC<NotesChoiceRingProps> = ({ x, y, onSelect, onClose }) => {
    const designSystem = useSettingsStore((state) => state.designSystem);
    const viewMode = useSettingsStore((state) => state.viewMode) || 'void';
    const isSolar = designSystem === 'solar';

    const menuBlur = isSolar ? 'backdrop-blur-xl bg-white/20' : 'backdrop-blur-xl bg-[#020210]/40';
    const textClass = isSolar ? 'text-slate-800' : 'text-white';
    const subTextClass = isSolar ? 'text-slate-500' : 'text-white/30';
    const ringBorderClass = isSolar ? 'border-slate-300/30' : 'border-white/5';

    const allowedTypes = ALLOWED_TYPES_PER_MODE[viewMode] || ALLOWED_TYPES_PER_MODE['void'];

    const getModeLabel = (type: NoteTypeValue, defaultLabel: string) => {
        if (viewMode === 'orbital') {
            if (type === NoteType.Jupiter) return 'Major Goal';
            if (type === NoteType.Earth) return 'Task';
            if (type === NoteType.Moon) return 'Quick Action';
        }
        if (viewMode === 'prism') {
            if (type === NoteType.Earth) return 'Project';
            if (type === NoteType.Moon) return 'Task';
        }
        if (viewMode === 'timeline') {
            if (type === NoteType.Mars) return 'Milestone';
            if (type === NoteType.Earth) return 'Event';
            if (type === NoteType.Comet) return 'Deadline';
        }
        return defaultLabel;
    };

    return (
        <div
            className={clsx("fixed inset-0 z-[2000] overflow-hidden select-none", menuBlur)}
            onClick={onClose}
        >
            {/* Animated Background Pulse */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 pointer-events-none"
                style={{ background: isSolar ? 'radial-gradient(circle at center, rgba(99,102,241,0.05) 0%, transparent 70%)' : 'radial-gradient(circle at center, rgba(25,25,230,0.1) 0%, transparent 70%)' }}
            />

            <motion.div
                initial={{ scale: 0.5, opacity: 0, x: x - 325, y: y - 325 }}
                animate={{ scale: 1, opacity: 1, x: x - 325, y: y - 325 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="absolute w-[650px] h-[650px] flex items-center justify-center pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Center label */}
                <div className="text-center space-y-1 pointer-events-none z-10">
                    <motion.h1
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className={clsx("text-3xl font-bold tracking-[0.3em] uppercase", textClass)}
                        style={{ fontFamily: 'var(--mode-font, "Space Grotesk")' }}
                    >
                        GENESIS
                    </motion.h1>
                    <motion.p
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className={clsx("text-xl font-black tracking-[0.4em] uppercase", textClass)}
                    >
                        SELECT CELESTIAL BODY
                    </motion.p>
                </div>

                {/* Orbit rings */}
                {ORBITS.map((orbit, orbitIdx) => {
                    const filteredItems = orbit.items.filter(item => allowedTypes.includes(item.type));
                    if (filteredItems.length === 0) return null;

                    return (
                        <React.Fragment key={orbit.id}>
                            {/* Orbit circle border */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 * orbitIdx, duration: 0.8 }}
                                className={clsx("absolute rounded-full border dashed-border pointer-events-none", ringBorderClass)}
                                style={{
                                    width: orbit.radius * 2,
                                    height: orbit.radius * 2,
                                    borderStyle: 'dashed',
                                    borderWidth: '1px',
                                    borderColor: isSolar ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
                                }}
                            />

                            {/* Items on this orbit */}
                            {filteredItems.map((item, itemIdx) => {
                                const angle = (itemIdx / filteredItems.length) * 360 - 90;
                                const rad = (angle * Math.PI) / 180;
                                const cx = Math.cos(rad) * orbit.radius;
                                const cy = Math.sin(rad) * orbit.radius;
                                const tierSize = TIER_SIZE[getTierForSize(item.type)] || 36;

                                return (
                                    <motion.div
                                        key={item.type}
                                        className="absolute cursor-pointer group"
                                        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                        animate={{ opacity: 1, scale: 1, x: cx, y: cy }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        transition={{
                                            delay: 0.15 + 0.04 * (orbitIdx * 4 + itemIdx),
                                            type: 'spring', stiffness: 400, damping: 25,
                                        }}
                                        style={{
                                            top: 'calc(50% - ' + tierSize / 2 + 'px)',
                                            left: 'calc(50% - ' + tierSize / 2 + 'px)',
                                        }}
                                        onClick={() => {
                                            onSelect(item.type);
                                            onClose();
                                        }}
                                    >
                                        {/* The celestial body */}
                                        <div
                                            className={clsx(
                                                'rounded-full transition-all duration-500 relative',
                                                'border border-white/20 shadow-xl overflow-hidden'
                                            )}
                                            style={{
                                                width: tierSize,
                                                height: tierSize,
                                                background: `radial-gradient(circle at 30% 30%, ${item.glow}, ${item.glow}44)`,
                                                boxShadow: `0 0 20px ${item.glow}30, inset -5px -5px 15px rgba(0,0,0,0.2)`
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-50" />
                                            {/* Atmosphere glow */}
                                            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                style={{ boxShadow: `0 0 30px 5px ${item.glow}88` }} />
                                        </div>

                                        {/* Label tooltips */}
                                        <div className={clsx(
                                            'absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1',
                                            'opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-2',
                                            'pointer-events-none'
                                        )}>
                                            <span className={clsx(
                                                'text-[13px] font-black tracking-[0.2em] uppercase whitespace-nowrap',
                                                textClass
                                            )}>
                                                {getModeLabel(item.type, item.label)}
                                            </span>
                                            <span className={clsx(
                                                'text-[10px] tracking-widest uppercase whitespace-pre-line font-medium text-center leading-tight',
                                                subTextClass
                                            )}>
                                                {item.desc}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </React.Fragment>
                    );
                })}

                {/* Cancel Hint */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className={clsx("absolute -bottom-16 text-[9px] uppercase tracking-[0.4em]", subTextClass)}
                >
                    Click anywhere to disperse
                </motion.div>
            </motion.div>
        </div>
    );
};

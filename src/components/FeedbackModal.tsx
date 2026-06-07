/**
 * STARDUST — First-Launch Feedback Modal
 * One-time, aesthetically-integrated feedback capture.
 * 4 questions, dark overlay, orbital progress dots.
 * All data stored in IndexedDB. No PII. No transmission without consent.
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizePlainText } from '../utils/sanitize';
import { initDB } from '../db/idb';

interface FeedbackEntry {
    id: string;
    completedAt: number | null;
    skipped: boolean;
    q1_source: string;
    q2_usecase: string;
    q3_frustration: string;
    q4_aspiration: string;
    appVersion: string;
}

const QUESTIONS = [
    {
        key: 'q1_source',
        title: 'How did you find Stardust?',
        subtitle: 'Help us understand where our cosmic travellers come from.',
        options: ['Search engine', 'Social media', 'Friend / colleague', 'Blog / article', 'App store'],
        allowFreeText: true,
    },
    {
        key: 'q2_usecase',
        title: 'What do you hope to use Stardust for?',
        subtitle: 'There are no wrong answers — we want to build for you.',
        options: ['Personal notes & journaling', 'Project management', 'Research & knowledge base', 'Creative brainstorming', 'Team collaboration'],
        allowFreeText: true,
    },
    {
        key: 'q3_frustration',
        title: 'What frustrated you about other note tools?',
        subtitle: 'Your pain is our compass.',
        options: ['Too many features', 'Too few features', 'Notes pile up and go stale', 'Hard to find things', 'Ugly or boring design'],
        allowFreeText: true,
    },
    {
        key: 'q4_aspiration',
        title: 'What would make Stardust feel truly yours?',
        subtitle: 'Dream big — we\'re listening.',
        options: ['AI that organizes for me', 'Beautiful visual design', 'Works offline perfectly', 'Connects ideas automatically', 'Stays out of my way'],
        allowFreeText: true,
    },
];

async function saveFeedback(entry: Partial<FeedbackEntry>): Promise<void> {
    try {
        const db = await initDB();
        const tx = db.transaction('feedback', 'readwrite');
        await tx.objectStore('feedback').put({ id: 'first-launch', ...entry });
        await tx.done;
    } catch (e) {
        console.error('[Feedback] Save failed:', e);
    }
}

export async function getFeedbackStatus(): Promise<'completed' | 'skipped' | 'pending'> {
    try {
        const db = await initDB();
        const entry = await db.get('feedback', 'first-launch');
        if (!entry) return 'pending';
        if (entry.skipped) return 'skipped';
        if (entry.completedAt) return 'completed';
        return 'pending';
    } catch {
        return 'pending';
    }
}

interface FeedbackModalProps {
    onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [freeText, setFreeText] = useState('');
    const [showFinal, setShowFinal] = useState(false);

    const currentQ = QUESTIONS[step];

    const handleSelect = useCallback((value: string) => {
        const key = currentQ.key;
        const sanitized = sanitizePlainText(value);
        const newAnswers = { ...answers, [key]: sanitized };
        setAnswers(newAnswers);
        setFreeText('');

        // Progressive save
        saveFeedback(newAnswers);

        if (step < QUESTIONS.length - 1) {
            setStep(step + 1);
        } else {
            // All done
            saveFeedback({
                ...newAnswers,
                completedAt: Date.now(),
                skipped: false,
                appVersion: '2.5',
            });
            setShowFinal(true);
            setTimeout(() => onClose(), 2000);
        }
    }, [currentQ, answers, step, onClose]);

    const handleSkip = useCallback(() => {
        saveFeedback({ skipped: true, completedAt: null });
        onClose();
    }, [onClose]);

    const handleFreeTextSubmit = useCallback(() => {
        if (freeText.trim()) {
            handleSelect(freeText.trim());
        }
    }, [freeText, handleSelect]);

    if (showFinal) {
        return (
            <motion.div
                className="fixed inset-0 z-[10000] flex items-center justify-center"
                style={{ backgroundColor: 'rgba(7,7,13,0.92)', backdropFilter: 'blur(8px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="text-3xl mb-4">✨</div>
                    <p className="text-white/80 text-lg font-light tracking-wide">
                        Your constellation is forming.
                    </p>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="fixed inset-0 z-[10000] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(7,7,13,0.92)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="w-full max-w-md mx-4 rounded-2xl border border-white/10 p-8"
                style={{ backgroundColor: 'rgba(15,15,25,0.95)' }}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
                {/* Progress dots */}
                <div className="flex justify-center gap-3 mb-8">
                    {QUESTIONS.map((_, i) => (
                        <div
                            key={i}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                                i === step
                                    ? 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)] scale-125'
                                    : i < step
                                        ? 'bg-indigo-500/60'
                                        : 'bg-white/15'
                            }`}
                        />
                    ))}
                </div>

                {/* Question */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h2 className="text-white text-xl font-semibold mb-2">
                            {currentQ.title}
                        </h2>
                        <p className="text-white/40 text-sm mb-6">
                            {currentQ.subtitle}
                        </p>

                        {/* Options */}
                        <div className="space-y-2 mb-6">
                            {currentQ.options.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => handleSelect(opt)}
                                    className="w-full text-left px-4 py-3 rounded-xl border border-white/10 text-white/80 text-sm hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all duration-200"
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>

                        {/* Free text */}
                        {currentQ.allowFreeText && (
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={freeText}
                                    onChange={(e) => setFreeText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFreeTextSubmit()}
                                    placeholder="Or type your own..."
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm placeholder-white/20 focus:border-indigo-500/40 focus:outline-none"
                                />
                                <button
                                    onClick={handleFreeTextSubmit}
                                    className="px-4 py-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 text-sm hover:bg-indigo-500/30 transition-colors"
                                >
                                    →
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Skip */}
                <button
                    onClick={handleSkip}
                    className="w-full text-center text-white/25 text-xs hover:text-white/50 transition-colors mt-2"
                >
                    Skip for now
                </button>
            </motion.div>
        </motion.div>
    );
};

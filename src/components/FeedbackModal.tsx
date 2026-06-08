import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizePlainText } from '../utils/sanitize';
import { initDB } from '../db/idb';
import { useSettingsStore } from '../ui/settings/settingsStore';

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
    const feedbackQuestions = useSettingsStore((state) => state.feedbackQuestions);
    const feedbackEmail = useSettingsStore((state) => state.feedbackEmail);

    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [freeText, setFreeText] = useState('');
    const [showFinal, setShowFinal] = useState(false);

    const currentQ = feedbackQuestions[step];

    const handleSelect = useCallback((value: string) => {
        const key = currentQ.key;
        const sanitized = sanitizePlainText(value);
        const newAnswers = { ...answers, [key]: sanitized };
        setAnswers(newAnswers);
        setFreeText('');

        // Progressive save
        saveFeedback(newAnswers);

        if (step < feedbackQuestions.length - 1) {
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
            window.dispatchEvent(new CustomEvent('stardust:toast', {
                detail: { message: 'Thank you for your feedback! It has been securely saved locally.', type: 'success' }
            }));
        }
    }, [currentQ, answers, step, feedbackQuestions, onClose]);

    const handleSkip = useCallback(() => {
        saveFeedback({ skipped: true, completedAt: null });
        window.dispatchEvent(new CustomEvent('stardust:toast', {
            detail: { message: 'Feedback skipped. You can reopen it anytime from settings.', type: 'info' }
        }));
        onClose();
    }, [onClose]);

    const handleFreeTextSubmit = useCallback(() => {
        if (freeText.trim()) {
            handleSelect(freeText.trim());
        }
    }, [freeText, handleSelect]);

    const handleSendEmail = () => {
        const emailBody = feedbackQuestions.map((q, i) => {
            const answer = answers[q.key] || 'No answer';
            return `Q${i + 1}: ${q.title}\nAnswer: ${answer}\n`;
        }).join('\n') + `\nApp Version: 2.5\nPlatform: Local Browser`;

        const mailtoUrl = `mailto:${encodeURIComponent(feedbackEmail)}?subject=${encodeURIComponent('Stardust Application Feedback')}&body=${encodeURIComponent(emailBody)}`;
        window.open(mailtoUrl, '_blank');
    };

    const handleCopyToClipboard = () => {
        const emailBody = feedbackQuestions.map((q, i) => {
            const answer = answers[q.key] || 'No answer';
            return `Q${i + 1}: ${q.title}\nAnswer: ${answer}`;
        }).join('\n\n') + `\n\nApp Version: 2.5\nPlatform: Local Browser`;

        navigator.clipboard.writeText(emailBody).then(() => {
            window.dispatchEvent(new CustomEvent('stardust:toast', {
                detail: { message: 'Feedback copied to clipboard!', type: 'success' }
            }));
        });
    };

    if (showFinal) {
        return (
            <motion.div
                className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-auto"
                style={{ backgroundColor: 'rgba(7,7,13,0.92)', backdropFilter: 'blur(8px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="w-full max-w-lg mx-4 rounded-3xl border border-white/10 p-8 text-center flex flex-col gap-6"
                    style={{ backgroundColor: 'rgba(15,15,25,0.95)' }}
                >
                    <div>
                        <div className="text-3xl mb-3">✨</div>
                        <h2 className="text-white text-xl font-bold tracking-tight">Your Feedback is Formed</h2>
                        <p className="text-white/40 text-xs mt-1">Send these details directly to your development lead or copy them locally.</p>
                    </div>

                    <div className="text-left bg-black/40 border border-white/5 p-5 rounded-2xl max-h-56 overflow-y-auto text-xs space-y-3 custom-scrollbar">
                        {feedbackQuestions.map((q, i) => (
                            <div key={q.key} className="space-y-1">
                                <span className="block font-bold text-white/50 uppercase tracking-widest text-[9px]">Q{i + 1}: {q.title}</span>
                                <span className="block text-indigo-200">{answers[q.key] || 'No answer provided'}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleSendEmail}
                            className="flex-1 py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                        >
                            📧 Send via Email Client
                        </button>
                        <button
                            onClick={handleCopyToClipboard}
                            className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            📋 Copy to Clipboard
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="py-3 w-full rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        Return to Cosmos
                    </button>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-auto"
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
                    {feedbackQuestions.map((_, i) => (
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

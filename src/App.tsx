import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from './utils/sound';
import { ModeManager } from './ui/modes/ModeManager';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { startDecayEngine, stopDecayEngine } from './engine/decayEngine';

import { LandingUltimate } from './pages/LandingUltimate';
import { loadFromDB } from './store/useStore';
import { UpdateNotifier } from './pwa/updateNotifier';

function App() {
    const [hasEnteredApp, setHasEnteredApp] = useState(false);
    useKeyboardShortcuts();

    // Hydrate store from DB on mount
    useEffect(() => {
        loadFromDB();
    }, []);

    // Toggle body scroll: landing page needs scroll, workspace needs overflow:hidden
    useEffect(() => {
        if (!hasEnteredApp) {
            document.body.classList.add('landing-active');
        } else {
            document.body.classList.remove('landing-active');
        }
        return () => document.body.classList.remove('landing-active');
    }, [hasEnteredApp]);

    // Start/stop the decay engine when the app canvas is active
    useEffect(() => {
        if (hasEnteredApp) {
            startDecayEngine();
            return () => stopDecayEngine();
        }
    }, [hasEnteredApp]);

    const handleEnterApp = () => {
        soundManager.playWarp();
        setHasEnteredApp(true);
    };

    return (
        <AnimatePresence mode="wait">
            {!hasEnteredApp ? (
                <motion.div
                    key="landing"
                    exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)" }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="w-full h-full"
                >
                    <LandingUltimate onEnterApp={handleEnterApp} />
                </motion.div>
            ) : (
                <motion.div
                    key="canvas"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 2.0, ease: "circOut" }}
                    className="w-full h-full"
                >
                    <ModeManager />
                    <UpdateNotifier />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default App;

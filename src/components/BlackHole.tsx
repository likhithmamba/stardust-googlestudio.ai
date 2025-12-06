import React from 'react';
import { motion } from 'framer-motion';

interface BlackHoleProps {
    isActive: boolean;
}

export const BlackHole: React.FC<BlackHoleProps> = ({ isActive }) => {

    // In a real implementation, we would subscribe to drag events to check distance
    // For now, we'll rely on the parent (CanvasViewport) to pass a prop or update a store value
    // But since the prompt asks for "Gravity Logic: During a drag event... system calculates distance",
    // we can make this component purely visual and reactive to a prop if we want, 
    // OR we can make it subscribe to the store's "dragState" if we put that in the store.
    // Currently `dragState` is local state in CanvasViewport.
    // Let's make this component accept an `isActive` prop or similar, 
    // BUT for simplicity in integration, let's just make it a dumb component that animates 
    // and let CanvasViewport handle the logic and pass a prop.
    // Wait, I can't easily pass props if I just drop it in. 
    // Let's export it and use it in CanvasViewport.

    // Actually, let's make it self-contained if possible? No, it needs to know about dragging.
    // I'll add `isBlackHoleActive` to the store or just pass it as a prop from CanvasViewport.
    // Passing as prop is cleaner for now.

    return (
        <div className="fixed bottom-8 right-8 w-32 h-32 pointer-events-none z-40 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Event Horizon */}
                <motion.div
                    className="absolute w-24 h-24 bg-black rounded-full shadow-[0_0_50px_#000]"
                    animate={{
                        scale: isActive ? 1.5 : 1,
                        rotate: 360
                    }}
                    transition={{
                        rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                        scale: { duration: 0.3 }
                    }}
                />

                {/* Accretion Disk */}
                <motion.div
                    className="absolute w-32 h-32 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-orange-500 border-l-transparent opacity-80 blur-sm"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute w-40 h-40 rounded-full border-2 border-t-transparent border-r-white border-b-transparent border-l-white opacity-30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />
            </div>
        </div>
    );
};

// We'll actually implement the logic in CanvasViewport and just use this for visuals?
// Or we can use a store selector if we move drag state to store.
// Let's stick to props in CanvasViewport for now.

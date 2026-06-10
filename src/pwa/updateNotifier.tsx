// src/pwa/updateNotifier.tsx — Custom Update Prompt Notification Toast
import React, { useState, useEffect } from 'react';

export const UpdateNotifier: React.FC = () => {
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        const handleUpdate = (e: Event) => {
            const customEvent = e as CustomEvent<{ registration: ServiceWorkerRegistration }>;
            setRegistration(customEvent.detail.registration);
        };

        window.addEventListener('stardust:sw-update', handleUpdate);
        return () => window.removeEventListener('stardust:sw-update', handleUpdate);
    }, []);

    const handleReload = () => {
        if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
            window.location.reload();
        }
    };

    if (!registration) return null;

    return (
        <div className="fixed bottom-8 right-8 z-[9999] max-w-sm bg-[#0A0B14]/90 border border-indigo-500/30 rounded-3xl p-6 shadow-[0_16px_48px_rgba(99,102,241,0.2)] backdrop-blur-2xl flex flex-col gap-4 transition-all duration-300">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <span className="material-symbols-outlined animate-pulse">system_update</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-black tracking-widest uppercase text-white">Update Available</span>
                    <span className="text-[10px] text-white/50 leading-relaxed">
                        A new cosmic update has been deployed. Reload to step into the updated universe.
                    </span>
                </div>
            </div>
            <div className="flex justify-end gap-3">
                <button 
                    onClick={() => setRegistration(null)}
                    className="px-4 py-2 rounded-xl text-[9px] uppercase font-bold tracking-widest text-white/40 hover:text-white/70 hover:bg-white/3 transition-colors"
                >
                    Later
                </button>
                <button
                    onClick={handleReload}
                    className="px-5 py-2 rounded-xl bg-indigo-500 text-white text-[9px] uppercase font-black tracking-widest hover:bg-indigo-600 transition-colors shadow-[0_0_12px_rgba(99,102,241,0.3)] flex items-center gap-1.5"
                >
                    <span className="material-symbols-outlined text-[12px]">cached</span>
                    Reload Universe
                </button>
            </div>
        </div>
    );
};

import React from 'react';
import { useSettingsStore } from '../../ui/settings/settingsStore';
import { useStore, noteVisibleInMode } from '../../store/useStore';
import { NoteType } from '../../constants';

export const PrismChrome: React.FC = () => {
    const designSystem = useSettingsStore((state) => state.designSystem);
    const isSolar = designSystem === 'solar';

    const handleSynthesize = () => {
        if (!navigator.onLine) {
            window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'AI unavailable offline. Please check your connection.', type: 'error' } }));
            return;
        }

        const countStr = localStorage.getItem('stardust_synthesis_count') || '0';
        const count = parseInt(countStr, 10);
        if (count >= 5) {
            window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Rate limit reached: Maximum of 5 syntheses allowed per hour.', type: 'error' } }));
            return;
        }

        localStorage.setItem('stardust_synthesis_count', (count + 1).toString());

        const store = useStore.getState();
        const activeConstellation = store.activeConstellation;
        const prismNotes = store.notes.filter(n => noteVisibleInMode(n, 'prism', activeConstellation));

        const CX = window.innerWidth / 2;
        const CY = window.innerHeight / 2;

        store.addNote({
            id: 'synth-' + Math.random().toString(36).substr(2, 9),
            x: CX - 40,
            y: CY - 150,
            w: 80,
            h: 80,
            type: NoteType.Sun,
            title: 'AI SYNTHESIS 🧠',
            content: `Synthesized analysis of ${prismNotes.length} notes:
Primary themes detected: ${prismNotes.map(n => n.title || 'Untitled').slice(0, 3).join(', ') || 'None'}.
Recommendation: Maintain steady progress on active items to avoid timeline slippage.`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            originMode: 'prism',
            status: 'todo',
            priority: 'high',
        } as any);

        window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'AI Synthesis created a new Sun core note!', type: 'success' } }));
    };

    // Solar Theme
    if (isSolar) {
        return (
            <div className="absolute inset-0 pointer-events-none font-inter text-zinc-900 flex flex-col">
                {/* Visual Metadata Only */}
                <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center opacity-30">
                    <h1 className="font-display text-2xl font-light tracking-tight text-zinc-800 uppercase">Reflections</h1>
                    <p className="text-[10px] tracking-[0.4em] text-zinc-400 mt-2 uppercase">Prism Analysis Mode</p>
                </div>

                {/* Background Grid Lines (Visual Flair) */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10 z-0">
                    <div className="absolute top-[20%] left-[10%] w-px h-[60%] bg-gradient-to-b from-transparent via-zinc-400 to-transparent"></div>
                    <div className="absolute top-[20%] left-[36.6%] w-px h-[60%] bg-gradient-to-b from-transparent via-zinc-400 to-transparent"></div>
                    <div className="absolute top-[20%] left-[63.3%] w-px h-[60%] bg-gradient-to-b from-transparent via-zinc-400 to-transparent"></div>
                    <div className="absolute top-[20%] left-[90%] w-px h-[60%] bg-gradient-to-b from-transparent via-zinc-400 to-transparent"></div>
                </div>

                {/* Bottom HUD info with button */}
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40 pointer-events-auto">
                    <button
                        onClick={handleSynthesize}
                        className="backdrop-blur-xl bg-slate-900/10 hover:bg-slate-900/25 border border-slate-900/20 px-4 py-2 rounded-lg text-[9px] tracking-widest uppercase font-mono text-slate-800 transition-all shadow-lg"
                    >
                        🧠 Synthesize Notes (AI)
                    </button>
                </div>
            </div>
        );
    }

    // Zero Point Theme
    return (
        <div className="absolute inset-0 pointer-events-none font-sans-alt text-white/90 flex flex-col">
            {/* Deep Space Background / Environmental Visuals */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                        backgroundSize: '120px 120px'
                    }}
                />
            </div>

            <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center opacity-20">
                <h1 className="text-xs font-bold tracking-[0.4em] uppercase text-white/50">Spectral Array // Prism</h1>
            </div>

            {/* Bottom HUD info with button */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40 pointer-events-auto">
                <button
                    onClick={handleSynthesize}
                    className="backdrop-blur-xl bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 px-4 py-2 rounded-lg text-[9px] tracking-widest uppercase font-mono text-white transition-all shadow-lg"
                >
                    🧠 Synthesize Notes (AI)
                </button>
            </div>
        </div>
    );
};

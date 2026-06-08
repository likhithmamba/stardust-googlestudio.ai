import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface LandingUltimateProps {
  onEnterApp: () => void;
}

const COGNITIVE_MODES = [
  {
    id: 'void',
    title: 'Void',
    tagline: 'Freeform brainstorm',
    description: 'An infinite playground where notes float with physics. Capture thoughts without structure or judgment.',
    icon: 'blur_on',
    color: 'from-indigo-500 to-cyan-400'
  },
  {
    id: 'matrix',
    title: 'Matrix',
    tagline: 'Eisenhower triage',
    description: 'Prioritize tasks by urgency and importance. Drag cards between Do, Plan, Delegate, and Eliminate quadrants.',
    icon: 'grid_view',
    color: 'from-blue-500 to-indigo-400'
  },
  {
    id: 'orbital',
    title: 'Orbital',
    tagline: 'Gravitational priorities',
    description: 'Map items in concentric rings by priority. Critical notes orbit close to the center, stale notes drift outward.',
    icon: 'bubble_chart',
    color: 'from-purple-500 to-pink-400'
  },
  {
    id: 'prism',
    title: 'Prism',
    tagline: 'Semantic clustering',
    description: 'Cluster notes by topics and tags. Cross-topic connections are illuminated as glowing curved arcs.',
    icon: 'view_column',
    color: 'from-violet-500 to-fuchsia-400'
  },
  {
    id: 'timeline',
    title: 'Timeline',
    tagline: 'Velocity Lanes',
    description: 'Track temporal velocity. Lanes categorize notes by activity (Today, Week, Month), glowing when active.',
    icon: 'timeline',
    color: 'from-amber-500 to-yellow-400'
  }
];

export const LandingUltimate: React.FC<LandingUltimateProps> = ({ onEnterApp }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState('void');
  const [isWarping, setIsWarping] = useState(false);

  // ── Hero starfield canvas ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const STARS = Array.from({ length: 180 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.3,
      opacity: Math.random() * 0.7 + 0.1,
      speed: Math.random() * 0.02 + 0.01,
      phase: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 0.0002,
      driftY: (Math.random() - 0.5) * 0.0002,
    }));

    let t = 0, raf = 0;
    const draw = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.2)'; // Sleek tail fading
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      t += 0.016;

      STARS.forEach(s => {
        const pulse = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity * (0.4 + 0.6 * pulse)})`;
        ctx.fill();

        s.x += s.driftX;
        s.y += s.driftY;
        if (s.x < 0) s.x = 1;
        if (s.x > 1) s.x = 0;
        if (s.y < 0) s.y = 1;
        if (s.y > 1) s.y = 0;
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleEnter = () => {
    setIsWarping(true);
    setTimeout(onEnterApp, 1000);
  };

  const activeMode = COGNITIVE_MODES.find(m => m.id === activeTab) || COGNITIVE_MODES[0];

  return (
    <div className={clsx(
      "relative w-full h-screen overflow-hidden bg-[#020617] text-white flex flex-col font-sans select-none transition-all duration-1000",
      isWarping && "scale-110 filter blur-sm opacity-0"
    )}>
      {/* Dynamic Starfield Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-10" />

      {/* Top Navbar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            ✨
          </div>
          <span className="text-sm font-black tracking-[0.3em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
            Stardust
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/50 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Local-First & Secure
          </div>
          <button
            onClick={handleEnter}
            className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold uppercase tracking-wider transition-all duration-300"
          >
            Enter universe
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 pointer-events-auto">
        
        {/* Left Panel: App Intro */}
        <div className="flex-1 text-center lg:text-left space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-extrabold text-indigo-300 tracking-[0.15em] uppercase">
            // Space is your Canvas
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none">
            Organize thoughts in <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
              concentric orbits.
            </span>
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-white/50 font-light">
            Stardust is an infinite physics-directed canvas for unstructured ideas. Notes have mass and orbit automatically. Unused thoughts fade naturally, maintaining visual focus on what is active right now.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button
              onClick={handleEnter}
              className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_45px_rgba(99,102,241,0.6)] transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              Enter the Cosmos
            </button>
            
            <div className="text-[11px] text-white/30 tracking-wide font-mono">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 border border-white/5 text-[9px]">H</kbd> in-app for shortcuts
            </div>
          </div>
        </div>

        {/* Right Panel: Feature tabs */}
        <div className="w-full max-w-xl lg:w-[480px] bg-white/[0.02] border border-white/10 backdrop-blur-2xl rounded-3xl p-6 flex flex-col shadow-[0_32px_64px_rgba(0,0,0,0.6)]">
          {/* Tab selector */}
          <div className="flex flex-wrap justify-between gap-1.5 mb-6 pb-4 border-b border-white/5">
            {COGNITIVE_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => setActiveTab(mode.id)}
                className={clsx(
                  "flex-1 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 border",
                  activeTab === mode.id
                    ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30 shadow-inner"
                    : "bg-transparent text-white/40 border-transparent hover:text-white/70"
                )}
              >
                <span className="material-symbols-outlined text-sm">{mode.icon}</span>
                {mode.title}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="h-56 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMode.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg",
                    activeMode.color
                  )}>
                    <span className="material-symbols-outlined text-lg">{activeMode.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight">{activeMode.title} Mode</h3>
                    <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">{activeMode.tagline}</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed text-white/55 font-light">
                  {activeMode.description}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/30 tracking-wide">
              <span>🛡️ Local SQLite/IndexedDB encrypted</span>
              <span>⚡ Zero-Network Latency</span>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-white/30 tracking-widest uppercase">
        <div>© 2026 Stardust Infinite Space</div>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <span>Zero Server, Zero cloud</span>
          <span>•</span>
          <span>100% Offline-Capable</span>
        </div>
      </footer>
    </div>
  );
};
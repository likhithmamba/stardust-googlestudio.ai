import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Sparkles, Shield, Cpu, Zap, HelpCircle, ChevronDown, ChevronUp, ArrowRight, Github, Code2, PenTool, FlaskConical, Check, Star } from 'lucide-react';

interface LandingUltimateProps {
  onEnterApp: () => void;
}

interface SandboxNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  color: string;
  label: string;
  glowColor: string;
}

const COGNITIVE_MODES = [
  {
    id: 'void',
    title: 'Void',
    tagline: 'Freeform Brainstorm',
    description: 'An infinite playground where notes float with physics. Capture thoughts without structure or judgment.',
    icon: 'blur_on',
    color: 'from-indigo-500 to-cyan-400',
    accentColor: '#6366f1'
  },
  {
    id: 'matrix',
    title: 'Matrix',
    tagline: 'Eisenhower Triage',
    description: 'Prioritize tasks by urgency and importance. Drag cards between Do, Plan, Delegate, and Eliminate quadrants.',
    icon: 'grid_view',
    color: 'from-blue-500 to-indigo-400',
    accentColor: '#3b82f6'
  },
  {
    id: 'orbital',
    title: 'Orbital',
    tagline: 'Gravitational Priorities',
    description: 'Map items in concentric rings by priority. Critical notes orbit close to the center, stale notes drift outward.',
    icon: 'bubble_chart',
    color: 'from-purple-500 to-pink-400',
    accentColor: '#a78bfa'
  },
  {
    id: 'prism',
    title: 'Prism',
    tagline: 'Semantic Clustering',
    description: 'Cluster notes by topics and tags. Cross-topic connections are illuminated as glowing curved arcs.',
    icon: 'view_column',
    color: 'from-violet-500 to-fuchsia-400',
    accentColor: '#a855f7'
  },
  {
    id: 'timeline',
    title: 'Timeline',
    tagline: 'Velocity Lanes',
    description: 'Track temporal velocity. Lanes categorize notes by activity (Today, Week, Month), glowing when active.',
    icon: 'timeline',
    color: 'from-amber-500 to-yellow-400',
    accentColor: '#eab308'
  }
];

const FAQS = [
  {
    question: "Where is my data stored?",
    answer: "Stardust is completely local-first. All your data is saved in a local SQLite database inside your browser (IndexedDB). No notes or credentials are ever sent to an external server. Your thoughts remain entirely yours."
  },
  {
    question: "How does the node gravity and decay work?",
    answer: "Notes are represented as celestial bodies. Larger notes with more connections possess greater gravity, pulling related ideas closer. Notes you don't interact with will naturally decay and lose luminance over time, keeping your workspace clean."
  },
  {
    question: "Can I export my database?",
    answer: "Yes. Stardust has complete support for importing and exporting backups. You can download your entire universe as a standardized JSON package, allowing you to back it up or move it between machines easily."
  },
  {
    question: "Does it work offline?",
    answer: "Yes, 100%. Because all routing, UI, rendering, and database actions run client-side in the browser, Stardust works perfectly without an internet connection. It is built to be a resilient, zero-latency thinking environment."
  }
];

const IDEA_WORDS = [
  "Quantum", "Idea", "Stardust", "Orbits", "Visual", "Concept", "Mind", "Core", "Gravity", "Decay", "Velocity", "Focus"
];

export const LandingUltimate: React.FC<LandingUltimateProps> = ({ onEnterApp }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState('void');
  const [isWarping, setIsWarping] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect reduced motion preference (WCAG 2.3)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const scrollToFeatures = useCallback(() => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Interaction refs
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const draggedNodeRef = useRef<SandboxNode | null>(null);
  const clickStartRef = useRef({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If user prefers reduced motion, draw a static starfield and bail
    if (prefersReducedMotion) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 80; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 1.2 + 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.4 + 0.1})`;
        ctx.fill();
      }
      return;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initial Sandbox Nodes
    const initialLabels = ["Orbits", "Visual", "Quantum", "Gravity", "Focus", "Brainstorm"];
    const initialColors = ["#fbbf24", "#6366f1", "#3b82f6", "#a78bfa", "#ef4444", "#22d3ee"];
    const nodes: SandboxNode[] = initialLabels.map((label, idx) => {
      const angle = (idx / initialLabels.length) * Math.PI * 2;
      const dist = Math.min(window.innerWidth, window.innerHeight) * 0.25;
      return {
        id: Math.random().toString(36).substring(2, 9),
        x: window.innerWidth / 2 + Math.cos(angle) * dist,
        y: window.innerHeight / 2.2 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: 40 + Math.random() * 20,
        mass: 5 + Math.random() * 10,
        color: initialColors[idx],
        label,
        glowColor: initialColors[idx]
      };
    });

    // Ambient background stars
    const STARS = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.0 + 0.3,
      opacity: Math.random() * 0.6 + 0.1,
      speed: Math.random() * 0.01 + 0.005,
      phase: Math.random() * Math.PI * 2
    }));

    let t = 0;
    let raf = 0;

    const draw = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.15)'; // Fading path history
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      t += 0.016;

      // Draw background stars
      STARS.forEach(s => {
        const pulse = 0.4 + 0.6 * Math.sin(t * s.speed + s.phase);
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity * pulse})`;
        ctx.fill();
      });

      const mouse = mouseRef.current;
      const draggedNode = draggedNodeRef.current;

      // N-Body gravity + update positions
      nodes.forEach((n) => {
        if (n === draggedNode) {
          // Dragging updates velocity smoothly
          n.vx = (mouse.x - n.x) * 0.15;
          n.vy = (mouse.y - n.y) * 0.15;
        } else {
          // Gravitational pull to mouse if active
          if (mouse.active) {
            const dx = mouse.x - n.x;
            const dy = mouse.y - n.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);
            if (dist > 20 && dist < 500) {
              const F = (n.mass * 2.0) / distSq;
              n.vx += (dx / dist) * F * 1.5;
              n.vy += (dy / dist) * F * 1.5;
            }
          }

          // Slow attraction to screen center (orbital hub)
          const cx = canvas.width / 2;
          const cy = canvas.height / 2.2;
          const cdx = cx - n.x;
          const cdy = cy - n.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cdist > 50) {
            n.vx += (cdx / cdist) * 0.02;
            n.vy += (cdy / cdist) * 0.02;
          }
        }

        // Apply damping friction
        n.vx *= 0.98;
        n.vy *= 0.98;

        // Apply velocities
        n.x += n.vx;
        n.y += n.vy;

        // Bounce off canvas boundaries
        const padding = n.radius + 10;
        if (n.x < padding) {
          n.x = padding;
          n.vx *= -0.7;
        }
        if (n.x > canvas.width - padding) {
          n.x = canvas.width - padding;
          n.vx *= -0.7;
        }
        if (n.y < padding) {
          n.y = padding;
          n.vy *= -0.7;
        }
        if (n.y > canvas.height - padding) {
          n.y = canvas.height - padding;
          n.vy *= -0.7;
        }
      });

      // Node-to-node collisions
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = n1.radius + n2.radius + 12;

          if (dist < minDist) {
            const overlap = minDist - dist;
            const angle = Math.atan2(dy, dx);

            // Separate
            const moveX = Math.cos(angle) * overlap * 0.5;
            const moveY = Math.sin(angle) * overlap * 0.5;

            if (n1 !== draggedNode) {
              n1.x -= moveX;
              n1.y -= moveY;
            }
            if (n2 !== draggedNode) {
              n2.x += moveX;
              n2.y += moveY;
            }

            // Elastic bounce
            const kx = n1.vx - n2.vx;
            const ky = n1.vy - n2.vy;
            const p = 2 * (Math.cos(angle) * kx + Math.sin(angle) * ky) / (n1.mass + n2.mass);

            if (n1 !== draggedNode) {
              n1.vx -= p * n2.mass * Math.cos(angle);
              n1.vy -= p * n2.mass * Math.sin(angle);
            }
            if (n2 !== draggedNode) {
              n2.vx += p * n1.mass * Math.cos(angle);
              n2.vy += p * n1.mass * Math.sin(angle);
            }
          }
        }
      }

      // Draw lines between nearby nodes (constellation bonds)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 260) {
            const alpha = (1 - dist / 260) * 0.15;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw Nodes
      nodes.forEach(n => {
        ctx.save();

        // Atmospheric Outer Glow
        const glow = ctx.createRadialGradient(n.x, n.y, n.radius * 0.6, n.x, n.y, n.radius * 1.5);
        glow.addColorStop(0, `${n.color}25`);
        glow.addColorStop(0.5, `${n.color}0c`);
        glow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Planet Body
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${n.color}55`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner glowing core
        const core = ctx.createRadialGradient(n.x - n.radius * 0.15, n.y - n.radius * 0.15, 0, n.x, n.y, n.radius);
        core.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
        core.addColorStop(0.7, `${n.color}05`);
        core.addColorStop(1, 'transparent');
        ctx.fillStyle = core;
        ctx.fill();

        // Label Text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '600 10px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.label.toUpperCase(), n.x, n.y);

        ctx.restore();
      });

      raf = requestAnimationFrame(draw);
    };

    draw();

    // Event handlers for interactive Canvas Sandbox
    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      clickStartRef.current = { x, y, time: Date.now() };
      mouseRef.current = { x, y, active: true };

      // Check if we clicked on a node
      let hit: SandboxNode | null = null;
      for (const node of nodes) {
        const dx = node.x - x;
        const dy = node.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < node.radius) {
          hit = node;
          break;
        }
      }

      if (hit) {
        draggedNodeRef.current = hit;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseRef.current = { x, y, active: true };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouseRef.current.active = false;
      const dragNode = draggedNodeRef.current;
      draggedNodeRef.current = null;

      // Click-to-create node trigger: If mouse barely moved and click was fast and didn't hit a node
      const clickStart = clickStartRef.current;
      const dx = x - clickStart.x;
      const dy = y - clickStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const duration = Date.now() - clickStart.time;

      if (dist < 8 && duration < 250 && !dragNode) {
        // Double check we aren't clicking too close to an existing node
        let tooClose = false;
        for (const node of nodes) {
          const ndx = node.x - x;
          const ndy = node.y - y;
          if (Math.sqrt(ndx * ndx + ndy * ndy) < node.radius + 60) {
            tooClose = true;
            break;
          }
        }

        if (!tooClose) {
          const randLabel = IDEA_WORDS[Math.floor(Math.random() * IDEA_WORDS.length)];
          const randColor = initialColors[Math.floor(Math.random() * initialColors.length)];
          nodes.push({
            id: Math.random().toString(36).substring(2, 9),
            x,
            y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            radius: 35 + Math.random() * 15,
            mass: 4 + Math.random() * 6,
            color: randColor,
            label: randLabel,
            glowColor: randColor
          });
        }
      }
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
      draggedNodeRef.current = null;
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [prefersReducedMotion]);

  const handleEnter = () => {
    setIsWarping(true);
    setTimeout(onEnterApp, 1000);
  };

  const activeMode = COGNITIVE_MODES.find(m => m.id === activeTab) || COGNITIVE_MODES[0];

  return (
    <div className={clsx(
      "relative w-full min-h-screen overflow-x-hidden bg-[#020205] text-white flex flex-col font-sans transition-all duration-1000",
      isWarping && "scale-110 filter blur-sm opacity-0"
    )}>
      {/* Interactive Physics Canvas */}
      <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 w-full h-full pointer-events-auto z-0" />

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none z-10" />

      {/* Radiant Glow Spots & Drifting Space Blurs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0%,transparent_70%)] pointer-events-none z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.04)_0%,transparent_70%)] pointer-events-none z-10" />
      <div className="fixed top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)] blur-[90px] pointer-events-none z-10 animate-slow-blur-1" />
      <div className="fixed top-1/2 right-1/4 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.06)_0%,transparent_70%)] blur-[100px] pointer-events-none z-10 animate-slow-blur-2" />
      <div className="fixed bottom-10 left-1/3 w-[350px] h-[350px] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.05)_0%,transparent_70%)] blur-[85px] pointer-events-none z-10 animate-slow-blur-3" />

      {/* Header (Top Navigation) */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            ✨
          </div>
          <span className="text-[15px] font-black tracking-[0.35em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
            Stardust
          </span>
        </div>

        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black tracking-widest text-white/40 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            Local-First & Sandbox Secure
          </div>
          <button
            onClick={handleEnter}
            aria-label="Try Stardust workspace now"
            className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            Try It Now
          </button>
        </div>
      </header>

      {/* Section 1: Hero Block */}
      <main className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 pt-12 pb-24 pointer-events-none">
        {/* Left column info */}
        <div className="flex-1 text-center lg:text-left space-y-6 max-w-xl pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black tracking-[0.2em] text-indigo-300 uppercase">
            // Infinite Spatial Canvas
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] font-sans">
            Orchestrate ideas in <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
              concentric orbits.
            </span>
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-white/50 font-light max-w-lg">
            Stardust is a zero-latency thinking repository. Capture notes as physical nodes that orbit dynamically by priority. Drag objects to merge thoughts, and watch stale ideas decay naturally. 100% offline, 100% private.
          </p>

          <div className="pt-4 flex flex-col items-center lg:items-start gap-5">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleEnter}
                aria-label="Start thinking spatially in the Stardust workspace"
                className="group relative px-9 py-4.5 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-700 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(99,102,241,0.35)] hover:shadow-[0_0_50px_rgba(99,102,241,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="flex items-center gap-2">
                  Start Thinking Spatially <ArrowRight size={14} aria-hidden="true" />
                </span>
              </button>
            </div>

            {/* Trust micro-copy */}
            <div className="text-[10px] text-white/40 tracking-wide font-mono flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1">
              <span>No signup required</span>
              <span className="text-white/15">·</span>
              <span>100% private</span>
              <span className="text-white/15">·</span>
              <span>Works offline</span>
              <span className="text-white/15">·</span>
              <span className="text-emerald-400/70">Always free</span>
            </div>

            {/* Social proof strip */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-[9px] text-white/40 font-mono tracking-wide">
                <Github size={11} className="text-white/50" aria-hidden="true" />
                Open Source · MIT
              </div>
              <div className="flex items-center gap-2 text-[9px] text-white/30 font-mono tracking-wide">
                <span className="flex items-center gap-1"><PenTool size={10} aria-hidden="true" /> Writers</span>
                <span className="text-white/10">·</span>
                <span className="flex items-center gap-1"><Code2 size={10} aria-hidden="true" /> Developers</span>
                <span className="text-white/10">·</span>
                <span className="flex items-center gap-1"><FlaskConical size={10} aria-hidden="true" /> Researchers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column features card */}
        <div className="w-full max-w-xl lg:w-[480px] bg-[#05050C]/75 border border-white/10 backdrop-blur-3xl rounded-3xl p-6 flex flex-col shadow-[0_32px_80px_rgba(0,0,0,0.6)] pointer-events-auto">
          {/* Tabs selector */}
          <div className="flex flex-wrap justify-between gap-1.5 mb-6 pb-4 border-b border-white/5">
            {COGNITIVE_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => setActiveTab(mode.id)}
                className={clsx(
                  "flex-1 px-2.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 border",
                  activeTab === mode.id
                    ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-inner"
                    : "bg-transparent text-white/40 border-transparent hover:text-white/70"
                )}
              >
                <span className="material-symbols-outlined text-[14px]" style={{ color: activeTab === mode.id ? mode.accentColor : 'inherit' }}>{mode.icon}</span>
                {mode.title}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div className="h-56 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMode.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
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
                    <p className="text-[9px] text-indigo-400 font-mono tracking-widest uppercase font-black">{activeMode.tagline}</p>
                  </div>
                </div>

                <p className="text-xs sm:text-[13px] leading-relaxed text-white/50 font-light">
                  {activeMode.description}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/30 tracking-wide">
              <span className="flex items-center gap-1">🛡️ SQLite encrypted locally</span>
              <span>⚡ Offline & private</span>
            </div>
          </div>
        </div>
      </main>

      {/* Scroll-to-content indicator */}
      <div className="relative z-20 w-full flex justify-center pb-8 pointer-events-none">
        <button
          onClick={scrollToFeatures}
          aria-label="Scroll to features"
          className="pointer-events-auto flex flex-col items-center gap-2 text-white/20 hover:text-white/50 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 rounded-lg p-2"
        >
          <span className="text-[9px] font-mono tracking-[0.3em] uppercase">Explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={18} />
          </motion.div>
        </button>
      </div>

      {/* Section 2: Cognitive Layout Showcase Details */}
      <section ref={featuresRef} role="region" aria-label="Cognitive layout modes" className="relative z-20 w-full max-w-7xl mx-auto px-6 py-20 border-t border-white/5 bg-[#030308]/40 backdrop-blur-md rounded-3xl mb-12 shadow-[inset_0_1px_rgba(255,255,255,0.02)]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black tracking-[0.2em] text-indigo-300 uppercase">
            // Core Architectures
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Five Dimensions of Order</h2>
          <p className="text-sm text-white/55 font-light">
            Toggle layouts instantly. Notes automatically translate positions on the canvas, snapping into columns, quadrants, or rings while maintaining their spatial links.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COGNITIVE_MODES.map((m) => (
            <div 
              key={m.id}
              className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 group shadow-sm flex flex-col justify-between min-h-[200px]"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={clsx(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-md",
                    m.color
                  )}>
                    <span className="material-symbols-outlined text-base">{m.icon}</span>
                  </div>
                  <span className="text-[9px] font-mono text-white/30 font-black uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                    {m.id}
                  </span>
                </div>
                <h3 className="text-base font-bold tracking-tight mb-2 group-hover:text-white transition-colors">{m.title} Layout</h3>
                <p className="text-xs text-white/50 leading-relaxed font-light">{m.description}</p>
              </div>
              <div className="pt-4 border-t border-white/5 text-[9px] font-mono text-indigo-300/60 uppercase tracking-widest font-black">
                {m.tagline}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2.5: Comparison Table */}
      <section role="region" aria-label="Feature comparison" className="relative z-20 w-full max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black tracking-[0.2em] text-indigo-300 uppercase">
            // Architecture Battlecard
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">How Stardust Outclasses Legacy Tools</h2>
          <p className="text-sm text-white/55 font-light">
            Compare our canvas-native orbital engine against linear text editors and static document sync layouts.
          </p>
        </div>

        <div className="w-full overflow-x-auto rounded-3xl border border-white/10 bg-[#05050C]/60 backdrop-blur-3xl shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] font-mono text-white/40 tracking-wider uppercase">
                <th className="p-6">Capabilities</th>
                <th className="p-6 text-indigo-300 font-bold">Stardust Ultra</th>
                <th className="p-6">Obsidian</th>
                <th className="p-6">Notion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-white/70 font-light">
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-6 font-semibold text-white">Spatial Layout Engines</td>
                <td className="p-6 text-indigo-300 font-medium flex items-center gap-2">
                  <Check size={14} className="text-indigo-400" /> 5 Modes (Orbital/Matrix/Void/etc.)
                </td>
                <td className="p-6 text-white/40">Plugin Canvas Only</td>
                <td className="p-6 text-white/40">No (Linear pages only)</td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-6 font-semibold text-white">N-Body Gravitational Physics</td>
                <td className="p-6 text-indigo-300 font-medium flex items-center gap-2">
                  <Check size={14} className="text-indigo-400" /> Active Orbits & Forces
                </td>
                <td className="p-6 text-white/40">No (Static Nodes)</td>
                <td className="p-6 text-white/40">No</td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-6 font-semibold text-white">Note Cognitive Decay</td>
                <td className="p-6 text-indigo-300 font-medium flex items-center gap-2">
                  <Check size={14} className="text-indigo-400" /> Passive cleanups of stale ideas
                </td>
                <td className="p-6 text-white/40">No</td>
                <td className="p-6 text-white/40">No</td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-6 font-semibold text-white">Data Privacy & Sovereignty</td>
                <td className="p-6 text-indigo-300 font-medium flex items-center gap-2">
                  <Check size={14} className="text-indigo-400" /> 100% Sandbox Local SQLite
                </td>
                <td className="p-6 text-white/60">Yes (Local Markdown)</td>
                <td className="p-6 text-white/40">No (Hosted Cloud)</td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-6 font-semibold text-white">Rendering Speed</td>
                <td className="p-6 text-indigo-300 font-medium flex items-center gap-2">
                  <Check size={14} className="text-indigo-400" /> Zero Sync Latency (120 FPS)
                </td>
                <td className="p-6 text-white/60">High (Local Disk)</td>
                <td className="p-6 text-white/40">Slow (Cloud Sync latency)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Privacy & Security Trust Grid */}
      <section role="region" aria-label="Privacy and security" className="relative z-20 w-full max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black tracking-[0.2em] text-emerald-300 uppercase">
            // Client-Side Sovereignty
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Security by Architecture</h2>
          <p className="text-sm text-white/55 font-light">
            Your data should never leave your machine. Stardust is engineered as a local-first system, prioritizing privacy and microsecond speed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3 p-4 bg-white/[0.01] rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Shield size={20} />
            </div>
            <h3 className="text-sm font-bold tracking-tight">SQLite/IndexedDB encrypted</h3>
            <p className="text-xs text-white/40 leading-relaxed font-light">
              Stored directly in the local sandbox using browser IndexedDB storage. Zero server calls mean zero breach surface.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-white/[0.01] rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Zap size={20} />
            </div>
            <h3 className="text-sm font-bold tracking-tight">Zero-network latency</h3>
            <p className="text-xs text-white/40 leading-relaxed font-light">
              No syncing roundtrips. Typing, sorting, physics updates, and navigation happen in real-time at 120 FPS.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-white/[0.01] rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cpu size={20} />
            </div>
            <h3 className="text-sm font-bold tracking-tight">100% Offline-capable</h3>
            <p className="text-xs text-white/40 leading-relaxed font-light">
              Works perfectly in airplanes, subways, or remote locations. Launch the page once and run it offline forever.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-white/[0.01] rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Sparkles size={20} />
            </div>
            <h3 className="text-sm font-bold tracking-tight">Full Backup Control</h3>
            <p className="text-xs text-white/40 leading-relaxed font-light">
              Import and export the entire note universe. Download standard JSON backups anytime with a single click.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3.5: Premium Pricing Tiers */}
      <section role="region" aria-label="Pricing tiers" className="relative z-20 w-full max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black tracking-[0.2em] text-indigo-300 uppercase">
            // Value Model
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Flexible Spaces for Minds of All Sizes</h2>
          <p className="text-sm text-white/55 font-light">
            Start completely free offline, or upgrade for advanced spatial intelligence features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <div className="premium-glass-card rounded-[32px] p-8 flex flex-col justify-between min-h-[420px]">
            <div>
              <div className="text-[9px] font-mono tracking-widest text-white/30 uppercase mb-2">Sovereign Space</div>
              <h3 className="text-xl font-bold tracking-tight text-white mb-4">Starter Pack</h3>
              <div className="text-3xl font-black mb-6">$0<span className="text-xs text-white/40 font-normal"> / forever</span></div>
              <ul className="space-y-3.5 text-xs text-white/50 font-light">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Unlimited Local Nodes</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> 5 Core Cognitive Modes</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> SQLite Local Persistence</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> JSON Import/Export backups</li>
              </ul>
            </div>
            <button onClick={handleEnter} className="w-full mt-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 cursor-pointer">
              Launch Free Sandbox
            </button>
          </div>

          {/* Premium Tier */}
          <div className="premium-glass-card rounded-[32px] p-8 flex flex-col justify-between min-h-[420px] relative overflow-hidden border-indigo-500/35 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
              Popular Choice
            </div>
            <div>
              <div className="text-[9px] font-mono tracking-widest text-indigo-400 uppercase mb-2">Cosmic Mind</div>
              <h3 className="text-xl font-bold tracking-tight text-white mb-4">Explorer Pro</h3>
              <div className="text-3xl font-black mb-6">$8<span className="text-xs text-white/40 font-normal"> / month</span></div>
              <ul className="space-y-3.5 text-xs text-white/70 font-light">
                <li className="flex items-center gap-2"><Check size={14} className="text-indigo-400" /> Everything in Starter</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-indigo-400" /> Advanced Link Cohesion Graph</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-indigo-400" /> Customizable Planet Types</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-indigo-400" /> Ambient spatial soundscapes</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-indigo-400" /> Smart Note Decay custom configs</li>
              </ul>
            </div>
            <button onClick={handleEnter} className="w-full mt-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-102 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 cursor-pointer">
              Get Explorer Pro
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="premium-glass-card rounded-[32px] p-8 flex flex-col justify-between min-h-[420px]">
            <div>
              <div className="text-[9px] font-mono tracking-widest text-white/30 uppercase mb-2">Omnipresence</div>
              <h3 className="text-xl font-bold tracking-tight text-white mb-4">Enterprise Singularity</h3>
              <div className="text-3xl font-black mb-6">$19<span className="text-xs text-white/40 font-normal"> / month / user</span></div>
              <ul className="space-y-3.5 text-xs text-white/50 font-light">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Peer-to-peer workspace bridging</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Local encrypted collaboration</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Custom hotkey configuration mapping</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Multi-vault offline federation</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> 24/7 Priority engineering support</li>
              </ul>
            </div>
            <button onClick={handleEnter} className="w-full mt-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 cursor-pointer">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Section 3.7: Customer Testimonials */}
      <section role="region" aria-label="Customer testimonials" className="relative z-20 w-full max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black tracking-[0.2em] text-indigo-300 uppercase">
            // Testimonials
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans">Voices from the Spatial Web</h2>
          <p className="text-sm text-white/55 font-light">
            Discover how thinkers, developers, and researchers structure their ideas inside Stardust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="premium-glass-card rounded-[24px] p-6 flex flex-col justify-between">
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className="fill-amber-400 text-amber-400" aria-hidden="true" />
              ))}
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-light mb-6">
              "Stardust redefined how I structure my research papers. Watching unrelated nodes drift away and decay keeps my focus razor sharp."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300" aria-hidden="true">
                EV
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Dr. Evelyn V.</h4>
                <p className="text-[9px] text-white/40">Cognitive Researcher</p>
              </div>
            </div>
          </div>

          <div className="premium-glass-card rounded-[24px] p-6 flex flex-col justify-between">
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className="fill-amber-400 text-amber-400" aria-hidden="true" />
              ))}
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-light mb-6">
              "The macOS-style taskbar and fluid layout animations make the workspace feel alive. Panning and scaling notes are smooth as silk at 120FPS."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-300" aria-hidden="true">
                LK
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Liam K.</h4>
                <p className="text-[9px] text-white/40">Creative Director</p>
              </div>
            </div>
          </div>

          <div className="premium-glass-card rounded-[24px] p-6 flex flex-col justify-between">
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className="fill-amber-400 text-amber-400" aria-hidden="true" />
              ))}
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-light mb-6">
              "Obsidian was too text-heavy. Stardust gives me a gravitational map of my tasks. Dragging ideas together to merge links feels incredibly tactile."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-300" aria-hidden="true">
                AS
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Aria S.</h4>
                <p className="text-[9px] text-white/40">Principal Software Architect</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Interactive FAQ Accordion */}
      <section role="region" aria-label="Frequently asked questions" className="relative z-20 w-full max-w-3xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black tracking-[0.2em] text-indigo-300 uppercase">
            // FAQ & Details
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Got Questions?</h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className="bg-[#05050C]/60 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/[0.01] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-400"
                >
                  <span id={`faq-q-${idx}`} className="text-xs sm:text-[13px] font-bold tracking-tight flex items-center gap-3">
                    <HelpCircle size={15} className="text-indigo-400 shrink-0" aria-hidden="true" />
                    {faq.question}
                  </span>
                  <div className="text-white/45" aria-hidden="true">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div id={`faq-answer-${idx}`} role="region" aria-labelledby={`faq-q-${idx}`} className="px-6 pb-5 pt-1 text-xs text-white/50 leading-relaxed font-light pl-[39px] border-t border-white/5">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 5: Bottom CTA Block */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-6 py-24 mb-12 text-center">
        <div className="bg-gradient-to-br from-indigo-950/20 via-violet-950/10 to-transparent border border-white/10 rounded-3xl p-12 max-w-4xl mx-auto shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_60%)] pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Launch your universe.</h2>
          <p className="text-sm text-white/55 font-light max-w-lg mx-auto mb-8">
            Create, group, decay, and re-arrange. Start writing thoughts in a spatial physics playground today.
          </p>
          <button
            onClick={handleEnter}
            aria-label="Start your Stardust universe for free"
            className="group relative px-10 py-4.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-xs font-black uppercase tracking-[0.25em] text-white shadow-[0_0_35px_rgba(99,102,241,0.4)] hover:shadow-[0_0_55px_rgba(99,102,241,0.65)] transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            Start Your Universe — It's Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[9px] font-mono text-white/30 tracking-widest uppercase gap-4">
        <div>© 2026 Stardust Infinite space. Open Source MIT License.</div>
        <div className="flex gap-4">
          <span>Zero network tracking</span>
          <span>•</span>
          <span>SQLite Sandbox Secure</span>
          <span>•</span>
          <span>120fps client physics</span>
        </div>
      </footer>
    </div>
  );
};
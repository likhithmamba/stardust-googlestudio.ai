import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import './LandingPage.css';
import { HeroSection } from './landing/HeroSection';
import { ProblemSection } from './landing/ProblemSection';
import { DualModeSection } from './landing/DualModeSection';
import { ObjectsSection } from './landing/ObjectsSection';
import { ModesSection } from './landing/ModesSection';
import { GenesisSection } from './landing/GenesisSection';
import { AISection, CompareSection, WorkflowSection, PricingSection, CTASection, FooterSection } from './landing/BottomSections';

interface LandingUltimateProps {
  onEnterApp: () => void;
}

export const LandingUltimate: React.FC<LandingUltimateProps> = ({ onEnterApp }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);

  // ── Custom cursor ──
  useEffect(() => {
    const cursor = cursorRef.current;
    const dot = cursorDotRef.current;
    if (!cursor || !dot) return;
    let mx = -100, my = -100, dx = -100, dy = -100;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    };

    const animate = () => {
      dx += (mx - dx) * 0.12;
      dy += (my - dy) * 0.12;
      cursor.style.left = dx + 'px';
      cursor.style.top = dy + 'px';
      raf = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(animate);

    // Hover effect for interactive elements
    const root = rootRef.current;
    if (root) {
      const hoverTargets = root.querySelectorAll('button, a, .lp-rp, .lp-obj-card, .lp-ai-card, .lp-pc, .lp-mode-cases li');
      const enter = () => cursor.classList.add('hovering');
      const leave = () => cursor.classList.remove('hovering');
      hoverTargets.forEach(el => { el.addEventListener('mouseenter', enter); el.addEventListener('mouseleave', leave); });
    }

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
    };
  }, []);

  // ── Nav scroll ──
  useEffect(() => {
    const nav = document.getElementById('lp-nav');
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Hero starfield canvas ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const STARS = Array.from({ length: 220 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.2,
      opacity: Math.random() * 0.7 + 0.1, speed: Math.random() * 0.0003 + 0.0001,
      phase: Math.random() * Math.PI * 2, drift: (Math.random() - 0.5) * 0.00004,
    }));

    const PLANETS = [
      { x: .12, y: .35, r: 42, vx: .00008, vy: .00005, hi: '#818cf8', lo: '#1e1b4b', glow: 'rgba(99,102,241,0.35)' },
      { x: .88, y: .22, r: 28, vx: -.00007, vy: .00009, hi: '#fde68a', lo: '#92400e', glow: 'rgba(245,158,11,0.45)' },
      { x: .78, y: .72, r: 20, vx: -.00009, vy: -.00006, hi: '#bfdbfe', lo: '#1e3a8a', glow: 'rgba(59,130,246,0.4)' },
      { x: .18, y: .78, r: 14, vx: .00011, vy: -.00007, hi: '#fca5a5', lo: '#7f1d1d', glow: 'rgba(239,68,68,0.4)' },
      { x: .55, y: .15, r: 10, vx: -.00005, vy: .00012, hi: '#f1f5f9', lo: '#334155', glow: 'rgba(148,163,184,0.3)' },
      { x: .35, y: .82, r: 8, vx: .00013, vy: -.00004, hi: '#a5f3fc', lo: '#164e63', glow: 'rgba(6,182,212,0.35)' },
      { x: .92, y: .55, r: 6, vx: -.00006, vy: -.00011, hi: '#334155', lo: '#0f172a', glow: '' },
      { x: .08, y: .55, r: 5, vx: .00009, vy: .00008, hi: '#1e293b', lo: '#0f172a', glow: '' },
    ];

    let t = 0, raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.016;
      STARS.forEach(s => {
        const pulse = 0.5 + 0.5 * Math.sin(t * s.speed * 200 + s.phase);
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.opacity * (0.6 + 0.4 * pulse)})`;
        ctx.fill();
        s.x += s.drift;
        if (s.x < -0.01) s.x = 1.01;
        if (s.x > 1.01) s.x = -0.01;
      });

      PLANETS.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -0.05) p.x = 1.05; if (p.x > 1.05) p.x = -0.05;
        if (p.y < -0.05) p.y = 1.05; if (p.y > 1.05) p.y = -0.05;
        const px = p.x * canvas.width, py = p.y * canvas.height;
        if (p.glow) {
          const g = ctx.createRadialGradient(px, py, 0, px, py, p.r * 3);
          g.addColorStop(0, p.glow); g.addColorStop(1, 'transparent');
          ctx.beginPath(); ctx.arc(px, py, p.r * 3, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        }
        const sg = ctx.createRadialGradient(px - p.r * .3, py - p.r * .3, 0, px, py, p.r);
        sg.addColorStop(0, p.hi); sg.addColorStop(1, p.lo);
        ctx.beginPath(); ctx.arc(px, py, p.r, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  // ── Scroll reveal ──
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll('.lp-reveal, .lp-reveal-left, .lp-reveal-right, .lp-reveal-scale');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const siblings = [...(el.parentElement?.children ?? [])].filter(c =>
            c.classList.contains('lp-reveal') || c.classList.contains('lp-reveal-left') ||
            c.classList.contains('lp-reveal-right') || c.classList.contains('lp-reveal-scale')
          );
          const idx = siblings.indexOf(el);
          setTimeout(() => el.classList.add('visible'), idx * 120);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // ── Parallax nebulae ──
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nebulae = root.querySelectorAll('.lp-hero-nebula') as NodeListOf<HTMLElement>;
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx, dy = (e.clientY - cy) / cy;
      nebulae.forEach((n, i) => {
        const f = (i + 1) * 12;
        n.style.transform = `translate(${dx * f}px, ${dy * f}px)`;
      });
    };
    document.addEventListener('mousemove', onMove, { passive: true } as EventListenerOptions);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  // ── Eyebrow text rotation ──
  useEffect(() => {
    const texts = ['// The Cognitive Operating System', '// Think in Space, Not in Rows', '// Five modes. One canvas. Your mind.', '// Importance has physical mass here'];
    let idx = 0;
    const el = document.querySelector('.lp-hero-eyebrow') as HTMLElement | null;
    if (!el) return;
    const iv = setInterval(() => {
      idx = (idx + 1) % texts.length;
      el.style.opacity = '0'; el.style.transition = 'opacity .4s';
      setTimeout(() => { el.textContent = texts[idx]; el.style.opacity = '1'; }, 400);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  // ── Orbital tilt on hover ──
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const orbVis = root.querySelector('.lp-orb-vis') as HTMLElement | null;
    if (!orbVis) return;
    const onMove = (e: MouseEvent) => {
      const rect = orbVis.getBoundingClientRect();
      const rx = ((e.clientY - rect.top - rect.height / 2) / rect.height) * 8;
      const ry = ((e.clientX - rect.left - rect.width / 2) / rect.width) * -8;
      orbVis.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      orbVis.style.transition = 'transform .1s';
    };
    const onLeave = () => { orbVis.style.transform = ''; orbVis.style.transition = 'transform .4s ease'; };
    orbVis.addEventListener('mousemove', onMove);
    orbVis.addEventListener('mouseleave', onLeave);
    return () => { orbVis.removeEventListener('mousemove', onMove); orbVis.removeEventListener('mouseleave', onLeave); };
  }, []);

  // ── Void visual parallax ──
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const voidVis = root.querySelector('.lp-void-vis') as HTMLElement | null;
    if (!voidVis) return;
    const notes = voidVis.querySelectorAll('.lp-void-note') as NodeListOf<HTMLElement>;
    const onMove = (e: MouseEvent) => {
      const rect = voidVis.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      notes.forEach((n, i) => { const d = (i % 3 + 1) * 6; n.style.marginLeft = cx * d + 'px'; n.style.marginTop = cy * d + 'px'; });
    };
    const onLeave = () => notes.forEach(n => { n.style.marginLeft = '0'; n.style.marginTop = '0'; });
    voidVis.addEventListener('mousemove', onMove);
    voidVis.addEventListener('mouseleave', onLeave);
    return () => { voidVis.removeEventListener('mousemove', onMove); voidVis.removeEventListener('mouseleave', onLeave); };
  }, []);

  const [isExiting, setIsExiting] = React.useState(false);

  const handleEnterApp = () => {
    setIsExiting(true);
    setTimeout(onEnterApp, 800);
  };

  // ── Enable Body Scroll ──
  useEffect(() => {
    document.body.classList.add('landing-active');
    return () => document.body.classList.remove('landing-active');
  }, []);

  return (
    <div className={clsx("landing-root", isExiting && "lp-warp-exit")} ref={rootRef}>
      <div id="lp-cursor" ref={cursorRef} />
      <div id="lp-cursor-dot" ref={cursorDotRef} />

      <nav id="lp-nav" className="lp-nav">
        <a href="#" className="lp-nav-logo">STAR<span>DUST</span></a>
        <ul className="lp-nav-links">
          <li><a href="#lp-modes">Modes</a></li>
          <li><a href="#lp-ai">AI</a></li>
          <li><a href="#lp-compare">Compare</a></li>
          <li><a href="#lp-pricing">Pricing</a></li>
        </ul>
        <button className="lp-nav-cta" onClick={handleEnterApp}>Start Free</button>
      </nav>

      <HeroSection onEnterApp={handleEnterApp} canvasRef={canvasRef} />
      <ProblemSection />
      <DualModeSection />
      <ObjectsSection />
      <ModesSection />
      <GenesisSection />
      <AISection />
      <CompareSection />
      <WorkflowSection />
      <PricingSection onEnterApp={handleEnterApp} />
      <CTASection onEnterApp={handleEnterApp} />
      <FooterSection />
    </div>
  );
};
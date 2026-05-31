import React from 'react';

interface GenesisPlanet {
    top: string; left: string; w: number; bg: string;
    bs?: string; br?: string; label: string;
    sublabel?: string; ring?: boolean; fs?: string;
}

export const GenesisSection: React.FC = () => {
    const outer: GenesisPlanet[] = [
        { top: 'calc(50% - 260px)', left: '50%', w: 64, bg: 'radial-gradient(circle at 35% 35%,#818cf8,#4f46e5,#1e1b4b)', bs: '0 0 28px rgba(99,102,241,0.8)', label: 'Nebula', sublabel: 'Brainstorm zone' },
        { top: 'calc(50% - 260px*0.309 - 28px)', left: 'calc(50% + 260px*0.951 - 28px)', w: 56, bg: 'radial-gradient(circle at 35% 35%,#a78bfa,#7c3aed,#0d0a1e)', bs: '0 0 22px rgba(139,92,246,0.7)', label: 'Galaxy', sublabel: 'Workspace' },
        { top: 'calc(50% + 260px*0.588 - 24px)', left: 'calc(50% + 260px*0.809 - 24px)', w: 48, bg: 'radial-gradient(circle at 35% 35%,#fde68a,#f59e0b,#92400e)', bs: '0 0 36px rgba(245,158,11,0.9)', label: 'Sun', sublabel: 'Core anchor' },
        { top: 'calc(50% + 260px*0.588 - 18px)', left: 'calc(50% - 260px*0.809 - 18px)', w: 36, bg: 'radial-gradient(circle at 40% 30%,#fef3c7,#d97706,#92400e)', bs: '0 0 18px rgba(217,119,6,0.7)', label: 'Jupiter', sublabel: 'Major project' },
        { top: 'calc(50% - 260px*0.309 - 16px)', left: 'calc(50% - 260px*0.951 - 16px)', w: 32, bg: 'radial-gradient(circle at 35% 35%,#fef9c3,#f59e0b,#78350f)', bs: '0 0 16px rgba(245,158,11,0.6)', label: 'Saturn', sublabel: 'Collection', ring: true },
    ];
    const inner: GenesisPlanet[] = [
        { top: 'calc(50% - 130px*0.866 - 9px)', left: 'calc(50% + 130px*0.5 - 9px)', w: 18, bg: 'radial-gradient(circle at 30% 30%,#bfdbfe,#3b82f6,#1e3a8a)', bs: '0 0 14px rgba(59,130,246,0.8)', label: 'Earth' },
        { top: 'calc(50% - 130px*0.208 - 8px)', left: 'calc(50% + 130px*0.978 - 8px)', w: 17, bg: 'radial-gradient(circle at 35% 35%,#fed7aa,#f97316,#7c2d12)', bs: '0 0 11px rgba(249,115,22,0.7)', label: 'Venus' },
        { top: 'calc(50% + 130px*0.995 - 8px)', left: 'calc(50% + 130px*0.105 - 8px)', w: 16, bg: 'radial-gradient(circle at 35% 35%,#fca5a5,#ef4444,#7f1d1d)', bs: '0 0 11px rgba(239,68,68,0.8)', label: 'Mars' },
        { top: 'calc(50% + 130px*0.407 - 6px)', left: 'calc(50% - 130px*0.914 - 6px)', w: 12, bg: 'radial-gradient(circle at 35% 35%,#f1f5f9,#94a3b8,#334155)', bs: '0 0 7px rgba(148,163,184,0.6)', label: 'Mercury' },
        { top: 'calc(50% - 130px*0.669 - 11px)', left: 'calc(50% - 130px*0.743 - 11px)', w: 22, bg: 'radial-gradient(circle at 35% 35%,#a5f3fc,#06b6d4,#164e63)', bs: '0 0 13px rgba(6,182,212,0.7)', label: 'Uranus' },
    ];
    const close: GenesisPlanet[] = [
        { top: 'calc(50% - 55px - 4px)', left: 'calc(50% - 4px)', w: 8, bg: 'radial-gradient(circle at 35% 35%,#f8fafc,#cbd5e1,#475569)', bs: '0 0 5px rgba(203,213,225,0.8)', label: 'Moon', fs: '.46rem' },
        { top: 'calc(50% + 55px*0.866 - 3.5px)', left: 'calc(50% - 55px*0.5 - 3.5px)', w: 7, bg: '#64748b', br: '42% 58% 70% 30% / 45% 45% 55% 55%', label: 'Asteroid', fs: '.46rem' },
        { top: 'calc(50% + 55px*0.866 - 3.5px)', left: 'calc(50% + 55px*0.5 - 3.5px)', w: 7, bg: 'radial-gradient(circle at 35% 35%,#bae6fd,#38bdf8,#0c4a6e)', bs: '0 0 5px rgba(56,189,248,0.6)', label: 'Comet', fs: '.46rem' },
    ];

    return (
        <section id="lp-genesis">
            <div className="lp-reveal">
                <span className="lp-section-kicker">Double-Click Anywhere to Create</span>
                <h2 className="lp-section-title">The Genesis Ring</h2>
                <p className="lp-section-body" style={{ maxWidth: 560, margin: '14px auto 0' }}>A solar system erupts from your cursor. Each body is sized to accurate scale relative to the others. The ring teaches you the vocabulary just by existing. Hover any planet to discover its semantic role.</p>
            </div>
            <div className="lp-ring-wrap lp-reveal-scale">
                <div className="lp-ring-orbit-el" style={{ width: 520, height: 520 }} />
                <div className="lp-ring-orbit-el" style={{ width: 260, height: 260, borderColor: 'rgba(255,255,255,0.07)' }} />
                <div className="lp-ring-orbit-el" style={{ width: 110, height: 110, borderColor: 'rgba(255,255,255,0.1)' }} />
                <div className="lp-ring-center">GENESIS</div>
                {[...outer, ...inner, ...close].map((p, i) => (
                    <div key={i} className="lp-rp" style={{ top: p.top, left: p.left, width: p.w, height: p.w, background: p.bg, boxShadow: p.bs, borderRadius: p.br }}>
                        {p.ring && <div style={{ position: 'absolute', width: 50, height: 13, border: '2px solid rgba(245,158,11,0.32)', borderRadius: '50%', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotateX(70deg)', pointerEvents: 'none' }} />}
                        <div className="lp-rl" style={{ top: p.w + 8, left: '50%', transform: 'translateX(-50%)', fontSize: p.fs }}>
                            {p.label}{p.sublabel && <><br /><span style={{ opacity: .5 }}>{p.sublabel}</span></>}
                        </div>
                    </div>
                ))}
            </div>
            <p className="lp-genesis-cap lp-reveal">Hover any body. Double-click anywhere on your canvas to summon it.</p>
        </section>
    );
};

import React from 'react';

interface OrbitalPlanet {
    rad: number; sp: string; st: string; w: number; bg: string;
    bs: string; o?: number; br?: string; h?: number;
}

interface PrismItem {
    w: number; bg: string; bs?: string; t?: string;
    br?: string; pulse?: boolean;
}

/* ── Void Visual ── */
const VoidVisual = () => (
    <div className="lp-void-vis">
        {[{ w: 1.5, h: 1.5, t: '8%', l: '16%', o: .6 }, { w: 1, h: 1, t: '22%', l: '76%', o: .5 }, { w: 2, h: 2, t: '46%', l: '89%', o: .7 }, { w: 1, h: 1, t: '71%', l: '6%', o: .4 }, { w: 1.5, h: 1.5, t: '85%', l: '63%', o: .6 }, { w: 1, h: 1, t: '14%', l: '43%', o: .3 }].map((s, i) => (
            <div key={i} className="lp-void-star-bg" style={{ width: s.w, height: s.h, top: s.t, left: s.l, opacity: s.o }} />
        ))}
        <div className="lp-void-mantra">Nothing is required of you.</div>
        <div className="lp-void-note" style={{ width: 54, height: 54, background: 'radial-gradient(circle at 35% 35%,rgba(99,102,241,0.28),rgba(30,27,75,0.8))', border: '1px solid rgba(99,102,241,0.28)', top: '18%', left: '14%', animationDelay: '0s' }}>product<br />vision</div>
        <div className="lp-void-note" style={{ width: 38, height: 38, background: 'radial-gradient(circle at 35% 35%,rgba(239,68,68,0.28),rgba(127,29,29,0.8))', border: '1px solid rgba(239,68,68,0.22)', top: '56%', left: '24%', animationDelay: '-1.5s' }}>urgent</div>
        <div className="lp-void-note" style={{ width: 22, height: 22, background: 'rgba(71,85,105,0.55)', border: '1px solid rgba(255,255,255,0.07)', top: '30%', right: '22%', animationDelay: '-3s', borderRadius: '42% 58% 70% 30% / 45% 45% 55% 55%' }} />
        <div className="lp-void-note" style={{ width: 46, height: 46, background: 'radial-gradient(circle at 35% 35%,rgba(56,189,248,0.28),rgba(12,74,110,0.8))', border: '1px solid rgba(56,189,248,0.22)', top: '66%', right: '19%', animationDelay: '-2s' }}>research<br />idea</div>
        <div className="lp-void-note" style={{ width: 16, height: 16, background: 'rgba(71,85,105,0.55)', border: '1px solid rgba(255,255,255,0.05)', bottom: '20%', left: '52%', animationDelay: '-0.8s' }} />
        <div className="lp-void-note" style={{ width: 62, height: 62, background: 'radial-gradient(circle at 35% 35%,rgba(245,158,11,0.22),rgba(146,64,14,0.7))', border: '1px solid rgba(245,158,11,0.25)', top: '19%', right: '36%', animationDelay: '-4s' }}>the big<br />idea</div>
    </div>
);

/* ── Orbital Visual ── */
const OrbitalVisual = () => (
    <div className="lp-orb-vis">
        <div className="lp-accretion" />
        <div className="lp-orb-ring-el" style={{ width: 300, height: 300 }} />
        <div className="lp-orb-ring-el" style={{ width: 196, height: 196 }} />
        <div className="lp-orb-ring-el" style={{ width: 116, height: 116 }} />
        <div className="lp-orb-center"><span style={{ fontFamily: "var(--lp-font-display)", fontSize: '.42rem', letterSpacing: '.15em', color: 'rgba(255,255,255,0.35)' }}>CORE</span></div>
        <div className="lp-ow">
            {([
                { rad: 58, sp: '6s', st: '0deg', w: 28, bg: 'radial-gradient(circle at 35% 35%,#fca5a5,#ef4444)', bs: '0 0 12px rgba(239,68,68,0.7)' },
                { rad: 58, sp: '6s', st: '180deg', w: 24, bg: 'radial-gradient(circle at 35% 35%,#fde68a,#f59e0b)', bs: '0 0 10px rgba(245,158,11,0.6)' },
                { rad: 98, sp: '11s', st: '60deg', w: 32, bg: 'radial-gradient(circle at 35% 35%,#bfdbfe,#3b82f6)', bs: '0 0 14px rgba(59,130,246,0.6)' },
                { rad: 98, sp: '11s', st: '240deg', w: 20, bg: 'radial-gradient(circle at 35% 35%,#a5f3fc,#06b6d4)', bs: '0 0 10px rgba(6,182,212,0.5)' },
                { rad: 150, sp: '17s', st: '30deg', w: 36, bg: 'radial-gradient(circle at 35% 35%,#d9f99d,#65a30d)', bs: '0 0 14px rgba(101,163,13,0.5)' },
                { rad: 150, sp: '17s', st: '150deg', w: 16, bg: '#334155', bs: 'none', o: .55 },
                { rad: 150, sp: '17s', st: '280deg', w: 13, bg: '#475569', bs: 'none', o: .45, br: '42% 58% 70% 30% / 45% 45% 55% 55%' },
            ] as OrbitalPlanet[]).map((p, i) => (
                <div key={i} className="lp-op" style={{ '--lp-rad': `${p.rad}px`, '--lp-sp': p.sp, '--lp-st': p.st, width: p.w, height: p.h || p.w, margin: `-${p.w / 2}px`, background: p.bg, boxShadow: p.bs !== 'none' ? p.bs : undefined, opacity: p.o, borderRadius: p.br } as React.CSSProperties} />
            ))}
        </div>
        <div style={{ position: 'absolute', bottom: 12, right: 14, fontFamily: "var(--lp-font-mono)", fontSize: '.5rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(245,158,11,0.38)' }}>Priority flows toward the center.</div>
    </div>
);

/* ── Matrix Visual ── */
const MatrixVisual = () => (
    <div className="lp-mtx-vis">
        <div className="lp-mtx-grid">
            <div className="lp-mtx-q">
                <span className="lp-mtx-ql">Solar Core — Do Now</span>
                <div className="lp-mn" style={{ width: 50, height: 50, top: '30%', left: '22%', background: 'radial-gradient(circle at 35% 35%,#fca5a5,#ef4444,#7f1d1d)', boxShadow: '0 0 20px rgba(239,68,68,0.5)' }}>ship<br />MVP</div>
                <div className="lp-mn" style={{ width: 34, height: 34, top: '58%', right: '14%', background: 'radial-gradient(circle at 35% 35%,#fde68a,#f59e0b)', boxShadow: '0 0 14px rgba(245,158,11,0.5)' }}>client</div>
            </div>
            <div className="lp-mtx-q">
                <span className="lp-mtx-ql tr">Nebula Flow — Schedule</span>
                <div className="lp-mn" style={{ width: 44, height: 44, top: '28%', left: '26%', background: 'radial-gradient(circle at 35% 35%,#c4b5fd,#7c3aed)', boxShadow: '0 0 16px rgba(124,58,237,0.4)' }}>strategy</div>
                <div className="lp-mn" style={{ width: 28, height: 28, bottom: '18%', right: '18%', background: 'radial-gradient(circle at 35% 35%,#bfdbfe,#3b82f6)', boxShadow: '0 0 10px rgba(59,130,246,0.4)' }}>docs</div>
            </div>
            <div className="lp-mtx-q">
                <span className="lp-mtx-ql br">Deep Void — Park</span>
                <div className="lp-mn" style={{ width: 16, height: 16, top: '42%', left: '42%', background: '#1e293b', opacity: .55, borderRadius: '42% 58% 70% 30% / 45% 45% 55% 55%' }} />
                <div className="lp-mn" style={{ width: 12, height: 12, top: '22%', right: '22%', background: '#0f172a', opacity: .45 }} />
            </div>
            <div className="lp-mtx-q">
                <span className="lp-mtx-ql tbr">Stellar Events — Delegate</span>
                <div className="lp-mn" style={{ width: 26, height: 26, top: '32%', left: '36%', background: 'radial-gradient(circle at 35% 35%,#d1d5db,#6b7280)', opacity: .7, fontSize: 6 }}>email</div>
                <div className="lp-mn" style={{ width: 22, height: 22, bottom: '28%', right: '26%', background: 'radial-gradient(circle at 35% 35%,#d1d5db,#6b7280)', opacity: .6, fontSize: 6 }}>slack</div>
            </div>
        </div>
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', fontFamily: "var(--lp-font-mono)", fontSize: '.48rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,158,11,0.32)', whiteSpace: 'nowrap' }}>HORIZON — Priority Board</div>
    </div>
);

/* ── Prism Visual ── */
const PrismVisual = () => (
    <div className="lp-prism-vis">
        {([
            { label: 'Mercury', items: [{ w: 26, bg: 'radial-gradient(circle at 35% 35%,#e2e8f0,#94a3b8)', bs: '0 0 6px rgba(148,163,184,0.4)', t: 'quick' }, { w: 20, bg: 'rgba(71,85,105,0.5)', br: '42% 58% 70% 30% / 45% 45% 55% 55%' }, { w: 22, bg: 'rgba(71,85,105,0.38)' }] },
            { label: 'Venus', items: [{ w: 50, bg: 'radial-gradient(circle at 35% 35%,#fed7aa,#f97316)', bs: '0 0 16px rgba(249,115,22,0.5)', t: 'brand\nvision' }, { w: 30, bg: 'radial-gradient(circle at 35% 35%,#fde68a,#f59e0b)', bs: '0 0 10px rgba(245,158,11,0.4)', t: 'design' }] },
            { label: 'Earth', items: [{ w: 64, bg: 'radial-gradient(circle at 35% 35%,#bfdbfe,#3b82f6,#1e3a8a)', bs: '0 0 22px rgba(59,130,246,0.5)', t: 'Product\nLaunch\nv2.0' }, { w: 36, bg: 'radial-gradient(circle at 35% 35%,#d1fae5,#059669)', bs: '0 0 12px rgba(5,150,105,0.5)', t: 'growth' }] },
            { label: 'Mars', items: [{ w: 44, bg: 'radial-gradient(circle at 35% 35%,#fca5a5,#ef4444)', bs: '0 0 16px rgba(239,68,68,0.6)', t: 'critical\nbug', pulse: true }, { w: 26, bg: 'radial-gradient(circle at 35% 35%,#fca5a5,#ef4444)', bs: '0 0 10px rgba(239,68,68,0.4)', t: 'block' }] },
        ] as { label: string; items: PrismItem[] }[]).map((col, ci) => (
            <div key={ci} className="lp-pcol">
                <span className="lp-pcol-label">{col.label}</span>
                {col.items.map((it, ii) => (
                    <div key={ii} className="lp-pn" style={{ width: it.w, height: it.w, background: it.bg, boxShadow: it.bs, borderRadius: it.br, ...(it.pulse ? { animation: 'lp-gp 2s ease-in-out infinite', '--ga': '0 0 14px rgba(239,68,68,0.5)', '--gb': '0 0 26px rgba(239,68,68,0.9)' } : {}) } as React.CSSProperties}>
                        {it.t?.split('\n').map((l, li) => <React.Fragment key={li}>{li > 0 && <br />}{l}</React.Fragment>)}
                    </div>
                ))}
            </div>
        ))}
    </div>
);

/* ── Timeline Visual ── */
const TimelineVisual = () => (
    <div className="lp-tl-vis">
        <div className="lp-tl-beam" />
        {[
            { side: 'l', top: '9%', title: 'Design System Draft', time: '10:00 AM — Oct 24' },
            { side: 'r', top: '29%', title: 'Launch Voyager I', time: 'CRITICAL — 14:00 Oct 24', highlight: true },
            { side: 'l', top: '53%', title: 'Stellar Team Sync', time: 'Oct 25 — All Hands' },
            { side: 'r', top: '73%', title: 'Quantum Research', time: '65% complete' },
        ].map((n, i) => (
            <div key={i} className={`lp-tl-n ${n.side}`} style={{ top: n.top }}>
                {n.side === 'l' ? <>
                    <div className="lp-tl-card"><div className="lp-tl-title">{n.title}</div><div className="lp-tl-time">{n.time}</div></div>
                    <div className="lp-tl-line" /><div className="lp-tl-dot" />
                </> : <>
                    <div className="lp-tl-dot" /><div className="lp-tl-line" />
                    <div className="lp-tl-card" style={n.highlight ? { borderColor: 'rgba(238,189,43,0.5)', boxShadow: '0 0 20px rgba(238,189,43,0.14)' } : undefined}>
                        <div className="lp-tl-title" style={n.highlight ? { color: '#eebd2b' } : undefined}>{n.title}</div>
                        <div className="lp-tl-time" style={n.highlight ? { color: 'rgba(239,68,68,0.8)' } : undefined}>{n.time}</div>
                    </div>
                </>}
            </div>
        ))}
        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', fontFamily: "var(--lp-font-mono)", fontSize: '.5rem', letterSpacing: '.24em', textTransform: 'uppercase', color: 'rgba(238,189,43,0.38)', whiteSpace: 'nowrap' }}>Temporal Star Stream</div>
    </div>
);

/* ── Mode Block helper ── */
interface ModeData { num: string; name: string; nameStyle: React.CSSProperties; tag: string; desc: string; cases: { icon: string; text: string }[]; flip?: boolean; Visual: React.FC; }
const ModeBlock: React.FC<ModeData> = ({ num, name, nameStyle, tag, desc, cases, flip, Visual }) => (
    <div className={`lp-mode-block${flip ? ' flip' : ''}`}>
        <div className={flip ? 'lp-reveal-right' : 'lp-reveal-left'}>
            <span className="lp-mode-num">{num}</span>
            <h2 className="lp-mode-name" style={nameStyle}>{name}</h2>
            <p className="lp-mode-tag">{tag}</p>
            <p className="lp-mode-desc">{desc}</p>
            <ul className="lp-mode-cases">
                {cases.map((c, i) => <li key={i}><span>{c.icon}</span><span>{c.text}</span></li>)}
            </ul>
        </div>
        <div className={`lp-mode-vis ${flip ? 'lp-reveal-left' : 'lp-reveal-right'}`}>
            <Visual />
        </div>
    </div>
);

/* ── Export ── */
export const ModesSection: React.FC = () => (
    <section id="lp-modes">
        <div className="lp-modes-header lp-reveal">
            <span className="lp-section-kicker">Five Modes of Thought</span>
            <h2 className="lp-section-title">Same notes. Five completely different<br />visual languages for five different tasks.</h2>
            <p className="lp-section-body" style={{ maxWidth: 620, margin: '14px auto 0' }}>Switch modes and your canvas transforms entirely — colors, layout, physics, chrome, typography. Your notes stay exactly where they are. Only the cognitive frame changes.</p>
        </div>
        <ModeBlock num="01 /" name="VOID" nameStyle={{ color: 'var(--lp-text)' }} tag="The receiving state. Nothing is required of you." desc="The only tool that does not punish you for not knowing what structure a thought belongs to. Click anywhere. Type. That is the entire workflow. Notes arrive without judgment. Structure happens when you are ready." cases={[{ icon: '📋', text: 'Meeting capture in real time — create notes freely, organize after the meeting ends' }, { icon: '🌅', text: 'Morning brain dump — 15 unstructured minutes before any structure is imposed' }, { icon: '📖', text: 'Reading and research — highlights land without filing, connections emerge naturally' }, { icon: '🎨', text: 'Creative development — ideas float near a concept without needing a format or category' }]} Visual={VoidVisual} />
        <ModeBlock flip num="02 /" name="ORBITAL" nameStyle={{ background: 'linear-gradient(135deg,#fde68a,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} tag="Priority is a radius, not a label." desc="Notes arrange themselves in concentric rings around a central point. Critical items orbit close. Low-priority items drift to the outer edge. You see what matters without reading a single word — because it is physically closest to the center." cases={[{ icon: '📅', text: 'Weekly planning — assign gravity to everything and see your actual focus' }, { icon: '🎯', text: 'Project triage — the critical path is always nearest the center, always visible' }, { icon: '⚡', text: 'Daily stand-up prep — 5 minutes shows exactly what to ship today' }, { icon: '✂️', text: 'Scope cutting — drag inward to keep, drag to the event horizon to eliminate' }]} Visual={OrbitalVisual} />
        <ModeBlock num="03 /" name="MATRIX" nameStyle={{ color: 'var(--lp-amber)' }} tag="Drag is the decision. No forms, no properties, no filing." desc="The canvas divides into four cosmic zones. Pick up a note, place it in a zone. That physical gesture is the decision — no property editor, no status field, no typing required. The act of placing replaces the act of filing." cases={[{ icon: '📊', text: "Weekly review — 10 minutes to place a week's captures into their zones" }, { icon: '🗺️', text: 'Feature prioritization — drag to cut vs. build, the result is a roadmap' }, { icon: '🤝', text: 'Hiring triage — one note per candidate, placed by immediate need and long-term fit' }, { icon: '📱', text: 'Content calendar — what ships this week vs. what needs more development' }]} Visual={MatrixVisual} />
        <ModeBlock flip num="04 /" name="PRISM" nameStyle={{ background: 'linear-gradient(135deg,#e0f2fe,#3b82f6,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} tag="Columns with gravitational weight. The most important card is literally bigger." desc="A kanban board where notes have physical size. The most important item in a column towers over the trivial one. You see sequence and weight simultaneously — without reading a single priority label." cases={[{ icon: '✍️', text: 'Writing workflow — Research → Draft → Edit → Done with weighted importance' }, { icon: '💻', text: 'Sprint board — story points determine visual size, heaviest tickets visually dominate' }, { icon: '🔬', text: 'Research pipeline — Literature → Ideas → Evidence → Draft → Published' }, { icon: '📚', text: 'Knowledge management — Capture → Process → Reference → Archive' }]} Visual={PrismVisual} />
        <ModeBlock num="05 /" name="TIMELINE" nameStyle={{ background: 'linear-gradient(135deg,#fef3c7,#eebd2b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} tag="The shape of your intellectual history made visible." desc="Notes placed on a time axis by creation date. Scroll through your thinking as it evolved. No other tool shows you the visual density of thought across time — which weeks were rich, which were sparse, where the breakthroughs arrived." cases={[{ icon: '🔭', text: 'Monthly retrospective — scroll through everything created this month, see the pattern' }, { icon: '📁', text: 'Project audit trail — when decisions were made, when velocity changed' }, { icon: '📔', text: 'Journaling — your intellectual history as a visual amber stream' }, { icon: '🧠', text: 'Learning tracking — see your learning velocity and its gaps over time at a glance' }]} Visual={TimelineVisual} />
    </section>
);

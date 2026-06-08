import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStore, noteVisibleInMode } from '../../store/useStore';
import { workerBridge } from '../../workers/WorkerBridge';

export type Mode = 'core' | 'pro' | 'ultra';

export interface SettingsState {
    mode: Mode;
    showHierarchy: boolean;
    showLinks: boolean;

    pro: {
        magneticAlignment: boolean;
        smartZoom: boolean;
        templatesVisible: boolean;
    };
    ultra: {
        focusMode: boolean;
        autoMapEnabled: boolean;
        invoiceUniverse: boolean;
        questMode: boolean;
    };
    setMode: (m: Mode) => void;
    transitionPhase: 'entering' | 'settling' | 'stable';
    freePositions: Map<string, { x: number; y: number }>;
    layoutVersion: number;
    setTransitionPhase: (phase: 'entering' | 'settling' | 'stable') => void;

    // Lens System (Ultra Mode)
    viewMode: ViewMode;
    designSystem: 'zero-point' | 'solar'; // Dual design system
    setViewMode: (v: ViewMode | 'void' | 'matrix' | 'prism' | 'orbital' | 'timeline' | 'free') => void;
    setDesignSystem: (ds: 'zero-point' | 'solar') => void;

    // Toolbar Settings
    toolbarMode: 'fixed' | 'auto-hide' | 'collapsed';

    feedbackEmail: string;
    feedbackQuestions: {
        key: string;
        title: string;
        subtitle: string;
        options: string[];
        allowFreeText: boolean;
    }[];
    setFeedbackEmail: (email: string) => void;
    setFeedbackQuestions: (questions: any[]) => void;

    setToggle: (key: string, val: boolean | string) => void;
}

import type { ViewMode } from '../../constants';

async function autoLayoutForMode(targetMode: ViewMode) {
    const viewStore = useStore.getState();
    const allNotes = viewStore.notes;
    const activeConstellation = viewStore.activeConstellation;
    const modeNotes = targetMode === 'archive'
        ? viewStore.graveyard
        : allNotes.filter(n => noteVisibleInMode(n, targetMode, activeConstellation));
    if (modeNotes.length === 0) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const cx = W / 2;
    const cy = H / 2;
    const minDim = Math.min(W, H);

    // Map store notes to StardustSchema Note interface format for Web Worker
    const workerNotes = modeNotes.map(n => ({
        id: n.id,
        x: n.x,
        y: n.y,
        w: n.w || 80,
        h: n.h || 80,
        vx: n.vx || 0,
        vy: n.vy || 0,
        mass: n.mass || 1,
        fixed: n.fixed || false,
        linkCount: 0,
        accessCount: 0,
        lastModified: n.updatedAt || Date.now(),
        lastAccessed: n.lastAccessedAt || Date.now(),
        type: n.type,
        title: n.title || '',
        content: n.content || '',
        tags: n.tags || [],
        priority: n.priority || 'medium',
        impact: 0.5,
        effort: 0.5,
        createdAt: n.createdAt || Date.now(),
        updatedAt: n.updatedAt || Date.now(),
        originMode: n.originMode,
        isCompleted: n.isCompleted,
        isDying: n.isDying,
    }));

    let targets: Record<string, { x: number; y: number }> | null = null;

    try {
        if (targetMode === 'orbital') {
            const gravityScores = await workerBridge.calculateGravityScores(workerNotes);
            targets = await workerBridge.getOrbitalTargets(workerNotes, { x: cx, y: cy }, gravityScores);
        } else if (targetMode === 'matrix') {
            targets = await workerBridge.getMatrixTargets(workerNotes, { x: cx, y: cy }, { width: W, height: H });
        } else if (targetMode === 'prism') {
            targets = await workerBridge.getPrismTargets(workerNotes, { x: cx, y: cy });
        } else if (targetMode === 'timeline') {
            targets = await workerBridge.getTimelineTargets(workerNotes, { x: cx, y: cy });
        }
    } catch (error) {
        console.warn('Worker layout computation failed, falling back to sync layout:', error);
    }

    const positions: { id: string; x: number; y: number }[] = [];

    if (targets) {
        Object.entries(targets).forEach(([id, pos]) => {
            positions.push({ id, x: pos.x, y: pos.y });
        });
    } else {
        // Fallback sync layout
        switch (targetMode) {
            case 'orbital': {
                const RADII: Record<string, number> = { critical: minDim * 0.17, high: minDim * 0.30, medium: minDim * 0.44, low: minDim * 0.58 };
                const byPriority: Record<string, typeof modeNotes> = { critical: [], high: [], medium: [], low: [] };
                modeNotes.forEach(n => { const p = n.priority || 'low'; if (!byPriority[p]) byPriority[p] = []; byPriority[p].push(n); });
                Object.entries(RADII).forEach(([priority, radius]) => {
                    const group = byPriority[priority] || [];
                    group.forEach((n, i) => {
                        const angle = (i / Math.max(group.length, 1)) * Math.PI * 2 - Math.PI / 2;
                        positions.push({ id: n.id, x: cx + radius * Math.cos(angle) - 40, y: cy + radius * Math.sin(angle) - 40 });
                    });
                });
                break;
            }
            case 'matrix': {
                const QW = W * 0.28; const QH = H * 0.22;
                const QUADS = [
                    { urgency: 'urgent', importance: 'important', dx: -QW, dy: -QH },
                    { urgency: 'not-urgent', importance: 'important', dx: QW, dy: -QH },
                    { urgency: 'urgent', importance: 'not-important', dx: -QW, dy: QH },
                    { urgency: 'not-urgent', importance: 'not-important', dx: QW, dy: QH },
                ];
                QUADS.forEach(q => {
                    const group = modeNotes.filter(n =>
                        (n.urgency === q.urgency || (!n.urgency && q.urgency === 'not-urgent')) &&
                        (n.importance === q.importance || (!n.importance && q.importance === 'important'))
                    );
                    group.forEach((n, i) => {
                        positions.push({ id: n.id, x: cx + q.dx + (i % 3) * 120 - 60, y: cy + q.dy + Math.floor(i / 3) * 100 - 50 });
                    });
                });
                break;
            }
            case 'prism': {
                const LANES = [{ status: 'todo', xPct: 0.125 }, { status: 'in-progress', xPct: 0.375 }, { status: 'review', xPct: 0.625 }, { status: 'done', xPct: 0.875 }];
                LANES.forEach(lane => {
                    const group = modeNotes.filter(n => n.status === lane.status || (lane.status === 'todo' && (!n.status || n.status === 'captured')));
                    group.forEach((n, i) => { positions.push({ id: n.id, x: W * lane.xPct - 45, y: H * 0.20 + i * 140 }); });
                });
                break;
            }
            case 'timeline': {
                const sorted = [...modeNotes].sort((a, b) => (a.dueDate || a.createdAt || 0) - (b.dueDate || b.createdAt || 0));
                const spacing = Math.min(220, (W * 0.80) / Math.max(sorted.length, 1));
                const startX = cx - (sorted.length / 2) * spacing;
                sorted.forEach((n, i) => { positions.push({ id: n.id, x: startX + i * spacing - 45, y: i % 2 === 0 ? cy - 200 : cy + 100 }); });
                break;
            }
            case 'archive': {
                modeNotes.forEach((n, i) => {
                    const angle = i * 0.9; const r = 80 + i * 55;
                    positions.push({ id: n.id, x: cx + r * Math.cos(angle) - 40, y: cy + r * Math.sin(angle) - 40 });
                });
                break;
            }
            default: break;
        }
    }

    positions.forEach((pos, i) => {
        setTimeout(() => { viewStore.updateNote(pos.id, { x: pos.x, y: pos.y, vx: 0, vy: 0, fixed: false }); }, i * 35);
    });
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            mode: 'ultra', // Default to Ultra for Showcase
            showHierarchy: true,
            showLinks: true,

            toolbarMode: 'fixed',
            pro: {
                magneticAlignment: true,
                smartZoom: true,
                templatesVisible: true,
            },
            ultra: {
                focusMode: false,
                autoMapEnabled: true,
                invoiceUniverse: true,
                questMode: true,
            },
            viewMode: 'void',
            designSystem: 'zero-point',
            transitionPhase: 'stable',
            freePositions: new Map(),
            layoutVersion: 1,

            feedbackEmail: 'feedback@stardust.space',
            feedbackQuestions: [
                {
                    key: 'q1_source',
                    title: 'How did you find Stardust?',
                    subtitle: 'Help us understand where our cosmic travellers come from.',
                    options: ['Search engine', 'Social media', 'Friend / colleague', 'Blog / article', 'App store'],
                    allowFreeText: true,
                },
                {
                    key: 'q2_usecase',
                    title: 'What do you hope to use Stardust for?',
                    subtitle: 'There are no wrong answers — we want to build for you.',
                    options: ['Personal notes & journaling', 'Project management', 'Research & knowledge base', 'Creative brainstorming', 'Team collaboration'],
                    allowFreeText: true,
                },
                {
                    key: 'q3_frustration',
                    title: 'What frustrated you about other note tools?',
                    subtitle: 'Your pain is our compass.',
                    options: ['Too many features', 'Too few features', 'Notes pile up and go stale', 'Hard to find things', 'Ugly or boring design'],
                    allowFreeText: true,
                },
                {
                    key: 'q4_aspiration',
                    title: 'What would make Stardust feel truly yours?',
                    subtitle: 'Dream big — we\'re listening.',
                    options: ['AI that organizes for me', 'Beautiful visual design', 'Works offline perfectly', 'Connects ideas automatically', 'Stays out of my way'],
                    allowFreeText: true,
                },
            ],
            setFeedbackEmail: (email) => set({ feedbackEmail: email }),
            setFeedbackQuestions: (qs) => set({ feedbackQuestions: qs }),
            setViewMode: (v) => {
                const state = get()
                const currentMode = state.viewMode;
                const viewStore = useStore.getState();

                // 1. Save current positions to currentMode's snapshot
                viewStore.saveModePositions(currentMode);

                // 2. Set new mode and enter transition phase
                set({
                    viewMode: v as ViewMode,
                    transitionPhase: 'entering'
                });

                // 3. Transition phase cascade: entering → settling → stable
                setTimeout(() => set({ transitionPhase: 'settling' }), 600);
                setTimeout(() => set({ transitionPhase: 'stable' }), 1400);

                // 4. Try to restore positions for target mode. Fallback to auto-layout if not found.
                const restored = viewStore.restoreModePositions(v);
                if (!restored) {
                    setTimeout(() => { autoLayoutForMode(v as ViewMode); }, 350);
                }
            },
            setTransitionPhase: (phase) => set({ transitionPhase: phase }),
            setDesignSystem: (ds) => set({ designSystem: ds }),
            setMode: (m: Mode) => {
                set((state) => {
                    const updates: any = { mode: m };

                    // Auto-enable features when upgrading
                    if (m === 'pro' || m === 'ultra') {
                        updates.pro = {
                            ...state.pro,
                            magneticAlignment: true,
                            smartZoom: true
                        };
                    }

                    if (m === 'ultra') {
                        updates.ultra = {
                            ...state.ultra,
                            invoiceUniverse: true,
                            questMode: true
                        };
                    }
                    return updates;
                });
            },
            setToggle: (key: string, val: boolean | string) => {
                // safe setter with simple path support
                const parts = key.split('.');
                if (parts.length === 1) set({ [key]: val } as any);
                else if (parts.length === 2) {
                    const [group, sub] = parts;
                    set((state: any) => ({
                        [group]: { ...state[group], [sub]: val },
                    }));
                }
            },
        }),
        { 
            name: 'stardust.settings.v3',
            storage: {
                getItem: (name: string) => {
                    const str = localStorage.getItem(name);
                    if (!str) return null;
                    try {
                        const parsed = JSON.parse(str);
                        // Rehydrate freePositions from array back to Map
                        if (parsed?.state?.freePositions && Array.isArray(parsed.state.freePositions)) {
                            parsed.state.freePositions = new Map(parsed.state.freePositions);
                        } else if (parsed?.state) {
                            parsed.state.freePositions = new Map();
                        }
                        return parsed;
                    } catch {
                        return null;
                    }
                },
                setItem: (name: string, value: any) => {
                    // Convert Map to array entries for JSON serialization
                    const clone = JSON.parse(JSON.stringify(value, (_key, val) => {
                        if (val instanceof Map) return Array.from(val.entries());
                        return val;
                    }));
                    localStorage.setItem(name, JSON.stringify(clone));
                },
                removeItem: (name: string) => localStorage.removeItem(name),
            },
        }
    )
);

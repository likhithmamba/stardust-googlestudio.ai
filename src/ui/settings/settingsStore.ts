import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStore, noteVisibleInMode } from '../../store/useStore';

export type Mode = 'core' | 'pro' | 'ultra';

export interface SettingsState {
    mode: Mode;
    showHierarchy: boolean;
    showLinks: boolean;
    showChooserPreview: boolean; // dev/test preview; not persisted by default
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

    setToggle: (key: string, val: boolean | string) => void;
}

import type { ViewMode } from '../../constants';

function autoLayoutForMode(targetMode: ViewMode) {
    const viewStore = useStore.getState();
    const allNotes = viewStore.notes;
    const modeNotes = allNotes.filter(n => noteVisibleInMode(n, targetMode));
    if (modeNotes.length === 0) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const cx = W / 2;
    const cy = H / 2;
    const minDim = Math.min(W, H);
    const positions: { id: string; x: number; y: number }[] = [];

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
            showChooserPreview: false,
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
            setViewMode: (v) => {
                const state = get()
                const currentMode = state.viewMode;
                const viewStore = useStore.getState();

                // 1. If leaving FREE mode, snapshot current positions in useStore
                if (currentMode === 'free') {
                    const snapshot = new Map<string, { x: number; y: number }>();
                    viewStore.notes.forEach(n => {
                        snapshot.set(n.id, { x: n.x, y: n.y });
                    });
                    set({ freePositions: snapshot });
                }

                // 2. Set new mode and enter transition phase
                if (v === 'free' && state.freePositions.size > 0) {
                    const restoredNotes = viewStore.notes.map(n => {
                        const saved = state.freePositions.get(n.id);
                        return saved ? { ...n, x: saved.x, y: saved.y, vx: 0, vy: 0, fixed: false } : n;
                    });
                    viewStore.setNotes(restoredNotes);
                }

                set({
                    viewMode: v as ViewMode,
                    transitionPhase: 'entering'
                });

                // 3. Transition phase cascade: entering → settling → stable
                setTimeout(() => set({ transitionPhase: 'settling' }), 600);
                setTimeout(() => set({ transitionPhase: 'stable' }), 1400);
                setTimeout(() => { autoLayoutForMode(v as ViewMode); }, 350);
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
        { name: 'stardust.settings.v3' }
    )
);

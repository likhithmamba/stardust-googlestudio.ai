export class VisualRegistry {
    private static instance: VisualRegistry;
    private refs: Map<string, HTMLElement> = new Map();

    private constructor() { }

    static getInstance(): VisualRegistry {
        if (!VisualRegistry.instance) {
            VisualRegistry.instance = new VisualRegistry();
        }
        return VisualRegistry.instance;
    }

    register(id: string, element: HTMLElement) {
        this.refs.set(id, element);
    }

    unregister(id: string) {
        this.refs.delete(id);
    }

    updatePosition(id: string, x: number, y: number, scale: number = 1, rotate: number = 0) {
        const el = this.refs.get(id);
        if (el) {
            // Force 3D transform for GPU acceleration
            el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}rad)`;
        }
    }

    private connectionRefs: Map<string, { path: SVGPathElement; particle?: SVGCircleElement; label?: HTMLElement }> = new Map();

    registerConnection(id: string, elements: { path: SVGPathElement; particle?: SVGCircleElement; label?: HTMLElement }) {
        this.connectionRefs.set(id, elements);
    }

    unregisterConnection(id: string) {
        this.connectionRefs.delete(id);
    }

    updateConnection(id: string, x1: number, y1: number, x2: number, y2: number) {
        const refs = this.connectionRefs.get(id);
        if (refs) {
            // Calculate Cubic Bezier
            const dx = x2 - x1;
            const cp1x = x1 + dx * 0.4;
            const cp1y = y1;
            const cp2x = x2 - dx * 0.4;
            const cp2y = y2;
            const pathData = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

            // Update main path
            refs.path.setAttribute('d', pathData);

            // Update particle animation path if it exists
            if (refs.particle) {
                const anim = refs.particle.querySelector('animateMotion');
                if (anim) {
                    anim.setAttribute('path', pathData);
                }
            }

            // Update label position (midpoint of bezier)
            if (refs.label) {
                // Bezier midpoint (t=0.5) formula: 0.125P0 + 0.375P1 + 0.375P2 + 0.125P3
                const mx = 0.125 * x1 + 0.375 * cp1x + 0.375 * cp2x + 0.125 * x2;
                const my = 0.125 * y1 + 0.375 * cp1y + 0.375 * cp2y + 0.125 * y2;
                refs.label.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
            }
        }
    }
}

export const visualRegistry = VisualRegistry.getInstance();

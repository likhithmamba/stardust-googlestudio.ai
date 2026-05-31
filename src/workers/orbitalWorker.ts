
// Orbital Physics Web Worker — Pure TypeScript implementation
// Replaces the broken d3-quadtree CDN import with a built-in spatial partitioning approach.

// ─── Types ──────────────────────────────────────────────────────

interface PhysicsNodeData {
    id: string;
    x?: number;
    y?: number;
    mass?: number;
    radius?: number;
}

interface PhysicsNode {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass: number;
    radius: number;
}

interface PhysicsLink {
    sourceId: string;
    targetId: string;
    strength: number;
}

interface PhysicsConfig {
    repulsionStrength: number;
    attractionStrength: number;
    damping: number;
    gravity: number;
}

// ─── Worker State ───────────────────────────────────────────────

let nodes: PhysicsNode[] = [];
let links: PhysicsLink[] = [];
let width = 1000;
let height = 1000;
let running = false;
let config: PhysicsConfig = {
    repulsionStrength: 0.5,
    attractionStrength: 0.1,
    damping: 0.1,
    gravity: 0.01,
};

function createNode(data: PhysicsNodeData): PhysicsNode {
    return {
        id: data.id,
        x: data.x ?? Math.random() * width,
        y: data.y ?? Math.random() * height,
        vx: 0,
        vy: 0,
        mass: data.mass ?? 1,
        radius: data.radius ?? 10,
    };
}

// ─── Message Handler ────────────────────────────────────────────

const ctx = self as unknown as Worker;

ctx.addEventListener('message', function (e: MessageEvent) {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT':
            width = payload.width || width;
            height = payload.height || height;
            config = { ...config, ...payload.config };
            break;

        case 'SET_INITIAL_STATE':
            nodes = (payload.nodes as PhysicsNodeData[]).map(createNode);
            links = [...(payload.links as PhysicsLink[])];
            break;

        case 'UPDATE_NODES':
            (payload as Partial<PhysicsNode>[]).forEach((update) => {
                const node = nodes.find((n) => n.id === update.id);
                if (node) Object.assign(node, update);
            });
            break;

        case 'UPDATE_LINKS':
            links = [...(payload as PhysicsLink[])];
            break;

        case 'START_SIMULATION':
            if (!running) {
                running = true;
                simulate();
            }
            break;

        case 'STOP_SIMULATION':
            running = false;
            break;
    }
});

// ─── Simulation Loop ────────────────────────────────────────────

function simulate() {
    if (!running) return;

    applyRepulsionForces();
    applyAttractionForces();
    applyCenterGravity();

    // Integrate velocities
    for (const node of nodes) {
        node.vx *= 1 - config.damping;
        node.vy *= 1 - config.damping;
        node.x += node.vx;
        node.y += node.vy;

        // Boundary constraints
        node.x = Math.max(0, Math.min(width, node.x));
        node.y = Math.max(0, Math.min(height, node.y));
    }

    // Send position updates
    const positions = nodes.map((node) => ({
        id: node.id,
        x: node.x,
        y: node.y,
    }));

    ctx.postMessage({ type: 'POSITIONS_UPDATE', payload: positions });

    setTimeout(simulate, 16); // ~60fps
}

// ─── Force Calculations ─────────────────────────────────────────

/**
 * O(N²) pairwise repulsion. For typical note counts (<200) this is
 * more than fast enough. Avoids the d3-quadtree dependency entirely.
 */
function applyRepulsionForces() {
    const len = nodes.length;
    for (let i = 0; i < len; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < len; j++) {
            const b = nodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            const minDist = (a.radius + b.radius) * 2;

            if (dist < minDist) {
                const force =
                    (config.repulsionStrength * a.mass * b.mass) / (dist * dist);
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                a.vx -= fx;
                a.vy -= fy;
                b.vx += fx;
                b.vy += fy;
            }
        }
    }
}

function applyAttractionForces() {
    for (const link of links) {
        const source = nodes.find((n) => n.id === link.sourceId);
        const target = nodes.find((n) => n.id === link.targetId);

        if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            const force = (config.attractionStrength * link.strength) / dist;

            source.vx += (dx / dist) * force;
            source.vy += (dy / dist) * force;
            target.vx -= (dx / dist) * force;
            target.vy -= (dy / dist) * force;
        }
    }
}

function applyCenterGravity() {
    const cx = width / 2;
    const cy = height / 2;

    for (const node of nodes) {
        const dx = cx - node.x;
        const dy = cy - node.y;
        node.vx += dx * config.gravity;
        node.vy += dy * config.gravity;
    }
}

// ─── Error Handling ─────────────────────────────────────────────

ctx.addEventListener('error', function (error: ErrorEvent) {
    ctx.postMessage({ type: 'ERROR', payload: error.message });
});

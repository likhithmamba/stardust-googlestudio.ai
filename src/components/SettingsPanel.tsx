import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useSettingsStore } from '../ui/settings/settingsStore';
import { soundManager } from '../utils/sound';
import { saveApiKey, getApiKey, clearApiKey, saveModel, getModel, AI_MODELS, type AIModelId } from '../utils/ai';
import { DECAY_CONFIG, updateDecayConfig, isDecayEngineRunning } from '../engine/decayEngine';
import { FLAGS } from '../engine/flags/FeatureFlags';
import { initDB } from '../db/idb';
import { exportCanvasToJSON, exportCanvasToPNG, exportToMarkdownZip } from '../utils/export';

type SettingsTab = 'canvas' | 'intelligence' | 'physics' | 'decay' | 'sound' | 'feedback' | 'data' | 'shortcuts' | 'about';

export const SettingsPanel: React.FC = () => {
    const isSettingsOpen = useStore((state: any) => state.isSettingsOpen);
    const setSettingsOpen = useStore((state: any) => state.setSettingsOpen);

    const [activeTab, setActiveTab] = useState<SettingsTab>('canvas');

    // Canvas Settings
    const showHierarchy = useSettingsStore((state) => state.showHierarchy);
    const showLinks = useSettingsStore((state) => state.showLinks);
    const setToggle = useSettingsStore((state) => state.setToggle);
    const currentViewMode = useSettingsStore((state) => state.viewMode);
    const setViewMode = useSettingsStore((state) => state.setViewMode);
    const designSystem = useSettingsStore((state) => state.designSystem);
    const setDesignSystem = useSettingsStore((state) => state.setDesignSystem);

    const feedbackEmail = useSettingsStore((state) => state.feedbackEmail);
    const setFeedbackEmail = useSettingsStore((state) => state.setFeedbackEmail);
    const feedbackQuestions = useSettingsStore((state) => state.feedbackQuestions);
    const setFeedbackQuestions = useSettingsStore((state) => state.setFeedbackQuestions);

    const showMinimap = useStore((state: any) => state.showMinimap);
    const setShowMinimap = useStore((state: any) => state.setShowMinimap);
    const showConnections = useStore((state: any) => state.showConnections);
    const setShowConnections = useStore((state: any) => state.setShowConnections);
    const scaleMode = useStore((state: any) => state.scaleMode);
    const setScaleMode = useStore((state: any) => state.setScaleMode);

    // AI/Intelligence Settings
    const [apiKey, setApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState<AIModelId>('google/gemini-2.0-flash-exp:free');
    const [isSavingKey, setIsSavingKey] = useState(false);

    // Sound Settings
    const [volume, setVolume] = useState(0.3);
    const [isMuted, setIsMuted] = useState(false);

    // Decay Settings
    const [decayEnabled, setDecayEnabled] = useState(true);
    const [decayRate, setDecayRate] = useState(0.005);
    const [gracePeriodHours, setGracePeriodHours] = useState(24);

    // Physics State (mutable object keys)
    const [flags, setFlags] = useState({
        ENABLE_PHYSICS: FLAGS.ENABLE_PHYSICS,
        ENABLE_SINGULARITY: FLAGS.ENABLE_SINGULARITY,
        ENABLE_SLEEP: FLAGS.ENABLE_SLEEP,
        ENABLE_LAYOUT: FLAGS.ENABLE_LAYOUT,
        ENABLE_RENDER: FLAGS.ENABLE_RENDER,
        ENABLE_PARTICLES: FLAGS.ENABLE_PARTICLES
    });



    // Load initial settings on mount
    useEffect(() => {
        if (!isSettingsOpen) return;

        // Fetch AI Settings
        getApiKey().then(key => {
            if (key) setApiKey(key);
        });
        setSelectedModel(getModel());

        // Fetch Sound Settings
        setVolume(soundManager.getVolume());
        setIsMuted(soundManager.isMuted());

        // Fetch Decay Settings
        setDecayEnabled(isDecayEngineRunning());
        setDecayRate(DECAY_CONFIG.DECAY_RATE);
        setGracePeriodHours(DECAY_CONFIG.GRACE_PERIOD / (60 * 60 * 1000));
    }, [isSettingsOpen]);

    const handleSaveApiKey = async () => {
        setIsSavingKey(true);
        try {
            if (apiKey.trim()) {
                await saveApiKey(apiKey.trim());
                window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'OpenRouter API Key saved successfully.', type: 'info' } }));
            } else {
                clearApiKey();
                window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'API Key cleared.', type: 'info' } }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleModelChange = (modelId: AIModelId) => {
        setSelectedModel(modelId);
        saveModel(modelId);
        let modelName = 'Unknown Model';
        switch (modelId) {
            case 'google/gemini-2.0-flash-exp:free':
                modelName = 'Gemini 2.0 Flash (Free)';
                break;
            case 'google/gemini-2.5-pro-preview':
                modelName = 'Gemini 2.5 Pro';
                break;
            case 'anthropic/claude-sonnet-4':
                modelName = 'Claude Sonnet 4';
                break;
            case 'openai/gpt-4o':
                modelName = 'GPT-4o';
                break;
            case 'openai/gpt-4o-mini':
                modelName = 'GPT-4o Mini';
                break;
            case 'meta-llama/llama-3.3-70b-instruct':
                modelName = 'Llama 3.3 70B';
                break;
            case 'deepseek/deepseek-chat-v3-0324:free':
                modelName = 'DeepSeek V3 (Free)';
                break;
        }
        window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: `Model set to ${modelName}`, type: 'info' } }));
    };

    const handleVolumeChange = (v: number) => {
        setVolume(v);
        soundManager.setVolume(v);
    };

    const handleMuteToggle = (muted: boolean) => {
        setIsMuted(muted);
        soundManager.setMuted(muted);
    };

    const handleDecayToggle = (enabled: boolean) => {
        setDecayEnabled(enabled);
        updateDecayConfig({ enabled });
    };

    const handleGracePeriodChange = (hours: number) => {
        setGracePeriodHours(hours);
        updateDecayConfig({ gracePeriodHours: hours });
    };

    const handleDecayRateChange = (rate: number) => {
        setDecayRate(rate);
        updateDecayConfig({ decayRate: rate });
    };

    const togglePhysicsFlag = (key: keyof typeof flags) => {
        let newVal = false;
        switch (key) {
            case 'ENABLE_PHYSICS':
                newVal = !flags.ENABLE_PHYSICS;
                FLAGS.ENABLE_PHYSICS = newVal;
                setFlags(prev => ({ ...prev, ENABLE_PHYSICS: newVal }));
                break;
            case 'ENABLE_SINGULARITY':
                newVal = !flags.ENABLE_SINGULARITY;
                FLAGS.ENABLE_SINGULARITY = newVal;
                setFlags(prev => ({ ...prev, ENABLE_SINGULARITY: newVal }));
                break;
            case 'ENABLE_SLEEP':
                newVal = !flags.ENABLE_SLEEP;
                FLAGS.ENABLE_SLEEP = newVal;
                setFlags(prev => ({ ...prev, ENABLE_SLEEP: newVal }));
                break;
            case 'ENABLE_LAYOUT':
                newVal = !flags.ENABLE_LAYOUT;
                FLAGS.ENABLE_LAYOUT = newVal;
                setFlags(prev => ({ ...prev, ENABLE_LAYOUT: newVal }));
                break;
            case 'ENABLE_RENDER':
                newVal = !flags.ENABLE_RENDER;
                FLAGS.ENABLE_RENDER = newVal;
                setFlags(prev => ({ ...prev, ENABLE_RENDER: newVal }));
                break;
            case 'ENABLE_PARTICLES':
                newVal = !flags.ENABLE_PARTICLES;
                FLAGS.ENABLE_PARTICLES = newVal;
                setFlags(prev => ({ ...prev, ENABLE_PARTICLES: newVal }));
                break;
            default:
                return;
        }
        window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: `${key.replace('ENABLE_', '')} toggled: ${newVal ? 'ON' : 'OFF'}`, type: 'info' } }));
    };

    const handleClearData = async () => {
        if (confirm("Are you sure you want to permanently delete all notes and connections? This cannot be undone.")) {
            const store = useStore.getState();
            store.setNotes([]);
            store.setConnections([]);
            if ('graveyard' in store) {
                (store as any).setGraveyard?.([]);
            }
            // Clear IndexedDB
            try {
                const db = await initDB();
                const tx = db.transaction(['notes', 'connections', 'graveyard'], 'readwrite');
                await Promise.all([
                    tx.objectStore('notes').clear(),
                    tx.objectStore('connections').clear(),
                    tx.objectStore('graveyard').clear()
                ]);
                await tx.done;
                window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Database cleared completely.', type: 'info' } }));
            } catch (e) {
                console.error("Failed to clear DB:", e);
            }
        }
    };

    const handleExportJSON = () => {
        const state = useStore.getState();
        exportCanvasToJSON(state.notes, state.connections, currentViewMode, designSystem);
        window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Universe backup exported.', type: 'success' } }));
    };

    const handleExportPNG = () => {
        const state = useStore.getState();
        exportCanvasToPNG(state.notes, state.connections, currentViewMode, designSystem);
        window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Canvas snapshot exported.', type: 'success' } }));
    };

    const handleExportMarkdown = async () => {
        const state = useStore.getState();
        await exportToMarkdownZip(state.notes);
        window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Markdown files exported.', type: 'success' } }));
    };

    const handleFallbackImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (data.notes && Array.isArray(data.notes)) {
                const state = useStore.getState();
                state.setNotes(data.notes);
                state.setConnections(data.connections || []);
                const settings = useSettingsStore.getState();
                if (data.viewMode) settings.setViewMode(data.viewMode);
                if (data.designSystem) settings.setDesignSystem(data.designSystem);
                window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Import completed successfully.', type: 'info' } }));
            } else {
                window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Invalid file format.', type: 'error' } }));
            }
        } catch (err) {
            console.error('Import failed:', err);
            window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Import failed.', type: 'error' } }));
        }
    };

    if (!isSettingsOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 pointer-events-auto">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" onClick={() => setSettingsOpen(false)} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: 30 }}
                className="relative w-full max-w-5xl h-[80vh] bg-[#0A0B14]/80 border border-white/10 rounded-[32px] shadow-[0_32px_128px_rgba(0,0,0,0.9)] backdrop-blur-3xl overflow-hidden flex"
            >
                {/* Lateral Navigation */}
                <div className="w-72 border-r border-white/5 flex flex-col p-8 gap-6 bg-black/10 select-none">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                            <span className="material-symbols-outlined text-white text-xl">settings</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black tracking-[0.3em] text-white uppercase">Control Center</span>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">v2.5.0</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1 pr-1">
                        <SideTab label="Canvas" icon="layers" isActive={activeTab === 'canvas'} onClick={() => setActiveTab('canvas')} />
                        <SideTab label="Intelligence" icon="psychology" isActive={activeTab === 'intelligence'} onClick={() => setActiveTab('intelligence')} />
                        <SideTab label="Physics" icon="motion_photos_on" isActive={activeTab === 'physics'} onClick={() => setActiveTab('physics')} />
                        <SideTab label="Decay" icon="hourglass_empty" isActive={activeTab === 'decay'} onClick={() => setActiveTab('decay')} />
                        <SideTab label="Sound" icon="volume_up" isActive={activeTab === 'sound'} onClick={() => setActiveTab('sound')} />
                        <SideTab label="Feedback Config" icon="rate_review" isActive={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} />
                        <SideTab label="Data Management" icon="database" isActive={activeTab === 'data'} onClick={() => setActiveTab('data')} />
                        <SideTab label="Shortcuts" icon="keyboard" isActive={activeTab === 'shortcuts'} onClick={() => setActiveTab('shortcuts')} />
                        <SideTab label="About Stardust" icon="info" isActive={activeTab === 'about'} onClick={() => setActiveTab('about')} />
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <button
                            onClick={() => setSettingsOpen(false)}
                            className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                            Return to Canvas
                        </button>
                    </div>
                </div>

                {/* Main View Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-black/5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {/* CANVAS TAB */}
                            {activeTab === 'canvas' && (
                                <div className="space-y-8">
                                    <TabHeader title="Canvas Configurations" subtitle="Control the layout, styling, and overlays of your spatial workspace." />
                                    
                                    <section className="space-y-4">
                                        <SectionTitle title="Active Layout Mode" />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <ViewCard label="Free Canvas" description="Infinite floating space." active={currentViewMode === 'free'} onClick={() => setViewMode('free')} />
                                            <ViewCard label="Void" description="Dark singularity attractor." active={currentViewMode === 'void'} onClick={() => setViewMode('void')} />
                                            <ViewCard label="Orbital" description="Radial priority bands." active={currentViewMode === 'orbital'} onClick={() => setViewMode('orbital')} />
                                            <ViewCard label="Matrix" description="Eisenhower decision grid." active={currentViewMode === 'matrix'} onClick={() => setViewMode('matrix')} />
                                            <ViewCard label="Prism" description="Categorized status columns." active={currentViewMode === 'prism'} onClick={() => setViewMode('prism')} />
                                            <ViewCard label="Timeline" description="Linear temporal lane guide." active={currentViewMode === 'timeline'} onClick={() => setViewMode('timeline')} />
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <SectionTitle title="Active Design System" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setDesignSystem('zero-point')}
                                                className={clsx(
                                                    "text-left p-6 rounded-3xl border transition-all text-left",
                                                    designSystem === 'zero-point'
                                                        ? "bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_24px_rgba(99,102,241,0.1)]"
                                                        : "bg-white/3 border-white/5 text-white/30 hover:bg-white/5"
                                                )}
                                            >
                                                <span className="text-[12px] font-black uppercase tracking-[0.15em] block mb-1">Zero Point (Dark Space)</span>
                                                <span className="text-[10px] text-white/40 block">High contrast, deep indigo accents, glowing stars on dark backgrounds.</span>
                                            </button>
                                            <button
                                                onClick={() => setDesignSystem('solar')}
                                                className={clsx(
                                                    "text-left p-6 rounded-3xl border transition-all text-left",
                                                    designSystem === 'solar'
                                                        ? "bg-amber-500/10 border-amber-500 text-white shadow-[0_0_24px_rgba(245,158,11,0.1)]"
                                                        : "bg-white/3 border-white/5 text-white/30 hover:bg-white/5"
                                                )}
                                            >
                                                <span className="text-[12px] font-black uppercase tracking-[0.15em] block mb-1">Solar Universe (Bright System)</span>
                                                <span className="text-[10px] text-white/40 block">Organic glow, warm ambient light levels, light-infused modern aesthetic.</span>
                                            </button>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <SectionTitle title="Visual Overlays" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Toggle label="Minimap Navigation" checked={showMinimap} onChange={setShowMinimap} />
                                            <Toggle label="Standard Note Connections" checked={showConnections} onChange={setShowConnections} />
                                            <Toggle label="Smart Labels / Smart Links" checked={showLinks} onChange={(val) => setToggle('showLinks', val)} />
                                            <Toggle label="Parent-Child Hierarchies" checked={showHierarchy} onChange={(val) => setToggle('showHierarchy', val)} />
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <SectionTitle title="Scale & Density Mode" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setScaleMode('compact')}
                                                className={clsx(
                                                    "p-5 rounded-3xl border text-center transition-all text-[11px] font-black uppercase tracking-[0.15em]",
                                                    scaleMode === 'compact' ? "bg-indigo-500/10 border-indigo-500 text-white" : "bg-white/3 border-white/5 text-white/30 hover:bg-white/5"
                                                )}
                                            >
                                                Compact Scale (Default)
                                            </button>
                                            <button
                                                onClick={() => setScaleMode('real')}
                                                className={clsx(
                                                    "p-5 rounded-3xl border text-center transition-all text-[11px] font-black uppercase tracking-[0.15em]",
                                                    scaleMode === 'real' ? "bg-indigo-500/10 border-indigo-500 text-white" : "bg-white/3 border-white/5 text-white/30 hover:bg-white/5"
                                                )}
                                            >
                                                Astronomical / Real Scale
                                            </button>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* INTELLIGENCE TAB */}
                            {activeTab === 'intelligence' && (
                                <div className="space-y-8">
                                    <TabHeader title="Artificial Intelligence" subtitle="Unlock neural mappings, stellar summaries, and automated synthesis." />
                                    
                                    <section className="bg-white/3 border border-white/5 rounded-3xl p-8 space-y-6">
                                        <SectionTitle title="API Key Setup" />
                                        <p className="text-[11px] leading-relaxed text-white/50">
                                            Stardust coordinates with <strong>OpenRouter</strong> to run advanced deep thinking models. Bring your own key (BYOK) to unlock infinite spatial analysis.
                                        </p>
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">OpenRouter API Key</label>
                                            <div className="flex gap-4">
                                                <input
                                                    type="password"
                                                    value={apiKey}
                                                    onChange={(e) => setApiKey(e.target.value)}
                                                    placeholder="sk-or-v1-..."
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                                />
                                                <button
                                                    onClick={handleSaveApiKey}
                                                    disabled={isSavingKey}
                                                    className="px-8 rounded-2xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.15em] hover:bg-indigo-600 transition-colors flex items-center justify-center"
                                                >
                                                    {isSavingKey ? 'Verifying...' : 'Save API Key'}
                                                </button>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="bg-white/3 border border-white/5 rounded-3xl p-8 space-y-4">
                                        <SectionTitle title="Synthesis Engine Model" />
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">Preferred AI Model</label>
                                            <select
                                                value={selectedModel}
                                                onChange={(e) => handleModelChange(e.target.value as AIModelId)}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                            >
                                                {Object.entries(AI_MODELS).map(([id, label]) => (
                                                    <option key={id} value={id} className="bg-[#0A0B14]">{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* PHYSICS TAB */}
                            {activeTab === 'physics' && (
                                <div className="space-y-8">
                                    <TabHeader title="Spatial Physics Settings" subtitle="Configure drift thresholds, black hole attractions, and frame efficiency parameters." />
                                    
                                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <PhysicsToggle
                                            label="N-Body Physics & Drift"
                                            description="Permit active note drifting, springs, and repulsions in Void."
                                            checked={flags.ENABLE_PHYSICS}
                                            onChange={() => togglePhysicsFlag('ENABLE_PHYSICS')}
                                        />
                                        <PhysicsToggle
                                            label="Singularity System"
                                            description="Active gravity suction for black holes. Vital for delete actions."
                                            checked={flags.ENABLE_SINGULARITY}
                                            onChange={() => togglePhysicsFlag('ENABLE_SINGULARITY')}
                                        />
                                        <PhysicsToggle
                                            label="Sleep Optimization"
                                            description="Halt calculations when notes are fully stationary to optimize performance."
                                            checked={flags.ENABLE_SLEEP}
                                            onChange={() => togglePhysicsFlag('ENABLE_SLEEP')}
                                        />
                                        <PhysicsToggle
                                            label="Deterministic Layout Easing"
                                            description="Permit mathematical grid layout snaps to fire smoothly."
                                            checked={flags.ENABLE_LAYOUT}
                                            onChange={() => togglePhysicsFlag('ENABLE_LAYOUT')}
                                        />
                                        <PhysicsToggle
                                            label="Renderer Pipeline"
                                            description="Update visual scales and center coordinates inside the canvas viewport."
                                            checked={flags.ENABLE_RENDER}
                                            onChange={() => togglePhysicsFlag('ENABLE_RENDER')}
                                        />
                                        <PhysicsToggle
                                            label="Particle Accelerator Layer"
                                            description="Display rich particle drift rings and orbital trails (Cosmic aura)."
                                            checked={flags.ENABLE_PARTICLES}
                                            onChange={() => togglePhysicsFlag('ENABLE_PARTICLES')}
                                        />
                                    </section>
                                </div>
                            )}

                            {/* DECAY TAB */}
                            {activeTab === 'decay' && (
                                <div className="space-y-8">
                                    <TabHeader title="Memory Decay engine" subtitle="Allow old notes to slowly dim, fade, and drift to the Event Horizon archive." />
                                    
                                    <section className="bg-white/3 border border-white/5 rounded-3xl p-8 space-y-6">
                                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                            <div>
                                                <SectionTitle title="Decay System Status" />
                                                <p className="text-[10px] text-white/40 mt-1">Halt or resume the automatic temporal fading process.</p>
                                            </div>
                                            <Toggle label="" checked={decayEnabled} onChange={handleDecayToggle} />
                                        </div>

                                        <div className="space-y-6 pt-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="font-bold text-white/70">Grace Period</span>
                                                    <span className="text-indigo-400 font-mono font-bold">{gracePeriodHours} Hours</span>
                                                </div>
                                                <p className="text-[9px] text-white/30">Hours a note stays perfectly bright before beginning its fading process.</p>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="168"
                                                    value={gracePeriodHours}
                                                    onChange={(e) => handleGracePeriodChange(Number(e.target.value))}
                                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="font-bold text-white/70">Decay Fading Rate</span>
                                                    <span className="text-indigo-400 font-mono font-bold">{(decayRate * 100).toFixed(2)}% / min</span>
                                                </div>
                                                <p className="text-[9px] text-white/30">Luminance lost per decay step. Higher equals faster fading.</p>
                                                <input
                                                    type="range"
                                                    min="0.001"
                                                    max="0.05"
                                                    step="0.001"
                                                    value={decayRate}
                                                    onChange={(e) => handleDecayRateChange(Number(e.target.value))}
                                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/5 mt-6">
                                            <button
                                                onClick={() => {
                                                    const state = useStore.getState();
                                                    let updatedCount = 0;
                                                    state.notes.forEach(note => {
                                                        if (note.status !== 'archived' && !note.isDying && !['sun', 'galaxy', 'nebula', 'black-hole'].includes(note.type)) {
                                                            const currentLum = note.luminance ?? 1.0;
                                                            const newLum = Math.max(0, currentLum - 0.15); // Lose 15% luminance
                                                            const patch: any = { luminance: newLum };
                                                            if (newLum <= 0.15) {
                                                                patch.status = 'archived';
                                                                patch.isDying = true;
                                                            }
                                                            state.updateNote(note.id, patch);
                                                            updatedCount++;
                                                        }
                                                    });
                                                    window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: `Simulated decay step on ${updatedCount} notes!`, type: 'info' } }));
                                                }}
                                                className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors"
                                            >
                                                ⚡ Simulate Fading Step (Force Decay)
                                            </button>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* SOUND TAB */}
                            {activeTab === 'sound' && (
                                <div className="space-y-8">
                                    <TabHeader title="Ambient Sound Parameters" subtitle="Adjust deep space synthesizers, clicks, and black hole vortex hum levels." />
                                    
                                    <section className="bg-white/3 border border-white/5 rounded-3xl p-8 space-y-6">
                                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                            <div>
                                                <SectionTitle title="Mute Ambient Effects" />
                                                <p className="text-[10px] text-white/40 mt-1">Completely disable sound generation feedback.</p>
                                            </div>
                                            <Toggle label="" checked={isMuted} onChange={handleMuteToggle} />
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <div className="flex justify-between text-[11px]">
                                                <span className="font-bold text-white/70">Master Sound Volume</span>
                                                <span className="text-indigo-400 font-mono font-bold">{Math.round(volume * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.05"
                                                value={volume}
                                                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* FEEDBACK TAB */}
                            {activeTab === 'feedback' && (
                                <div className="space-y-8">
                                    <TabHeader title="Feedback Customization" subtitle="Configure the destination email and edit survey questions for user reviews." />
                                    
                                    <section className="bg-white/3 border border-white/5 rounded-3xl p-8 space-y-6">
                                        <SectionTitle title="Destination Target" />
                                        <p className="text-[11px] leading-relaxed text-white/50">
                                            Configure where user feedback forms are routed when submitted via email.
                                        </p>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">Target Email Address</label>
                                            <input
                                                type="email"
                                                value={feedbackEmail}
                                                onChange={(e) => setFeedbackEmail(e.target.value)}
                                                placeholder="feedback@stardust.space"
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                            />
                                        </div>
                                    </section>

                                    <section className="bg-white/3 border border-white/5 rounded-3xl p-8 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <SectionTitle title="Survey Questions Editor" />
                                            <button
                                                onClick={() => {
                                                    if (confirm("Reset all survey questions to system defaults?")) {
                                                        setFeedbackQuestions([
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
                                                        ]);
                                                        window.dispatchEvent(new CustomEvent('stardust:toast', { detail: { message: 'Reset to default questions', type: 'info' } }));
                                                    }
                                                }}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors"
                                            >
                                                Reset Defaults
                                            </button>
                                        </div>

                                        <div className="space-y-6 divide-y divide-white/5">
                                            {feedbackQuestions.map((q, idx) => (
                                                <div key={q.key} className={clsx("space-y-4", idx > 0 && "pt-6")}>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-indigo-400">QUESTION {idx + 1} ({q.key})</span>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={q.allowFreeText}
                                                                onChange={(e) => {
                                                                    const updated = feedbackQuestions.map(item => 
                                                                        item.key === q.key ? { ...item, allowFreeText: e.target.checked } : item
                                                                    );
                                                                    setFeedbackQuestions(updated);
                                                                }}
                                                                className="rounded border-white/10 bg-black/40 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                                                            />
                                                            <span className="text-[9px] uppercase tracking-wider text-white/50 select-none">Allow custom text</span>
                                                        </label>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] uppercase tracking-wider text-white/30">Title</label>
                                                            <input
                                                                type="text"
                                                                value={q.title}
                                                                onChange={(e) => {
                                                                    const updated = feedbackQuestions.map(item => 
                                                                        item.key === q.key ? { ...item, title: e.target.value } : item
                                                                    );
                                                                    setFeedbackQuestions(updated);
                                                                }}
                                                                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] uppercase tracking-wider text-white/30">Subtitle</label>
                                                            <input
                                                                type="text"
                                                                value={q.subtitle}
                                                                onChange={(e) => {
                                                                    const updated = feedbackQuestions.map(item => 
                                                                        item.key === q.key ? { ...item, subtitle: e.target.value } : item
                                                                    );
                                                                    setFeedbackQuestions(updated);
                                                                }}
                                                                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] uppercase tracking-wider text-white/30">Options (comma-separated)</label>
                                                        <input
                                                            type="text"
                                                            value={q.options.join(', ')}
                                                            onChange={(e) => {
                                                                const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                                                const updated = feedbackQuestions.map(item => 
                                                                    item.key === q.key ? { ...item, options: opts } : item
                                                                );
                                                                setFeedbackQuestions(updated);
                                                            }}
                                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* DATA MANAGEMENT TAB */}
                            {activeTab === 'data' && (
                                <div className="space-y-8">
                                    <TabHeader title="Database & Operations" subtitle="Perform spatial database dumps, retrieve full backups, and manage local storage." />
                                    
                                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white/3 border border-white/5 rounded-3xl p-8 flex flex-col justify-between h-[300px]">
                                            <div>
                                                <SectionTitle title="Backup & Export" />
                                                <p className="text-[10px] leading-relaxed text-white/40 mt-2">
                                                    Export your spatial mindmap in various formats for local backups, sharing, or publishing.
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2 mt-4">
                                                <button
                                                    onClick={handleExportJSON}
                                                    className="w-full py-2.5 rounded-xl bg-white/5 border border-white/15 text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-colors text-center"
                                                >
                                                    Export Universe (.stardust)
                                                </button>
                                                <button
                                                    onClick={handleExportPNG}
                                                    className="w-full py-2.5 rounded-xl bg-white/5 border border-white/15 text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-colors text-center"
                                                >
                                                    Export Snapshot (.png)
                                                </button>
                                                <button
                                                    onClick={handleExportMarkdown}
                                                    className="w-full py-2.5 rounded-xl bg-[#5046e5]/10 border border-[#5046e5]/40 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:bg-[#5046e5]/20 transition-colors text-center"
                                                >
                                                    Export Markdown (.zip)
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-white/3 border border-white/5 rounded-3xl p-8 flex flex-col justify-between h-[300px]">
                                            <div>
                                                <SectionTitle title="Restore Backup" />
                                                <p className="text-[10px] leading-relaxed text-white/40 mt-2">
                                                    Load a previously saved stardust system mapping backup to overwrite your current canvas coordinates.
                                                </p>
                                            </div>
                                            <label className="w-full py-2.5 rounded-xl bg-[#5046e5]/10 border border-[#5046e5]/40 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:bg-[#5046e5]/20 transition-colors text-center cursor-pointer block mt-4">
                                                Restore Backup File
                                                <input type="file" accept=".stardust,.json" onChange={handleFallbackImport} className="hidden" />
                                            </label>
                                        </div>
                                    </section>

                                    <section className="bg-rose-950/20 border border-rose-500/20 rounded-3xl p-8 space-y-4">
                                        <SectionTitle title="Danger Zone" />
                                        <p className="text-[10px] leading-relaxed text-rose-300/60">
                                            Completely clear your local IndexedDB storage. This will permanently delete all notes, logs, connections, and graveyards. Action cannot be undone.
                                        </p>
                                        <button
                                            onClick={handleClearData}
                                            className="px-8 py-4 rounded-2xl bg-rose-900/35 border border-rose-500/40 text-[10px] font-black uppercase tracking-[0.2em] text-rose-300 hover:bg-rose-900/60 hover:text-white transition-colors"
                                        >
                                            Reset Stardust Database
                                        </button>
                                    </section>
                                </div>
                            )}

                            {/* SHORTCUTS TAB */}
                            {activeTab === 'shortcuts' && (
                                <div className="space-y-8">
                                    <TabHeader title="System Hotkeys" subtitle="Navigate your spatial note board with maximal speed using these keyboard shortcuts." />
                                    
                                    <section className="bg-white/3 border border-white/5 rounded-3xl overflow-hidden">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/5 bg-white/2">
                                                    <th className="p-5 font-black uppercase tracking-widest text-[9px] text-white/40">Action Target</th>
                                                    <th className="p-5 font-black uppercase tracking-widest text-[9px] text-white/40">Command Combination</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                <ShortcutRow action="Switch layout: Free Space" keys={['0']} />
                                                <ShortcutRow action="Switch layout: Void attractor" keys={['1']} />
                                                <ShortcutRow action="Switch layout: Decision Matrix" keys={['2']} />
                                                <ShortcutRow action="Switch layout: Prism lanes" keys={['3']} />
                                                <ShortcutRow action="Switch layout: Orbital priority" keys={['4']} />
                                                <ShortcutRow action="Switch layout: Timeline axis" keys={['5']} />
                                                <ShortcutRow action="Deselect/Close settings & search" keys={['ESC']} />
                                                <ShortcutRow action="Toggle quick fuzzy finder" keys={['Ctrl', 'K']} />
                                                <ShortcutRow action="Toggle system configuration" keys={['Ctrl', ',']} />
                                            </tbody>
                                        </table>
                                    </section>
                                </div>
                            )}

                            {/* ABOUT TAB */}
                            {activeTab === 'about' && (
                                <div className="space-y-8">
                                    <TabHeader title="About Stardust Universe" subtitle="Learn about the design philosophy of the modern spatial canvas." />
                                    
                                    <section className="bg-white/3 border border-white/5 rounded-3xl p-8 space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold text-white">The Spatial Canvas Philosophy</h4>
                                            <p className="text-[11px] leading-relaxed text-white/60">
                                                Stardust was built as a modern spatial memory medium. Standard linear note-taking apps force thoughts into flat boxes. Stardust represents ideas as stars, planets, and moons, organizing them in multi-dimensional views to trace connections and patterns that linear systems obscure.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 text-center">
                                            <div className="bg-black/30 p-5 rounded-2xl border border-white/5">
                                                <span className="text-[10px] text-white/40 block uppercase tracking-wider">Engine Scale</span>
                                                <span className="text-xs font-black text-indigo-400 mt-1 block">Vector QuadTree</span>
                                            </div>
                                            <div className="bg-black/30 p-5 rounded-2xl border border-white/5">
                                                <span className="text-[10px] text-white/40 block uppercase tracking-wider">Local Storage</span>
                                                <span className="text-xs font-black text-indigo-400 mt-1 block">IndexedDB V3</span>
                                            </div>
                                            <div className="bg-black/30 p-5 rounded-2xl border border-white/5">
                                                <span className="text-[10px] text-white/40 block uppercase tracking-wider">Core Framework</span>
                                                <span className="text-xs font-black text-indigo-400 mt-1 block">React / TS</span>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

// Helper Sub-components
const SideTab = ({ label, icon, isActive, onClick }: { label: string; icon: string; isActive: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={clsx(
            "flex items-center gap-4 px-6 py-4 w-full rounded-2xl transition-all duration-300 group text-left",
            isActive
                ? "bg-indigo-500/15 text-indigo-400 shadow-[0_4px_16px_rgba(99,102,241,0.1)] border border-indigo-500/20"
                : "text-white/20 hover:text-white/40 hover:bg-white/5 border border-transparent"
        )}
    >
        <span className={clsx(
            "material-symbols-outlined text-[20px] transition-transform",
            isActive ? "scale-110" : "group-hover:scale-110"
        )}>
            {icon}
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
);

const TabHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="border-b border-white/5 pb-6 mb-8">
        <h2 className="text-lg font-black tracking-wider text-white uppercase">{title}</h2>
        <p className="text-xs text-white/40 leading-relaxed mt-1">{subtitle}</p>
    </div>
);

const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">{title}</h3>
);

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
    <button
        onClick={() => onChange(!checked)}
        className={clsx(
            "flex items-center justify-between p-5 rounded-3xl border transition-all text-left w-full",
            checked
                ? "bg-indigo-500/10 border-indigo-500/30 text-white"
                : "bg-white/3 border-white/5 text-white/30 hover:bg-white/5"
        )}
    >
        <span className="text-[11px] font-black uppercase tracking-[0.15em]">{label}</span>
        <div className={clsx(
            "w-8 h-4 rounded-full relative transition-all duration-500",
            checked ? "bg-indigo-500" : "bg-white/10"
        )}>
            <div className={clsx(
                "absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-500",
                checked ? "translate-x-4" : "translate-x-0"
            )} />
        </div>
    </button>
);

const ViewCard = ({ label, description, active, onClick }: { label: string; description: string; active: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={clsx(
            "text-left flex flex-col p-6 rounded-[28px] border transition-all active:scale-[0.98]",
            active
                ? "bg-indigo-500/20 border-indigo-500 text-white shadow-[0_0_32px_rgba(99,102,241,0.2)]"
                : "bg-white/3 border-white/5 text-white/30 hover:bg-white/5 hover:border-white/10"
        )}
    >
        <div className="flex items-center justify-between w-full mb-2">
            <span className={clsx(
                "text-[11px] font-black uppercase tracking-[0.1em]",
                active ? "text-white" : "text-white/40"
            )}>
                {label}
            </span>
            {active && <span className="material-symbols-outlined text-indigo-400 text-sm">radio_button_checked</span>}
        </div>
        <span className="text-[10px] font-bold opacity-60 leading-relaxed">
            {description}
        </span>
    </button>
);

const PhysicsToggle = ({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) => (
    <button
        onClick={onChange}
        className={clsx(
            "text-left flex flex-col p-6 rounded-3xl border transition-all active:scale-[0.98]",
            checked
                ? "bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_24px_rgba(99,102,241,0.1)]"
                : "bg-white/3 border-white/5 text-white/30 hover:bg-white/5 hover:border-white/10"
        )}
    >
        <div className="flex items-center justify-between w-full mb-2">
            <span className="text-[11px] font-black uppercase tracking-[0.15em]">{label}</span>
            <div className={clsx(
                "w-8 h-4 rounded-full relative transition-all duration-500",
                checked ? "bg-indigo-500" : "bg-white/10"
            )}>
                <div className={clsx(
                    "absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-500",
                    checked ? "translate-x-4" : "translate-x-0"
                )} />
            </div>
        </div>
        <span className="text-[10px] text-white/40 leading-relaxed">{description}</span>
    </button>
);

const ShortcutRow = ({ action, keys }: { action: string; keys: string[] }) => (
    <tr>
        <td className="p-5 text-white/70 font-semibold">{action}</td>
        <td className="p-5">
            <div className="flex gap-2">
                {keys.map((k, i) => (
                    <kbd key={i} className="px-2.5 py-1 rounded bg-white/10 border border-white/10 font-mono text-[10px] text-white/90 shadow-sm uppercase">{k}</kbd>
                ))}
            </div>
        </td>
    </tr>
);

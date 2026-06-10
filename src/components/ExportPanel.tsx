import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { exportToPNG, exportToMarkdownZIP, exportToObsidianVault } from '../utils/exportEngine';

interface ExportPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ isOpen, onClose }) => {
    const notes = useStore((s) => s.notes);
    const connections = useStore((s) => s.connections);
    const [exporting, setExporting] = useState<string | null>(null);

    const handleExport = async (type: 'png' | 'md' | 'obsidian') => {
        setExporting(type);
        try {
            if (type === 'png') {
                // Select viewport container
                const container = document.querySelector('.canvas-viewport-container') as HTMLElement;
                await exportToPNG(container);
            } else if (type === 'md') {
                await exportToMarkdownZIP(notes, connections);
            } else if (type === 'obsidian') {
                await exportToObsidianVault(notes, connections);
            }
            window.dispatchEvent(new CustomEvent('stardust:toast', { 
                detail: { message: `Workspace exported successfully!`, type: 'success' } 
            }));
            onClose();
        } catch (err) {
            console.error('[ExportPanel] Export failed:', err);
            window.dispatchEvent(new CustomEvent('stardust:toast', { 
                detail: { message: 'Export failed, check console for details.', type: 'error' } 
            }));
        } finally {
            setExporting(null);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="relative w-full max-w-xl p-6 rounded-2xl bg-zinc-950/90 border border-white/10 shadow-2xl backdrop-blur-xl pointer-events-auto flex flex-col gap-6"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-indigo-400 text-2xl">download_content</span>
                                <div>
                                    <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Export Workspace</h3>
                                    <p className="text-[10px] text-white/40 mt-0.5">Archive or translate your spatial mind map</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={exporting !== null}
                                className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none cursor-pointer disabled:pointer-events-none disabled:opacity-30"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Options */}
                        <div className="flex flex-col gap-3">
                            {/* Option 1: PNG */}
                            <motion.button
                                onClick={() => handleExport('png')}
                                disabled={exporting !== null}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="group flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all text-left cursor-pointer disabled:pointer-events-none disabled:opacity-40"
                            >
                                <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                                    <span className="material-symbols-outlined text-[24px]">image</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wider">
                                        High-Resolution Image
                                    </h4>
                                    <p className="text-[10px] text-white/40 mt-1 leading-normal">
                                        Capture a pristine PNG snapshot of your complete spatial note canvas, hiding toolbar control widgets.
                                    </p>
                                </div>
                                {exporting === 'png' && (
                                    <div className="size-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin self-center" />
                                )}
                            </motion.button>

                            {/* Option 2: Markdown ZIP */}
                            <motion.button
                                onClick={() => handleExport('md')}
                                disabled={exporting !== null}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="group flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all text-left cursor-pointer disabled:pointer-events-none disabled:opacity-40"
                            >
                                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                                    <span className="material-symbols-outlined text-[24px]">folder_zip</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-wider">
                                        Standard Markdown Archive
                                    </h4>
                                    <p className="text-[10px] text-white/40 mt-1 leading-normal">
                                        Export notes as clean `.md` files bundled inside a ZIP. Includes YAML frontmatter metadata and a backlinks index.
                                    </p>
                                </div>
                                {exporting === 'md' && (
                                    <div className="size-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin self-center" />
                                )}
                            </motion.button>

                            {/* Option 3: Obsidian Vault */}
                            <motion.button
                                onClick={() => handleExport('obsidian')}
                                disabled={exporting !== null}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="group flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.04] transition-all text-left cursor-pointer disabled:pointer-events-none disabled:opacity-40"
                            >
                                <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                                    <span className="material-symbols-outlined text-[24px]">account_tree</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-semibold text-white group-hover:text-purple-400 transition-colors uppercase tracking-wider">
                                        Obsidian Vault with Canvas
                                    </h4>
                                    <p className="text-[10px] text-white/40 mt-1 leading-normal">
                                        Organizes notes into subfolders by status and creates a native `stardust.canvas` file, preserving notes coordinates and connection lines.
                                    </p>
                                </div>
                                {exporting === 'obsidian' && (
                                    <div className="size-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin self-center" />
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

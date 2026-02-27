import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';
import clsx from 'clsx';

export type ToastType = 'success' | 'error' | 'info' | 'ultra';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

export const ToastOverlay: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const handleToast = (e: any) => {
            const { message, type = 'info' } = e.detail;
            const id = Math.random().toString(36).substring(7);
            setToasts((prev) => [...prev, { id, message, type }]);

            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 4000);
        };

        window.addEventListener('stardust:toast', handleToast);
        return () => window.removeEventListener('stardust:toast', handleToast);
    }, []);

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[3000] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }}
                        className={clsx(
                            "px-5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl border backdrop-blur-xl pointer-events-auto",
                            toast.type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                            toast.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-400",
                            toast.type === 'info' && "bg-slate-500/10 border-slate-500/20 text-slate-300",
                            toast.type === 'ultra' && "bg-[#1919e6]/10 border-[#1919e6]/30 text-white"
                        )}
                        style={{ boxShadow: toast.type === 'ultra' ? '0 0 30px rgba(25,25,230,0.2)' : '0 10px 40px rgba(0,0,0,0.3)' }}
                    >
                        <div className="flex-shrink-0">
                            {toast.type === 'success' && <CheckCircle2 size={18} />}
                            {toast.type === 'error' && <AlertCircle size={18} />}
                            {toast.type === 'info' && <Info size={18} />}
                            {toast.type === 'ultra' && <Sparkles size={18} className="text-[#1919e6]" />}
                        </div>
                        <p className="text-sm font-medium tracking-tight">{toast.message}</p>
                        <button
                            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className="ml-2 hover:opacity-60 transition-opacity"
                        >
                            <X size={14} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

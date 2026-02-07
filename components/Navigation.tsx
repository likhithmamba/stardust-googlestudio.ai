import React, { useState } from 'react';
import {
  Search,
  Grid,
  Plus,
  Link as LinkIcon,
  Settings,
  User,
  Compass,
  Layers,
  Download,
  Share,
  HelpCircle,
  Sun,
  Moon,
  Maximize2
} from 'lucide-react';
import useStore from '../hooks/useStore';
import { NoteType } from '../types';

export const TopBar: React.FC = () => {
  const settings = useStore(state => state.settings);
  const setSettings = useStore(state => state.setSettings);
  const setSearchOpen = useStore(state => state.setSearchOpen);

  return (
    <div className="fixed top-0 left-0 right-0 p-6 flex justify-between items-start z-50 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-4">
         <div className="w-10 h-10 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(77,182,172,0.3)]">
            <Compass size={24} />
         </div>
         <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                <span className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">System Status: Active</span>
            </div>
            <h1 className="font-serif-display text-2xl font-bold tracking-tight text-slate-800 dark:text-white leading-none">
                STARDUST
            </h1>
         </div>
      </div>

      <div className="pointer-events-auto flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => setSearchOpen(true)}>
            <Search size={14} className="text-slate-400" />
            <span className="text-xs text-slate-400 font-mono">Search cosmos...</span>
            <span className="ml-4 text-[10px] text-slate-500 font-mono border border-white/10 px-1.5 rounded">⌘K</span>
        </div>

        <button
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400 hover:text-primary"
            onClick={() => setSettings({ theme: settings.theme === 'light' ? 'cosmic' : 'light' })}
            title="Toggle Theme"
        >
            {settings.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-cover bg-center cursor-pointer hover:border-primary transition-colors" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCAxRrpHBkz6JsSnQKgr56DgiHFnltmALm6Q6hcmKJoE8zN4GU4A3cnq8fJ3omfkjbZDbHwsbQT0NzZV4zAQYb58jL3PECXRW6fHlob0FTa5F4eaUCDMlqGnYIzMJ6YFLDlQi9zaPresNFOw3qFwcwLRx5UevoSUN6NYoHAguVvoZd9-QeI5w_1K9lL7E1dpds21BwzCuRevNirH55hiUCQaB9wDPMCj_7S_aP8ah5NruPaM-0-8LA24AMTHRdbrxR1dpZlxuDFFg")' }}></div>
      </div>
    </div>
  );
};

export const BottomBar: React.FC = () => {
  const addNote = useStore(state => state.addNote);
  const settings = useStore(state => state.settings);
  const setSettings = useStore(state => state.setSettings);
  const resetCanvas = useStore(state => state.resetCanvas);

  const [activeTab, setActiveTab] = useState('orbit');

  const handleAddNote = () => {
      // Add a note at the center of the screen (approximate, since we don't have viewport coords here easily without hooking into canvas state more deeply or passing props)
      // Actually, addNote puts it at 0,0 or based on orbital logic.
      addNote({ type: NoteType.Planet });
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="glass-panel px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xl border border-white/10">
        <button
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all group ${activeTab === 'grid' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400'}`}
            onClick={() => setActiveTab('grid')}
        >
            <Grid size={20} className={activeTab === 'grid' ? 'text-primary' : 'group-hover:text-white'} />
            <span className="font-mono text-[8px] uppercase tracking-tighter mt-1">Grid</span>
        </button>

        <button
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all group ${activeTab === 'orbit' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400'}`}
            onClick={() => setActiveTab('orbit')}
        >
            <Layers size={20} className={activeTab === 'orbit' ? 'text-primary' : 'group-hover:text-white'} />
            <span className="font-mono text-[8px] uppercase tracking-tighter mt-1">Orbit</span>
        </button>

        <div className="w-px h-8 bg-white/10 mx-2"></div>

        <button
            className="w-14 h-14 bg-primary text-background-dark rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(77,182,172,0.4)] hover:scale-105 active:scale-95 transition-all mx-2 hover:bg-primary-muted"
            onClick={handleAddNote}
        >
            <Plus size={28} />
        </button>

        <div className="w-px h-8 bg-white/10 mx-2"></div>

        <button
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all group ${settings.showConnections ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400'}`}
            onClick={() => setSettings({ showConnections: !settings.showConnections })}
        >
            <LinkIcon size={20} className={settings.showConnections ? 'text-primary' : 'group-hover:text-white'} />
            <span className="font-mono text-[8px] uppercase tracking-tighter mt-1">Links</span>
        </button>

        <button
            className="flex flex-col items-center justify-center w-14 h-12 rounded-xl hover:bg-white/5 text-slate-400 transition-all group"
            onClick={resetCanvas}
        >
             <Maximize2 size={20} className="group-hover:text-white" />
             <span className="font-mono text-[8px] uppercase tracking-tighter mt-1">Reset</span>
        </button>
      </div>
    </div>
  );
};

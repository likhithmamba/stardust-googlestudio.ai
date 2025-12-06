import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { saveApiKey, getApiKey } from '../utils/ai';

export const SettingsPanel: React.FC = () => {
    const isSettingsOpen = useStore((state) => state.isSettingsOpen);
    const setSettingsOpen = useStore((state) => state.setSettingsOpen);
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (isSettingsOpen) {
            getApiKey('default').then(key => {
                if (key) setApiKey(key);
            });
        }
    }, [isSettingsOpen]);

    const handleSave = async () => {
        await saveApiKey(apiKey, 'default');
        setStatus('Saved!');
        setTimeout(() => setStatus(''), 2000);
    };

    if (!isSettingsOpen) return null;

    return (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-600 p-6 rounded-xl w-96 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Settings</h2>

                <div className="mb-4">
                    <label className="block text-slate-400 text-sm mb-2">Google Gemini API Key</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-blue-500"
                        placeholder="Enter API Key"
                    />
                    <p className="text-xs text-slate-500 mt-1">Stored locally in your browser.</p>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-green-400 text-sm">{status}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSettingsOpen(false)}
                            className="px-4 py-2 text-slate-300 hover:text-white"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

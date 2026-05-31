import React, { useMemo } from 'react';
import { useSettingsStore } from '../../ui/settings/settingsStore';
import { useStore } from '../../store/useStore';
import { Download, X } from 'lucide-react';

export const InvoiceOverlay: React.FC = () => {
    const showInvoiceUniverse = useSettingsStore((state) => state.ultra?.invoiceUniverse);
    const setShowInvoiceUniverse = useSettingsStore((state) => state.setToggle); // Generic toggle
    const notes = useStore((state) => state.notes);

    if (!showInvoiceUniverse) return null;

    // Logic: Roots are Clients. Children are Services/Items.
    // ... (rest of logic unchanged)
    const invoices = useMemo(() => {
        const roots = notes.filter(n => !n.parentId);
        return roots.map(client => {
            const services = notes.filter(n => n.parentId === client.id);
            if (services.length === 0 && !client.value) return null;

            const items = services.map(s => ({
                id: s.id,
                desc: s.title || 'Service',
                cost: s.value || 100
            }));

            if (client.value) {
                items.unshift({ id: client.id, desc: client.title || 'Project', cost: client.value });
            }

            const total = items.reduce((acc, item) => acc + item.cost, 0);

            return {
                client: client.title || 'Unnamed Client',
                items,
                total
            };
        }).filter(i => i !== null);

    }, [notes]);

    return (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-8 overflow-y-auto">
            {/* Close Button - Aggressive Z-Index */}
            <button
                onClick={() => {
                    setShowInvoiceUniverse('ultra.invoiceUniverse', false);
                }}
                className="fixed top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/50 transition-all z-[999] cursor-pointer shadow-lg hover:scale-105 active:scale-95"
            >
                <span className="font-bold text-sm tracking-wider">CLOSE</span>
                <X size={20} />
            </button>

            <div className="w-full max-w-4xl grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {invoices.map((inv, idx) => (
                    <div key={idx} className="bg-white text-black p-6 rounded-sm shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                        <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-2">
                            <h2 className="text-xl font-bold font-mono">{inv!.client}</h2>
                            <span className="text-xs font-mono bg-black text-white px-2 py-1">INVOICE</span>
                        </div>

                        <table className="w-full text-sm font-mono mb-6">
                            <thead>
                                <tr className="text-left border-b border-gray-300">
                                    <th className="pb-2">Item</th>
                                    <th className="pb-2 text-right">Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inv!.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="py-2 border-b border-gray-100">{item.desc}</td>
                                        <td className="py-2 text-right border-b border-gray-100">${item.cost}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold text-lg">
                                    <td className="pt-4">TOTAL</td>
                                    <td className="pt-4 text-right">${inv!.total}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <button className="w-full bg-black text-white py-2 font-bold font-mono hover:bg-gray-800 flex items-center justify-center gap-2">
                            <Download size={16} /> Export PDF
                        </button>
                    </div>
                ))}
            </div>

            {invoices.length === 0 && (
                <div className="text-center text-white/50">
                    <h2 className="text-2xl font-bold mb-2">Invoice Universe Empty</h2>
                    <p>Create hierarchies (Planet = Client, Moons = Services) to generate invoices.</p>
                </div>
            )}
        </div>
    );
};

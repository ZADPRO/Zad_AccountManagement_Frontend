import React, { useState, useEffect } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Database, X, Check } from 'lucide-react'; 
import api from '@/api/api'; 

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: any) => void;
}

const CustomFieldSidebar: React.FC<Props> = ({
    visible,
    onHide,
    onSave,
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fieldLabel: '',
        fieldType: 'text',
        isRequired: false
    });

    useEffect(() => {
        if (visible) {
            setFormData({
                fieldLabel: '',
                fieldType: 'text',
                isRequired: false
            });
        }
    }, [visible]);

    const handleSave = async () => {
        if (!formData.fieldLabel.trim()) return;

        setLoading(true);
        try {
            const payload = {
                fieldLabel: formData.fieldLabel,
                fieldType: formData.fieldType,
                isRequired: formData.isRequired
            };

            const res = await api.post('/custom-fields', payload);

            if (res.data?.status) {
                onSave(res.data);
                onHide();
            }
        } catch (err: any) {
            console.error("Failed to create custom field:", err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const fieldTypes = [
        { label: 'Short Text', value: 'text' },
        { label: 'Number', value: 'number' },
        { label: 'Date Picker', value: 'date' },
        { label: 'True/False (Checkbox)', value: 'boolean' }
    ];

    return (
        <Sidebar
            visible={visible}
            onHide={onHide}
            position="right"
            showCloseIcon={false}
            blockScroll
            className="w-full md:w-[450px] bg-white border-l border-slate-100 shadow-2xl"
        >
            <div className="h-screen flex flex-col bg-white overflow-hidden">
                
                {/* Header */}
                <div className="px-8 py-7 border-b border-slate-50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Database size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-slate-900 leading-tight">
                                New Custom Field
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mt-0.5">
                                Schema Definition
                            </p>
                        </div>
                    </div>

                    <button onClick={onHide} className="p-2.5 text-slate-400 hover:text-slate-900 rounded-xl transition-all">
                        <X size={22} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto px-8 py-8 bg-white space-y-8">
                    
                    {/* Field Label */}
                    <div className="group space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
                            Field Label (Display Name)
                        </label>
                        <InputText
                            value={formData.fieldLabel}
                            onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
                            placeholder="e.g. VAT Number"
                            className="w-full h-14 px-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold transition-all"
                        />
                    </div>

                    {/* Field Type */}
                    <div className="group space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
                            Data Type
                        </label>
                        <Dropdown
                            value={formData.fieldType}
                            options={fieldTypes}
                            onChange={(e) => setFormData({ ...formData, fieldType: e.value })}
                            className="w-full h-14 rounded-2xl border-slate-200 bg-slate-50/50 font-bold flex items-center"
                        />
                    </div>

                   
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-100 flex gap-4 bg-white shadow-2xl">
                    <button onClick={onHide} className="flex-1 h-14 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={loading || !formData.fieldLabel}
                        className="flex-[2] h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/10 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : <><Check size={18} strokeWidth={3} /> Define Field</>}
                    </button>
                </div>
            </div>
        </Sidebar>
    );
};

export default CustomFieldSidebar;
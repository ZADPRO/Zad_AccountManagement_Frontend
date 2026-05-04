import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { 
    Landmark, Plus, Edit2, Trash2, GripVertical, 
    Calendar, Type, MoreVertical, CheckCircle2 
} from 'lucide-react';
import BankDetailsSidebar from '@/components/forms/BankDetails'; 
import CustomFieldSidebar from '@/components/forms/AddFields';
import api from '@/api/api'; 


// Interfaces matching your Go backend logic
interface BankAccount {
    id?: number;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    bankAddress: string;
    accountType: string;
    swiftCode: string;
    qrCodeUrl: string | null;
    userId: number;
    isDefault?: boolean;
}

interface CustomField {
    id: string;
    label: string;
    type: 'Text' | 'Date' | 'Number';
    isRequired: boolean;
    active: boolean;
}

const SettingsPage: React.FC = () => {
    // --- State Management ---
    const [banks, setBanks] = useState<BankAccount[]>([]);
    const [isBankSidebarOpen, setIsBankSidebarOpen] = useState(false);
    const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
    const [loading, setLoading] = useState(false); 
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [isFieldSidebarOpen, setIsFieldSidebarOpen] = useState(false);
    
    useEffect(() => {
        const fetchBanks = async () => {
            setLoading(true);
            try {
                const res = await api.get('/banking/current');
                // Map the slice/array from backend and normalize the ID
                const bankList = (res.data.data || []).map((b: any) => ({
                    ...b,
                    id: b.detailsId // Map backend DetailsID to frontend id
                }));
                setBanks(bankList);
            } catch (err) {
                console.error("Error fetching banks:", err);
            } finally {
                setLoading(false);
            }
        };
        const fetchFields = async () => {
        try {
            const res = await api.get('/custom-fields');
            if (res.data?.status) {
                const fields = (res.data.fields || []).map((f: any) => ({
                    id: f.fieldId,
                    label: f.fieldLabel,
                    type: f.fieldType,
                    isRequired: f.isRequired,
                    active: true 
                }));
                setCustomFields(fields);
            }
        } catch (err) {
            console.error("Error fetching custom fields:", err);
        }
    };
        fetchBanks();
        fetchFields();
    }, []
);
   

const handleSaveBank = (apiResponse: any, formData?: any) => {
    // According to your console log, the data is directly in apiResponse or apiResponse.data
    // structure: { detailsId: 17, message: '...', status: true }
    const responseData = apiResponse.data || apiResponse;
    const bankId = responseData.detailsId || responseData.id;
    if (!bankId) {
        console.error("No ID found, cannot update UI state");
        return;
    }
    setBanks((prev) => {
        // 🔍 Check if this bank already exists in our local state
        const exists = prev.find((b) => b.id === bankId);

        if (exists) {
            // 🔁 UPDATE: Map through and replace the specific bank
            return prev.map((b) =>
                b.id === bankId 
                    ? { ...b, ...responseData, id: bankId } 
                    : b
            );
        }

        // 🆕 CREATE: Add the new bank to the array
        // We ensure 'id' is set to 'detailsId' so the 'exists' check works next time
        const newBankEntry: BankAccount = { 
            ...formData,
            ...responseData,
            id: bankId,
            // If the backend doesn't return the full object on create, 
            // you might need to merge with your local sidebar state, 
            // but usually, the backend returns the created record.
        };

        return [...prev, newBankEntry];
    });
};

    const toggleField = (id: string) => {
        setCustomFields(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
    }; 

    const handleDelete = async (id: number) => {
    // Standard browser confirmation
    if (!window.confirm("Are you sure you want to remove this bank account?")) return;

    try {
        // This matches the backend route: DELETE /banking/:id
        const res = await api.delete(`/banking/${id}`);
        
        if (res.data.status) {
            // Remove from local state so the UI updates instantly
            setBanks(prev => prev.filter(bank => bank.id !== id));
        }
    } catch (err) {
        console.error("Delete request failed:", err);
        alert("Could not delete the bank account. Please try again.");
    }
}; 

const handleSaveField = (apiResponse: any) => {
    const res = apiResponse.data || apiResponse; // ✅ handle both cases

    if (!res?.fieldId) {
        console.error("Invalid response:", res);
        return;
    }

    setCustomFields((prev) => [
        ...prev,
        {
            id: String(res.fieldId),   // 👈 convert to string (important)
            label: res.fieldLabel || "",  // backend doesn't return label
            type: res.fieldType || "Text",
            isRequired: res.isRequired || false,
            active: true
        }
    ]);
};
const handleDeleteField = async (id: string) => {
    if (!window.confirm("Delete this field? Existing invoices won't be affected.")) return;
    try {
        const res = await api.delete(`/custom-fields/${id}`);
        if (res.data.status) {
            setCustomFields(prev => prev.filter(f => f.id !== id));
        }
    } catch (err) {
        console.error("Delete field failed:", err);
    }
};

    return (
        <div className="p-10 max-w-5xl mx-auto bg-slate-50 min-h-screen text-slate-900 font-sans">
            {/* Header Area */}
            <header className="mb-12">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Invoice settings</h1>
                <p className="text-slate-500 font-medium mt-2">Configure your banking details and metadata fields for invoices.</p>
            </header>

            {/* --- Banking Details Section --- */}
            <section className="mb-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-800">Banking details</h2>
                        <p className="text-sm text-slate-400 font-medium">Add multiple accounts for client payments.</p>
                    </div>
                    <Button 
                        label="Add bank account" 
                        icon={<Plus size={18} className="mr-2" />} 
                        onClick={() => { setSelectedBank(null); setIsBankSidebarOpen(true); }}
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                    />
                </div>

                <div className="grid gap-4">
                    {banks.length === 0 ? (
                        <div className="p-12 border-2 border-dashed border-slate-200 rounded-[2rem] text-center bg-white/50">
                            <Landmark size={40} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No accounts linked yet</p>
                        </div>
                    ) : (
                        banks.map((bank, idx) => (
                            <div key={idx} className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-[2rem] hover:border-blue-400 transition-all hover:shadow-lg hover:shadow-blue-500/5">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                        <Landmark size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-slate-900 text-lg">{bank.bankName}</span>
                                            {bank.isDefault && (
                                                <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-tighter rounded-full">
                                                    <CheckCircle2 size={12} /> Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 mt-0.5 tracking-tight">
                                            {bank.accountNumber} • {bank.accountType} • {bank.ifscCode}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                    onClick={() => {
            setSelectedBank(bank); 
            setIsBankSidebarOpen(true);
        }}
                                    className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                        <Edit2 size={18} />
                                    </button>
                                    <button 
                                    onClick={() => {
            // Ensure bank.id exists before calling delete
            if (bank.id) {
                handleDelete(bank.id);
            }
        }}
                                    className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <hr className="border-slate-200 mb-16" />

            {/* Sidebar Component */}
            <BankDetailsSidebar 
                visible={isBankSidebarOpen} 
                onHide={() => {
                setIsBankSidebarOpen(false);
                setSelectedBank(null); // 💡 Crucial: Reset to null so "Add" mode works next time
                }}
                onSave={handleSaveBank}
                loading={loading}
                initialData={selectedBank} // For Edit Mode logic
            /> 

            {/* --- Custom Fields Section --- */}
<section>
    <div className="flex items-center justify-between mb-8">
        <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">Custom invoice fields</h2>
            <p className="text-sm text-slate-400 font-medium">Extra metadata shown on your generated PDF documents.</p>
        </div>
        <Button 
            label="New field" 
            icon={<Plus size={18} className="mr-2" />} 
            onClick={() => setIsFieldSidebarOpen(true)} // Open Sidebar
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
        />
    </div>

    <div className="space-y-3">
        {customFields.length === 0 ? (
             <p className="text-center text-slate-400 py-10 border-2 border-dashed rounded-3xl">No custom fields defined.</p>
        ) : (
            customFields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-[1.5rem]">
                    <div className="flex items-center gap-5">
                        <GripVertical size={20} className="text-slate-300 cursor-grab" />
                        <span className="font-black text-slate-800">{field.label}</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50 px-3 py-1.5 rounded-lg">
                             {field.type}
                        </span>
                        {field.isRequired && (
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-widest">Required</span>
                        )}
                        <div className="flex items-center gap-1 border-l border-slate-100 pl-6 text-slate-300">
                            {/* Pass field.id to delete handler */}
                            <button 
                                onClick={() => handleDeleteField(field.id)}
                                className="p-2 hover:text-rose-600 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            ))
        )}
    </div>
</section>

{/* Add the Custom Field Sidebar component here */}
<CustomFieldSidebar 
    visible={isFieldSidebarOpen}
    onHide={() => setIsFieldSidebarOpen(false)}
    onSave={handleSaveField}
/>
        </div>
    );
};

export default SettingsPage;
import React, { useState, useEffect } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Landmark, X, Check } from 'lucide-react';
import api from '@/api/api'; 

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: any, formData?: any) => void;
    initialData?: any;
    loading?: boolean;
}

const getStoredUserId = () => {
    const id = sessionStorage.getItem('userId');
    return id ? Number(id) : 0;
};

const BankDetailsSidebar: React.FC<Props> = ({
    visible,
    onHide,
    onSave,
    initialData,
   
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        bankAddress: '',
        accountType: 'Savings',
        swiftCode: '',
        qrCodeUrl: '',
        userId: getStoredUserId()
    });

    const isEdit = !!initialData?.detailsId;
        // ✅ Prefill form (EDIT) / Reset form (CREATE)
    useEffect(() => {
        if (initialData) {
            setFormData({
                bankName: initialData.bankName || '',
                accountNumber: initialData.accountNumber || '',
                ifscCode: initialData.ifscCode || '',
                bankAddress: initialData.bankAddress || '',
                accountType: initialData.accountType || 'Savings',
                swiftCode: initialData.swiftCode || '',
                qrCodeUrl: initialData.qrCodeUrl || '',
                userId: initialData.userId || getStoredUserId()
            });
        } else {
            setFormData({
                bankName: '',
                accountNumber: '',
                ifscCode: '',
                bankAddress: '',
                accountType: 'Savings',
                swiftCode: '',
                qrCodeUrl: '',
                userId: getStoredUserId()
            });
        }
    }, [initialData, visible]);

const handleSave = async () => {
    setLoading(true);
    try {
        // Match the Go 'dto.SaveBankingRequest' JSON tags exactly
        const payload = {
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            ifscCode: formData.ifscCode,
            bankAddress: formData.bankAddress,
            accountType: formData.accountType,
            swiftCode: formData.swiftCode,
            qrCodeUrl: formData.qrCodeUrl, // Mapped to LogoURL in Go
            userId: Number(formData.userId)
        };

        // The interceptor will catch this, encrypt it, and add the Bearer token
        let res;

            if (isEdit) {
                // 🔁 UPDATE
                res = await api.put(`/banking/${initialData.detailsId}`, payload);
            } else {
                // 🆕 CREATE
                res = await api.post('/banking', payload);
                
                        }

            if (res.data?.status) {
                onSave(res.data, formData); // 🔥 trigger parent refresh
                onHide();
            }
        if (res && res.data && res.data.status) {
            // PASS THE ENTIRE RESPONSE DATA TO PARENT
            // Your parent handleSaveBank expects the object containing detailsId
            onSave(res.data); 
            onHide();
        } else {
            console.error("API Error: Status was false", res?.data);
        }
    } catch (err: any) {
        // The interceptor also decrypts error messages automatically
        const errorMsg = err.response?.data?.message || err.message || "An error occurred";
        console.error("Save failed:", errorMsg);
    } finally {
        setLoading(false);
    }
};
    const accountTypes = [
        { label: 'Savings Account', value: 'Savings' },
        { label: 'Current Account', value: 'Current' }
    ];

   return (
    <Sidebar
        visible={visible}
        onHide={onHide}
        position="right"
        showCloseIcon={false}
        blockScroll
        className="w-full md:w-[520px] bg-white border-l border-slate-100 shadow-2xl"
        appendTo="self"
    >
        <div className="h-screen flex flex-col bg-white overflow-hidden">
            
            <div className="px-8 py-7 border-b border-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Landmark size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-slate-900 leading-tight">
                            {initialData ? 'Edit Bank Account' : 'Add Bank Account'}
                        </h2>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mt-0.5">
                            Banking Configuration
                        </p>
                    </div>
                </div>

                <button 
                    onClick={onHide}
                    className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-200"
                >
                    <X size={22} />
                </button>
            </div>

            {/* --- SCROLLABLE CONTENT AREA --- */}
            <div className="flex-1 overflow-y-auto px-8  custom-scrollbar min-h-0 bg-white">
                <div className="space-y-7 pb-12">
                    
                    {/* Bank Name Field */}
                    <div className="group space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">
                            Bank Name
                        </label>
                        <InputText
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            placeholder="e.g. JPMorgan Chase"
                            className="w-full h-14 px-5 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all placeholder:text-slate-300 placeholder:font-medium"
                        />
                    </div>

                    {/* Grid Fields */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">
                                Account Type
                            </label>
                            <Dropdown
                                value={formData.accountType}
                                options={accountTypes} 
                                appendTo={document.body}
                                panelClassName="z-[2000]"
                                onChange={(e) => setFormData({ ...formData, accountType: e.value })}
                                className="w-full h-14 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:ring-4 focus:ring-blue-500/10 font-bold flex items-center transition-all"
                            />
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">
                                IFSC Code
                            </label>
                            <InputText
                                value={formData.ifscCode}
                                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                                placeholder="IFSC0001"
                                className="w-full h-14 px-5 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all"
                            />
                        </div>
                    </div>

                    {/* Account Number */}
                    <div className="group space-y-7 z-10">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">
                            Account Number
                        </label>
                        <InputText
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            placeholder="XXXX XXXX XXXX"
                            className="w-full h-14 px-5 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all"
                        />
                    </div>

                    {/* Swift Code */}
                    <div className="group space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">
                            Swift Code <span className="text-slate-300 lowercase font-medium italic">(Optional)</span>
                        </label>
                        <InputText
                            value={formData.swiftCode}
                            onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                            className="w-full h-14 px-5 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all"
                        />
                    </div>

                    {/* Address */}
                    <div className="group space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">
                            Bank Branch Address
                        </label>
                        <InputTextarea
                            value={formData.bankAddress}
                            onChange={(e) => setFormData({ ...formData, bankAddress: e.target.value })}
                            rows={4}
                            className="w-full p-5 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* --- STICKY FOOTER --- */}
            <div className="px-8 py-6 border-t border-slate-100 flex gap-4 shrink-0 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                <button
                    onClick={onHide}
                    className="flex-1 h-14 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
                >
                    Cancel
                </button>

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-[2] h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                        </span>
                    ) : (
                        <><Check size={18} strokeWidth={3} /> Save Account</>
                    )}
                </button>
            </div>
        </div>
    </Sidebar>
);
};

export default BankDetailsSidebar;
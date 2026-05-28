import React, { useState, useEffect } from 'react';
import { X, Shield, Save, Eye, Edit3, Loader2 } from 'lucide-react';
import api from '@/api/api';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => void;
  userId?: number | string;
  mode: 'create' | 'edit' | 'view';
}

const UserModal = ({ isOpen, onClose, onSave, userId, mode }: UserModalProps) => {
  const emptyForm = { 
    userId: '', 
    fullName: '', 
    username: '', 
    email: '', 
    roleId: 2, 
  };
  
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  
  // --- ADDED: Error state to track field-specific messages ---
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- ADDED: Styled Label component for inline errors ---
  const FieldLabel = ({ label, fieldName, required }: { label: string; fieldName: string; required?: boolean }) => (
    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 transition-colors duration-200 ${
      errors[fieldName] ? 'text-rose-600' : 'text-slate-400'
    }`}>
      {label} {required && '*'}
      {errors[fieldName] && (
        <span className="ml-1 lowercase italic font-bold text-rose-500 animate-in fade-in slide-in-from-left-1">
          ({errors[fieldName]})
        </span>
      )}
    </label>
  );

  useEffect(() => {
    const fetchUserData = async () => {
      if (isOpen && userId && mode !== 'create') {
        setLoading(true);
        try {
           
          const res = await api.get(`/users/${userId}`);
          if (res.data.status) {
            const data = res.data.data;
            setFormData({
              userId: data.userId,
              fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
              username: data.username || '',
              email: data.email || '',
              roleId: data.roleId || 2,
            });
          }
        } catch (err: any) {
          console.error("Failed to fetch user for modal:", err.response?.data?.message || err.message);
        } finally {
          setLoading(false);
        }
      } else if (isOpen && mode === 'create') {
        setFormData(emptyForm);
      }
    };

    if (isOpen) {
      setErrors({}); // Reset errors when modal opens
      fetchUserData();
    }
  }, [isOpen, userId, mode]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  
  const inputClass = `w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-900 outline-none transition-all ${
    isViewOnly 
      ? 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-100' 
      : 'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5'
  }`;

  const generateUserCode = (roleId: number) => {
    const prefix = roleId === 1 ? 'ADM' : 'USR';
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${year}-${random}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // --- ADDED: Validation Logic ---
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "required";
    if (!formData.username.trim()) newErrors.username = "required";
    if (!formData.email.trim()) {
        newErrors.email = "required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "invalid email";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const names = formData.fullName.trim().split(' ');
    const payload: any = {
      userId: userId,
      username: formData.username,
      email: formData.email,
      firstName: names[0] || '',
      lastName: names.slice(1).join(' ') || '',
     roleId: Number(formData.roleId)
     };


    if (mode === 'create') {
      payload.userCode = generateUserCode(payload.roleId);
    }

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isViewOnly ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
              {isViewOnly ? <Eye size={20} /> : mode === 'edit' ? <Edit3 size={20} /> : <Shield size={20} />}
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {isViewOnly ? 'User Profile' : mode === 'edit' ? 'Edit User' : 'Create User'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-600 mb-2" />
            <span className="text-slate-400 text-sm font-medium">Loading details...</span>
          </div>
        ) : (
          /* --- CHANGED: Added noValidate to allow custom error handling --- */
          <form className="p-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <FieldLabel label="Full Name" fieldName="fullName" required />
              <input 
                type="text" 
                disabled={isViewOnly} 
                className={`${inputClass} ${errors.fullName ? 'border-rose-500 ring-4 ring-rose-500/5' : ''}`} 
                value={formData.fullName} 
                onChange={e => {
                  setFormData({...formData, fullName: e.target.value});
                  if(errors.fullName) setErrors(prev => ({...prev, fullName: ''}));
                }} 
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <FieldLabel label="Username" fieldName="username" required />
                <input 
                  type="text" 
                  readOnly
                  className={`${inputClass} bg-slate-50 cursor-not-allowed ${errors.username ? 'border-rose-500 ring-4 ring-rose-500/5' : ''}`} 
                  value={formData.username}  
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel label="Role" fieldName="roleId" />
                <select 
                  disabled={isViewOnly} className={inputClass} 
                  value={formData.roleId} 
                  onChange={e => setFormData({...formData, roleId: Number(e.target.value)})}
                >
                  <option value={1}>Admin</option>
                  <option value={2}>Manager</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel label="Email Address" fieldName="email" required />
              <input 
                type="email" 
                readOnly
                className={`${inputClass} bg-slate-50 cursor-not-allowed ${errors.email ? 'border-rose-500 ring-4 ring-rose-500/5' : ''}`} 
                value={formData.email} 
              />
            </div>

            <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-50 mt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">
                Cancel
              </button>
              {!isViewOnly && (
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-600/10 active:scale-95">
                  <Save size={16} /> {mode === 'edit' ? 'Update' : 'Save User'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserModal;
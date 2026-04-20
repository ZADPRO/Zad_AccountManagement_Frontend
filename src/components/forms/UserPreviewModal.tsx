import React, { useState, useEffect } from 'react';
import { X, UserCheck, Loader2, AlertCircle, Shield, Calendar } from 'lucide-react';
import api from '@/api/api';
interface ViewUserProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number | string;
}

const UserPreviewModal = ({ isOpen, onClose, userId }: ViewUserProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
    const fetchDetails = async () => {
      if (!isOpen || !userId) return;
      
      setLoading(true);
      setError(null);
      try {
        // 1. Axios handles the token via the interceptor automatically
        // 2. No need for manual 'Content-Type' or 'Authorization' headers
        const res = await api.get(`/users/${userId}`);

        // 3. Axios puts the response body directly in .data
        // Based on your backend structure: res.data is the full JSON, res.data.data is the user
        if (res.data.status) {
          setData(res.data.data);
        } else {
          throw new Error(res.data.message || "Failed to fetch user data");
        }
      } catch (err: any) {
        // 4. Axios provides detailed error info in err.response
        console.error("User View Fetch Error:", err);
        const errorMessage = err.response?.data?.message || err.message;
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, userId]);


  if (!isOpen) return null;

  // Mapping helper for UserData model (excludes password logic)
  const user = data ? {
    fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'N/A',
    username: data.username || '-',
    userCode: data.userCode || '-',
    role: data.roleId === 1 ? 'Admin' : 'User',
    email: data.email || '-',
    createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A',
    updatedAt: data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : 'N/A',
    createdBy: data.createdBy || 'System',
  } : null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <div className="absolute right-6 top-6 z-10">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 transition-colors">
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="h-80 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
            <p className="text-slate-400 font-medium">Retrieving User Profile...</p>
          </div>
        ) : error ? (
          <div className="h-80 flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-900">Error Loading User</h3>
            <p className="text-slate-500 text-sm mt-2">{error}</p>
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-slate-100 rounded-xl text-slate-600 font-semibold">Close</button>
          </div>
        ) : user ? (
          <div className="flex flex-col p-8 animate-in fade-in zoom-in duration-200 overflow-y-auto">
            {/* Profile Header */}
            <div className="flex flex-col items-center mb-8">
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 mb-4">
                    <UserCheck size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{user.fullName}</h3>
                <p className="text-blue-600 font-mono text-sm font-bold">{user.userCode}</p>
            </div>
            
            <div className="space-y-6">
              {/* Identity Section */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                    <Shield size={12} /> Account Identity
                </h4>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Username</span>
                    <span className="font-bold text-slate-900">@{user.username}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">System Role</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider ${
                        user.role === 'Admin' 
                        ? 'bg-purple-50 text-purple-600 border-purple-100' 
                        : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                        {user.role}
                    </span>
                  </div> 
                  <div className="col-span-2 pt-2 border-t border-slate-200/50">
      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Email Address</span>
      <span className="font-bold text-slate-900 break-all">{user.email}</span>
    </div>
                </div>
              </div>

              {/* Audit/System Section */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                    <Calendar size={12} /> System History
                </h4>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Created On</span>
                    <span className="font-bold text-slate-900">{user.createdAt}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Created By</span>
                    <span className="font-bold text-slate-900">ID: {user.createdBy}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Last Record Update</span>
                    <span className="font-bold text-slate-900">{user.updatedAt}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default UserPreviewModal; 


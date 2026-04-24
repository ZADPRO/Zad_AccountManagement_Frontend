import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import api from '@/api/api';
import { useAuth } from '@/context/AuthContext';

const ChangePassword = () => {
  const { completeFirstLogin, userId } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const rawIdFromStorage = sessionStorage.getItem("userId");
    const numericId = rawIdFromStorage ? Number(rawIdFromStorage) : null; 
    console.log("Sending to Backend:", { userid: numericId, newPassword: newPassword });
    // 1. Frontend Validation
    if (newPassword !== confirmPassword) return setError("Passwords do not match");
    if (!hasMinLength || !hasNumber || !hasUpper) return setError("Requirements not met");

    setIsLoading(true);
    if (!numericId) {
    setError("User session expired. Please login again.");
    navigate("/login", { replace: true });
    return;
    }
    try {
    const response = await api.post("/change-password", { 
  userid: numericId,           
  newPassword: newPassword  
});

    if (response.status === 200) {
      // 🔥 THIS IS THE PART YOU ARE MISSING:
      completeFirstLogin(); // This updates the Context state to 'false'
      
      // OR if you aren't using the helper function yet:
      alert("Success! Redirecting to Dashboard...");
      navigate("/dashboard", { replace: true });  // Now the router will see isFirstLogin is false and let you in
    }
  } catch (err) {
    setError("Failed to update");
  } finally {
  setIsLoading(false); 
}
};

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 w-full max-w-md animate-in fade-in zoom-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Security Update</h2>
          <p className="text-slate-500 text-sm mt-2">Please set a new password for your first login.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 text-[10px] font-black rounded-2xl border border-rose-100 text-center uppercase">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full py-4 px-12 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Lock className="absolute left-4 top-4 text-slate-300" size={18} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-300">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 px-1">
            <RequirementItem label="8+ Characters" met={hasMinLength} />
            <RequirementItem label="Includes Number" met={hasNumber} />
            <RequirementItem label="Uppercase Letter" met={hasUpper} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full py-4 px-12 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Lock className="absolute left-4 top-4 text-slate-300" size={18} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

const RequirementItem = ({ label, met }: { label: string; met: boolean }) => (
  <div className={`flex items-center gap-2 text-[9px] font-bold uppercase ${met ? 'text-emerald-500' : 'text-slate-300'}`}>
    {met ? <CheckCircle2 size={12} /> : <Circle size={12} />}
    {label}
  </div>
);

export default ChangePassword;
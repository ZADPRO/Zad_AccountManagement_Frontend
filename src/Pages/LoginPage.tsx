import React, { useState } from "react";  
import { useNavigate } from 'react-router-dom';
import api from "@/api/api";
import { useAuth } from "@/context/AuthContext"; 


const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); 
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    const response = await api.post('/login', {
      email,
      password
    });

    console.log("📦 Final response (after interceptor):", response.data);

    // ✅ Now data is already decrypted
    const { token, role, isFirstLogin, userId, name, status } = response.data;

    if (!token) throw new Error("Token missing");

    // ✅ Store token
    sessionStorage.setItem("token", token);

    if (status) {
      sessionStorage.setItem("userId", String(userId));
      sessionStorage.setItem("username", name);

      login(role, isFirstLogin, userId);

      if (isFirstLogin) {
        navigate('/change-password', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }

  } catch (err: any) {
    console.error("❌ Login error:", err);
    setError(err.response?.data?.message || "Invalid email or password");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="relative flex flex-col bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-2xl shadow-slate-200/50 w-full max-w-md mx-4">
        
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg rotate-3 hover:rotate-0 transition-transform">
            <span className="text-white text-2xl font-black italic">AM</span>
          </div>
          <h1 className="text-3xl text-slate-900 font-black tracking-tighter">
            AccountManager
          </h1>
          <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] mt-3 font-bold">
            Internal Secure Access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold p-4 rounded-xl text-center uppercase tracking-wider">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-slate-500 text-[10px] uppercase font-black tracking-widest ml-1">
              Work Email
            </label>
            <input
              type="text"
              className="w-full py-4 px-5 text-sm text-slate-900 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-all"
              placeholder="admin@posters.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-slate-500 text-[10px] uppercase font-black tracking-widest ml-1">
              Password
            </label>
            <input
              type="password"
              className="w-full py-4 px-5 text-sm text-slate-900 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-[0.15em] py-5 rounded-2xl shadow-xl transition-all active:scale-[0.97] flex items-center justify-center gap-3 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? "Authenticating..." : "Sign In to System"}
          </button>
        </form>         
      </div>
    </div>
  );
};

export default LoginPage;
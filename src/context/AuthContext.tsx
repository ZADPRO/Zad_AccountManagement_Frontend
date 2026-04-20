import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  userRole: 'Admin' | 'Regular';
  loading: boolean;
  isFirstLogin: boolean;
  // ✅ Matches the 2-argument call from your LoginPage
  login: (role: 'Admin' | 'Regular', isFirstLogin: boolean, userId: number) => void; 
  userId: number | null;
  logout: () => void;
  completeFirstLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'Admin' | 'Regular'>('Regular'); 
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [loading, setLoading] = useState(true); 
  
  const [userId, setUserId] = useState<number | null>(null);
  useEffect(() => {
    // ✅ Using sessionStorage: Persists on reload, clears on tab close
    const storedLogin = sessionStorage.getItem("isLoggedIn") === "true";
    const storedRole = sessionStorage.getItem("role") as 'Admin' | 'Regular' | null;
    const storedFirstLogin = sessionStorage.getItem("isFirstLogin") === "true";
    const storedUserId = sessionStorage.getItem("userId");
    if (storedLogin && storedRole) {
      setIsLoggedIn(true);
      setUserRole(storedRole);
      setIsFirstLogin(storedFirstLogin);
      setUserId(storedUserId ? parseInt(storedUserId, 10) : null);
    }
    setLoading(false);
  }, []);

  const login = (role: 'Admin' | 'Regular', firstLogin: boolean, id:number) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setIsFirstLogin(firstLogin);
    setUserId(id);
    // ✅ Saving to sessionStorage
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("role", role);
    sessionStorage.setItem("isFirstLogin", String(firstLogin));
    sessionStorage.setItem("userId", String(id));
   
    
  };

  const completeFirstLogin = () => {
    setIsFirstLogin(false);
    sessionStorage.setItem("isFirstLogin", "false");
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsFirstLogin(false); 
    setUserId(null);
    sessionStorage.clear(); // ✅ Wipes everything in this tab's session
  };

  return (
    <AuthContext.Provider 
  value={{ 
    isLoggedIn, 
    userRole, 
    loading, 
    isFirstLogin, 
    userId, // 🔥 ADD THIS
    login, 
    logout, 
    completeFirstLogin 
  }}
>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
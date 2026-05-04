import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import React from 'react';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isLoggedIn, isFirstLogin, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // 🔐 Not logged in → go to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // 🔥 FIRST LOGIN CONTROL (prevents loop + misuse)
  if (isFirstLogin && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

export default ProtectedRoute;
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Shell from './components/layout/shell'; 
import RecipientMaster from './Pages/ClientRegistry';
import UserManagement from './Pages/UserManagement';
import NewInvoice from './Pages/NewInvoicePage'; 
 

import LoginPage from './Pages/LoginPage'; 
import PendingInvoices from './Pages/PendingInvoices';
import ChangePassword from './components/forms/ChangePassword'; // ✅ Ensure this is imported 
import Dashboard from './Pages/Dashboard'; 

import SettingsPage from './Pages/SettingsPage';

const AppContent = () => {
  // ✅ Extract isFirstLogin directly from useAuth()
  const { isLoggedIn, isFirstLogin, userRole, loading } = useAuth();

  // 1. Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex min-w-7xl items-center justify-center bg-slate-50 ">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-sm">Loading System...</p>
        </div>
      </div>
    );
  }

  // 2. Not logged in: Only allow access to the Login Page
  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // 3. ✅ THE GATEKEEPER: Logged in but must change password
  // If isFirstLogin is true, they CANNOT see the Shell or Dashboard
  if (isFirstLogin) {
    return (
      <Routes>
        <Route path="/change-password" element={<ChangePassword />} />
        {/* Redirect any attempt to access other pages back to change-password */}
        <Route path="*" element={<Navigate to="/change-password" replace />} />
      </Routes>
    );
  }

  // 4. Fully Logged in: Standard role-based routing with Shell
  return (
    <Routes>
      {/* Root redirect based on role */}
      <Route 
        path="/" 
        element={<Navigate to="/dashboard" replace />} 
      />

      {/* Main Protected Routes wrapped in Shell */}
      <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
      <Route path="/recipient-master" element={<Shell><RecipientMaster /></Shell>} />
      <Route path="/invoices/new" element={<Shell><NewInvoice /></Shell>} />
      <Route path="/invoices/pending" element={<Shell><PendingInvoices /></Shell>} />
      <Route path="/Settings" element={<Shell><SettingsPage /></Shell>} />
      
      
      {/* Admin Only Route */}
      <Route 
        path="/user-management" 
        element={
          userRole === 'Admin' 
            ? <Shell><UserManagement /></Shell>
            : <Navigate to="/recipient-master" replace />
        } 
      />

      {/* Prevent logged-in users from seeing login page */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/change-password" element={<Navigate to="/" replace />} />
      
      {/* Catch-all: Redirect to root if route doesn't exist */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
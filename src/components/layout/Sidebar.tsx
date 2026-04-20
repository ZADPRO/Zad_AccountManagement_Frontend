import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { userRole, logout } = useAuth();

  return (
    <aside className="w-62 h-screen bg-white text-slate-600 flex flex-col border-r border-slate-200 fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-slate-900 font-black text-xl tracking-tighter italic">
          Account<span className="text-blue-600">Manager</span>
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto py-1 space-y-5">
        
        <div>
          
          <nav className="space-y-1 px-4">
            <SidebarItem icon="pi-home" label="Dashboard" to="/dashboard" />
          </nav>
        </div>
 
          <nav className="space-y-1 px-4">
            <SidebarItem icon="pi-plus-circle" label="New Invoice" to="/invoices/new" />
          </nav>
          <nav className="space-y-1 px-4">
            <SidebarItem icon="pi-clock" label="Pending Invoices" to="/invoices/pending" />
          </nav>
        
          <nav className="space-y-1 px-4">
            <SidebarItem icon="pi-users" label="Clients" to="/recipient-master" />
          </nav>
        
        {userRole === 'Admin' && (
          <nav className="space-y-1 px-4">
              <SidebarItem icon="pi-shield" label="User Management" to="/user-management" />
          </nav>
          
        )}
      </div>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={logout} 
          className="flex items-center w-full px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all group"
        >
          <i className="pi pi-sign-out mr-3 group-hover:-translate-x-1 transition-transform"></i>
          Logout
        </button>
      </div>
    </aside>
  );
};

// Refactored SidebarItem to handle PrimeIcons strings
const SidebarItem = ({ icon, label, to }: { icon: string, label: string, to: string }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `
      flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all 
      ${isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
      }
    `}
  >
    <i className={`pi ${icon} mr-3 text-[14px]`}></i> {label}
  </NavLink>
);

export default Sidebar;
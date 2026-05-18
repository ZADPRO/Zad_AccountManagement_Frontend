
import { Avatar } from 'primereact/avatar';
// import { useNavigate } from 'react-router-dom';

const Header = () => {
  // const navigate = useNavigate();
  const username = sessionStorage.getItem('username') || 'Guest User';
  const role = sessionStorage.getItem('role') || 'User';


  return (
    <header className="h-15 bg-white border-b border-slate-200 flex items-center justify-end px-8 sticky top-0 z-50 w-full gap-6">
      
      <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border-2 border-white shadow-sm">
          <Avatar 
          label={username.charAt(0).toUpperCase()} 
          shape="circle" 
          size="large"
          className="bg-primary text-white border-circle"
          style={{ backgroundColor: '#6366F1', color: '#ffffff' }}
        />
        </div>

        <div className="text-left hidden sm:block">
          <p className="text-sm font-black text-slate-900 leading-none">
            {username}
          </p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
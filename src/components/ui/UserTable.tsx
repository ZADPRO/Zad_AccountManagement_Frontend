
interface UserTableProps {
  data: any[];
  onEdit: (user: any, mode: 'edit' | 'view') => void;
  onDelete: (id: number) => void;
}

const UserTable = ({ data, onEdit, onDelete }: UserTableProps) => {

  const getRoleBadge = (roleId: number) => {
    const isAdmin = roleId === 1;
    return (
      <span className={`px-2 py-1 rounded text-[10px] font-black border uppercase tracking-wider ${
        isAdmin 
          ? 'bg-purple-50 text-purple-600 border-purple-100' 
          : 'bg-blue-50 text-blue-600 border-blue-100'
      }`}>
        {isAdmin ? 'Admin' : 'User'}
      </span>
    );
  };

  return (
  <div className="w-full">
    <div className="relative w-full overflow-y-auto max-h-150 rounded-xl border border-slate-100 bg-white custom-scrollbar">
      <table className="w-full text-left border-separate border-spacing-0">
        {/* 4. Made the header STICKY so it doesn't disappear when scrolling */}
        <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
          <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            <th className="px-6 py-5 border-b border-slate-200">User Identity</th>
            <th className="px-6 py-5 border-b border-slate-200">User Code</th>
            <th className="px-6 py-5 border-b border-slate-200">System Role</th>
            <th className="px-6 py-5 border-b border-slate-200 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((user) => (
            <tr key={user.userId} className="hover:bg-slate-50 transition-all group">
              <td className="px-6 py-4">
                <button 
                  onClick={() => onEdit(user, 'view')}
                  className="text-left block hover:translate-x-1 transition-transform group/name"
                >
                  <div className="text-sm font-bold text-slate-900 group-hover/name:text-blue-600 transition-colors">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">
                    @{user.username}
                  </div>
                </button>
              </td>
              <td className="px-6 py-4 text-xs font-mono text-slate-600">
                {user.userCode}
              </td>
              <td className="px-6 py-4">
                {getRoleBadge(user.roleId)}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEdit(user, 'edit')} 
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <i className="pi pi-pencil text-[12px]"></i>
                  </button>
                  <button 
                    onClick={() => onDelete(user)} 
                    className="p-2 text-rose-500/70 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <i className="pi pi-trash text-[12px]"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
};

export default UserTable;
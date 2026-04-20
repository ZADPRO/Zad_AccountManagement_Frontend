import { useAuth } from '@/context/AuthContext';
import { type ClientListModel } from '@/types/clients';

interface TableProps {
  data: ClientListModel[];
  onDelete: (id: number) => void;
  onEdit: (client: ClientListModel, mode: 'edit' | 'view') => void;
  isLoading?: boolean; // optional (nice UX)
}

const Table = ({ data = [], onDelete, onEdit, isLoading = false }: TableProps) => {
const { userRole } = useAuth();

 
  return (
    <div className="w-full h-125 overflow-y-auto custom-scrollbar bg-white">
      <table className="w-full text-left border-separate border-spacing-0">
        
        {/* HEADER */}
        <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
          <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            <th className="px-6 py-5 border-b border-slate-200">Client Info</th>
            <th className="px-6 py-5 border-b border-slate-200">Status</th>
            <th className="px-6 py-5 border-b border-slate-200 font-mono">Client Code</th>
            <th className="px-6 py-5 border-b border-slate-200 text-right">Management</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody className="divide-y divide-slate-100">
          
          {/* 🔄 Loading State */}
          {isLoading ? (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                Loading clients...
              </td>
            </tr>
          ) : data.length === 0 ? (
            
            /* ❌ Empty State */
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic text-sm">
                No clients found.
              </td>
            </tr>

          ) : (
            
            /* ✅ Data Rows */
            data.map((client) => (
              <tr key={client.clientId} className="hover:bg-slate-50 transition-all group">
                
                {/* CLIENT INFO */}
                <td className="px-6 py-4">
                  <button 
                    onClick={() => onEdit(client, 'view')}
                    className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 text-left transition-colors outline-none"
                  >
                    {client.name}
                  </button>

                  <div className="text-[11px] text-slate-400 mt-0.5">
                    <span className="font-medium text-slate-500">
                      {client.businessName || '—'}
                    </span>
                  </div>
                </td>

                {/* STATUS */}
                <td className="px-6 py-4">
                  <span
                    className={`
                      px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider
                      ${
                        client.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }
                    `}
                  >
                    {client.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>

                {/* CLIENT CODE */}
                <td className="px-6 py-4">
                  <div className="text-xs font-mono text-slate-600 bg-slate-50 w-fit px-2 py-1 rounded border border-slate-200">
                    {client.clientCode || 'N/A'}
                  </div>
                </td>
              

                {/* ACTIONS */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">

                    {/* EDIT */}
                    <button 
                      onClick={() => onEdit(client, 'edit')}
                      className="p-2 hover:bg-blue-50 hover:text-blue-600 text-slate-400 rounded-lg transition-all"
                      title="Edit Client"
                    >
                      <i className="pi pi-pencil text-[12px]"></i>
                    </button>

                    {/* DELETE (Admin only) */}
                    {userRole === 'Admin' && (
                      <button 
                        onClick={() => {
                          if (window.confirm(`Delete ${client.name}?`)) {
                            onDelete(client.clientId);
                          }
                        }}
                        className="p-2 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-all"
                        title="Delete Client"
                      >
                        <i className="pi pi-trash text-[12px]"></i>
                      </button>
                    )}

                  </div>
                </td>

              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
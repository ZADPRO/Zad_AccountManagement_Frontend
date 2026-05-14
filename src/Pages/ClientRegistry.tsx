import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
import Table from '../components/ui/ClientTable';
import ClientModal from '../components/forms/ClientModal';
import ClientPreviewModal from '@/components/forms/ClientPreviewModal'; // New Component
// import StatCard from '../components/ui/StatCard';
import { type ClientListModel } from '../types/clients'; 
import api from '@/api/api';
import { Button } from 'primereact/button';
const RecipientMaster = () => {
  // const { userRole } = useAuth();
  const [clients, setClients] = useState<ClientListModel[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Separate States for Two Different UI Elements
  const [isModalOpen, setIsModalOpen] = useState(false); // For Create/Edit
  const [isViewOpen, setIsViewOpen] = useState(false);   // For View Only
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedClient, setSelectedClient] = useState<ClientListModel | null>(null); 
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientListModel | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        // 1. Axios handles the Base URL and Token automatically
        const res = await api.get(`/clients`);
        
        // 2. IMPORTANT: Axios results are in res.data
        // Your backend sends { "clients": [...] }, so we use res.data.clients
        setClients(res.data.clients || []); 
        
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    };
    fetchClients();
  }, [refreshKey]);

  // Unified Handler to decide which UI to open
  const handleAction = (client: ClientListModel | null = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedClient(client);
    if (mode === 'view') {
      setIsViewOpen(true);
      setIsModalOpen(false);
    } else {
      setModalMode(mode as 'create' | 'edit');
      setIsModalOpen(true);
      setIsViewOpen(false);
    }
  };

  const handleCloseAll = () => {
    setIsModalOpen(false);
    setIsViewOpen(false);
    setSelectedClient(null);
  };

const handleSave = async (clientData: any) => {
    const isEdit = modalMode === 'edit';
    const id = clientData.clientId || clientData.clientID;
    
    // 1. Construct only the relative endpoint
    const endpoint = isEdit ? `/clients/${id}` : `/clients`;

    try {
      // 2. Use the 'api' instance
      // Axios methods: .put(url, data) or .post(url, data)
      const res = isEdit 
        ? await api.put(endpoint, clientData) 
        : await api.post(endpoint, clientData);

      // 3. Axios considers 200-299 status codes as successful
      if (res.status === 200 || res.status === 201) {
        setRefreshKey(prev => prev + 1);
        handleCloseAll();
      }
    } catch (err: any) {
      // 4. Enhanced error logging with Axios
      console.error("Save client failed:", err.response?.data?.message || err.message);
    }
  };
const triggerDelete = (client: ClientListModel) => {
  setClientToDelete(client);
  setIsDeleteOpen(true);
}; 
const confirmDeleteAction = async () => {
  if (!clientToDelete) return;

  try {
    const res = await api.delete(`/clients/${clientToDelete.clientId}`, {
      data: { deletedBy: 5 }
    });

    if (res.status === 200 || res.status === 204) {
      setRefreshKey(prev => prev + 1);
      setIsDeleteOpen(false);
      setClientToDelete(null);
    }
  } catch (err: any) {
    console.error("Delete failed:", err.response?.data?.message || err.message);
  }
};

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.clientCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-2 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tighter text-slate-900">Clients</h1>
      </div>

      <div className="flex items-center justify-between gap-4">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clients..."
          className="border p-2.5 rounded-xl w-full max-w-md bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button 
          onClick={() => handleAction(null, 'create')}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={18} /> Add Client
        </button>
      </div>

      <Table
        data={filteredClients}
        onDelete={triggerDelete}
        onEdit={(client, mode) => handleAction(client, mode)}
      />

      {/* COMPONENT 1: The Form (Create/Edit) */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={handleCloseAll}
        onSave={handleSave}
        initialData={selectedClient}
        mode={modalMode}
      />

      {/* COMPONENT 2: The Detailed View */}
      <ClientPreviewModal 
        isOpen={isViewOpen} 
        onClose={handleCloseAll} 
        clientId={selectedClient?.clientId} 
      />
      {isDeleteOpen && (
  <div className="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
    <div className="bg-white border border-slate-200 w-full max-w-sm rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
      <div className="p-8 text-center">
        <div className="mx-auto w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
          <i className="pi pi-exclamation-triangle text-2xl" />
        </div>

        <h3 className="text-xl font-black tracking-tighter text-slate-900 mb-2">
          Confirm Deletion
        </h3>

        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Are you sure you want to delete{" "}
          <span className="font-bold text-slate-700">
            "{clientToDelete?.name}"
          </span>?
        </p>

        <div className="flex gap-3">
          <Button 
            label="Cancel"
            onClick={() => setIsDeleteOpen(false)}
            className="flex-1 p-button-secondary p-button-text font-bold uppercase text-[10px] tracking-widest text-slate-400 border border-slate-200 rounded-2xl h-12"
          />

          <Button 
            label="Delete"
            onClick={confirmDeleteAction}
            className="flex-1 bg-rose-500 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-500/20 border-none rounded-2xl h-12"
          />
        </div>
      </div>
    </div>
  </div>
)}
    </div>  
  );
  
};

export default RecipientMaster;
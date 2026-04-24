import { useState, useEffect } from 'react';
import { Plus, Users, Globe, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Table from '../components/ui/ClientTable';
import ClientModal from '../components/forms/ClientModal';
import ClientPreviewModal from '@/components/forms/ClientPreviewModal'; // New Component
import StatCard from '../components/ui/StatCard';
import { type ClientListModel } from '../types/clients'; 
import api from '@/api/api';

const RecipientMaster = () => {
  const { userRole } = useAuth();
  const [clients, setClients] = useState<ClientListModel[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Separate States for Two Different UI Elements
  const [isModalOpen, setIsModalOpen] = useState(false); // For Create/Edit
  const [isViewOpen, setIsViewOpen] = useState(false);   // For View Only
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedClient, setSelectedClient] = useState<ClientListModel | null>(null);

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
const handleDelete = async (id: number) => {
  if (!window.confirm("Are you sure you want to delete this client?")) return;

  try {
    // 1. Axios DELETE uses a config object as the second argument.
    // The request body must be placed inside the 'data' property.
    const res = await api.delete(`/clients/${id}`, {
      data: {
        deletedBy: 5 
      }
    });

    // 2. Axios throws an error for non-2xx responses, 
    // so if we reach this line, the request was successful.
    if (res.status === 200 || res.status === 204) {
      console.log("Client deleted");
      
      // Don't forget to trigger a refresh so the client disappears from your list
      setRefreshKey(prev => prev + 1);
    }

  } catch (err: any) {
    // 3. Axios captures the backend error message automatically
    const errorMsg = err.response?.data?.message || "Delete error";
    console.error("Delete failed:", errorMsg);
    alert(errorMsg); 
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

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={clients.length} icon={<Users />} />
        <StatCard label="Active" value={clients.filter(c => c.isActive).length} icon={<ShieldCheck />} />
        
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
        onDelete={handleDelete}
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
    </div>
  );
};

export default RecipientMaster;
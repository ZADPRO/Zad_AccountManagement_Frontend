import { useState, useEffect } from 'react';
import { FileText, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import InvoiceListTable from '@/components/ui/invoiceTable';
import api from '@/api/api';

// Define a type for your Invoices
export interface InvoiceListModel {
  id: number;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'overdue' | 'paid';
}

const PendingInvoices = () => {
  useAuth();
  const [invoices, setInvoices] = useState<InvoiceListModel[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // UI State management
  const [, setIsModalOpen] = useState(false);
  const [, setIsViewOpen] = useState(false);
  const [, setModalMode] = useState<'create' | 'edit'>('create');
  const [, setSelectedInvoice] = useState<InvoiceListModel | null>(null);

  // Fetch Invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const token = sessionStorage.getItem('token');
        const res = await api.get('/invoices');
        
        
        // 1. Access the 'data' key from your backend
        const rawData = res.data.data || [];

        // 2. Map the lowercase backend keys to your frontend model
        const mappedInvoices: InvoiceListModel[] = rawData.map((inv: any) => ({
          id: inv.invoiceid,
          invoiceNumber: inv.invoicenumber,
          clientName: inv.clientname,
          amount: Number(inv.grandtotal || 0),
          dueDate: inv.invoicedate,
          status: inv.paymentstatus
        }));

        setInvoices(mappedInvoices);
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoices();
  }, [refreshKey]); 

  

  const handleAction = (invoice: InvoiceListModel | null = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedInvoice(invoice);
    if (mode === 'view') {
      setIsViewOpen(true);
      setIsModalOpen(false);
    } else {
      setModalMode(mode as 'create' | 'edit');
      setIsModalOpen(true);
      setIsViewOpen(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Void this invoice? This action cannot be undone.")) return;
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/v1/invoices/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Calculations ---
  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  
  // Overdue check (Comparing only dates without time)
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = invoices.filter(inv => inv.dueDate < today && inv.status !== 'paid').length;

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pending Invoices</h1>
          <p className="text-slate-500 text-sm font-medium">Manage and track your outstanding payments</p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
            label="Outstanding Amount" 
            value={`₹${totalAmount.toLocaleString('en-IN')}`} 
            icon={<FileText className="text-blue-600" />} 
        />
        <StatCard 
            label="Pending Invoices" 
            value={invoices.length} 
            icon={<Clock className="text-amber-500" />} 
        />
        <StatCard 
            label="Overdue" 
            value={overdueCount} 
            icon={<AlertCircle className="text-rose-500" />} 
        />
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-md">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client or invoice #..."
            className="w-full border border-slate-200 p-3 pl-4 rounded-2xl bg-white shadow-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* Invoice Table Container */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-400 font-medium">Fetching invoices...</p>
          </div>
        ) : (
          <InvoiceListTable
            data={filteredInvoices}
            onView={(inv) => handleAction(inv, 'view')}
            onEdit={(inv) => handleAction(inv, 'edit')}
            onDelete={handleDelete}
          />
        )}
      </div>

     
    </div>
  );
};

export default PendingInvoices;
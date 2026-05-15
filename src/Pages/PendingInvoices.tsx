import { useState, useEffect } from 'react';
import { FileText, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import InvoiceListTable from '@/components/ui/invoiceTable';
import InvoicePrint  from '@/Pages/PrintInvoice';
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
 
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  
  
  // Fetch Invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        // const token = sessionStorage.getItem('token');
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

  

const handleView = (invoice: InvoiceListModel) => {
  setSelectedInvoiceId(invoice.id);
  setIsPrintMode(false);
  setIsViewOpen(true);
};
const handlePrint = (invoice: InvoiceListModel) => {
  setSelectedInvoiceId(invoice.id);
  setIsPrintMode(true);
  setIsViewOpen(true);
};

const handleDelete = async (id: number) => {

  const confirmed = window.confirm(
    "Void this invoice? This action cannot be undone."
  );

  if (!confirmed) return;

  try {
    const token = sessionStorage.getItem("token");

    const res = await api.delete(`/invoices/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // ✅ Success
    alert(
      res.data?.message ||
      "Invoice deleted successfully"
    );

    // ✅ Refresh invoice list
    setRefreshKey((prev) => prev + 1);

  } catch (err: any) {

    console.error("Delete failed:", err);

    alert(
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      "Failed to delete invoice"
    );
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
    <div className="p-3 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pending Invoices</h1>
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
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-4">
        <div className="relative w-full max-w-md h-12">
          <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client or invoice #..."
          className="w-full h-full pl-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-blue-500 transition-all"
          />
        </div>
      </div>

        
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <InvoiceListTable
            data={filteredInvoices}
            onView={handleView}
            onPrint={handlePrint}
            onDelete={handleDelete}
          />
        )}


      {/* ✅ MODAL */}
     {isViewOpen && selectedInvoiceId && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white \w-[900px]\ max-h-[90vh] overflow-y-auto rounded-xl shadow-xl p-4 relative">

      {/* Close Button */}
      <button
        onClick={() => setIsViewOpen(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
      >
        ✕
      </button>

      {/* 👇 THIS IS THE IMPORTANT PART */}
      <InvoicePrint 
        invoiceId={selectedInvoiceId} 
        autoPrint={isPrintMode}   // NEW PROP
      />

    </div>
  </div>
)}
    </div>
  );
};

export default PendingInvoices;
import { useState, useEffect } from 'react';
import { FileText, Clock, AlertCircle, AlertTriangle, X } from 'lucide-react'; // ✅ ADDED AlertTriangle & X
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
  
  // ✅ NEW: Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);
  
  // Fetch Invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/invoices');
        
        const rawData = res.data.data || [];

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

  // ✅ 1. OPENS THE MODAL (Instead of native confirm)
  const handleDelete = (id: number) => {
    setInvoiceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // ✅ 2. ACTUALLY EXECUTES THE DELETE WHEN "YES" IS CLICKED
  const confirmDelete = async () => {
    if (!invoiceToDelete) return;

    try {
      const token = sessionStorage.getItem("token");

      await api.delete(`/invoices/${invoiceToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Refresh invoice list and close modal
      setRefreshKey((prev) => prev + 1);
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);

    } catch (err: any) {
      console.error("Delete failed:", err);
      alert(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to delete invoice"
      );
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
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


      {/* PRINT/VIEW MODAL */}
      {isViewOpen && selectedInvoiceId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white \w-[900px]\ max-h-[90vh] overflow-y-auto rounded-xl shadow-xl p-4 relative">
            <button
              onClick={() => setIsViewOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
            >
              ✕
            </button>
            <InvoicePrint 
              invoiceId={selectedInvoiceId} 
              autoPrint={isPrintMode} 
            />
          </div>
        </div>
      )}

      {/* ✅ NEW: CUSTOM DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4">
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Delete Confirmation</h3>
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setInvoiceToDelete(null);
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex items-start gap-4">
              <AlertTriangle className="text-slate-600 shrink-0 mt-0.5" size={24} />
              <p className="text-slate-600 text-[15px] leading-relaxed">
                Void this invoice? This action cannot be undone.
              </p>
            </div>

            {/* Footer */}
            <div className="p-5 flex justify-end gap-3 bg-white">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setInvoiceToDelete(null);
                }}
                className="px-6 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                No
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors shadow-sm shadow-rose-200"
              >
                Yes
              </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
};

export default PendingInvoices;
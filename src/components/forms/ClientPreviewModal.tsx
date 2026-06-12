import  { useState, useEffect } from 'react';
import { X,  Loader2, AlertCircle, Building2, MapPin, ReceiptIndianRupee } from 'lucide-react';
import api from '@/api/api';
// import api from '../../api/apitest';

interface ViewClientProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: number | string;
}

const ClientPreviewModal = ({ isOpen, onClose, clientId }: ViewClientProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!isOpen || !clientId) return;
      
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/clients/${clientId}`);
        if (res.data?.status) {
          setData(res.data.data);
        } else {
          throw new Error(res.data?.message || "Failed to fetch data");
        }
      } catch (err: any) {
        console.error("View Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, clientId]);

  if (!isOpen) return null;

  // Mapping helper to include Billing, Tax %, and Export Status
  const client = data ? {
    name: data.name || data.businessName || '-',
    clientCode: data.clientCode || data.clientcode || '-',
    clienttype: data.clienttype || data.clientType || 'Standard',
    billingCountryName: data.billingCountryName || '-', // Add this
    billingStateName: data.billingStateName || '-',
    mobilenumber: data.mobilenumber || data.mobileNumber || '-',
    email: data.email || '-',
    // Registered Address
    registeredAddress: data.registeredAddress || '-',
    countryName: data.countryName || 'India',
    stateName: data.stateName || '-',
    zip: data.zip || '-',
    // Billing & New Fields
    billingAddress: data.billingAddress || '-',
    taxPercentage: data.taxPercentage ?? 0,
    isExport: data.isExport || data.isexport || false,
    // Tax Info
    
    gstnumber: data.gstnumber || data.gstNumber || '-',
    pan: data.pan || '-'
  } : null;

  const isIndia = client?.countryName?.toLowerCase() === 'india';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Client Profile</h3>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">ID: {client?.clientCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 transition-colors">
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
            <p className="text-slate-400 font-medium">Fetching Record...</p>
          </div>
        ) : error ? (
          <div className="h-96 flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-900">Error</h3>
            <p className="text-slate-500 text-sm mt-2">{error}</p>
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-slate-100 rounded-xl text-slate-600 font-semibold">Close</button>
          </div>
        ) : client ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            {/* Quick Status Badges */}
            <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${client.isExport ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                   {client.isExport ? 'Export Client' : 'Domestic Client'}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border bg-slate-50 text-slate-600 border-slate-100">
                   {client.clienttype}
                </span>
            </div>

            {/* Section: Core Business */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Business Name</label>
                <p className="text-base font-bold text-slate-900">{client.name}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                <p className="text-sm font-semibold text-slate-700">{client.email}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Contact Number</label>
                <p className="text-sm font-semibold text-slate-700">{client.mobilenumber}</p>
              </div>
            </div>

            {/* Section: Addresses */}
            <div className="space-y-4">
               <h4 className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-widest">
                  <MapPin size={14} className="text-blue-500" /> Location Details
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-100 bg-white">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Registered Address</label>
                    <p className="text-sm text-slate-700 font-medium mb-3">{client.registeredAddress}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-slate-50">
                        <div><span className="text-[10px] text-slate-400 mr-1">Country:</span> <span className="text-xs font-bold">{client.countryName}</span></div>
                        {isIndia && (
                          <>
                            <div><span className="text-[10px] text-slate-400 mr-1">State:</span> <span className="text-xs font-bold">{client.stateName}</span></div>
                            <div><span className="text-[10px] text-slate-400 mr-1">Zip:</span> <span className="text-xs font-bold">{client.zip}</span></div>
                          </>
                        )}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 bg-white">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Billing Address</label>
                    <p className="text-sm text-slate-700 font-medium">{client.billingAddress}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-slate-50">
    <div>
      <span className="text-[10px] text-slate-400 mr-1">Country:</span> 
      <span className="text-xs font-bold">{client.billingCountryName}</span>
    </div>
    {/* Only show state if it's provided or if country is India */}
    {client.billingStateName !== '-' && (
      <div>
        <span className="text-[10px] text-slate-400 mr-1">State:</span> 
        <span className="text-xs font-bold">{client.billingStateName}</span>
      </div>
    )}
  </div>
                  </div>
               </div>
            </div>

            {/* Section: Tax & Financial */}
            <div className="space-y-4">
               <h4 className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-widest">
                  <ReceiptIndianRupee size={14} className="text-emerald-500" /> Tax & Financials
               </h4>
               <div className="grid grid-cols-3 gap-4">
                  
                  <div className="bg-slate-50 p-4 rounded-2xl col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">GST Number</label>
                    <p className="text-sm font-mono font-bold text-blue-600">{client.gstnumber}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">PAN / Tax ID</label>
                    <p className="text-sm font-bold text-slate-900 uppercase">{client.pan}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl">
                    <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">Tax Rate</label>
                    <p className="text-lg font-black text-emerald-700">{client.taxPercentage}%</p>
                  </div>
                  
               </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="p-6 border-t border-slate-50 bg-slate-50/30">
          <button 
            onClick={onClose} 
            className="w-full px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            Close Record
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientPreviewModal;
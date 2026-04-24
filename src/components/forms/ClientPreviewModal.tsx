import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import api from '@/api/apitest';

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
        const token = sessionStorage.getItem('token');
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

  // Mapping helper to handle your specific backend vs frontend key naming
  const client = data ? {
    name: data.name || data.businessName || '-',
    clientCode: data.clientCode || data.clientcode || '-',
    clienttype: data.clienttype || data.clientType || 'Standard',
    mobilenumber: data.mobilenumber || data.mobileNumber || '-',
    email: data.email || '-',
    registeredAddress: data.registeredAddress || data.address || data.registeredaddress || '-',
    countryName: data.countryName || data.country || 'India',
    stateName: data.stateName || data.state || '-',
    zip: data.zip || '-',
    gststatus: data.gststatus || data.gstStatus || 'Registered',
    gstnumber: data.gstnumber || data.gstNumber || '-',
    pan: data.pan || '-'
  } : null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[95vh]">
        
        {/* Close Header */}
        <div className="absolute right-6 top-6 z-10">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
            <p className="text-slate-400 font-medium">Loading Database Record...</p>
          </div>
        ) : error ? (
          <div className="h-96 flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-900">Unable to load client</h3>
            <p className="text-slate-500 text-sm mt-2">{error}</p>
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-slate-100 rounded-xl text-slate-600 font-semibold">Close</button>
          </div>
        ) : client ? (
          <div className="flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-200 overflow-y-auto">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600 mb-4">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Client Details</h3>
            <p className="text-slate-500 mb-8 text-center text-sm">Full record from database.</p>
            
            <div className="w-full bg-slate-50 rounded-2xl p-6 space-y-6 mb-8">
              {/* Business Info */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">Business Info</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-400">Business Name:</span> <span className="font-semibold block text-slate-900">{client.name}</span></div>
                  <div><span className="text-slate-400">Client Code:</span> <span className="font-semibold block text-slate-900">{client.clientCode}</span></div>
                  <div><span className="text-slate-400">Client Type:</span> <span className="font-semibold block text-slate-900">{client.clienttype}</span></div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">Contact Info</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-400">Mobile:</span> <span className="font-semibold block text-slate-900">{client.mobilenumber}</span></div>
                  <div><span className="text-slate-400">Email:</span> <span className="font-semibold block text-slate-900">{client.email}</span></div>
                </div>
              </div>

              {/* Address Info */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">Address Info</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2"><span className="text-slate-400">Address:</span> <div className="font-semibold text-slate-900">{client.registeredAddress}</div></div>
                  <div><span className="text-slate-400">Country:</span> <span className="font-semibold block text-slate-900">{client.countryName}</span></div>
                  <div><span className="text-slate-400">State:</span> <span className="font-semibold block text-slate-900">{client.stateName}</span></div>
                  <div><span className="text-slate-400">Zip:</span> <span className="font-semibold block text-slate-900">{client.zip}</span></div>
                </div>
              </div>

              {/* Tax Info */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">Tax Info</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-400">GST Status:</span> <span className="font-semibold block text-slate-900">{client.gststatus}</span></div>
                  <div><span className="text-slate-400">GST Number:</span> <span className="font-semibold uppercase block text-slate-900">{client.gstnumber}</span></div>
                  <div><span className="text-slate-400">PAN:</span> <span className="font-semibold uppercase block text-slate-900">{client.pan}</span></div>
                </div>
              </div>
            </div>

            <div className="w-full max-w-md">
              <button 
                onClick={onClose} 
                className="w-full px-6 py-4 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                Done Reading
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ClientPreviewModal;
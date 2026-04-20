import { User, Calendar, Hash } from 'lucide-react';

interface InvoiceHeaderProps {
  clients: any[];
  selectedClientId: string;
  onClientChange: (id: string) => void;
  invoiceNumber: string;
  invoiceDate: string;
  onDateChange: (date: string) => void;
}

const InvoiceHeader = ({ 
  clients, 
  selectedClientId, 
  onClientChange, 
  invoiceNumber, 
  invoiceDate, 
  onDateChange 
}: InvoiceHeaderProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Client Selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
          <User size={12} strokeWidth={3} className="text-blue-600" /> Billed To
        </label>
        {/* Swapped dark bg for bg-white and added a subtle border shadow */}
        <select 
          value={selectedClientId}
          onChange={(e) => onClientChange(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer shadow-sm"
        >
          <option value="">Select a Client...</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </div>

      {/* Invoice Number (Read Only) */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
          <Hash size={12} strokeWidth={3} className="text-blue-600" /> Invoice Number
        </label>
        {/* Swapped dark background for a very light slate tint to show it's read-only */}
        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-sm text-slate-900 font-mono font-bold">
          {invoiceNumber}
        </div>
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
          <Calendar size={12} strokeWidth={3} className="text-blue-600" /> Date of Issue
        </label>
        {/* Removed invert filter and swapped for clean light mode styling */}
        <input 
          type="date" 
          value={invoiceDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer shadow-sm"
        />
      </div>
    </div>
  );
};

export default InvoiceHeader;
import { User, Calendar,  Landmark, FileCheck } from 'lucide-react';
// import { useState } from "react";

interface InvoiceHeaderProps {
  clients: any[];
  selectedClientId: string;
  onClientChange: (id: string) => void;
  // Bank Props
  banks: any[]; // Data from your bank API
  selectedBankId: string;
  onBankChange: (id: string) => void;
  // Invoice Details
  invoiceNumber: string;
  invoiceDate: string;
  onDateChange: (date: string) => void;
  invoiceDueDate: string;
  onDueDateChange: (date: string) => void;
  invoiceType: string;
  onInvoiceTypeChange: (type: string) => void;
}

const InvoiceHeader = ({
  clients,
  selectedClientId,
  onClientChange,
  banks,
  selectedBankId,
  onBankChange,
  // invoiceNumber,
  invoiceDate,
  onDateChange,
  invoiceDueDate,
  onDueDateChange,
  invoiceType,
  onInvoiceTypeChange,
}: InvoiceHeaderProps) => {
  return (
    /* Changed to grid-cols-2 on medium and grid-cols-3 on large for better spacing with 5+ fields */
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      
      {/* 1. Client Selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
          <User size={12} strokeWidth={3} className="text-blue-600" /> Billed To
        </label>
        <select
  value={selectedClientId}
  onChange={(e) => onClientChange(e.target.value)}
  className="w-full bg-white border border-slate-500 rounded-2xl p-3.5 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer shadow-sm"
>
  <option value="">Select a Client...</option>
  {clients.map((client) => (
    // Use client.clientId if that's what your Go backend returns
    <option key={client.clientId || client.id} value={client.clientId || client.id}>
      {client.name}
    </option>
  ))}
</select>
      </div>

      {/* 2. Bank Selection (Connected to Backend API via Props) */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
          <Landmark size={12} strokeWidth={3} className="text-blue-600" /> Settlement Bank
        </label>
        <select
  value={selectedBankId}
  onChange={(e) => onBankChange(e.target.value)}
 className="w-full bg-white border border-slate-500 rounded-2xl p-3.5 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer shadow-sm"
>
  <option value="">Select Bank Account...</option>
  {banks.map((bank) => (
    // Use bank.id (normalized from detailsId) or fallback to bank.detailsId
    <option key={bank.id || bank.detailsId} value={bank.id || bank.detailsId}>
      {bank.bankName} - {bank.accountNumber?.slice(-4)}
    </option>
  ))}
</select>
      </div>

      {/* 3. Invoice Type Selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
          <FileCheck size={12} strokeWidth={3} className="text-blue-600" /> Invoice Type
        </label>
        <select
          value={invoiceType}
          onChange={(e) => onInvoiceTypeChange(e.target.value)}
          className="w-full bg-white border border-slate-500 rounded-2xl p-3.5 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer shadow-sm"
        >
          <option value="invoice">Tax Invoice</option>
          <option value="proforma">Proforma Invoice</option>
        </select>
      </div>
    
      {/* 4. Date of Issue */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
          <Calendar size={12} strokeWidth={3} className="text-blue-600" /> Date of Issue
        </label>
        <input
          type="date"
          value={invoiceDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full bg-white border border-slate-500 rounded-2xl p-3.5 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer shadow-sm"
        />
      </div>

      {/* 5. Due Date */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
          <Calendar size={12} strokeWidth={3} className="text-blue-600" /> Due Date
        </label>
        <input
          type="date"
          value={invoiceDueDate}
          onChange={(e) => onDueDateChange(e.target.value)}
          className="w-full bg-white border border-slate-500 rounded-2xl p-3.5 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer shadow-sm"
        />
      </div>

    </div>
  );
};

export default InvoiceHeader;
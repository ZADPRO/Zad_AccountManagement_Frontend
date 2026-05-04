import React from 'react';
import { Eye, FileText, Calendar } from 'lucide-react';
import { type InvoiceListModel } from '@/Pages/PendingInvoices';

interface Props {
  data: InvoiceListModel[];
  onView: (invoice: InvoiceListModel) => void;
  onPrint: (invoice: InvoiceListModel) => void;
  onDelete: (id: number) => void;
}

const InvoiceListTable = ({ data, onView, onPrint, onDelete }: Props) => {

  // ✅ Status Badge
  const getStatusBadge = (status: string) => {
    const base = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ";

    switch (status.toLowerCase()) {
      case 'paid':
        return <span className={`${base} bg-emerald-50 text-emerald-600 border-emerald-100`}>Paid</span>;
      case 'overdue':
        return <span className={`${base} bg-rose-50 text-rose-600 border-rose-100`}>Overdue</span>;
      default:
        return <span className={`${base} bg-amber-50 text-amber-600 border-amber-100`}>Pending</span>;
    }
  };

  return (
    <div className="w-full">

      {/* Table */}
      <table className="w-full text-left border-collapse">

        {/* Header */}
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Invoice / ID</th>
            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Client</th>
            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Due Date</th>
            <th className="py-4 px-6 text-right"></th>
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-slate-50">
          {data.map((invoice) => (
            <tr
              key={invoice.id}
              className="group hover:bg-blue-50/30 transition-all"
            >

              {/* Invoice */}
              <td className="py-5 px-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-slate-100 rounded-lg shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      {invoice.invoiceNumber}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      ID: {invoice.id}
                    </div>
                  </div>
                </div>
              </td>

              {/* Client */}
              <td className="py-5 px-6">
                <div className="text-sm font-bold text-slate-700">
                  {invoice.clientName}
                </div>
              </td>

              {/* Amount */}
              <td className="py-5 px-6">
                <div className="flex items-center gap-1 text-sm font-black text-slate-900">
                  <span className="text-xs text-slate-400">₹</span>
                  {invoice.amount.toLocaleString('en-IN')}
                </div>
              </td>

              {/* Status */}
              <td className="py-5 px-6">
                {getStatusBadge(invoice.status)}
              </td>

              {/* Due Date */}
              <td className="py-5 px-6">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                  <Calendar size={12} className="text-slate-300" />
                  {new Date(invoice.dueDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short'
                  })}
                </div>
              </td>

              {/* Actions */}
              <td className="py-5 px-6">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">

                  {/* View */}
                  <button
                    onClick={() => onView(invoice)}
                    className="p-2 hover:bg-white hover:shadow-md text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                    title="View"
                  >
                    <Eye size={16} />
                  </button>

                  {/* Print */}
                  <button
                    onClick={() => onPrint(invoice)}
                    className="p-2 hover:bg-white hover:shadow-md text-slate-400 hover:text-green-600 rounded-xl transition-all"
                    title="Print"
                  >
                    🖨️
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDelete(invoice.id)}
                    className="p-2 hover:bg-white hover:shadow-md text-slate-400 hover:text-red-600 rounded-xl transition-all"
                    title="Delete"
                  >
                    🗑️
                  </button>

                </div>
              </td>

            </tr>
          ))}
        </tbody>
      </table>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="py-32 text-center">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-slate-300" size={32} />
          </div>
          <h3 className="text-slate-900 font-bold">No Invoices Found</h3>
          <p className="text-slate-500 text-sm">
            No pending invoices match your current search.
          </p>
        </div>
      )}

    </div>
  );
};

export default InvoiceListTable;
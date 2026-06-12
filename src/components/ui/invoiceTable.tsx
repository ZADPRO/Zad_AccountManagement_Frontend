// import React from 'react';
import {
  Eye,
  FileText,
  Calendar,
  Pencil
} from 'lucide-react';
import { type InvoiceListModel } from '@/Pages/PendingInvoices';

interface Props {
  data: InvoiceListModel[];
  onView: (invoice: InvoiceListModel) => void;
  onPrint: (invoice: InvoiceListModel) => void;
  onDelete: (id: number) => void;
  onEdit: (invoice: InvoiceListModel) => void;
}

const InvoiceListTable = ({ data, onView, onPrint, onDelete, onEdit }: Props) => {

  // ✅ Status Badge
  const getStatusBadge = (status: string) => {
    const base = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ";

    switch (status.toLowerCase()) {
      case "draft":
        return (<span className={`${base} bg-slate-100 text-slate-600 border-slate-200`}>Draft</span>);
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
      <div className="relative w-full overflow-y-auto max-h-150 rounded-xl border border-slate-100 bg-white custom-scrollbar">
      {/* Table */}
      <table className="w-full text-left border-separate border-spacing-0">

        {/* Header */}
        <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
          <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            <th className="px-6 py-5 border-b border-slate-200">Invoice Number</th>
            <th className="px-6 py-5 border-b border-slate-200">Client</th>
            <th className="px-6 py-5 border-b border-slate-200">Amount</th>
            <th className="px-6 py-5 border-b border-slate-200">Status</th>
            <th className="px-6 py-5 border-b border-slate-200">Due Date</th>
            <th className="px-6 py-5 border-b border-slate-200 text-center">Actions</th>
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-slate-100">
          {data.map((invoice) => (
            <tr
              key={invoice.id}
              className="group hover:bg-slate-50 transition-all"
            >

              {/* Invoice */}
              <td className="py-5 px-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-slate-500 rounded-lg shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      {invoice.invoiceNumber}
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

                  
  <button
    onClick={() => onEdit(invoice)}
    className="p-2 hover:bg-white hover:shadow-md text-slate-400 hover:text-amber-600 rounded-xl transition-all"
    title="Edit Draft"
  >
    <Pencil size={16} />
  </button>


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
    </div>
  );
};

export default InvoiceListTable;
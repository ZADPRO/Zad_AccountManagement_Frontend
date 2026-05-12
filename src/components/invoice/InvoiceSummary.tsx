import { IndianRupee, ShieldCheck } from 'lucide-react';

interface InvoiceSummaryProps {
  subtotal: number;
  taxRate: number; 
  tdsRate: number; 
  isInterState: boolean; 
  currency: string;
}

const InvoiceSummary = ({ subtotal, taxRate, tdsRate, isInterState,currency, }: InvoiceSummaryProps) => {
  const gstAmount = (subtotal * taxRate) / 100;
  const tdsAmount = (subtotal * tdsRate) / 100;
  const grandTotal = subtotal + gstAmount - tdsAmount;
 

  const currencySymbols: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const currencySymbol = currencySymbols[currency] || currency;


  return (
    <div className="space-y-6">
      {/* Main Summary Card */}
      <div className="bg-white border border-slate-200 rounded-4xl p-8 shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
            <IndianRupee size={12} strokeWidth={3} />
          </div> 
          Payment Summary
        </h3>
        
        <div className="space-y-5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Total Taxable Value</span>
            <span className="font-bold text-slate-900">{currencySymbol}{subtotal.toLocaleString()}</span>
          </div>

          {/* GST Logic: Using Emerald-600 for high-contrast visibility */}
          {isInterState ? (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">IGST ({taxRate}%)</span>
              <span className="font-bold text-emerald-600">+{currencySymbol}{gstAmount.toLocaleString()}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">CGST ({taxRate / 2}%)</span>
                <span className="font-bold text-emerald-600">+{currencySymbol}{(gstAmount / 2).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">SGST ({taxRate / 2}%)</span>
                <span className="font-bold text-emerald-600">+ {currencySymbol}{(gstAmount / 2).toLocaleString()}</span>
              </div>
            </>
          )}

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">TDS Deduction ({tdsRate}%)</span>
            <span className="font-bold text-rose-600">- {currencySymbol}{tdsAmount.toLocaleString()}</span>
          </div>

          {/* Grand Total Section */}
          <div className="pt-6 border-t border-slate-100 flex justify-between items-end mt-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block mb-1">Final Amount</span>
              <span className="text-4xl font-black text-slate-900 leading-none tracking-tighter">
                {currencySymbol}{grandTotal.toLocaleString()}
              </span>
            </div>
            
          </div>
        </div>
      </div>

      {/* Compliance Note: Soft Blue/Slate style */}
      <div className="bg-slate-100/50 border border-slate-200 rounded-2xl p-5 flex gap-4">
        <ShieldCheck className="text-blue-600 shrink-0" size={20} />
        <p className="text-[11px] leading-relaxed text-slate-600">
          This is a computer-generated document. Taxes are calculated as per the 
          <strong className="text-slate-900"> GST Act 2017</strong>. Ensure TDS certificates are filed within 
          the quarterly deadline.
        </p>
      </div>
    </div>
  );
};

export default InvoiceSummary;
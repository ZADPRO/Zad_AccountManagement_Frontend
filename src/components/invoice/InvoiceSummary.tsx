import { IndianRupee } from 'lucide-react';

interface InvoiceSummaryProps {
  subtotal: number;
  taxType: string;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;  
  currency: string;
  adjustment: number;
  onAdjustmentChange: (val: number) => void;
}

const InvoiceSummary = ({
  subtotal,
  taxType,
  cgstAmount,
  sgstAmount,
  igstAmount,
  currency,
  adjustment
  
}: InvoiceSummaryProps) => {

  const gstAmount =
  taxType === "NO TAX"
    ? 0
    : taxType === "IGST @ 18%"
    ? igstAmount
    : cgstAmount + sgstAmount;

  

  const grandTotal = subtotal + gstAmount + adjustment;

  const currencySymbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };

  const currencySymbol =
    currencySymbols[currency] || currency;

  return (
    <div className="space-y-6">

      {/* Main Summary Card */}
      <div className="bg-white border border-slate-200 rounded-4xl p-8 shadow-sm">

        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">

          <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
            <IndianRupee
              size={12}
              strokeWidth={3}
            />
          </div>

          Payment Summary
        </h3>

        <div className="space-y-5">

          {/* Taxable Value */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">
              Total Taxable Value
            </span>

            <span className="font-bold text-slate-900">
              {currencySymbol}
              {subtotal.toLocaleString()}
            </span>
          </div>

          {/* GST SECTION */}
          {taxType === "NO TAX" ? null : taxType === "IGST @ 18%" ? (

  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500 font-medium">
      IGST (18%)
    </span>

    <span className="font-bold text-emerald-600">
      + {currencySymbol}
      {igstAmount.toLocaleString()}
    </span>
  </div>

) : (

  <>
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500 font-medium">
        CGST (9%)
      </span>

      <span className="font-bold text-emerald-600">
        + {currencySymbol}
        {cgstAmount.toLocaleString()}
      </span>
    </div>

    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500 font-medium">
        SGST (9%)
      </span>

      <span className="font-bold text-emerald-600">
        + {currencySymbol}
        {sgstAmount.toLocaleString()}
      </span>
    </div>
  </>

)}

          {/*  ADJUSTMENT ROW (Only visible if adjustment is not 0) */}
          {Math.abs(adjustment) > 0.001 && (
            <div className="flex justify-between items-center text-sm pt-2">
              <span className="text-slate-500 font-medium">
                Adjustment (Round off)
              </span>
              <span className={`font-bold ${adjustment < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                {adjustment > 0 ? '+' : ''} {currencySymbol}
                {adjustment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* FINAL TOTAL */}
          <div className="pt-6 border-t border-slate-100 flex justify-between items-end mt-4">

            <div>

              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block mb-1">
                Final Amount
              </span>

              <span className="text-4xl font-black text-slate-900 leading-none tracking-tighter">

                {currencySymbol}
                {grandTotal.toLocaleString()}

              </span>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default InvoiceSummary;
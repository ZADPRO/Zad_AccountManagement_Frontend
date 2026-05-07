import { useState, useEffect, useRef } from "react";
import api from "@/api/api";
import CustomFields from "../components/invoice/CustomInvoiceFields";
// ── Types matching your Go InvoiceResponse ──

interface CustomField {
  fieldId: number;
  label: string;  
  value: string;
}
interface InvoiceItem {
  itemid: number;
  description: string;
  quantity: number;
  unitprice: number;
  linetotal: number;
}

interface ClientInfo {
  clientid: number;
  clientCode: string;
  name: string;
  businessName: string;
  clienttype: string;
  email: string;
  mobilenumber: string;
  registeredAddress: string;
  countryName: string;
  stateName: string;
  zip: number;
  gstnumber: string;
  pan: string;
  gststatus: string;
  isexport: boolean;
  tax_percentage: number;
  billingAddress: string;
  billingCountry: string;
  billingState: string;
}

interface InvoiceResponse {
  invoiceid: number;
  invoicenumber: string;
  invoicedate: string;
  grandtotal: number;
  paymentstatus: string;
  client: ClientInfo;
  items: InvoiceItem[];
  customFields?: CustomField[];
}

interface Props {
  invoiceId: number;
  autoPrint?: boolean;   // NEW
}

// ── Utilities ──
function numberToWords(num: number): string {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (num === 0) return "Zero";
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? " " + ones[num%10] : "");
  if (num < 1000) return ones[Math.floor(num/100)] + " Hundred" + (num%100 ? " " + numberToWords(num%100) : "");
  if (num < 100000) return numberToWords(Math.floor(num/1000)) + " Thousand" + (num%1000 ? " " + numberToWords(num%1000) : "");
  return numberToWords(Math.floor(num/100000)) + " Lakh" + (num%100000 ? " " + numberToWords(num%100000) : "");
}

const fmt = (n: number) =>
  `INR ${Number(n).toLocaleString("en-CH", { minimumFractionDigits: 2 })}`;

// ── Component ──
export default function InvoicePrint({ invoiceId, autoPrint }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) return;
    
    const fetchInvoice = async () => {
      try {
        setLoading(true);

        const token = sessionStorage.getItem("token");

       const res = await api.get(`/invoices/${invoiceId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // ✅ handle both formats safely
        const raw = res.data.data || res.data;
        console.log(res)
const data = {
  ...raw,

  items: (raw.items || []).map((item: any) => ({
    itemid: item.itemid ?? item.ItemID,
    description: item.description ?? item.Description,
    quantity: item.quantity ?? item.Quantity,
    unitprice: item.unitprice ?? item.UnitPrice,
    linetotal: item.linetotal ?? item.LineTotal,
  })),

 customFields: (raw.customFields || raw.CustomFields || []).map((f: any) => ({
  fieldId: f.fieldId ?? f.FieldID,
  label: f.label ?? f.Label ?? `Field ${f.fieldId}`,  // ← add this
  value: f.value ?? f.Value,
})),
};

setInvoice(data);
       
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || "Failed to fetch invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  useEffect(() => {
  if (autoPrint && invoice) {
    setTimeout(() => {
      handlePrint();
    }, 500);
  }
}, [autoPrint, invoice]);

  const handlePrint = () => {
    if (!printRef.current || !invoice) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=800,height=1000");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Invoice - ${invoice.invoicenumber}</title>
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #222; }
            .inv-header { display:flex; border-bottom: 2px solid #1a5276; }
            .inv-company { flex:1; padding:12px 14px; }
            .inv-company h2 { color:#1a5276; font-size:14px; font-weight:bold; margin-bottom:4px; }
            .inv-company p { font-size:11px; line-height:1.5; }
            .inv-logo-box { width:160px; display:flex; align-items:center; justify-content:center; padding:10px; }
            .inv-title-bar { background:#1a5276; color:white; text-align:center; padding:6px; font-size:13px; font-weight:bold; letter-spacing:1px; }
            .inv-dates { display:flex; border-bottom:1px solid #ccc; }
            .inv-date-cell { flex:1; padding:7px 14px; border-right:1px solid #ccc; }
            .inv-date-cell:last-child { border-right:none; }
            .inv-date-cell b { color:#1a5276; }
            .inv-section-bar { background:#1a5276; color:white; padding:5px 14px; font-size:12px; font-weight:bold; }
            .inv-bill-to { padding:10px 14px; min-height:52px; line-height:1.6; }
            table { width:100%; border-collapse:collapse; }
            thead tr { background:#1a5276; color:white; }
            thead th { padding:7px 10px; text-align:left; }
            thead th:first-child { width:36px; text-align:center; }
            thead th:last-child { text-align:right; }
            tbody tr { border-bottom:1px solid #ddd; }
            tbody td { padding:10px; vertical-align:top; }
            tbody td:first-child { text-align:center; color:#555; }
            tbody td:last-child { text-align:right; }
            .total-row { display:flex; justify-content:flex-end; border-bottom:1px solid #ccc; }
            .total-label { padding:5px 14px; font-weight:bold; color:#1a5276; border-left:1px solid #ccc; min-width:90px; text-align:right; }
            .total-value { padding:5px 14px; min-width:110px; text-align:right; border-left:1px solid #ccc; }
            .words-bar { padding:7px 14px; border-top:1px solid #ccc; border-bottom:1px solid #ccc; }
            .words-bar b { color:#1a5276; }
            .payment-section { display:flex; }
            .payment-left { flex:1; padding:10px 14px; }
            .payment-left .pay-header { background:#1a5276; color:white; margin:-10px -14px 8px; padding:6px 14px; font-weight:bold; font-size:12px; }
            .pay-row { display:flex; margin-bottom:2px; font-size:11px; }
            .pay-label { min-width:110px; color:#555; }
            .pay-val { font-weight:bold; }
            .payment-right { width:175px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:10px; border-left:1px solid #ccc; gap:8px; }
            .qr-label { font-size:10px; text-align:center; color:#1a5276; font-weight:bold; line-height:1.3; }
            .scan-pay { font-size:10px; color:#c0392b; font-weight:bold; }
            .inv-footer { padding:8px 14px; border-top:2px solid #1a5276; font-weight:bold; }
            @page { margin: 10mm; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading invoice...</div>;
  if (error)   return <div style={{ padding: 20, color: "red" }}>Error: {error}</div>;
  if (!invoice) return <div style={{ padding: 20 }}>Invoice not found</div>;

  const totalWords = numberToWords(Math.floor(invoice.grandtotal)) + "Rupees Only";

  return (
    <div>
      {/* Print Button */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
        <button
          onClick={handlePrint}
          style={{
            background:"#1a5276", color:"white", border:"none",
            padding:"10px 22px", borderRadius:6, cursor:"pointer",
            fontSize:15, display:"flex", alignItems:"center", gap:8
          }}
        >
          🖨️ Print Invoice
        </button>
      </div>

      {/* Invoice */}
      <div ref={printRef} style={{ background:"white", border:"1px solid #aaa", fontFamily:"Arial, sans-serif" }}>

        {/* Header */}
        <div className="inv-header" style={{ display:"flex", borderBottom:"2px solid #1a5276" }}>
          <div className="inv-company" style={{ flex:1, padding:"12px 14px" }}>
            <h2 style={{ color:"#1a5276", fontSize:14, fontWeight:"bold", marginBottom:4 }}>
              ZAdroit IT Solutions Private Limited
            </h2>
            <p style={{ fontSize:11, lineHeight:1.5 }}>
              38/37b, No.1 Logi Street, Gugai,<br/>
              Salem - 636006, Tamilnadu, INDIA<br/>
              GST Reg Number : 33AACCZ1874E1ZE<br/>
              Email: finance@zadroit.com<br/>
              Phone No : 0427-3562462, 8838638407<br/>
              Www.zadroit.com, http://max-idigital.com
            </p>
          </div>
          <div style={{ width:160, display:"flex", alignItems:"center", justifyContent:"center", padding:10 }}>
            <svg width="130" height="60" viewBox="0 0 130 60">
              <text x="2" y="42" fontSize="36" fontWeight="bold" fill="#1a5276">ZA</text>
              <text x="48" y="42" fontSize="36" fontWeight="bold" fill="#e67e22">dro</text>
              <text x="98" y="42" fontSize="36" fontWeight="bold" fill="#1a5276">it</text>
              <text x="2" y="56" fontSize="11" fill="#555">IT Solutions</text>
            </svg>
          </div>
        </div>

        {/* Title */}
        <div style={{ background:"#1a5276", color:"white", textAlign:"center", padding:"6px", fontSize:13, fontWeight:"bold", letterSpacing:1 }}>
          Proforma Invoice
        </div>

        {/* Dates */}
        <div style={{ display:"flex", borderBottom:"1px solid #ccc" }}>
          <div style={{ flex:1, padding:"7px 14px", borderRight:"1px solid #ccc", fontSize:12 }}>
            <b style={{ color:"#1a5276" }}>Invoice Date :</b>&nbsp;{invoice.invoicedate}
          </div>
          <div style={{ flex:1, padding:"7px 14px", fontSize:12 }}>
            <b style={{ color:"#1a5276" }}>Invoice No :</b>&nbsp;{invoice.invoicenumber}
          </div>
        </div>

        {/* Bill To */}
        <div style={{ background:"#1a5276", color:"white", padding:"5px 14px", fontSize:12, fontWeight:"bold" }}>
          Bill To
        </div>
        <div style={{ padding:"10px 14px", minHeight:52, fontSize:12, lineHeight:1.6 }}>
          <strong>{invoice.client.name}</strong>&nbsp;
          ({invoice.client.businessName})<br/>
          {invoice.client.billingAddress}<br/>
          {invoice.client.billingState}, {invoice.client.billingCountry}<br/>
          {invoice.client.gstnumber && `GSTIN: ${invoice.client.gstnumber}`}
          {invoice.client.pan && <>&nbsp;·&nbsp;PAN: {invoice.client.pan}</>}
        </div>

        {/* Items Table */}
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#1a5276", color:"white" }}>
              <th style={{ padding:"7px 10px", textAlign:"center", width:36 }}>#</th>
              <th style={{ padding:"7px 10px", textAlign:"left" }}>Item &amp; Description</th>
              <th style={{ padding:"7px 10px", textAlign:"right" }}>Amount in Rupees (INR)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={item.itemid} style={{ borderBottom:"1px solid #ddd" }}>
                <td style={{ padding:"10px", textAlign:"center", color:"#555" }}>{i + 1}</td>
                <td style={{ padding:"10px", fontSize:12 }}>
                  {item.description}
                  {item.quantity > 1 && (
                    <span style={{ color:"#888", fontSize:11 }}>
                      &nbsp;(Qty: {item.quantity} × {fmt(item.unitprice)})
                    </span>
                  )}
                </td>
                <td style={{ padding:"10px", textAlign:"right", fontSize:12 }}>
                  {fmt(item.linetotal)}
                </td>
              </tr>
            ))}
            {invoice.items.length < 3 && (
              <tr><td colSpan={3} style={{ height:36 }}></td></tr>
            )}
          </tbody>
        </table>
            {invoice.customFields && invoice.customFields.length > 0 && (
  <>
    <div style={{
      background:"#1a5276",
      color:"white",
      padding:"5px 14px",
      fontSize:12,
      fontWeight:"bold"
    }}>
      Additional Details
    </div>

    <div style={{
      padding:"10px 14px",
      fontSize:12,
      lineHeight:1.6
    }}>
     {invoice.customFields.map((field, index) => (
  <div key={index}>
    <strong>{field.label}:</strong> {field.value}
  </div>
))}
    </div>
  </>
)}
        {/* Totals */}
        <div>
          {/* Sub Total */}
          <div style={{ display:"flex", justifyContent:"flex-end", borderBottom:"1px solid #ccc" }}>
            <div style={{ padding:"5px 14px", fontWeight:"bold", color:"#1a5276", borderLeft:"1px solid #ccc", minWidth:90, textAlign:"right", fontSize:12 }}>
              Sub Total
            </div>
            <div style={{ padding:"5px 14px", minWidth:110, textAlign:"right", borderLeft:"1px solid #ccc", fontSize:12 }}>
              {fmt(invoice.grandtotal)}
            </div>
          </div>

          {/* Tax row — only if not export and tax > 0 */}
          {!invoice.client.isexport && invoice.client.tax_percentage > 0 && (
            <div style={{ display:"flex", justifyContent:"flex-end", borderBottom:"1px solid #ccc" }}>
              <div style={{ padding:"5px 14px", fontWeight:"bold", color:"#1a5276", borderLeft:"1px solid #ccc", minWidth:90, textAlign:"right", fontSize:12 }}>
                GST ({invoice.client.tax_percentage}%)
              </div>
              <div style={{ padding:"5px 14px", minWidth:110, textAlign:"right", borderLeft:"1px solid #ccc", fontSize:12 }}>
                {fmt(invoice.grandtotal * invoice.client.tax_percentage / 100)}
              </div>
            </div>
          )}

          {/* Grand Total */}
          <div style={{ display:"flex", justifyContent:"flex-end", borderBottom:"1px solid #ccc" }}>
            <div style={{ padding:"5px 14px", fontWeight:"bold", color:"#1a5276", borderLeft:"1px solid #ccc", minWidth:90, textAlign:"right", fontSize:13 }}>
              Total
            </div>
            <div style={{ padding:"5px 14px", minWidth:110, textAlign:"right", borderLeft:"1px solid #ccc", fontWeight:"bold", fontSize:13 }}>
              {fmt(invoice.grandtotal)}
            </div>
          </div>
        </div>

        {/* Total in Words */}
        <div style={{ padding:"7px 14px", borderTop:"1px solid #ccc", borderBottom:"1px solid #ccc", fontSize:12 }}>
          <b style={{ color:"#1a5276" }}>Total In Words :</b> {totalWords}
        </div>

        {/* Payment Details */}
        <div style={{ display:"flex" }}>
          <div style={{ flex:1, padding:"10px 14px" }}>
            <div style={{ background:"#1a5276", color:"white", margin:"-10px -14px 8px", padding:"6px 14px", fontWeight:"bold", fontSize:12 }}>
              Payments to be made to :
            </div>
            {[
              ["Beneficiary",     "ZADROIT IT SOLUTIONS PRIVATE LIMITED"],
              ["Beneficiary Bank","ICICI Bank"],
              ["Bank Account No", "611905057496"],
              ["IFSC Code",       "ICIC0006119"],
              ["Account Type",    "Current"],
              ["AD Code:",        "6390138"],
              ["Swift Code:",     "ICICINBBCTS"],
              ["Bank Address",    "Swarnambigai Plaza, Omalur Main Road, Salem - 636009, Tamilnadu, INDIA"],
            ].map(([label, val]) => (
              <div key={label} style={{ display:"flex", marginBottom:2, fontSize:11 }}>
                <div style={{ minWidth:110, color:"#555" }}>{label}</div>
                <div style={{ fontWeight:"bold" }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ width:175, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:10, borderLeft:"1px solid #ccc", gap:8 }}>
            <div style={{ fontSize:10, textAlign:"center", color:"#1a5276", fontWeight:"bold", lineHeight:1.3 }}>
              M/S.ZADROIT IT SOLUTIONS PRIVATE LIMITED
            </div>
            <img src="/qr-code.png" width={90} height={90} alt="QR"
              onError={(e) => (e.currentTarget.style.display = "none")} />
            <div style={{ fontSize:10, color:"#c0392b", fontWeight:"bold" }}>Scan and Pay</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"8px 14px", borderTop:"2px solid #1a5276", fontWeight:"bold", fontSize:12 }}>
          For ZADROIT IT SOLUTIONS PRIVATE LIMITED
        </div>

      </div>
    </div>
  );
}
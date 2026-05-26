import { useState, useEffect, useRef } from "react";
import api from "@/api/api";
// import CustomFields from "../components/invoice/CustomInvoiceFields";

// ── Types matching your Go InvoiceResponse ──
interface CustomFieldValue {
  fieldId: number;
  label: string;
  value: string;
}
interface ItemCustomFieldValue {
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
  itemCustomValues?: ItemCustomFieldValue[];
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
  taxtype: string;
  client: ClientInfo;
  items: InvoiceItem[];
  customValues?: CustomFieldValue[];
 invoiceduedate :string ;           
	currency  :     string;  
  invoiceType: string;
  taxamount: number; 
  tdsamount: number; 
  
    // ✅ ADD THESE
  bankDetails?: {
    beneficiary: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    accountType: string;
    swiftCode: string;
    bankAddress: string;
  };
  qrCodeUrl?: string;
  
  signatureAuthorityId?: number;
signatureAuthorityName?: string;
signatureAuthorityRole?: string;
signatureContactNumber?: string;
signatureEmail?: string;

  

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
  Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
function formatDate(date: string) {
  if (!date) return "";

  return new Date(date)
    .toLocaleDateString("en-GB")
    .replace(/\//g, "-");
}

// ── Component ──
export default function InvoicePrint({ invoiceId, autoPrint }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => {
    if (!invoiceId) return;
    
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");

        // 1. Fetch BOTH the invoice AND the custom field names at the same time!
        const [invRes, fieldsRes] = await Promise.all([
          api.get(`/invoices/${invoiceId}`, { headers: { Authorization: `Bearer ${token}` } }),
          api.get(`/custom-fields`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
      
        const raw = invRes.data.data || invRes.data;
        const customFieldsList = fieldsRes.data?.fields || [];

        // 2. Create a lookup dictionary for the real labels (e.g., { 1: "SAC", 2: "Qty in Hrs" })
        const fieldLabels: Record<number, string> = {};
        customFieldsList.forEach((f: any) => {
          fieldLabels[f.fieldId] = f.fieldLabel;
        });
        
        const data = {
          ...raw,
          taxtype: raw.taxtype || raw.taxType || "",

          items: (raw.items || []).map((item: any) => ({
            itemid: item.itemid ?? item.ItemID,
            description: item.description ?? item.Description,
            quantity: item.quantity ?? item.Quantity,
            unitprice: item.unitprice ?? item.UnitPrice,
            linetotal: item.linetotal ?? item.LineTotal, 

            itemCustomValues: (item.customFieldValues || item.custom_field_values || []).map((f: any) => ({
              fieldId: Number(f.fieldId),
              // ✅ Look up the real label using the ID!
              label: fieldLabels[Number(f.fieldId)] || f.label || f.fieldLabel || "Custom Field",
              value: f.value,
            })),
          })),
          
          // ✅ Invoice-level custom fields mapped with real labels!
          customValues: (raw.customValues || raw.CustomValues || []).map((f: any) => ({
            fieldId: Number(f.fieldId),
            label: fieldLabels[Number(f.fieldId)] || f.fieldLabel || f.label || "Custom Field", 
            value: f.value,
          })),
          
          bankDetails: raw.bankDetails || {
            beneficiary: raw.invoiceBeneficiary,
            bankName: raw.invoiceBankName,
            accountNumber: raw.invoiceAccountNumber,
            ifsc: raw.invoiceIfscCode,
            accountType: raw.invoiceAccountType,
            swiftCode: raw.invoiceSwiftCode,
            bankAddress: raw.invoiceBankAddress,
          },
          qrCodeUrl: raw.qrCodeUrl || raw.invoiceQrCodeUrl || null,
        };

        setInvoice(data); 
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || "Failed to fetch invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
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
          <title>${`Invoice_${invoice.invoicenumber}_${
    new Date().toISOString().split("T")[0]
  }`}</title>
          <style>
              * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #222; }
            .inv-header { display:flex; border-bottom: 2px solid #4A90D9; }
            .inv-company { flex:1; padding:12px 14px; }
            .inv-company h2 { color:#4A90D9; font-size:14px; font-weight:bold; margin-bottom:4px; }
            .inv-company p { font-size:11px; line-height:1.5; }
            .inv-logo-box { width:160px; display:flex; align-items:center; justify-content:center; padding:10px; }
            .inv-title-bar { background:#4A90D9; color:white; text-align:center; padding:6px; font-size:13px; font-weight:bold; letter-spacing:1px; }
            .inv-dates { display:flex; border-bottom:1px solid #ccc; }
            .inv-date-cell { flex:1; padding:7px 14px; border-right:1px solid #ccc; }
            .inv-date-cell:last-child { border-right:none; }
            .inv-date-cell b { color:#4A90D9; }
            .inv-section-bar { background:#4A90D9; color:white; padding:5px 14px; font-size:12px; font-weight:bold; }
            .inv-bill-to { padding:10px 14px; min-height:52px; line-height:1.6; }
            table { width:100%; border-collapse:collapse; }
            thead tr { background:#4A90D9; color:white; }
           <th style={{ padding: "7px 10px", textAlign: "right" }}></th>
            thead th:first-child { width:36px; text-align:center; }
            thead th:last-child { text-align:right; }
            tbody tr { border-bottom:1px solid #ddd; }
            tbody td { padding:10px; vertical-align:top; }
            tbody td:first-child { text-align:center; color:#555; }
            tbody td:last-child { text-align:right; }
            .total-row { display:flex; justify-content:flex-end; border-bottom:1px solid #ccc; }
            .total-label { padding:5px 14px; font-weight:bold; color:#4A90D9; border-left:1px solid #ccc; min-width:90px; text-align:right; }
            .total-value { padding:5px 14px; min-width:110px; text-align:right; border-left:1px solid #ccc; }
            .words-bar { padding:7px 14px; border-top:1px solid #ccc; border-bottom:1px solid #ccc; }
            .words-bar b { color:#4A90D9; }
            .payment-section { display:flex; }
            .payment-left { flex:1; padding:10px 14px; }
            .payment-left .pay-header { background:#4A90D9; color:white; margin:-10px -14px 8px; padding:6px 14px; font-weight:bold; font-size:12px; }
            .pay-row { display:flex; margin-bottom:2px; font-size:11px; }
            .pay-label { min-width:110px; color:#555; }
            .pay-val { font-weight:bold; }
            .payment-right { width:175px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:10px; border-left:1px solid #ccc; gap:8px; }
            .qr-label { font-size:10px; text-align:center; color:#4A90D9; font-weight:bold; line-height:1.3; }
            .scan-pay { font-size:10px; color:#E6B800; font-weight:bold; }
            .inv-footer { padding:8px 14px; border-top:2px solid #4A90D9; font-weight:bold; }
            @page { margin: 10mm; }
            @media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .inv-title-bar,
  .inv-section-bar,
  thead tr {
    background: #4A90D9 !important;
    color: white !important;
  }
}
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

  const totalWords =
  numberToWords(Math.floor(invoice.grandtotal)) + " Only";
  const bank = invoice.bankDetails;

  const subtotal = invoice.items.reduce(
    (sum: number, item: any) => sum + Number(item.linetotal || 0),
    0
  );

  let taxPercentage = 0;
  let calculatedTax = 0;
  let adjustment = 0;

  // 1. First try calculating from the saved tax amount
  if (invoice.taxamount > 0) {
    taxPercentage = Math.round((invoice.taxamount / subtotal) * 100);
    calculatedTax = invoice.taxamount;
  } 
  // 2. Next, check if the string tells us (e.g., "IGST @ 18%")
  else if (invoice.taxtype?.includes("18") || invoice.taxtype?.includes("9")) {
    taxPercentage = 18;
    calculatedTax = (subtotal * taxPercentage) / 100;
  } 
  // 3. Reverse-engineer it if older invoice is missing tax fields
  else if (!invoice.client.isexport) {
    // If grand total is exactly Subtotal + 18%, assume it's 18%
    const expected18PercentTax = (subtotal * 18) / 100;
    
    // Using a tiny margin of error (0.1) for floating-point math weirdness
    if (Math.abs(invoice.grandtotal - (subtotal + expected18PercentTax)) < 0.1) {
        taxPercentage = 18;
        calculatedTax = expected18PercentTax;
    }
  }

  // 4. Calculate actual adjustment based on what's left over
  adjustment = invoice.grandtotal - (subtotal + calculatedTax);

  const showTax = !invoice.client.isexport && taxPercentage > 0;
  const showAdjustment = Math.abs(adjustment) > 0.01;
  const totalRowCount = 2 + (showTax ? 1 : 0) + (showAdjustment ? 1 : 0);
  
  // ✅ Change this to 2 to account for the new split column!
  const leftColSpan = 2 + (invoice.customValues?.length || 0);

  return (
    <div>
      {/* Print Button */}
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
        <button
          onClick={handlePrint}
          style={{
            background: "#4A90D9",
            color: "white",
            border: "none",
            padding: "10px 22px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          🖨️ Print Invoice
        </button>
      </div>

      {/* Invoice */}
      <div ref={printRef} style={{ background:"white", border:"1px solid #aaa", fontFamily:"Arial, sans-serif" }}>

        {/* Header */}
        <div className="inv-header" style={{ display:"flex", borderBottom:"2px solid #4A90D9" }}>
          <div className="inv-company" style={{ flex:1, padding:"12px 14px" }}>
            <h2 style={{ color:"#4A90D9", fontSize:14, fontWeight:"bold", marginBottom:4 }}>
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
          <div style={{ width: 160, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
            <img 
              src="/LOGO.PNG" 
              style={{ width: "100%", height: "auto", maxWidth: "140px", objectFit: "contain" }} 
            />
          </div>
        </div>

        {/* Title */}
        <div style={{ background:"#4A90D9", color:"white", textAlign:"center", padding:"6px", fontSize:13, fontWeight:"bold", letterSpacing:1 }}>
          {invoice.invoiceType === "proforma" ? "Proforma Invoice" : invoice.invoiceType === "quote" ? "Quotation" : "Tax Invoice"}
        </div>
        
        {/* Dates */}
        <div style={{ display:"flex", borderBottom:"1px solid #ccc" }}>
          <div style={{ flex:1, padding:"7px 14px", borderRight:"1px solid #ccc", fontSize:12 }}>
            <b style={{ color:"#4A90D9" }}>Invoice Date :</b>&nbsp;{formatDate(invoice.invoicedate)}
          </div>
           <div style={{ flex:1, padding:"7px 14px", fontSize:12 }}>
            <b style={{ color:"#4A90D9" }}>Due Date :</b>&nbsp;{formatDate(invoice.invoiceduedate)}
          </div>
          <div style={{ flex:1, padding:"7px 14px", fontSize:12 }}>
            <b style={{ color:"#4A90D9" }}>Invoice No :</b>&nbsp;{invoice.invoicenumber}
          </div>
        </div>

        {/* Bill To */}
        <div style={{ background:"#4A90D9", color:"white", padding:"5px 14px", fontSize:12, fontWeight:"bold" }}>
          Bill To
        </div>
        <div style={{ padding:"10px 14px", minHeight:52, fontSize:12, lineHeight:1.6 }}>
          <strong>{invoice.client.name}</strong>&nbsp;({invoice.client.businessName})<br/>
          {invoice.client.billingAddress}<br/>
          {[invoice.client.billingState, invoice.client.billingCountry].filter(Boolean).join(", ")}<br/>
          {[
            invoice.client.gstnumber ? `GSTIN: ${invoice.client.gstnumber}` : null,
            invoice.client.pan ? `PAN: ${invoice.client.pan}` : null,
          ].filter(Boolean).join(" · ")}
        </div>

        {/* Items Table & Totals Grid */}
        <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px solid #4A90D9", borderBottom: "1px solid black" }}>
          <thead>
            <tr style={{ background: "#4A90D9", color: "white" }}>
              <th style={{ padding: "7px 10px", textAlign: "center", width: 36, border: "1px solid black" }}>#</th>
              
              {/* colSpan={2} secretly splits this column so the footer can align properly */}
              <th colSpan={2} style={{ padding: "7px 10px", textAlign: "left", border: "1px solid black" }}>Item &amp; Description</th>
              
              {/* Dynamic Custom Columns */}
              {invoice.customValues?.map((field) => (
                <th key={field.fieldId} style={{ padding: "7px 10px", textAlign: "left", border: "1px solid black" }}>
                  {field.label}
                </th>
              ))}

              {/* ✨ Added width: 130px here to anchor the right side of the table */}
              <th style={{ width: "130px", padding: "7px 10px", textAlign: "right", border: "1px solid black" }}>Amount ({invoice.currency})</th>
            </tr>
          </thead>
          
          <tbody>
            {invoice.items.map((item: any, i) => (
              <tr key={item.itemid} style={{ borderBottom: "1px solid black" }}>
                <td style={{ padding: "10px", textAlign: "center", color: "#555", border: "1px solid black" }}>{i + 1}</td>
                
                {/* colSpan={2} here matches the header split */}
                <td colSpan={2} style={{ padding: "10px", fontSize: 12, border: "1px solid black" }}>
                  {item.description}
                  {item.quantity > 1 && (
                    <span style={{ color: "#888", fontSize: 11 }}>
                      <br/>(Qty: {item.quantity} × {fmt(item.unitprice)})
                    </span>
                  )}
                </td>

                {/* Dynamic Custom Cells */}
                {invoice.customValues?.map((field) => (
                  <td key={field.fieldId} style={{ padding: "10px", fontSize: 12, border: "1px solid black" }}>
                    {item.itemCustomValues?.find(
                      (cf: ItemCustomFieldValue) => cf.fieldId === field.fieldId
                    )?.value || "-"}
                  </td>
                ))}

                <td style={{ padding: "10px", textAlign: "right", fontSize: 12, border: "1px solid black" }}>
                  {fmt(item.linetotal)}
                </td>
              </tr>
            ))}
          </tbody>

          {/* Totals Section Attached to Table Grid */}
          <tfoot>
            {/* Sub Total */}
            <tr>
              {/* The empty box dynamically stretches across the # and left half of the description */}
              <td rowSpan={totalRowCount} colSpan={leftColSpan} style={{ border: "1px solid black", backgroundColor: "white" }}></td>
              
              {/* ✨ Added width: 130px here to stop the browser from collapsing the invisible column! */}
              <td style={{ width: "130px", padding: "5px 14px", fontWeight: "bold", textAlign: "right", fontSize: 12, border: "1px solid black", color: "#4A90D9" }}>
                Sub Total
              </td>
              <td style={{ padding: "5px 14px", textAlign: "right", fontSize: 12, border: "1px solid black" }}>
                {fmt(subtotal)}
              </td>
            </tr>

            {/* Tax */}
            {showTax && (
              <tr>
                <td style={{ padding: "5px 14px", fontWeight: "bold", textAlign: "right", fontSize: 12, border: "1px solid black", color: "#4A90D9" }}>
                  {invoice.taxtype || `GST/IGST (${taxPercentage}%)`}
                </td>
                <td style={{ padding: "5px 14px", textAlign: "right", fontSize: 12, border: "1px solid black" }}>
                  {fmt(calculatedTax)}
                </td>
              </tr>
            )}

            {/* Adjustments */}
            {showAdjustment && (
              <tr>
                <td style={{ padding: "5px 14px", fontWeight: "bold", textAlign: "right", fontSize: 12, border: "1px solid black", color: "#4A90D9" }}>
                  Adjustments
                </td>
                <td style={{ padding: "5px 14px", textAlign: "right", fontSize: 12, border: "1px solid black" }}>
                  {adjustment < 0 ? `- ${fmt(Math.abs(adjustment))}` : fmt(adjustment)}
                </td>
              </tr>
            )}

            {/* Grand Total */}
            <tr>
              <td style={{ padding: "5px 14px", fontWeight: "bold", textAlign: "right", fontSize: 13, border: "1px solid black", color: "#4A90D9" }}>
                Total
              </td>
              <td style={{ padding: "5px 14px", textAlign: "right", fontWeight: "bold", fontSize: 13, border: "1px solid black" }}>
                {invoice.currency} {fmt(invoice.grandtotal)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Total in Words */}
        <div style={{ padding:"7px 14px", borderTop:"1px solid #ccc", borderBottom:"1px solid #ccc", fontSize:12 }}>
          <b style={{ color:"#4A90D9" }}>Total In Words :</b> {totalWords}
        </div>

        {/* Payment Details */}
        <div style={{ display:"flex" }}>
          <div style={{ flex:1, padding:"10px 14px" }}>
            {bank && (
              <>
                <div style={{ background:"#4A90D9", color:"white", margin:"-10px -14px 8px", padding:"6px 14px", fontWeight:"bold", fontSize:12 }}>
                  Payments to be made to :
                </div>
                {[
                  ["Beneficiary", 'ZADROIT IT SOLUTIONS PRIVATE LIMITED'],
                  ["Bank", bank.bankName],
                  ["Account No", bank.accountNumber],
                  ["IFSC Code", bank.ifsc],
                  ["Account Type", bank.accountType],
                  ["Swift Code", bank.swiftCode],
                  ["Bank Address", bank.bankAddress],
                ].map(([label, val]) => (
                  <div key={label} style={{ display:"flex", marginBottom:2, fontSize:11 }}>
                    <div style={{ minWidth:110, color:"#555" }}>{label}</div>
                    <div style={{ fontWeight:"bold" }}>{val}</div>
                  </div>
                ))}
              </>
            )}
          </div>
          <div style={{ width:175, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:10, gap:8 }}>
            <div style={{ fontSize:10, textAlign:"center", color:"#4A90D9", fontWeight:"bold", lineHeight:1.3 }}>
              M/S.ZADROIT IT SOLUTIONS PRIVATE LIMITED
            </div>
            {invoice.qrCodeUrl ? (
              <img src={invoice.qrCodeUrl} width={90} height={90} alt="QR Code" />
            ) : null}
            <div style={{ fontSize:10, color:"#E6B800", fontWeight:"bold" }}>Scan and Pay</div>
          </div>
        </div>

        {/* Signature Section */}
        <div style={{ borderTop: "2px solid #4A90D9", padding: "10px 14px", minHeight: 140, display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 12, fontWeight: "bold" }}>
          <div>For ZADROIT IT SOLUTIONS PRIVATE LIMITED</div>
          <div>
            <div style={{ marginTop: 60 }}>
              <div style={{ fontWeight: "bold", fontSize: 13 }}>{invoice.signatureAuthorityName}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{invoice.signatureAuthorityRole}</div>
            </div>
            <div style={{ marginTop: 6 }}>AUTHORISED SIGNATORY</div>
          </div>
        </div>

      </div>
    </div>
  );
}
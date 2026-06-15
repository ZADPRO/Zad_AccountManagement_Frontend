import { useRef } from "react";

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
  sacCode: string;
  linetotal: number;
  itemCustomValues?: ItemCustomFieldValue[];
}



interface Props {
  previewData: any;
  onClose: () => void;
  onGenerate: () => void;
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
export default function InvoicePreview({
  previewData,
  onClose,
  onGenerate
}: Props) {
  const printRef = useRef<HTMLDivElement>(null);
 
  


  const totalWords =
  numberToWords(Math.floor(previewData.grandtotal)) + " Only";
  const bank = previewData.bankDetails;

  

  const subtotal = previewData.items.reduce(
    (sum: number, item: any) => sum + Number(item.linetotal || 0),
    0
  );

  let taxPercentage = 0;
  let calculatedTax = 0;
  let adjustment = 0;

  // 1. First try calculating from the saved tax amount
  if (previewData.taxamount > 0) {
    taxPercentage = Math.round((previewData.taxamount / subtotal) * 100);
    calculatedTax = previewData.taxamount;
  } 
  // 2. Next, check if the string tells us (e.g., "IGST @ 18%")
  else if (previewData.taxtype?.includes("18") || previewData.taxtype?.includes("9")) {
    taxPercentage = 18;
    calculatedTax = (subtotal * taxPercentage) / 100;
  } 
  // 3. Reverse-engineer it if older invoice is missing tax fields
  else if (!previewData.client.isexport) {
    // If grand total is exactly Subtotal + 18%, assume it's 18%
    const expected18PercentTax = (subtotal * 18) / 100;
    
    // Using a tiny margin of error (0.1) for floating-point math weirdness
    if (Math.abs(previewData.grandtotal - (subtotal + expected18PercentTax)) < 0.1) {
        taxPercentage = 18;
        calculatedTax = expected18PercentTax;
    }
  }

  // 4. Calculate actual adjustment based on what's left over
  adjustment = previewData.grandtotal - (subtotal + calculatedTax);

  const showTax = !previewData.client.isexport && taxPercentage > 0;
  const showAdjustment = Math.abs(adjustment) > 0.01;
  const totalRowCount = 2 + (showTax ? 1 : 0) + (showAdjustment ? 1 : 0);
  
  // ✅ Change this to 2 to account for the new split column!
  const leftColSpan = 2 + (previewData.customValues?.length || 0);

  console.log("PREVIEW DATA =", previewData);
console.log("PREVIEW CLIENT =", previewData.client);
  

  return (
    <div>
      

      {/* Invoice */}
      <div ref={printRef} style={{ background:"white", border:"1px solid #aaa", fontFamily:"Arial, sans-serif" }}>

        {/* Header */}
        <div className="inv-header" style={{ display:"flex", borderBottom:"2px solid #4A90D9" }}>
          <div className="inv-company" style={{ flex:1, padding:"12px 14px" }}>
            <h2
  style={{
    color:"#4A90D9",
    fontSize:14,
    fontWeight:"bold",
    marginBottom:4
  }}
>
  {previewData.companyName}
</h2>

<p style={{ fontSize:11, lineHeight:1.5 }}>
  {previewData.addressLine1}
  <br/>

  {previewData.addressLine2 && (
    <>
      {previewData.addressLine2}
      <br/>
    </>
  )}

  {previewData.city} - {previewData.pincode}, {previewData.state}, {previewData.country}
  <br/>

  {previewData.gstNumber && (
    <>
      GST Reg Number : {previewData.gstNumber}
      <br/>
    </>
  )}

  Email: {previewData.companyEmail}
  <br/>

  Phone No : {previewData.companyPhone}
  <br/>

  {previewData.website}
</p>
</div>

          <div style={{ width: 160, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
            {previewData.companyLogoUrl ? (
  <img
    src={previewData.companyLogoUrl}
    alt="Company Logo"
    style={{
      width: "100%",
      height: "auto",
      maxWidth: "140px",
      objectFit: "contain"
    }}
  />
) : (
  <img
    src="/LOGO.PNG"
    alt="Default Logo"
    style={{
      width: "100%",
      height: "auto",
      maxWidth: "140px",
      objectFit: "contain"
    }}
  />
)}
          </div>
        </div>
        
        

        {/* Title */}
        <div style={{ background:"#4A90D9", color:"white", textAlign:"center", padding:"6px", fontSize:13, fontWeight:"bold", letterSpacing:1 }}>
          {previewData.invoiceType === "proforma" ? "Proforma Invoice" : previewData.invoiceType === "quote" ? "Quotation" : "Tax Invoice"}
        </div>
        
        {/* Dates */}
<div
  style={{
    display: "flex",
    borderBottom: "1px solid #000",
    minHeight: "90px"
  }}
>
  {/* LEFT */}
  <div
    style={{
      flex: 1,
      padding: "10px 14px",
      borderRight: "1px solid #000",
      fontSize: 12,
      lineHeight: 2
    }}
  >
    <div>
      <strong>Invoice No :</strong>{" "}
      {previewData.invoicenumber}
    </div>

    <div>
      <strong>Invoice Date :</strong>{" "}
      {formatDate(previewData.invoicedate)}
    </div>

    <div>
      <strong>Due Date :</strong>{" "}
      {formatDate(previewData.invoiceduedate)}
    </div>
  </div>

  {/* RIGHT */}
  <div
    style={{
      flex: 1,
      padding: "10px 14px",
      fontSize: 12,
      lineHeight: 2
    }}
  >
    <div>
      <strong>Supply Type :</strong>{" "}
      {previewData.client?.supplytype ||
       previewData.client?.supplyType ||
       "-"}
    </div>

    {(previewData.client?.isexport ||
      previewData.client?.billingCountry?.toLowerCase() !== "india") && (
      <div>
        <strong>IEC Code :</strong> AACCZ1874E
      </div>
    )}
  </div>
</div>

        {/* Bill To */}
        <div style={{ background:"#4A90D9", color:"white", padding:"5px 14px", fontSize:12, fontWeight:"bold" }}>
          Bill To
        </div>
        <div style={{ padding:"10px 14px", minHeight:52, fontSize:12, lineHeight:1.6 }}>
          <strong>{previewData.client.name}</strong>&nbsp;({previewData.client.businessName})<br/>
          {previewData.client.billingAddress}<br/>
          {[previewData.client.billingState, previewData.client.billingCountry].filter(Boolean).join(", ")}<br/>
          {[
            previewData.client.gstnumber ? `GSTIN: ${previewData.client.gstnumber}` : null,
            previewData.client.pan ? `PAN: ${previewData.client.pan}` : null,
          ].filter(Boolean).join(" · ")}
        </div>

        {/* Items Table & Totals Grid */}
        <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px solid #4A90D9", borderBottom: "1px solid black" }}>
          <thead>
            <tr style={{ background: "#4A90D9", color: "white" }}>
              <th style={{ padding: "7px 10px", textAlign: "center", width: 36, border: "1px solid black" }}>#</th>
              
              {/* colSpan={2} secretly splits this column so the footer can align properly */}
              <th
  style={{
    padding: "7px 10px",
    textAlign: "left",
    border: "1px solid black",
  }}
>
  Description
</th>

<th
  style={{
    padding: "7px 10px",
    textAlign: "left",
    border: "1px solid black",
  }}
>
  SAC Code
</th>
              
              {/* Dynamic Custom Columns */}
              {previewData.customValues?.map((field: CustomFieldValue) => (
                <th key={field.fieldId} style={{ padding: "7px 10px", textAlign: "left", border: "1px solid black" }}>
                  {field.label}
                </th>
              ))}

              {/* ✨ Added width: 130px here to anchor the right side of the table */}
              <th style={{ width: "130px", padding: "7px 10px", textAlign: "right", border: "1px solid black" }}>Amount ({previewData.currency})</th>
            </tr>
          </thead>
          
          <tbody>
            {previewData.items.map((item: InvoiceItem, i: number) => (
              <tr key={item.itemid} style={{ borderBottom: "1px solid black" }}>
                <td style={{ padding: "10px", textAlign: "center", color: "#555", border: "1px solid black" }}>{i + 1}</td>
                
                {/* colSpan={2} here matches the header split */}
                <td
  style={{
    padding: "10px",
    fontSize: 12,
    border: "1px solid black",
  }}
>
  {item.description}
</td>

<td
  style={{
    padding: "10px",
    fontSize: 12,
    border: "1px solid black",
  }}
>
  {item.sacCode || "-"}
</td>

                {/* Dynamic Custom Cells */}
                {previewData.customValues?.map((field: CustomFieldValue) => (
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
                  {previewData.taxtype || `GST/IGST (${taxPercentage}%)`}
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
                {previewData.currency} {fmt(previewData.grandtotal)}
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
  ["Beneficiary", "ZADROIT IT SOLUTIONS PRIVATE LIMITED"],
  ["Bank", bank.bankName || "-"],
  ["Account No", bank.accountNumber || "-"],
  ["IFSC Code", bank.ifscCode || "-"],
  ["Account Type", bank.accountType || "-"],
  ["Swift Code", bank.swiftCode || "-"],
  ["Bank Address", bank.bankAddress || "-"],
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
              M/S. {previewData.companyName}
            </div>
            {previewData.qrCodeUrl ? (
              <img src={previewData.qrCodeUrl} width={90} height={90} alt="QR Code" />
            ) : null}
            <div style={{ fontSize:10, color:"#E6B800", fontWeight:"bold" }}>Scan and Pay</div>
          </div>
        </div>

        {/* Signature Section */}
        <div style={{ borderTop: "2px solid #4A90D9", padding: "10px 14px", minHeight: 140, display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 12, fontWeight: "bold" }}>
          <div>For ZADROIT IT SOLUTIONS PRIVATE LIMITED</div>
          <div>
            <div>
  {previewData.signatureUrl && (
    <img
  src={previewData.signatureUrl}
  alt="Signature"
  
      style={{
        maxHeight: "60px",
        maxWidth: "200px",
        objectFit: "contain",
        marginTop: "10px",
        marginBottom: "10px"
      }}
    />
  )}

  <div style={{ fontWeight: "bold", fontSize: 13 }}>
    {previewData.signatureAuthorityName}
  </div>
  

  <div style={{ fontSize: 12, marginTop: 4 }}>
    {previewData.signatureAuthorityRole}
  </div>
</div>
            <div style={{ marginTop: 6 }}>AUTHORISED SIGNATORY</div>
          </div>
        </div>

      </div>
      <div className="flex justify-end gap-3 mt-6">
  <button
    onClick={onClose}
    className="px-5 py-2 border rounded-lg"
  >
    Cancel
  </button>

  <button
    onClick={onGenerate}
    className="px-5 py-2 bg-blue-600 text-white rounded-lg"
  >
    Generate E-Invoice
  </button>
</div>

    </div>
    
  );
}
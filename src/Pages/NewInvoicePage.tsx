import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Save } from 'lucide-react';

import InvoiceItemsTable from '../components/invoice/InvoiceItemsTable';
import InvoiceSummary from '../components/invoice/InvoiceSummary';
import InvoiceHeader from '@/components/invoice/InvoiceHeader';
import CustomFields from "../components/invoice/CustomInvoiceFields";
import { getSignatureAuthorities } from "../api/signatureAuthorityApi";
import { type ClientListModel } from '@/types/clients';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/api/api';
import { Toast } from 'primereact/toast';
import InvoicePreview from "../components/invoice/InvoicePreview";

/* -------------------------------------------------------------------------- */
/*                                  INTERFACES                                */
/* -------------------------------------------------------------------------- */
interface CustomFieldDefinition {
  fieldId: number;
  fieldLabel: string;
  fieldType: string;
  isRequired?: boolean;
  active?: boolean;
}


interface CustomFieldValue {
  fieldId: number;
  label: string;
  value: string;
}


/* -------------------------------------------------------------------------- */
/*                               HELPER FUNCTION                              */
/* -------------------------------------------------------------------------- */

const getStoredUserId = () => {
  const id = sessionStorage.getItem('userId');
  return id ? Number(id) : 0;
};
interface InvoiceItem {
  id: string;
  description: string;
  sacCode: string;
  amount: number;

  customFieldValues: {
    fieldId: number;
    label: string;
    value: string;
  }[];
  [key: string]: any;
}

/* -------------------------------------------------------------------------- */
/*                                MAIN COMPONENT                              */
/* -------------------------------------------------------------------------- */

const NewInvoice = () => {
  const navigate = useNavigate();

  const { id } = useParams();
  

  const toastRef = useRef<Toast>(null);

  

  /* -------------------------------------------------------------------------- */
  /*                                   STATES                                   */
  /* -------------------------------------------------------------------------- */

  // ✅ FIXED: added customFieldValues inside item
 const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: '',
      sacCode: '',
      amount: 0,
      customFieldValues: [],
    },
  ]);
  
  const [adjustment, setAdjustment] = useState<number>(0);

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [invoiceDueDate, setInvoiceDueDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [invoiceNumber, setInvoiceNumber] = useState("");

  const [clients, setClients] = useState<ClientListModel[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  const [fullClientDetails, setFullClientDetails] = useState<any>(null);

  const [, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customFieldDefs, setCustomFieldDefs] = useState<
    CustomFieldDefinition[]
  >([]);

  // ✅ THESE ARE COLUMN DEFINITIONS
  const [selectedCustomFields, setSelectedCustomFields] = useState<
    CustomFieldValue[]
  >([]);

  const [currency, setCurrency] = useState("");

  // ✅ BANK STATES
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');

  // ✅ INVOICE TYPE
  const [invoiceType, setInvoiceType] = useState('invoice');

  const [signatureAuthorities, setSignatureAuthorities] = useState<any[]>([]);
  const [selectedSignatureAuthority, setSelectedSignatureAuthority] = useState("");

   const [taxType, setTaxType] = useState(
  "IGST @ 18%"
    );
    
  const [currencies, setCurrencies] = useState<any[]>([]);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");


  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

    

  const handleClientChange = (clientId: string) => {
  setSelectedClientId(clientId);
};

  /* -------------------------------------------------------------------------- */
  /* CALCULATIONS                                 */
  /* -------------------------------------------------------------------------- */

  const subtotal = items.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const taxRate =
  taxType === "NO TAX"
    ? 0
    : 18;

  const gstAmount = (subtotal * taxRate) / 100;

  const cgstAmount =
    taxType === "CGST @ 9% + SGST @ 9%"
      ? gstAmount / 2
      : 0;

  const sgstAmount =
    taxType === "CGST @ 9% + SGST @ 9%"
      ? gstAmount / 2
      : 0;

  const igstAmount =
    taxType === "IGST @ 18%"
      ? gstAmount
      : 0;
  
  // 1. Calculate raw total before any adjustment
  const rawTotal = subtotal + gstAmount;

  // 2. Automatically calculate round-off if there's a decimal
  useEffect(() => {
    if (rawTotal % 1 !== 0) {
      const rounded = Math.round(rawTotal);       // Find nearest whole number
      const diff = rounded - rawTotal;            // Find the exact difference
      setAdjustment(Number(diff.toFixed(2)));     // Update the state
    } else {
      setAdjustment(0);                           // Reset to 0 if it's a clean number
    }
  }, [rawTotal]);

  // 3. Final grand total
  const grandTotal = rawTotal + Number(adjustment);

  
  /* -------------------------------------------------------------------------- */
  /*                                   TOASTS                                   */
  /* -------------------------------------------------------------------------- */

  const showSuccess = (detail: string) => {
    toastRef.current?.show({
      severity: 'success',
      summary: 'Success',
      detail,
      life: 3000,
    });
  };

  const showError = (detail: string) => {
    toastRef.current?.show({
      severity: 'error',
      summary: 'Error',
      detail,
      life: 4000,
    });
  };

  /* -------------------------------------------------------------------------- */
  /*                            GENERATE INVOICE                                */
  /* -------------------------------------------------------------------------- */

  const handleGenerateInvoice = async () => {
    // ✅ VALIDATION
    if (!selectedClientId) {
      showError("Please select a client");
      return;
    }

    if (!selectedBankId) {
      showError("Please select a bank");
      return;
    }

    if (
  items.some(
    (item) =>
      !item.description ||
      !item.sacCode ||
      item.amount <= 0
  )
) {
      showError(
        "All items must have description and amount"
      );
      return;
    }

    if (!selectedProfileId) {
  showError(
    "Please select a company profile"
  );
  return;
}

    setIsSubmitting(true);
    

    // ✅ PAYLOAD
    const payload = {
      invoicenumber: invoiceNumber,

      clientid: parseInt(selectedClientId),

      bankid: parseInt(selectedBankId), // ✅ ADDED

      invoicetype: invoiceType, // ✅ ADDED

      invoicedate: invoiceDate,

      invoiceduedate: invoiceDueDate,

      currency: currency,

      signatureAuthorityId: Number(selectedSignatureAuthority),

      grandtotal: grandTotal,

      paymentstatus: "pending",

      updatedby: getStoredUserId(),

      taxtype: taxType,
      
      companyProfileId: Number(selectedProfileId),

      isSaveDraft: false,
      

      // ✅ ITEMS WITH CUSTOM FIELDS
      
items: items.map((item: any) => ({
  description: item.description,
  quantity: 1,
  unitprice: item.amount,
  linetotal: item.amount,
  saccode: item.sacCode,
  customFieldValues: Array.isArray(customFieldDefs)
    ? customFieldDefs
        .filter((def) => item[def.fieldId] !== undefined && item[def.fieldId] !== "")
        .map((def) => ({
          fieldId: Number(def.fieldId),
          value: String(item[def.fieldId]),
        }))
    : [],
})),

      // ✅ HEADER LEVEL CUSTOM FIELDS
      customValues: Array.isArray(selectedCustomFields)
  ? selectedCustomFields.map((field) => ({
      fieldId: Number(field.fieldId),
      value: field.value || "",
    }))
  : [],
    };
    

  
    try {
      let res;

if (id) {
  res = await api.put(
    `/invoices/${id}`,
    payload
  );
} else {
  res = await api.post(
    "/invoices",
    payload
  );
}

      if (res.status === 200) {
  showSuccess(
    id
      ? `Invoice ${invoiceNumber} updated successfully`
      : `Invoice ${invoiceNumber} created successfully`
  );

  setTimeout(() => {
    navigate('/invoices/pending');
  }, 1500);
} else {
  showError(
    res.data.message ||
      "Failed to save invoice"
  );
}
    } catch (err: any) {
      showError(
        err?.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              FETCH CLIENTS                                 */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);

      try {
        const res = await api.get('/clients');

        setClients(res.data.clients || []);
      } catch (err) {
        showError("Failed to load clients");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                               FETCH BANKS                                  */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await api.get(
          '/banking/current'
        );

        // ✅ NORMALIZE BANK IDs
        const bankList = (
          res.data.data || []
        ).map((b: any) => ({
          ...b,
          id: b.detailsId,
        }));

        setBanks(bankList);
      } catch (err) {
        console.error(err);

        showError(
          "Failed to load bank details"
        );
      }
    };

    fetchBanks();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                           FETCH CLIENT DETAILS                             */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedClientId) {
        setFullClientDetails(null);
        return;
      }

      try {
        const res = await api.get(
          `/clients/${selectedClientId}`
        );

        const rawData =
          res.data.data || res.data;


  console.log("RAW CLIENT DATA =", rawData);

        setFullClientDetails({
  name: rawData.name || rawData.businessName || '-',

  clientCode: rawData.clientCode || '-',

  clienttype: rawData.clientType || 'Standard',

  mobilenumber: rawData.mobileNumber || '-',

  email: rawData.email || '-',

  registeredAddress:
    rawData.registeredAddress || '-',

  billingCountryName:
    rawData.billingCountryName || "",

  billingStateName:
    rawData.billingStateName || "",

  isExport: rawData.isExport,

  gstnumber:
    rawData.gstNumber || '-',

  pan: rawData.pan || '-',
});



const clientDetails = {
  name: rawData.name || rawData.businessName || "-",
  supplytype:
  rawData.supplyTypeId === 1
    ? "B2B"
    : rawData.supplyTypeId === 2
    ? "B2C"
    : rawData.supplyTypeId === 3
    ? "C2C"
    : "",
  clientCode: rawData.clientCode || "-",
  clienttype: rawData.clientType || "Standard",
  mobilenumber: rawData.mobileNumber || "-",
  email: rawData.email || "-",
  registeredAddress: rawData.registeredAddress || "-",

  billingCountryName: rawData.billingCountryName || "",
  billingStateName: rawData.billingStateName || "",

  isExport: rawData.isExport,

  gstnumber: rawData.gstNumber || "-",
  pan: rawData.pan || "-",
};

console.log("CLIENT DETAILS", clientDetails);


setFullClientDetails(clientDetails);
      } catch (err) {
        showError(
          "Failed to load client details"
        );
      }
    };

    fetchDetails();
  }, [selectedClientId]);

  /* -------------------------------------------------------------------------- */
  /*                           FETCH CUSTOM FIELDS                              */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await api.get(
          '/custom-fields'
        );

        const rawData =
          res.data?.fields || [];

        // ✅ FIXED FIELD NAMES
        setCustomFieldDefs(
          rawData.map((f: any) => ({
            fieldId: f.fieldId,
            fieldLabel: f.fieldLabel,
            fieldType: f.fieldType,
            isRequired: f.isRequired,
          }))
        );
      } catch (err) {
        showError(
          "Failed to load custom fields"
        );
      }
    };

    fetchFields();
  }, []);

  useEffect(() => {
  if (
    currencies.length > 0 &&
    !currency
  ) {
    setCurrency(
      currencies[0].currencyCode
    );
  }
}, [currencies]);

/* -------------------------------------------------------------------------- */
  /*                           FETCH SIGNATURE AUTHORITIES                              */
  /* -------------------------------------------------------------------------- */


  useEffect(() => {

  const loadSignatureAuthorities = async () => {

    try {

      const data =
        await getSignatureAuthorities();

      setSignatureAuthorities(data);

    } catch (err) {

      console.error(
        "Failed to load signature authorities",
        err
      );
    }
  };

  loadSignatureAuthorities();

}, []);

/* -------------------------------------------------------------------------- */
  /*                           FETCH CURRENCIES                         */
  /* -------------------------------------------------------------------------- */


useEffect(() => {
  const loadCurrencies = async () => {
    try {
      const res = await api.get("/currencies");

      setCurrencies(res.data || []);
    } catch (err) {
      console.error(
        "Failed to load currencies",
        err
      );
    }
  };

  loadCurrencies();
}, []);


/* -------------------------------------------------------------------------- */
  /*                           FETCH TAX                      */
  /* -------------------------------------------------------------------------- */

useEffect(() => {
  if (!fullClientDetails) return;

  

  const isExport = fullClientDetails.isExport;

  const billingState =
    fullClientDetails.billingStateName || "";

  if (isExport) {
    // console.log("EXPORT CLIENT -> NO TAX");
    setTaxType("NO TAX");
    return;
  }

  if (
    billingState.toLowerCase() === "tamil nadu" ||
    billingState.toLowerCase() === "tamilnadu"
  ) {
    
    setTaxType("CGST @ 9% + SGST @ 9%");
    return;
  }

  
  setTaxType("IGST @ 18%");
}, [fullClientDetails]);


useEffect(() => {

  const loadProfiles = async () => {

    try {

      const res =
        await api.get(
          "/company-profiles"
        );

      setProfiles(
        res.data || []
      );

    } catch (err) {

      console.error(
        "Failed to load company profiles",
        err
      );
    }
  };

  loadProfiles();

}, []);

const handleSaveDraft = async () => {

  const payload = {
    invoicenumber: invoiceNumber,

    clientid: parseInt(selectedClientId),

    bankid: parseInt(selectedBankId),

    invoicetype: invoiceType,

    invoicedate: invoiceDate,

    invoiceduedate: invoiceDueDate,

    currency: currency,

    signatureAuthorityId: Number(selectedSignatureAuthority),

    grandtotal: grandTotal,

    paymentstatus: "draft",

    updatedby: getStoredUserId(),

    taxtype: taxType,

    companyProfileId: Number(selectedProfileId),

    isSaveDraft: true,

    items: items.map((item: any) => ({
      description: item.description,
      quantity: 1,
      unitprice: item.amount,
      linetotal: item.amount,
      saccode: item.sacCode,

      customFieldValues: customFieldDefs
        .filter(
          (def) =>
            item[def.fieldId] !== undefined &&
            item[def.fieldId] !== ""
        )
        .map((def) => ({
          fieldId: Number(def.fieldId),
          value: String(item[def.fieldId]),
        })),
    })),

    customValues: selectedCustomFields.map(
      (field) => ({
        fieldId: Number(field.fieldId),
        value: field.value || "",
      })
    ),
  };

  try {

    let res;

if (id) {
  res = await api.put(`/invoices/${id}`, payload);
} else {
  res = await api.post("/invoices", payload);
}

if (res.status === 200) {
  showSuccess(
    id
      ? "Draft updated successfully"
      : "Draft saved successfully"
  );

  navigate("/invoices/pending");
}

  } catch (err) {

    showError("Failed to save draft");
  }
};



useEffect(() => {
  if (invoiceType === "proforma") {
    setInvoiceNumber("");
  }
}, [invoiceType]);




useEffect(() => {
  if (!id) return;

  loadInvoice(id);
}, [id]);

const loadInvoice = async (invoiceId: string) => {
  try {
    const res = await api.get(`/invoices/${invoiceId}`);

    const inv = res.data.data;


    // Header fields
    setSelectedClientId(String(inv.client.clientid));
    setSelectedBankId(String(inv.bankId));

    setInvoiceNumber(inv.invoicenumber);

    setInvoiceDate(
      inv.invoicedate?.split("T")[0]
    );

    setInvoiceDueDate(
      inv.invoiceduedate?.split("T")[0]
    );

    setCurrency(inv.currency || "");

    setTaxType(inv.taxtype || "");

    setSelectedSignatureAuthority(
      String(inv.signatureAuthorityId || "")
    );

   

    // Items
    if (inv.items) {
      setItems(
        inv.items.map((item: any) => ({
          id: String(item.itemid),
          description: item.description || "",
          sacCode: item.sacCode || "",
          amount: Number(item.unitprice || 0),
          customFieldValues:
            item.customFieldValues || [],
        }))
      );
    }

    // Header custom fields
    if (inv.customValues) {
      setSelectedCustomFields(
        inv.customValues
      );
    }

  } catch (err) {
    console.error(err);
  }
};

  /* -------------------------------------------------------------------------- */
  /*                                   RETURN                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="p-3 max-w-7xl mx-auto bg-slate-50 min-h-screen text-slate-900">
      {/* TOAST */}
      <Toast
        ref={toastRef}
        position="top-right"
      />

      {/* HEADER */}
      <header className="flex justify-between items-end mb-10">
  <div>
    <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-slate-900">
      New Invoice
    </h1>
  </div>

  <div className="flex items-center gap-3">

        <button
  onClick={handleSaveDraft}
  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-200"
>
  <Save size={16} />
  Save Draft
</button>

        <button
          disabled={isSubmitting}
          onClick={() => {

  

  const selectedClient = fullClientDetails;

const selectedBank = banks.find(
  b => String(b.id) === selectedBankId
);

const selectedAuthority =
  signatureAuthorities.find(
    a => String(a.id) === selectedSignatureAuthority
  );

const selectedProfile = profiles.find(
  p => String(p.id) === selectedProfileId
);

  

setPreviewData({
  invoicenumber: invoiceNumber,
  invoicedate: invoiceDate,
  invoiceduedate: invoiceDueDate,

  invoiceType,

  currency,
  taxtype: taxType,

  grandtotal: grandTotal,

  companyName: selectedProfile?.companyName || "",

addressLine1: selectedProfile?.addressLine1 || "",
addressLine2: selectedProfile?.addressLine2 || "",

city: selectedProfile?.city || "",
state: selectedProfile?.state || "",
country: selectedProfile?.country || "",
pincode: selectedProfile?.pincode || "",

gstNumber: selectedProfile?.gstNumber || "",

companyEmail: selectedProfile?.email || "",
companyPhone: selectedProfile?.phoneNumber || "",

website: selectedProfile?.website || "",

companyLogoUrl: selectedProfile?.logoUrl || "",

  client: {
    name: selectedClient?.name || "",
    businessName: selectedClient?.name || "",
    billingAddress:
      selectedClient?.registeredAddress || "",

    billingState:
      selectedClient?.billingStateName || "",

    billingCountry:
      selectedClient?.billingCountryName || "",

    gstnumber:
      selectedClient?.gstnumber || "",

    pan:
      selectedClient?.pan || "",

    isexport:
      selectedClient?.isExport || false,

       supplytype:
    selectedClient?.supplytype ||
    selectedClient?.supplyType ||
    "",
  },

  bankDetails: selectedBank,

  signatureAuthorityName:
    selectedAuthority?.name || "",

  signatureAuthorityRole:
    selectedAuthority?.designation || "",

  signatureUrl:
  selectedAuthority?.signatureUrl || "",

  customValues: selectedCustomFields,

  items: items.map(item => ({
  itemid: Number(item.id),
  description: item.description,
  sacCode: item.sacCode,
  linetotal: item.amount,
  itemCustomValues: customFieldDefs
  .filter(
    (def) =>
      item[def.fieldId] !== undefined &&
      item[def.fieldId] !== ""
  )
  .map((def) => ({
    fieldId: def.fieldId,
    label: def.fieldLabel,
    value: String(item[def.fieldId]),
  })),
})),
});



  setIsPreviewOpen(true);
}}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 shadow-blue-200"
        >
          {isSubmitting ? (
            <>
              <Loader2
                size={14}
                className="animate-spin"
              />
              Generating...
            </>
          ) : (
            <>
              <Send size={16} />
              Review Invoice
            </>
          )}
        </button>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-3 gap-8">
        {/* LEFT */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            {/* HEADER */}
            <InvoiceHeader
              clients={clients}
              selectedClientId={
                selectedClientId
              }
              onClientChange={
                handleClientChange
              }
              banks={banks}
              selectedBankId={
                selectedBankId
              }
              onBankChange={
                setSelectedBankId
              }
              invoiceNumber={
                invoiceNumber
              }
              invoiceDate={invoiceDate}
              onDateChange={
                setInvoiceDate
              }
              invoiceDueDate={
                invoiceDueDate
              }
              onDueDateChange={
                setInvoiceDueDate
              }
              invoiceType={
                invoiceType
              }
              onInvoiceTypeChange={
                setInvoiceType
              }
             taxType={taxType}
onTaxTypeChange={setTaxType}


/>
            
          
            {/* CUSTOM FIELDS + CURRENCY */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <CustomFields
                fieldDefs={
                  customFieldDefs
                }
                onChange={
                  setSelectedCustomFields
                }
              />

            <div className="flex flex-col gap-2">
  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
  Currency
</label>

  <select
    value={currency}
    onChange={(e) =>
      setCurrency(e.target.value)
    }
    className="w-full bg-white border border-slate-500 rounded-2xl p-3.5 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer shadow-sm"
  >
    <option value="">
      Select Currency
    </option>

    {currencies.map((curr) => (
      <option
        key={curr.id}
        value={curr.currencyCode}
      >
        {curr.currencyCode} - {curr.currencyName}
      </option>
    ))}
  </select>
</div>

              {/* SIGNATURE AUTHORITY */}
  <div className="flex flex-col gap-2">

    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
  Signature Authority
</label>

    <select
      value={selectedSignatureAuthority}
      onChange={(e) =>
        setSelectedSignatureAuthority(
          e.target.value
        )
      }
      className="w-full bg-white border border-slate-500 rounded-2xl p-3.5 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer shadow-sm"
    >

      <option value="">
        Select Authority
      </option>

      {signatureAuthorities.map((authority) => (

        <option
          key={authority.id}
          value={authority.id}
        >
          {authority.name}
        </option>

      ))}

    </select>
  </div>

   {/* COMPANY PROFILE TABLE */}
 <div className="flex flex-col gap-2">

<label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
  Company Profile
</label>

  <select
    value={selectedProfileId}
    onChange={(e) =>
      setSelectedProfileId(
        e.target.value
      )
    }
    className="w-full bg-white border border-slate-500 rounded-2xl p-3.5 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer shadow-sm">

    <option value="">
      Select Profile
    </option>

    {profiles.map((profile) => (

      <option
        key={profile.id}
        value={profile.id}
      >
        {profile.companyName}
      </option>

    ))}

  </select>

            </div>

           
</div>



            {/* ITEMS TABLE */}
            <InvoiceItemsTable
              items={items}
              onItemsChange={setItems}
              currency={currency}
              customFields={selectedCustomFields}
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <InvoiceSummary
            subtotal={subtotal}
            taxType={taxType}
            cgstAmount={cgstAmount}
            sgstAmount={sgstAmount}
            igstAmount={igstAmount}
            currency={currency}
            adjustment={adjustment}
            onAdjustmentChange={setAdjustment}
          />
        </div>
      </div>
      {isPreviewOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white w-[900px] max-h-[90vh] overflow-y-auto rounded-xl shadow-xl p-4 relative">

      <button
        onClick={() => setIsPreviewOpen(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
      >
        ✕
      </button>

      {/* Invoice Preview */}

      {previewData && (
  <InvoicePreview
    previewData={previewData}
    onClose={() => setIsPreviewOpen(false)}
    onGenerate={handleGenerateInvoice}
  />
)}

      

    </div>
  </div>
)}
    </div>
  );
};

export default NewInvoice;
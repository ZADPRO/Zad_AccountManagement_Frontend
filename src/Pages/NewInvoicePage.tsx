import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';

import InvoiceItemsTable from '../components/invoice/InvoiceItemsTable';
import InvoiceSummary from '../components/invoice/InvoiceSummary';
import InvoiceHeader from '@/components/invoice/InvoiceHeader';
import CustomFields from "../components/invoice/CustomInvoiceFields";
import { getSignatureAuthorities } from "../api/signatureAuthorityApi";
import { type ClientListModel } from '@/types/clients';
import { useNavigate } from 'react-router-dom';
import api from '@/api/api';
import { Toast } from 'primereact/toast';

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
  
  rate: number;
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
  const toastRef = useRef<Toast>(null);

  

  /* -------------------------------------------------------------------------- */
  /*                                   STATES                                   */
  /* -------------------------------------------------------------------------- */

  // ✅ FIXED: added customFieldValues inside item
 const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: '',
      
      rate: 0,
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

  const [invoiceNumber] = useState(
    `INV-${Date.now().toString().slice(-6)}`
  );

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

    

  const handleClientChange = (clientId: string) => {

  setSelectedClientId(clientId);

  const selectedClient = clients.find(
    (client: any) =>
      String(
        client.clientId || client.id
      ) === clientId
  );

  if (!selectedClient) return;

  const clientState =
  fullClientDetails?.stateName?.toLowerCase() || "";

  if (
    clientState === "tamil nadu" ||
    clientState === "tamilnadu"
  ) {

    setTaxType(
      "CGST @ 9% + SGST @ 9%"
    );

  } else {

    setTaxType(
      "IGST @ 18%"
    );
  }
};

  /* -------------------------------------------------------------------------- */
  /* CALCULATIONS                                 */
  /* -------------------------------------------------------------------------- */

  const subtotal = items.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const gstAmount = (subtotal * 18) / 100;

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
      

      // ✅ ITEMS WITH CUSTOM FIELDS
      
items: items.map((item: any) => ({
  description: item.description,
  quantity: 1,
  unitprice: item.rate,
  linetotal: item.amount,
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
    console.log("CUSTOM VALUES:", selectedCustomFields);
console.log(
  "TYPE:",
  typeof selectedCustomFields
);
    console.log(payload);
    try {
      const res = await api.post(
        '/invoices',
        payload
      );

      if (res.data.status) {
        showSuccess(
          `Invoice ${invoiceNumber} created successfully`
        );

        setTimeout(() => {
          navigate('/invoices/pending');
        }, 1500);
      } else {
        showError(
          res.data.message ||
            "Failed to create invoice"
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

        setFullClientDetails({
          name:
            rawData.name ||
            rawData.businessName ||
            '-',

          clientCode:
            rawData.clientCode || '-',

          clienttype:
            rawData.clientType ||
            'Standard',

          mobilenumber:
            rawData.mobileNumber || '-',

          email:
            rawData.email || '-',

          registeredAddress:
            rawData.registeredAddress ||
            '-',

          countryName:
            rawData.countryName ||
            'India',

          stateName:
            rawData.stateName || '-',

          zip: rawData.zip || '-',

          gststatus:
            rawData.gstStatus ||
            'Registered',

          gstnumber:
            rawData.gstNumber || '-',

          pan: rawData.pan || '-',
        });
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

        <button
          disabled={isSubmitting}
          onClick={handleGenerateInvoice}
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
              Generate e-Invoice
            </>
          )}
        </button>
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
  <label className="text-sm font-semibold text-slate-700">
    Currency
  </label>

  <select
    value={currency}
    onChange={(e) =>
      setCurrency(e.target.value)
    }
    className="border border-slate-300 rounded-xl px-4 py-3 bg-white text-sm"
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

    <label className="text-sm font-semibold text-slate-700">
      Signature Authority
    </label>

    <select
      value={selectedSignatureAuthority}
      onChange={(e) =>
        setSelectedSignatureAuthority(
          e.target.value
        )
      }
      className="border border-slate-300 rounded-xl px-4 py-3 bg-white text-sm"
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
            </div>

            {/* COMPANY PROFILE TABLE */}
 <div className="flex flex-col gap-2">

  <label className="text-sm font-semibold text-slate-700">
    Company Profile
  </label>

  <select
    value={selectedProfileId}
    onChange={(e) =>
      setSelectedProfileId(
        e.target.value
      )
    }
    className="
      border
      border-slate-300
      rounded-xl
      px-4 py-3
      bg-white
      text-sm
    "
  >

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
    </div>
  );
};

export default NewInvoice;
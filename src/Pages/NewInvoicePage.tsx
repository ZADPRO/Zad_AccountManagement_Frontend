import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';

import InvoiceItemsTable from '../components/invoice/InvoiceItemsTable';
import InvoiceSummary from '../components/invoice/InvoiceSummary';
import InvoiceHeader from '@/components/invoice/InvoiceHeader';
import CustomFields from "../components/invoice/CustomInvoiceFields";
import CurrencyDropdown from "../components/invoice/CurrencyDropdown";

import { type ClientListModel } from '@/types/clients';
import { useNavigate } from 'react-router-dom';
import api from '@/api/api';
import { Toast } from 'primereact/toast';

/* -------------------------------------------------------------------------- */
/*                                  INTERFACES                                */
/* -------------------------------------------------------------------------- */
interface CustomFieldDefinition {
  id: number;
  label: string;
  type: string;
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
  quantity: number;
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

  const MY_BUSINESS_STATE = "Tamil Nadu";

  /* -------------------------------------------------------------------------- */
  /*                                   STATES                                   */
  /* -------------------------------------------------------------------------- */

  // ✅ FIXED: added customFieldValues inside item
 const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      customFieldValues: [],
    },
  ]);

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

  const [currency, setCurrency] = useState("INR");

  // ✅ BANK STATES
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');

  // ✅ INVOICE TYPE
  const [invoiceType, setInvoiceType] = useState('invoice');

   const [taxRate, setTaxRate] = useState(18);
   const [tdsRate, setTdsRate] = useState(2);
 

  /* -------------------------------------------------------------------------- */
  /*                               CALCULATIONS                                 */
  /* -------------------------------------------------------------------------- */

  const subtotal = items.reduce(
    (sum, item) => sum + item.amount,
    0
  );

 

  // const isExport =
  //   fullClientDetails?.countryName?.toLowerCase() !== "india";

  const isInterState =
    fullClientDetails?.stateName !== MY_BUSINESS_STATE;

  // const activeTaxRate = isExport ? 0 : taxRate;

  const gstAmount = (subtotal * taxRate) / 100;

  const tdsAmount = (subtotal * tdsRate) / 100;

  const grandTotal = subtotal + gstAmount - tdsAmount;

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

      grandtotal: grandTotal,

      paymentstatus: "pending",

      updatedby: getStoredUserId(),

      taxamount:  gstAmount,
      tdsamount: tdsAmount,

      // ✅ ITEMS WITH CUSTOM FIELDS
      items: items.map((item: any) => ({
        description: item.description,

        quantity: item.quantity,

        unitprice: item.rate,

        linetotal: item.amount,

        customFieldValues: selectedCustomFields.map((field) => ({
  fieldId: field.fieldId,
  label: field.label,
  value: item[String(field.fieldId)] ?? "",
})),
      })),

      // ✅ HEADER LEVEL CUSTOM FIELDS
      customValues: selectedCustomFields.map(
        (field) => ({
          fieldId: field.fieldId,
          label: field.label,
          value: field.value,
        })
      ),
    };
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
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
                setSelectedClientId
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
             taxRate={taxRate}
  onTaxRateChange={setTaxRate}
  

   tdsRate={tdsRate}
  onTdsRateChange={setTdsRate}
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

              <CurrencyDropdown
                selectedCurrency={
                  currency
                }
                onCurrencyChange={
                  setCurrency
                }
              />
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
            taxRate={taxRate}
            tdsRate={tdsRate}
            isInterState={
              isInterState
            }
            currency={currency}
          />
        </div>
      </div>
    </div>
  );
};

export default NewInvoice;
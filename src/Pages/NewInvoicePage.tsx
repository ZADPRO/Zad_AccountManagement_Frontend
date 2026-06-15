import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Save, Hash, Trash2 } from 'lucide-react';

import InvoiceItemsTable from '../components/invoice/InvoiceItemsTable';
import InvoiceSummary from '../components/invoice/InvoiceSummary';
import InvoiceHeader from '@/components/invoice/InvoiceHeader';
import { getSignatureAuthorities } from "../api/signatureAuthorityApi";
import { type ClientListModel } from '@/types/clients';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/api/api';
import { Toast } from 'primereact/toast';
import InvoicePreview from "../components/invoice/InvoicePreview";

/* -------------------------------------------------------------------------- */
/* INTERFACES                                 */
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
/* HELPER FUNCTION                              */
/* -------------------------------------------------------------------------- */
const getStoredUserId = () => {
  const id = sessionStorage.getItem('userId');
  return id ? Number(id) : 0;
};

/* -------------------------------------------------------------------------- */
/* CHILD COMPONENT: CUSTOM FIELDS                    */
/* -------------------------------------------------------------------------- */
const CustomFields = ({ fieldDefs, selectedFields, onChange }: any) => {
  const handleAddField = (fieldId: number) => {
    if (selectedFields.some((f: any) => f.fieldId === fieldId)) return;

    const field = fieldDefs.find((f: any) => f.fieldId === fieldId);
    if (!field) return;

    const updated = [
      ...selectedFields,
      {
        fieldId,
        label: field.fieldLabel,
        value: ""
      }
    ];
    onChange(updated);
  };

  
  const removeField = (index: number) => {
    const updated = selectedFields.filter((_: any, i: number) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
        <Hash size={12} strokeWidth={3} className="text-blue-600" /> Custom Fields
      </label>

      <select
        onChange={(e) => handleAddField(parseInt(e.target.value))}
        className="w-full bg-white border border-slate-500 rounded-xl p-3 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 transition-all"
        value=""
      >
        <option value="">Select Field</option>
        {fieldDefs.map((f: any) => (
          <option key={f.fieldId} value={f.fieldId}>
            {f.fieldLabel}
          </option>
        ))}
      </select>

      {selectedFields
        .filter((field: any) => field.label?.trim())
        .map((field: any, index: number) => (
          <div
            key={field.fieldId}
            className="flex gap-3 items-center bg-slate-50 border border-slate-500 rounded-xl p-3"
          >
            <span className="w-40 text-sm font-semibold text-slate-700">
              {field.label}
            </span>

          
  

            <button
              type="button"
              onClick={() => removeField(index)}
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */
const NewInvoice = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const toastRef = useRef<Toast>(null);

  /* -------------------------------------------------------------------------- */
  /* STATES                                   */
  /* -------------------------------------------------------------------------- */
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: '',
      sacCode: '',
      amount: 0,
      customFieldValues: [],
    },
  ]);

  useEffect(() => {
  // console.log("ITEMS STATE =", items);
}, [items]);

  const [adjustment, setAdjustment] = useState<number>(0);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [clients, setClients] = useState<ClientListModel[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [fullClientDetails, setFullClientDetails] = useState<any>(null);
  const [, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
  const [selectedCustomFields, setSelectedCustomFields] = useState<CustomFieldValue[]>([]);
  const [currency, setCurrency] = useState("");
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [invoiceType, setInvoiceType] = useState('invoice');
  const [signatureAuthorities, setSignatureAuthorities] = useState<any[]>([]);
  const [selectedSignatureAuthority, setSelectedSignatureAuthority] = useState("");
  const [taxType, setTaxType] = useState("IGST @ 18%");
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  /* -------------------------------------------------------------------------- */
  /* CALCULATIONS                                */
  /* -------------------------------------------------------------------------- */
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = taxType === "NO TAX" ? 0 : 18;
  const gstAmount = (subtotal * taxRate) / 100;

  const cgstAmount = taxType === "CGST @ 9% + SGST @ 9%" ? gstAmount / 2 : 0;
  const sgstAmount = taxType === "CGST @ 9% + SGST @ 9%" ? gstAmount / 2 : 0;
  const igstAmount = taxType === "IGST @ 18%" ? gstAmount : 0;
  const rawTotal = subtotal + gstAmount;

  useEffect(() => {
    if (rawTotal % 1 !== 0) {
      const rounded = Math.round(rawTotal);
      const diff = rounded - rawTotal;
      setAdjustment(Number(diff.toFixed(2)));
    } else {
      setAdjustment(0);
    }
  }, [rawTotal]);

  const grandTotal = rawTotal + Number(adjustment);

  /* -------------------------------------------------------------------------- */
  /* TOASTS                                   */
  /* -------------------------------------------------------------------------- */
  const showSuccess = (detail: string) => {
    toastRef.current?.show({ severity: 'success', summary: 'Success', detail, life: 3000 });
  };

  const showError = (detail: string) => {
    toastRef.current?.show({ severity: 'error', summary: 'Error', detail, life: 4000 });
  };

  /* -------------------------------------------------------------------------- */
  /* DATA FETCHING                                */
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

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await api.get('/banking/current');
        const bankList = (res.data.data || []).map((b: any) => ({
          ...b,
          id: b.detailsId,
        }));
        setBanks(bankList);
      } catch (err) {
        showError("Failed to load bank details");
      }
    };
    fetchBanks();
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedClientId) {
        setFullClientDetails(null);
        return;
      }
      try {
        const res = await api.get(`/clients/${selectedClientId}`);
        const rawData = res.data.data || res.data;

        const clientDetails = {
          name: rawData.name || rawData.businessName || "-",
          supplytype: rawData.supplyTypeId === 1 ? "B2B" : rawData.supplyTypeId === 2 ? "B2C" : rawData.supplyTypeId === 3 ? "C2C" : "",
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
        setFullClientDetails(clientDetails);
      } catch (err) {
        showError("Failed to load client details");
      }
    };
    fetchDetails();
  }, [selectedClientId]);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await api.get('/custom-fields');
        const rawData = res.data?.fields || [];
        setCustomFieldDefs(
          rawData.map((f: any) => ({
            fieldId: f.fieldId,
            fieldLabel: f.fieldLabel,
            fieldType: f.fieldType,
            isRequired: f.isRequired,
          }))
        );
      } catch (err) {
        showError("Failed to load custom fields");
      }
    };
    fetchFields();
  }, []);

  useEffect(() => {
    if (currencies.length > 0 && !currency) {
      setCurrency(currencies[0].currencyCode);
    }
  }, [currencies, currency]);

  useEffect(() => {
    const loadSignatureAuthorities = async () => {
      try {
        const data = await getSignatureAuthorities();
        setSignatureAuthorities(data);
      } catch (err) {
        console.error("Failed to load signature authorities", err);
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
        console.error("Failed to load currencies", err);
      }
    };
    loadCurrencies();
  }, []);

  useEffect(() => {
    if (!fullClientDetails) return;
    const isExport = fullClientDetails.isExport;
    const billingState = fullClientDetails.billingStateName || "";

    if (isExport) {
      setTaxType("NO TAX");
      return;
    }
    if (billingState.toLowerCase() === "tamil nadu" || billingState.toLowerCase() === "tamilnadu") {
      setTaxType("CGST @ 9% + SGST @ 9%");
      return;
    }
    setTaxType("IGST @ 18%");
  }, [fullClientDetails]);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const res = await api.get("/company-profiles");
        setProfiles(res.data || []);
      } catch (err) {
        console.error("Failed to load company profiles", err);
      }
    };
    loadProfiles();
  }, []);

  useEffect(() => {
    if (invoiceType === "proforma") {
      setInvoiceNumber("");
    }
  }, [invoiceType]);

  /* -------------------------------------------------------------------------- */
  /* INVOICE EDIT & PREFILL ENGINE                       */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!id) return;
    loadInvoice(id);
  }, [id]);

  // Combined Prefill Tracker Effect
  useEffect(() => {
    if (!id || customFieldDefs.length === 0 || !previewData?.rawCustomValues) return;

    const mappedCustomFields = previewData.rawCustomValues.map((cv: any) => {
      const def = customFieldDefs.find((f) => f.fieldId === cv.fieldId);
      return {
        fieldId: cv.fieldId,
        label: def?.fieldLabel || `Field ${cv.fieldId}`,
        value: cv.value || "",
      };
    });

    setSelectedCustomFields(mappedCustomFields);
  }, [customFieldDefs, id, previewData?.rawCustomValues]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}`);
      const inv = res.data.data;

      setSelectedClientId(String(inv.client.clientid));
      setSelectedBankId(String(inv.bankId));
      setInvoiceNumber(inv.invoicenumber);
      setInvoiceDate(inv.invoicedate?.split("T")[0]);
      setInvoiceDueDate(inv.invoiceduedate?.split("T")[0]);
      setCurrency(inv.currency || "");
      setTaxType(inv.taxtype || "");
      setSelectedSignatureAuthority(String(inv.signatureAuthorityId || ""));
      setSelectedProfileId(String(inv.companyProfileId || ""));

      // Preserve clean data arrays for the asynchronous prefill engine matcher
      setPreviewData((prev: any) => ({
        ...prev,
        rawCustomValues: inv.customValues || []
      }));

      if (inv.items) {

  // console.log("RAW ITEMS FROM API =",inv.items);



  setItems(
  inv.items.map((item: any) => {

    const dynamicFields =
      (item.customFieldValues || []).reduce(
        (acc: any, field: any) => {
          acc[field.fieldId] = field.value;
          return acc;
        },
        {}
      );

    return {
      id: String(item.itemid),
      description: item.description || "",
      sacCode: item.sacCode || "",
      amount: Number(item.unitprice || 0),
      customFieldValues: item.customFieldValues || [],

      ...dynamicFields
    };
  })
);
  // console.log("FULL INVOICE RESPONSE =",inv);
}
    } catch (err) {

      console.error("Error running invoice lookup sync engine:", err);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* ACTIONS                                      */
  /* -------------------------------------------------------------------------- */
  const handleGenerateInvoice = async () => {
    if (!selectedClientId) { showError("Please select a client"); return; }
    if (!selectedBankId) { showError("Please select a bank"); return; }
    if (items.some((item) => !item.description || !item.sacCode || item.amount <= 0)) {
      showError("All items must have description and amount");
      return;
    }
    if (!selectedProfileId) { showError("Please select a company profile"); return; }

    setIsSubmitting(true);

    // console.log("ITEMS BEFORE SAVE =", items);

/*console.log(
  "ITEM CUSTOM VALUES =",
  items.map(item => ({
    description: item.description,
    customFieldValues: customFieldDefs
      .filter(
        def =>
          item[def.fieldId] !== undefined &&
          item[def.fieldId] !== ""
      )
      .map(def => ({
        fieldId: def.fieldId,
        value: item[def.fieldId]
      }))
  }))
);*/

// // console.log("FIRST ITEM CUSTOM FIELD =",items[0].customFieldValues);

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
      paymentstatus: "pending",
      updatedby: getStoredUserId(),
      taxtype: taxType,
      companyProfileId: Number(selectedProfileId),
      isSaveDraft: false,
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
      customValues: selectedCustomFields.map((field) => ({
        fieldId: Number(field.fieldId),
        value: field.value || "",
      })),
    };

    try {

      // console.log("PAYLOAD CUSTOM VALUES =",selectedCustomFields);

// console.log("PAYLOAD =",payload);
      let res = id ? await api.put(`/invoices/${id}`, payload) : await api.post("/invoices", payload);
      if (res.status === 200) {
        showSuccess(id ? `Invoice ${invoiceNumber} updated successfully` : `Invoice ${invoiceNumber} created successfully`);
        setTimeout(() => navigate('/invoices/pending'), 1500);
      } else {
        showError(res.data.message || "Failed to save invoice");
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || "Something went wrong");
    } {
      setIsSubmitting(false);
    }
  };

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
          .filter((def) => item[def.fieldId] !== undefined && item[def.fieldId] !== "")
          .map((def) => ({
            fieldId: Number(def.fieldId),
            value: String(item[def.fieldId]),
          })),
      })),
      customValues: selectedCustomFields.map((field) => ({
        fieldId: Number(field.fieldId),
        value: field.value || "",
      })),
    };

    try {
      let res = id ? await api.put(`/invoices/${id}`, payload) : await api.post("/invoices", payload);
      if (res.status === 200) {
        showSuccess(id ? "Draft updated successfully" : "Draft saved successfully");
        navigate("/invoices/pending");
      }
    } catch (err) {
      showError("Failed to save draft");
    }
  };



  /* -------------------------------------------------------------------------- */
  /* RETURN                                   */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="p-3 max-w-7xl mx-auto bg-slate-50 min-h-screen text-slate-900">
      <Toast ref={toastRef} position="top-right" />

      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-slate-900">
            {id ? "Edit Invoice" : "New Invoice"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-200"
          >
            <Save size={16} /> Save Draft
          </button>

          <button
            disabled={isSubmitting}
            onClick={() => {
              const selectedClient = fullClientDetails;
              const selectedBank = banks.find(b => String(b.id) === selectedBankId);
              const selectedAuthority = signatureAuthorities.find(a => String(a.id) === selectedSignatureAuthority);
              const selectedProfile = profiles.find(p => String(p.id) === selectedProfileId);

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
                  billingAddress: selectedClient?.registeredAddress || "",
                  billingState: selectedClient?.billingStateName || "",
                  billingCountry: selectedClient?.billingCountryName || "",
                  gstnumber: selectedClient?.gstnumber || "",
                  pan: selectedClient?.pan || "",
                  isexport: selectedClient?.isExport || false,
                  supplytype: selectedClient?.supplytype || selectedClient?.supplyType || "",
                },
                bankDetails: selectedBank,
                signatureAuthorityName: selectedAuthority?.name || "",
                signatureAuthorityRole: selectedAuthority?.designation || "",
                signatureUrl: selectedAuthority?.signatureUrl || "",
                customValues: selectedCustomFields,
                items: items.map(item => ({
                  itemid: Number(item.id),
                  description: item.description,
                  sacCode: item.sacCode,
                  linetotal: item.amount,
                  itemCustomValues: customFieldDefs
                    .filter((def) => item[def.fieldId] !== undefined && item[def.fieldId] !== "")
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
                <Loader2 size={14} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Send size={16} /> Review Invoice
              </>
            )}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <InvoiceHeader
              clients={clients}
              selectedClientId={selectedClientId}
              onClientChange={handleClientChange}
              banks={banks}
              selectedBankId={selectedBankId}
              onBankChange={setSelectedBankId}
              invoiceNumber={invoiceNumber}
              invoiceDate={invoiceDate}
              onDateChange={setInvoiceDate}
              invoiceDueDate={invoiceDueDate}
              onDueDateChange={setInvoiceDueDate}
              invoiceType={invoiceType}
              onInvoiceTypeChange={setInvoiceType}
              taxType={taxType}
              onTaxTypeChange={setTaxType}
            />
            
            <div className="grid grid-cols-3 gap-6 mb-8">

              
              <CustomFields
                fieldDefs={customFieldDefs}
                selectedFields={selectedCustomFields}
                onChange={setSelectedCustomFields}
              />

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-white border border-slate-500 rounded-2xl p-3.5 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer shadow-sm"
                >
                  <option value="">Select Currency</option>
                  {currencies.map((curr) => (
                    <option key={curr.id} value={curr.currencyCode}>
                      {curr.currencyCode} - {curr.currencyName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Signature Authority
                </label>
                <select
                  value={selectedSignatureAuthority}
                  onChange={(e) => setSelectedSignatureAuthority(e.target.value)}
                  className="w-full bg-white border border-slate-500 rounded-2xl p-3.5 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer shadow-sm"
                >
                  <option value="">Select Authority</option>
                  {signatureAuthorities.map((authority) => (
                    <option key={authority.id} value={authority.id}>
                      {authority.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Company Profile
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full bg-white border border-slate-500 rounded-2xl p-3.5 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer shadow-sm"
                >
                  <option value="">Select Profile</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <InvoiceItemsTable
              items={items}
              onItemsChange={setItems}
              currency={currency}
              customFields={selectedCustomFields}
            />
          </div>
        </div>

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
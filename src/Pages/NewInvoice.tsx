import { useState, useEffect } from 'react';
import { FileText, Send} from 'lucide-react';
import InvoiceItemsTable from '../components/invoice/InvoiceItemsTable';
import InvoiceSummary from '../components/invoice/InvoiceSummary';
import { type ClientListModel } from '@/types/clients';
import { useNavigate } from 'react-router-dom'; 
import api from '@/api/api';
import CustomFields from "../components/invoice/CustomInvoiceFields";

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
const NewInvoice = () => {
  const navigate = useNavigate();
  const MY_BUSINESS_STATE = "Tamil Nadu"; 

  // --- States ---
  const [items, setItems] = useState([{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`); // Simple generator
  
  const [clients, setClients] = useState<ClientListModel[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [fullClientDetails, setFullClientDetails] = useState<any>(null);
  const [, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Calculations ---
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = 18;
  const tdsRate = 2;

  // Tax Determination
  const isExport = fullClientDetails?.countryName.toLowerCase() !== "india";
  const isInterState = fullClientDetails?.stateName !== MY_BUSINESS_STATE;
  const activeTaxRate = isExport ? 0 : taxRate;

  const gstAmount = (subtotal * activeTaxRate) / 100;
  const tdsAmount = (subtotal * tdsRate) / 100;
  const grandTotal = subtotal + gstAmount - tdsAmount;
  // ✅ Custom Fields
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
  const [selectedCustomFields, setSelectedCustomFields] = useState<CustomFieldValue[]>([]);
 

const handleGenerateInvoice = async () => {
    // 1. Validations remain purely frontend logic
    if (!selectedClientId) return alert("Please select a client");
    if (items.some(item => !item.description || item.amount <= 0)) {
        return alert("Please ensure all items have a description and value");
    }

    setIsSubmitting(true);
    
    // 2. Payload construction
    const payload = {
      invoicenumber: invoiceNumber,
      clientid: parseInt(selectedClientId),
      invoicedate: invoiceDate,
      grandtotal: grandTotal,
      paymentstatus: 'pending',
      updatedby: 5, // Replace with your auth context user ID
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitprice: item.rate, 
        linetotal: item.amount 
      })),
       // ✅ Custom Fields
     customValues: selectedCustomFields.map(field => ({
        fieldId: field.fieldId,
        label: field.label,
        value: field.value
      }))
    };

    try {
      // 3. Axios POST request
      // No need for full URL, manual token retrieval, or JSON.stringify
     console.log(JSON.stringify(payload, null, 2));
      const res = await api.post('/invoices', payload);
      
      // 4. Handle response (Axios puts data in res.data)
      if (res.data.status) {
        alert("Invoice Created!");
        navigate('/invoices/pending');
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (err: any) {
      // 5. Catch network errors or 4xx/5xx responses from Go
      console.error("Save failed:", err);
      const msg = err.response?.data?.message || "Something went wrong";
      alert("Submission Error: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (Keep your useEffects for fetching clients and details)
 useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        // 1. Axios handles the BaseURL and Authorization header automatically
        const res = await api.get('/clients');

        // 2. Axios automatically parses JSON; access your backend data via .data
        // If your Go backend sends { "clients": [...] }, use res.data.clients
        setClients(res.data.clients || []);
        
      } catch (err: any) {
        // 3. Axios provides easy access to backend error messages
        console.error("Fetch list failed:", err.response?.data?.message || err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  // 2. Client Selection: Fetch tax details and MAP correctly
useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedClientId) {
        setFullClientDetails(null);
        return;
      }

      try {
        // 1. Axios handles the BaseURL and Token via Interceptors automatically
        const res = await api.get(`/clients/${selectedClientId}`);
        
        // 2. Axios results are in res.data. 
        // If your backend follows the { status: true, data: {...} } pattern:
        const rawData = res.data.data || res.data; 

        // ✅ MAPPING remains the same, but now it's safer with rawData from Axios
        const mappedClient = {
          name: rawData.name || rawData.businessName || '-',
          clientCode: rawData.clientCode || '-',
          clienttype: rawData.clientType || 'Standard',
          mobilenumber: rawData.mobileNumber || '-',
          email: rawData.email || '-',
          registeredAddress: rawData.registeredAddress || '-',
          countryName: rawData.countryName || 'India',
          stateName: rawData.stateName || '-', 
          zip: rawData.zip || '-',
          gststatus: rawData.gstStatus || 'Registered',
          gstnumber: rawData.gstNumber || '-',
          pan: rawData.pan || '-'
        };

        setFullClientDetails(mappedClient);
      } catch (err: any) {
        // 3. Detailed error logging
        console.error("Fetch details failed:", err.response?.data?.message || err.message);
      }
    };
    
    fetchDetails();
  }, [selectedClientId]);


   

useEffect(() => {
        const fetchFields = async () => {
            try {
                const res = await api.get('/custom-fields');
                
                // Accessing 'fields' as seen in your Axios log
                const rawData = res.data?.fields || []; 
                
                const fieldslist = rawData.map((f: any) => ({
  fieldId: f.fieldId,       
  fieldLabel: f.fieldLabel,  
  fieldType: f.fieldType,
  isRequired: f.isRequired
}));
               
                setCustomFieldDefs(fieldslist);
            } catch (err) {
                console.error("Error fetching custom fields:", err);
            }
        };

        fetchFields();
    }, []);

    

 return (
  <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen text-slate-900">
    
    {/* Header */}
    <header className="flex justify-between items-end mb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-slate-900">
          <FileText className="text-blue-600" /> New Invoice
        </h1>
      </div>

      <div className="flex gap-3">
        <button 
          disabled={isSubmitting}
          onClick={handleGenerateInvoice}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
        >
          <Send size={16} /> {isSubmitting ? 'Generating...' : 'Generate e-Invoice'}
        </button>
      </div>
    </header>

    {/* Main Grid */}
    <div className="grid grid-cols-3 gap-8">

      {/* LEFT SIDE */}
      <div className="col-span-2 space-y-6">
        
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          
          {/* Client + Date */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Client Selection
              </label>
              <select 
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
              >
                <option value="">Select a Client...</option>
                {clients.map((client) => (
                  <option key={client.clientId} value={client.clientId}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Invoice Date
              </label>
              <input 
                type="date" 
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-blue-500 transition-all"
              />
            </div>

          </div>

          {/* Items */}
          <InvoiceItemsTable items={items} onItemsChange={setItems} />

        </div>

        {/* ✅ Custom Fields (correct placement) */}
        <CustomFields
          fieldDefs={customFieldDefs}
          onChange={setSelectedCustomFields}
        />

      </div>

      {/* RIGHT SIDE */}
      <div className="space-y-6">
        <InvoiceSummary 
          subtotal={subtotal}
          taxRate={activeTaxRate}
          tdsRate={tdsRate}
          isInterState={isInterState}
        />
      </div>

    </div>
  </div>
);
}
export default NewInvoice;
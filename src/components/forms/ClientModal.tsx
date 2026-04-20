import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Edit3, Eye, CheckCircle2, Loader2 } from 'lucide-react';
import api  from '@/api/api';

interface DropdownItem {
  id: number | string;
  name: string;
}

interface ClientModalProps {
  isOpen: boolean;
  
  onClose: () => void;
  onSave: (client: any) => void;
  initialData?: any; // Used to get the ID for fetching
  mode?: 'create' | 'edit' | 'view';
}

const ClientModal = ({ isOpen, onClose, onSave, initialData, mode = 'create'}: ClientModalProps) => { 

   const generateClientCode = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    return `CLT-${year}-${random}`;
  };
  const getSupplyTypeId = (type: string, country: string) => {
  if (country !== 'India') return 3; // Export
  if (type === 'B2B') return 1;
  if (type === 'B2C') return 2;
  return 1;
};
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(mode !== 'view');
  const [countries, setCountries] = useState<DropdownItem[]>([]);
  const [states, setStates] = useState<DropdownItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [preparedPayload, setPreparedPayload] = useState<any>(null); 
  const [errors, setErrors] = useState<Record<string, string>>({});

  const FieldLabel = ({ label, fieldName, required }: { label: string; fieldName: string; required?: boolean }) => (
    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 transition-colors duration-200 ${
      errors[fieldName] ? 'text-rose-600' : 'text-slate-400'
    }`}>
      {label} {required && '*'}
      {errors[fieldName] && (
        <span className="ml-1 lowercase italic font-bold text-rose-500 animate-in fade-in slide-in-from-left-1">
          ({errors[fieldName]})
        </span>
      )}
    </label>
  );
  
  const emptyForm = {
    id: '',
    clientCode: '',
    name: '',
    email: '',
    mobileNumber: '',
    address: '',
    country: 'India',
    state: '',
    zip: '',
    gstStatus: 'Registered',
    supplyType: 'B2B',
    gstNumber: '',
    pan: ''
  };

  const [formData, setFormData] = useState(emptyForm);

  // 1. Logic to fetch Dropdowns and Detailed Client Data
useEffect(() => {
    const initializeModal = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        // 1. Fetch Dropdowns using your 'api' instance
        // Axios handles the baseURL and the token automatically
        const [countryRes, stateRes] = await Promise.all([
          api.get('/dropdowns/countries'),
          api.get('/dropdowns/states')
        ]);

        // Access data via .data.status and .data.data
        if (countryRes.data.status) setCountries(countryRes.data.data);
        if (stateRes.data.status) setStates(stateRes.data.data);

        // 2. Fetch Detailed Data if in Edit or View mode
        const clientId = initialData?.clientId || initialData?.clientID;
        
        if (clientId && mode !== 'create') {
          const res = await api.get(`/clients/${clientId}`);
          const json = res.data; // This is your backend's JSON response
          
          if (json.status) {
            const d = json.data;
            setFormData({
              id: d.clientId || d.clientID || '',
              clientCode: d.clientCode || '',
              name: d.businessName || d.name || '',
              email: d.email || '',
              mobileNumber: d.mobilenumber || d.mobileNumber || '',
              address: d.registeredAddress || d.address || '',
              country: d.countryName || d.country || 'India',
              state: d.stateName || d.state || '',
              zip: d.zip?.toString() || '',
              gstStatus: d.gststatus || d.gstStatus || 'Registered',
              supplyType: d.supplytype || d.supplyType || 'B2B',
              gstNumber: d.gstnumber || d.gstNumber || '',
              pan: d.pan || ''
            });
          }
        } else {
          // CREATE MODE: Assign the auto-incremented ID and CLT Code
          setFormData({
            ...emptyForm, 
            clientCode: generateClientCode(),
            country: 'India', 
            gstStatus: 'URD'
          });
        }
      } catch (err: any) {
        console.error("Initialization failed:", err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
        setStep(1);
        setIsEditing(mode !== 'view');
        setShowPreview(false);
      }
    };

    initializeModal();
  }, [isOpen, initialData, mode]);

  // Auto-set supply type logic based on country
  useEffect(() => {
    if (isEditing && formData.country) {
      if (formData.country !== 'India') {
        setFormData(prev => ({ ...prev, supplyType: 'Export' }));
      } else if (formData.country !== 'India' && formData.supplyType === 'Export') {
        setFormData(prev => ({ ...prev, supplyType: 'B2B' }));
      }
    }
  }, [formData.country, isEditing]);

  if (!isOpen) return null;

  // Validation Helpers
  const isValidMobile = (num: string) => /^[0-9]{10}$/.test(num);
  const isValidZip = (zip: string) => /^[0-9]{6}$/.test(zip);
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const handleNext = (e: React.MouseEvent) => {
  e.preventDefault();
  const newErrors: Record<string, string> = {};

  if (isEditing && step === 1) {
    // 1. Basic Details
    if (!formData.name.trim()) newErrors.name = "required";
    
    if (!isValidMobile(formData.mobileNumber)) {
        newErrors.mobileNumber = "10 digits required";
    }

    // 2. Email Validation (Cleaned up duplicate)
    if (!formData.email.trim()) {
  newErrors.email = "required"; 
} else if (!isValidEmail(formData.email)) {
  newErrors.email = "invalid format";
}

    // 3. Address & Country
    if (!formData.address.trim()) newErrors.address = "required";
    if (!formData.country) newErrors.country = "required";

    // 4. State (Only required for India)
    if (formData.country === 'India' && !formData.state) {
      newErrors.state = "required";
    }

    // 5. Zip Code (Required for everyone, but 6-digit check only for India)
    if (!formData.zip.trim()) {
      newErrors.zip = "required";
    } else if (formData.country === 'India' && !isValidZip(formData.zip)) {
      newErrors.zip = "6 digits required";
    }
  }

  // --- Final Check ---
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setErrors({}); 
  setStep(prev => prev + 1);
};


  
const handleFinalSubmit = (e: React.FormEvent) => {
  e.preventDefault(); // This stops the page reload
  
  const finalErrors: Record<string, string> = {};

  // Validate Step 3 fields manually since we disabled browser validation
  if (formData.country === 'India' && formData.gstStatus === 'Registered' && !formData.gstNumber.trim()) {
    finalErrors.gstNumber = "required";
  }
  if (!formData.pan.trim()) {
    finalErrors.pan = "required"; // 🔥 This will now trigger your red Label
  }

  if (Object.keys(finalErrors).length > 0) {
    setErrors(finalErrors);
    return; // ❌ CRITICAL: This stops the code before it creates the payload
  }

  // If we reach here, data is valid
  setErrors({});
  const isExport = formData.country !== 'India';
  
  // Construct payload only after validation passes
  const payload = {

    clientCode:        formData.clientCode,
    name:              formData.name,
    businessName:      formData.name,
    supplytypeid:      getSupplyTypeId(formData.supplyType, formData.country),
    clienttype:        isExport ? 'Export' : 'Direct',
    email:             formData.email || "", // Ensure no undefined values
    mobilenumber:      formData.mobileNumber,
    registeredAddress: formData.address,
    countryName:       formData.country,
    stateName:         isExport ? 'Export' : formData.state,
    zip:               isExport ? (Number(formData.zip) || 0) : (Number(formData.zip) || 0),
    gstnumber:         isExport ? "" : formData.gstNumber,
    pan:               formData.pan,
    isexport:          isExport,
    gststatus:         isExport ? "URD" : formData.gstStatus,
  };

  setPreparedPayload(payload);
  setShowPreview(true);
};
  const inputClass = `w-full bg-white border border-slate-200 rounded-xl p-3.5 text-slate-900 outline-none transition-all ${
    !isEditing ? 'bg-slate-50 cursor-not-allowed border-slate-100' : 'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5'
  }`;

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
    <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative">
      
      {/* HEADER WITH VISUAL STEP INDICATOR */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl ${!isEditing ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
            {!isEditing ? <Eye size={18} /> : <Edit3 size={18} />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {!isEditing ? 'Client Details' : (formData.id ? 'Edit Client' : 'Add New Client')}
            </h2>
            {/* NON-TEXT INDICATOR DOTS */}
            <div className="flex gap-1.5 mt-1">
              <div className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step === 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <div className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step === 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            </div>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>

      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-slate-400 text-sm font-medium">Fetching details...</p>
        </div>
      ) : (
        <form onSubmit={handleFinalSubmit} noValidate className="p-6">
          
          {/* STEP 1: MERGED CONTACT & ADDRESS */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="col-span-2 space-y-1">
                  <FieldLabel label="Business Name" fieldName="name" required />
                  <input 
                    required disabled={!isEditing}
                    className={`${inputClass} py-2 text-sm ${errors.name ? 'border-rose-500 ring-2 ring-rose-500/5' : ''}`} 
                    value={formData.name} 
                    onChange={e => {
                      setFormData({...formData, name: e.target.value});
                      if(errors.name) setErrors(prev => ({...prev, name: ''}));
                    }} 
                  />
                </div>

                <div className="space-y-1">
                  <FieldLabel label="Email" fieldName="email" />
                  <input 
                    type="email" disabled={!isEditing} 
                    className={`${inputClass} py-2 text-sm ${errors.email ? 'border-rose-500 ring-2 ring-rose-500/5' : ''}`} 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <FieldLabel label="Mobile" fieldName="mobileNumber" required />
                  <input 
                    required disabled={!isEditing} 
                    className={`${inputClass} py-2 text-sm ${errors.mobileNumber ? 'border-rose-500 ring-2 ring-rose-500/5' : ''}`} 
                    value={formData.mobileNumber} 
                    onChange={e => setFormData({...formData, mobileNumber: e.target.value})} 
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <FieldLabel label="Billing Address" fieldName="address" required />
                  <textarea 
                    required disabled={!isEditing} 
                    className={`${inputClass} h-16 py-2 text-sm resize-none ${errors.address ? 'border-rose-500 ring-2 ring-rose-500/5' : ''}`} 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <FieldLabel label="Country" fieldName="country" required />
                  <select 
                    required disabled={!isEditing} 
                    className={`${inputClass} py-2 text-sm ${errors.country ? 'border-rose-500 ring-2 ring-rose-500/5' : ''}`} 
                    value={formData.country} 
                    onChange={e => setFormData({...formData, country: e.target.value})}
                  >
                    <option value="">Select</option>
                    {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <FieldLabel label="State" fieldName="state" required />
                    <select 
                      required disabled={!isEditing} 
                      className={`${inputClass} py-2 text-sm ${errors.state ? 'border-rose-500 ring-2 ring-rose-500/5' : ''}`} 
                      value={formData.state} 
                      onChange={e => setFormData({...formData, state: e.target.value})}
                    >
                      <option value="">State</option>
                      {states.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <FieldLabel label="Zip" fieldName="zip" required />
                    <input 
                      required disabled={!isEditing} 
                      className={`${inputClass} py-2 text-sm ${errors.zip ? 'border-rose-500 ring-2 ring-rose-500/5' : ''}`} 
                      value={formData.zip} 
                      onChange={e => setFormData({...formData, zip: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TAX INFO */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                {formData.country === 'India' && (
                  <div className="space-y-1">
                    <FieldLabel label="GST Status" fieldName="gstStatus" />
                    <select 
                      disabled={!isEditing} className={`${inputClass} py-2 text-sm`}
                      value={formData.gstStatus} 
                      onChange={e => setFormData({...formData, gstStatus: e.target.value})}
                    >
                      <option value="Registered">Registered</option>
                      <option value="URD">Unregistered</option>
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <FieldLabel label="Supply Type" fieldName="supplyType" />
                  <select 
                    disabled={!isEditing} className={`${inputClass} py-2 text-sm`}
                    value={formData.supplyType} 
                    onChange={e => setFormData({...formData, supplyType: e.target.value})}
                  >
                    {formData.country === 'India' ? (
                      <><option value="B2B">B2B</option><option value="B2C">B2C</option></>
                    ) : <option value="Export">Export</option>}
                  </select>
                </div>
              </div>

              {formData.country === 'India' && formData.gstStatus === 'Registered' && (
                <div className="space-y-1">
                  <FieldLabel label="GSTIN" fieldName="gstNumber" required />
                  <input 
                    required disabled={!isEditing} 
                    className={`${inputClass} py-2 text-sm ${errors.gstNumber ? 'border-rose-500 ring-2 ring-rose-500/5' : ''}`} 
                    value={formData.gstNumber} 
                    onChange={e => setFormData({...formData, gstNumber: e.target.value})} 
                  />
                </div>
              )}

              <div className="space-y-1">
                <FieldLabel label={formData.country === 'India' ? 'PAN' : 'Tax ID'} fieldName="pan" required />
                <input 
                  required disabled={!isEditing} 
                  className={`${inputClass} py-2 text-sm ${errors.pan ? 'border-rose-500 ring-2 ring-rose-500/5' : ''}`} 
                  value={formData.pan} 
                  onChange={e => setFormData({...formData, pan: e.target.value})} 
                />
              </div>
            </div>
          )}

          {/* COMPACT FOOTER */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={step === 1 ? onClose : () => setStep(1)} 
              className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 hover:text-slate-600 transition-colors"
            >
              {step > 1 && <ChevronLeft size={14} />}
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            {step === 1 ? (
              <button 
                type="button" 
                onClick={handleNext} 
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : isEditing && (
              <button 
                type="submit" 
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95"
              >
                Review Details <Eye size={16} />
              </button>
            )}
          </div>
        </form>
      )}
      
      {/* PREVIEW POPUP remains mostly the same, but you may want to ensure it also uses text-sm for consistency */} 
	{showPreview && preparedPayload && (
          <div className="absolute inset-0 z-70 bg-white flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-200 overflow-y-auto">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600 mb-4"><CheckCircle2 size={40} /></div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Review Information</h3>
            <div className="w-full max-w-2xl bg-slate-50 rounded-2xl p-6 space-y-4 mb-8 text-sm">
              <div className="grid grid-cols-2 gap-4">
  {Object.entries(preparedPayload).map(([key, value]) => (
    <div key={key}>
      <p className="text-slate-400 text-xs uppercase font-bold">
        {key}
      </p>
      <p className="font-semibold wrap-break-word">
        {value?.toString() || '-'}
      </p>
    </div>
  ))}
</div>
              <div className="pt-2">
                <p className="text-slate-400 text-xs uppercase font-bold">Address</p>
                <p className="font-semibold">{preparedPayload.registeredAddress}, {preparedPayload.stateName}, {preparedPayload.countryName} - {preparedPayload.zip}</p>
              </div>
            </div>
            <div className="flex gap-4 w-full max-w-md">
              <button onClick={() => setShowPreview(false)} className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50">Go Back</button>
              <button onClick={() => { onSave(preparedPayload); onClose(); }} className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200">Confirm & Save</button>
            </div>
          </div>
        )}
    </div>
  </div>
);
};

export default ClientModal;
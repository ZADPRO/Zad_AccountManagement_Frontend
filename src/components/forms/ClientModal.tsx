import React, { useState, useEffect } from "react";
import {
  X,
  Edit3,
  Eye,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import api from "@/api/api";


interface DropdownItem {
  id: number | string;
  name: string;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: any) => void;
  initialData?: any;
  mode?: "create" | "edit" | "view";
}

const ClientModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = "create",
}: ClientModalProps) => {
  const COMPANY_IEC = "AACCZ1874E";

  const generateClientCode = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    
    return `CLT-${year}-${random}`;
  };

 const getSupplyTypeId = (type: string) => {
  if (type === "B2B") return 1;
  if (type === "B2C") return 2;
  if (type === "C2C") return 3;

  return 1;
};

 
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(mode !== "view");
  const [countries, setCountries] = useState<DropdownItem[]>([]);
  const [states, setStates] = useState<DropdownItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [preparedPayload, setPreparedPayload] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const FieldLabel = ({
    label,
    fieldName,
    required,
  }: {
    label: string;
    fieldName: string;
    required?: boolean;
  }) => (
    <label
      className={`text-[10px] font-black uppercase tracking-widest ml-1 transition-colors duration-200 ${
        errors[fieldName] ? "text-rose-600" : "text-slate-400"
      }`}
    >
      {label} {required && "*"}
      {errors[fieldName] && (
        <span className="ml-1 lowercase italic font-bold text-rose-500 animate-in fade-in slide-in-from-left-1">
          ({errors[fieldName]})
        </span>
      )}
    </label>
  );

  const emptyForm = {
  id: "",
  clientCode: "",
  name: "",
  email: "",
  mobileNumber: "",
  billingAddress: "",
  billingCountryId: 0,
  billingStateId: 0,
  pan: "",
  supplyType: "B2B",
  gstNumber: "",
  taxPercentage: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,


};

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const initializeModal = async () => {
      if (!isOpen) return;
      setLoading(true);

      try {
        const [countryRes, stateRes] = await Promise.all([
          api.get("/dropdowns/countries"),
          api.get("/dropdowns/states"),
        ]);

        const countryData = Array.isArray(countryRes.data?.data)
          ? countryRes.data.data
          : [];
        const stateData = Array.isArray(stateRes.data?.data)
          ? stateRes.data.data
          : [];

        setCountries(countryData);
        setStates(stateData);

        const clientId = initialData?.clientId || initialData?.clientID;

        if (clientId && mode !== "create") {
          const res = await api.get(`/clients/${clientId}`);
          const responseData = res.data;
          const clientDetails = responseData.data;

          if (responseData.status && clientDetails) {
            // Find billing country and state IDs from names
            const billingCountry = countryData.find(
              (c: DropdownItem) =>
                c.name === clientDetails.billingCountryName
            );
            const billingState = stateData.find(
              (s: DropdownItem) =>
                s.name === clientDetails.billingStateName
            );

            setFormData({
              id: clientDetails.clientId || clientId,
              clientCode: clientDetails.clientCode || "",
              name: clientDetails.name || clientDetails.businessName || "",
              email: clientDetails.email || "",
              mobileNumber:
                clientDetails.mobilenumber || clientDetails.mobileNumber || "",
              
              

              // Billing + Tax
              billingAddress: clientDetails.billingAddress || "",
              billingCountryId: billingCountry?.id as number || 0,
              billingStateId: billingState?.id as number || 0,
            
              supplyType:
                clientDetails.supplytype || clientDetails.supplyType || "B2B",
              gstNumber:
                clientDetails.gstnumber || clientDetails.gstNumber || "",
              pan: clientDetails.pan || "",
              taxPercentage: clientDetails.taxPercentage || clientDetails.tax_percentage || 0,
              cgst: clientDetails.cgst || 0,
              sgst: clientDetails.sgst || 0,
              igst: clientDetails.igst || 0,
            });
          }
        } else {
          setFormData({
            ...emptyForm,
            clientCode: generateClientCode(),
          });
        }
      } catch (err: any) {
        console.error(
          "Initialization failed:",
          err.response?.data?.message || err.message
        );
      } finally {
        setLoading(false);
        
        setIsEditing(mode !== "view");
        setShowPreview(false);
      }
    };

    initializeModal();
  }, [isOpen, initialData, mode]);

  if (!isOpen) return null;

  const isValidMobile = (num: string) => /^[0-9]{10}$/.test(num);
  // const isValidZip = (zip: string) => /^[0-9]{6}$/.test(zip);
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Derive billing country name for conditionals
  const billingCountryObj = countries.find(
    (c) => c.id === formData.billingCountryId
  );
  const isIndiaBilling = billingCountryObj?.name === "India";
  const isValidGSTIN = (gstin: string) =>
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
    gstin.toUpperCase().trim()
  );
  // --- Updated Step 1 Validation ---
  // --- Updated Step 1 Validation (Mandatory: Business Name, Mobile) ---
  

    

  // --- Updated Step 2 Validation (Mandatory: Billing Addr, Country, State if India) ---
  const handleFinalSubmit = (
  e?: React.FormEvent | React.MouseEvent
) => {
  e?.preventDefault();

    const finalErrors: Record<string, string> = {};

// Business Name
if (!formData.name.trim()) {
  finalErrors.name = "required";
}

// Mobile (optional)
if (
  formData.mobileNumber &&
  !isValidMobile(formData.mobileNumber)
) {
  finalErrors.mobileNumber = "10 digits required";
}


// Email (optional)
const email = formData.email?.trim();

if (email && !isValidEmail(email)) {
  finalErrors.email = "invalid email";
}

    // 3. Billing Address
    if (!formData.billingAddress.trim())
      finalErrors.billingAddress = "required";

    // 4. Billing Country
    if (!formData.billingCountryId || formData.billingCountryId === 0)
      finalErrors.billingCountryId = "required";

    // 5. Billing State (Only if India)
    if (isIndiaBilling && (!formData.billingStateId || formData.billingStateId === 0))
      finalErrors.billingStateId = "required";

    if (
  isIndiaBilling &&
  formData.gstNumber.trim() &&
  !isValidGSTIN(formData.gstNumber)
) {
  finalErrors.gstNumber = "invalid GSTIN";
}
    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }

    setErrors({});

    // Payload remains the same, ensuring optional fields default to empty strings
    const billingCountryName =
  countries.find(c => c.id === formData.billingCountryId)?.name || "-";

const billingStateName =
  states.find(s => s.id === formData.billingStateId)?.name || "-";

const payload = {
  clientId: formData.id,
  clientCode: formData.clientCode || generateClientCode(),
  name: formData.name,
  businessName: formData.name,
  supplytypeid: getSupplyTypeId(formData.supplyType),
  supplytype: formData.supplyType,
  clienttype: formData.supplyType,
  email: formData.email || "",
  mobilenumber: formData.mobileNumber,
  billingAddress: formData.billingAddress,
  billingCountryId: formData.billingCountryId,
  billingStateId:
    formData.billingStateId === 0 ? null : formData.billingStateId,
  gstnumber: isIndiaBilling ? formData.gstNumber : "",
  pan: isIndiaBilling ? formData.pan : "",
  isexport: !isIndiaBilling,
  cgst: formData.cgst,
sgst: formData.sgst,
igst: formData.igst,
tax_percentage:
  formData.cgst +
  formData.sgst +
  formData.igst,

  billingCountryName,
  billingStateName,
};



    setPreparedPayload(payload);
    setShowPreview(true);
  };

  const inputClass = `w-full bg-white border border-slate-200 rounded-xl p-3.5 text-slate-900 outline-none transition-all ${
    !isEditing
      ? "bg-slate-50 cursor-not-allowed border-slate-100"
      : "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
  }`;

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
    <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] min-h-0">
      
      {/* HEADER - Fixed at top */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div
            className={`p-2 rounded-xl transition-colors duration-300 ${
              !isEditing ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
            }`}
          >
            {!isEditing ? <Eye size={18} /> : <Edit3 size={18} />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {mode === "view" && "Client Details"}
              {mode === "edit" && "Edit Client"}
              {mode === "create" && "Add New Client"}
            </h2>
            
             
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
          <X size={20} />
        </button>
      </div>

      {/* BODY - Scrollable Area */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-slate-400 text-sm font-medium">Fetching details...</p>
          </div>
        ) : (
          <form onSubmit={handleFinalSubmit} noValidate className="p-6">

            {/* STEP 1 — Contact Information */}
            {(
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  
                  <div className="col-span-2 space-y-1">
                    <FieldLabel label="Business Name" fieldName="name" required />
                    <input
                      disabled={!isEditing}
                      className={`${inputClass} py-2 text-sm ${errors.name ? "border-rose-500 ring-2 ring-rose-500/5" : ""}`}
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <FieldLabel label="Email" fieldName="email"/>
                    <input
                      type="email"
                      disabled={!isEditing}
                      className={`${inputClass} py-2 text-sm ${errors.email ? "border-rose-500 ring-2 ring-rose-500/5" : ""}`}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <FieldLabel label="Mobile" fieldName="mobileNumber" />
                    <input
                      disabled={!isEditing}
                      className={`${inputClass} py-2 text-sm ${errors.mobileNumber ? "border-rose-500 ring-2 ring-rose-500/5" : ""}`}
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    />
                  </div>

                  

          

              
                </div>
              </div>
            )}

            {/* STEP 2 — Billing Address & Tax Info */}
            {(
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                
                <div className="space-y-1">
                  <FieldLabel label="Billing Address" fieldName="billingAddress" required />
                  <textarea
                    disabled={!isEditing}
                    className={`${inputClass} h-16 py-2 text-sm resize-none ${errors.billingAddress ? "border-rose-500 ring-2 ring-rose-500/5" : ""}`}
                    value={formData.billingAddress}
                    onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={isIndiaBilling ? "col-span-1 space-y-1" : "col-span-2 space-y-1"}>
                    <FieldLabel label="Billing Country" fieldName="billingCountryId" required />
                    <select
                      disabled={!isEditing}
                      className={`${inputClass} py-2 text-sm ${errors.billingCountryId ? "border-rose-500 ring-2 ring-rose-500/5" : ""}`}
                      value={formData.billingCountryId}
                      
                      onChange={(e) => {
  const selectedId = Number(e.target.value);

  const selectedCountry = countries.find(
    (c) => Number(c.id) === selectedId
  );

  const isExport = selectedCountry?.name !== "India";

  if (isExport) {
    setFormData({
      ...formData,
      billingCountryId: selectedId,
      billingStateId: 0,
      gstNumber: "",
      pan: "",
      cgst: 0,
      sgst: 0,
      igst: 0,
    });
  } else {
    setFormData({
      ...formData,
      billingCountryId: selectedId,
      billingStateId: 0,
    });
  }
}}

                    >
                      <option value={0}>Select Country</option>
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Billing State — only for India */}
                  {isIndiaBilling && (
                    <div className="space-y-1">
                      <FieldLabel label="Billing State" fieldName="billingStateId" required />
                      <select
                        disabled={!isEditing}
                        className={`${inputClass} py-2 text-sm ${errors.billingStateId ? "border-rose-500 ring-2 ring-rose-500/5" : ""}`}
                        value={formData.billingStateId}
                        onChange={(e) => {
  const stateId = Number(e.target.value);

  const selectedState = states.find(
    (s) => Number(s.id) === stateId
  );

  const isTamilNadu =
    selectedState?.name?.toLowerCase() === "tamil nadu";

  if (isTamilNadu) {
    setFormData({
      ...formData,
      billingStateId: stateId,
      cgst: 9,
      sgst: 9,
      igst: 0,
    });
  } else {
    setFormData({
      ...formData,
      billingStateId: stateId,
      cgst: 0,
      sgst: 0,
      igst: 18,
    });
  }
}}
                      >
                        <option value={0}>Select State</option>
                        {states.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-4">
                  
                  {/*  Supply Type — India only */}
                  
                    <div className="grid grid-cols-2 gap-4">
                    
                      <div className="space-y-1">
                        <FieldLabel label="Supply Type" fieldName="supplyType" />
                        <select
                          disabled={!isEditing}
                          className={`${inputClass} py-2 text-sm`}
                          value={formData.supplyType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                                supplyType: e.target.value,
                              })
                            }
                          >
                            <option value="B2B">B2B</option>
                            <option value="B2C">B2C</option>
                            <option value="C2C">C2C</option>
                          </select>
                      </div>
                    </div>

                  

                  

                  {/* GSTIN — India + Registered only */}
                  {isIndiaBilling &&  (
                    <div className="space-y-1">
                      <FieldLabel label="GSTIN" fieldName="gstNumber" />
                      <input
                        disabled={!isEditing}
                        className={`${inputClass} py-2 text-sm ${errors.gstNumber ? "border-rose-500 ring-2 ring-rose-500/5" : ""}`}
                        value={formData.gstNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gstNumber: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </div>
                  )}

                  {/* PAN / Tax ID + Tax % */}
                  <div className="grid grid-cols-2 gap-4">

  {isIndiaBilling && (
    <div className="space-y-1">
      <FieldLabel label="PAN" fieldName="pan" />
      <input
        disabled={!isEditing}
        className={`${inputClass} py-2 text-sm`}
        value={formData.pan}
        onChange={(e) =>
          setFormData({
            ...formData,
            pan: e.target.value,
          })
        }
      />
    </div>
  )}

  <div className="space-y-1">
    <div className="grid grid-cols-3 gap-4">

  <div>
    <FieldLabel label="CGST %" fieldName="cgst" />
    <input
      readOnly
      className={`${inputClass} py-2 text-sm bg-slate-50`}
      value={formData.cgst}
    />
  </div>

  <div>
    <FieldLabel label="SGST %" fieldName="sgst" />
    <input
      readOnly
      className={`${inputClass} py-2 text-sm bg-slate-50`}
      value={formData.sgst}
    />
  </div>

  <div>
    <FieldLabel label="IGST %" fieldName="igst" />
    <input
      readOnly
      className={`${inputClass} py-2 text-sm bg-slate-50`}
      value={formData.igst}
    />
  </div>

</div>
  </div>

</div>
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      {/* FOOTER - Fixed at bottom */}
      <div className="p-6 border-t border-slate-100 flex justify-between">

  <button
    type="button"
    onClick={onClose}
    className="text-slate-500"
  >
    Cancel
  </button>

  <button
    type="button"
    onClick={handleFinalSubmit}
    className="bg-emerald-600 text-white px-6 py-3 rounded-xl"
  >
    Review Details
  </button>

</div>

      {/* PREVIEW — fully scrollable, pinned footer */}
      {showPreview && preparedPayload && (
        <div className="absolute inset-0 z-[70] bg-white flex flex-col rounded-3xl overflow-hidden">
          
          {/* Scrollable preview content */}
          <div className="flex-1 overflow-y-auto min-h-0 p-8 flex flex-col items-center">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600 mb-4">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Review Information</h3>

            <div className="w-full max-w-xl bg-slate-50 rounded-2xl p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { label: "Business", val: preparedPayload.name },
                  { label: "Email", val: preparedPayload.email },
                  { label: "Contact", val: preparedPayload.mobilenumber },
                  
                    ...(preparedPayload.isexport
                      ? [
                          { label: "IEC Code", val: COMPANY_IEC },
                        ]
                      : [
                          { label: "PAN", val: preparedPayload.pan || "-" },
                          { label: "GSTIN", val: preparedPayload.gstnumber || "-" },
                        ]),

                  { label: "Supply Type", val: preparedPayload.supplytype },
                  { label: "Billing Country", val: preparedPayload.billingCountryName },
                   ...(preparedPayload.billingStateName &&
                    preparedPayload.billingStateName !== "-"
                      ? [
                          {
                            label: "Billing State",
                            val: preparedPayload.billingStateName,
                          },
                        ]
                      : []),
                  { label: "CGST", val: `${preparedPayload.cgst}%` },
                  { label: "SGST", val: `${preparedPayload.sgst}%` },
                  { label: "IGST", val: `${preparedPayload.igst}%` },
                  { label: "Total Tax", val: `${preparedPayload.tax_percentage}%` },
                  { label: "Is Export", val: preparedPayload.isexport ? "Yes" : "No" },
                ].map((item, idx) => (
                  <div key={idx}>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      {item.label}
                    </p>
                    <p className="font-semibold text-slate-700 break-words">{item.val || "-"}</p>
                  </div>
                ))}
              </div>

              

              <div className="pt-3 border-t border-slate-200/60">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                  Billing Address
                </p>
                <p className="font-semibold text-slate-700 leading-relaxed">
                  {preparedPayload.billingAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Preview footer — pinned */}
          <div className="p-6 border-t border-slate-100 flex gap-4 shrink-0 bg-white rounded-b-3xl">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(preparedPayload);
                console.log("Payload being sent:", preparedPayload);
                onClose();
              }}
              className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              Confirm & Save
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default ClientModal;
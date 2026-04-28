import React, { useState, useEffect } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Edit3,
  Eye,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import api from "@/api/apitest";

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
  const generateClientCode = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    return `CLT-${year}-${random}`;
  };

  const getSupplyTypeId = (type: string) => {
    if (type === "Export") return 3;
    if (type === "B2B") return 1;
    if (type === "B2C") return 2;
    return 1;
  };

  const [step, setStep] = useState(1);
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

    // Step 1 - Registered Address
    registeredAddress: "",
    registeredCountry: "India",
    registeredState: "",
    zip: "",

    // Step 2 - Billing + Tax
    billingAddress: "",
    billingCountryId: 0,
    billingStateId: 0,
    gstStatus: "Registered",
    supplyType: "B2B",
    gstNumber: "",
    pan: "",
    taxPercentage: 0,
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

              // Registered
              registeredAddress:
                clientDetails.registeredAddress || clientDetails.address || "",
              registeredCountry:
                clientDetails.countryName || clientDetails.country || "India",
              registeredState:
                clientDetails.stateName || clientDetails.state || "",
              zip: clientDetails.zip?.toString() || "",

              // Billing + Tax
              billingAddress: clientDetails.billingAddress || "",
              billingCountryId: billingCountry?.id as number || 0,
              billingStateId: billingState?.id as number || 0,
              gstStatus:
                clientDetails.gststatus ||
                clientDetails.gstStatus ||
                "Registered",
              supplyType:
                clientDetails.supplytype || clientDetails.supplyType || "B2B",
              gstNumber:
                clientDetails.gstnumber || clientDetails.gstNumber || "",
              pan: clientDetails.pan || "",
              taxPercentage: clientDetails.taxPercentage || clientDetails.tax_percentage || 0,
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
        setStep(1);
        setIsEditing(mode !== "view");
        setShowPreview(false);
      }
    };

    initializeModal();
  }, [isOpen, initialData, mode]);

  if (!isOpen) return null;

  const isValidMobile = (num: string) => /^[0-9]{10}$/.test(num);
  const isValidZip = (zip: string) => /^[0-9]{6}$/.test(zip);
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Derive billing country name for conditionals
  const billingCountryObj = countries.find(
    (c) => c.id === formData.billingCountryId
  );
  const isIndiaBilling = billingCountryObj?.name === "India";

  // --- Updated Step 1 Validation ---
  // --- Updated Step 1 Validation (Mandatory: Business Name, Mobile) ---
  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (isEditing && step === 1) {
      // 1. Business Name
      if (!formData.name.trim()) newErrors.name = "required";
      
      // 2. Mobile Number (10 digits)
      if (!isValidMobile(formData.mobileNumber)) {
        newErrors.mobileNumber = formData.mobileNumber.trim() === "" 
          ? "required" 
          : "10 digits required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep(2);
  };

  // --- Updated Step 2 Validation (Mandatory: Billing Addr, Country, State if India) ---
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalErrors: Record<string, string> = {};

    // 3. Billing Address
    if (!formData.billingAddress.trim())
      finalErrors.billingAddress = "required";

    // 4. Billing Country
    if (!formData.billingCountryId || formData.billingCountryId === 0)
      finalErrors.billingCountryId = "required";

    // 5. Billing State (Only if India)
    if (isIndiaBilling && (!formData.billingStateId || formData.billingStateId === 0))
      finalErrors.billingStateId = "required";

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }

    setErrors({});

    // Payload remains the same, ensuring optional fields default to empty strings
    const payload = { 
      clientId: formData.id, 
      clientCode: formData.clientCode || generateClientCode(),
      name: formData.name,
      businessName: formData.name,
      supplytypeid: getSupplyTypeId(formData.supplyType),
      clienttype: formData.supplyType === "Export" ? "Export" : "Direct",
      email: formData.email || "", 
      mobilenumber: formData.mobileNumber,
      registeredAddress: formData.registeredAddress || "",
      countryName: formData.registeredCountry || "India",
      stateName: formData.registeredState || "",
      zip: Number(formData.zip) || 0,
      billingAddress: formData.billingAddress,
      billingCountryId: formData.billingCountryId,
      billingStateId: formData.billingStateId === 0 ? null : formData.billingStateId,
      gstnumber: isIndiaBilling ? formData.gstNumber : "",
      pan: formData.pan || "",
      isexport: !isIndiaBilling,
      gststatus: isIndiaBilling ? formData.gstStatus : "URD",
      tax_percentage: formData.taxPercentage || 0,
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
            <div className="flex gap-1.5 mt-1">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                    step === s ? "bg-blue-600" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
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

            {/* STEP 1 — Contact & Registered Address */}
            {step === 1 && (
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
                    <FieldLabel label="Mobile" fieldName="mobileNumber" required />
                    <input
                      disabled={!isEditing}
                      className={`${inputClass} py-2 text-sm ${errors.mobileNumber ? "border-rose-500 ring-2 ring-rose-500/5" : ""}`}
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <FieldLabel label="Registered Address" fieldName="registeredAddress"/>
                    <textarea
                      disabled={!isEditing}
                      className={`${inputClass} h-16 py-2 text-sm resize-none ${errors.registeredAddress ? "border-rose-500 ring-2 ring-rose-500/5" : ""}`}
                      value={formData.registeredAddress}
                      onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                    />
                  </div>

                  <div className={formData.registeredCountry === "India" ? "col-span-1 space-y-1" : "col-span-2 space-y-1"}>
                    <FieldLabel label="Country" fieldName="registeredCountry"/>
                    <select
                      disabled={!isEditing}
                      className={`${inputClass} py-2 text-sm ${errors.registeredCountry ? "border-rose-500 ring-2 ring-rose-500/5" : ""}`}
                      value={formData.registeredCountry}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registeredCountry: e.target.value,
                          registeredState: "",
                        })
                      }
                    >
                      <option value="">Select</option>
                      {countries.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* State + Zip — only for India */}
                  <div className="space-y-3">
  {/* Row 1: State (Only for India) */}
  {formData.registeredCountry === "India" && (
    <div className="space-y-1">
      <FieldLabel label="State" fieldName="registeredState" required />
      <select
        disabled={!isEditing}
        className={`${inputClass} py-2 text-sm ${errors.registeredState ? "border-rose-500 ring-2 ring-rose-500/5" : ""}`}
        value={formData.registeredState}
        onChange={(e) => setFormData({ ...formData, registeredState: e.target.value })}
      >
        <option value="">State</option>
        {states.map((s) => (
          <option key={s.id} value={s.name}>{s.name}</option>
        ))}
      </select>
    </div>
  )}

  {/* Row 2: Zip (Always visible, but now on its own line) */}
  <div className="space-y-1">
    <FieldLabel 
      label="Zip" 
      fieldName="zip" 
      required={formData.registeredCountry === "India"} 
    />
    <input
      disabled={!isEditing}
      placeholder="Enter Zip/Postal Code"
      className={`${inputClass} py-2 text-sm ${errors.zip ? "border-rose-500 ring-2 ring-rose-500/5" : ""}`}
      value={formData.zip}
      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
    />
  </div>
</div>
                </div>
              </div>
            )}

            {/* STEP 2 — Billing Address & Tax Info */}
            {step === 2 && (
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
                        const selectedCountry = countries.find((c) => c.id === selectedId);
                        const isExport = selectedCountry?.name !== "India";
                        setFormData({
                          ...formData,
                          billingCountryId: selectedId,
                          billingStateId: 0,
                          supplyType: isExport ? "Export" : "B2B",
                          gstStatus: isExport ? "URD" : "Registered",
                          gstNumber: isExport ? "" : formData.gstNumber,
                        });
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
                        onChange={(e) => setFormData({ ...formData, billingStateId: Number(e.target.value) })}
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
                  
                  {/* GST Status + Supply Type — India only */}
                  {isIndiaBilling && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <FieldLabel label="GST Status" fieldName="gstStatus" />
                        <select
                          disabled={!isEditing}
                          className={`${inputClass} py-2 text-sm`}
                          value={formData.gstStatus}
                          onChange={(e) => setFormData({ ...formData, gstStatus: e.target.value })}
                        >
                          <option value="Registered">Registered</option>
                          <option value="URD">Unregistered</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Supply Type" fieldName="supplyType" />
                        <select
                          disabled={!isEditing}
                          className={`${inputClass} py-2 text-sm`}
                          value={formData.supplyType}
                          onChange={(e) => setFormData({ ...formData, supplyType: e.target.value })}
                        >
                          <option value="B2B">B2B</option>
                          <option value="B2C">B2C</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* GSTIN — India + Registered only */}
                  {isIndiaBilling && formData.gstStatus === "Registered" && (
                    <div className="space-y-1">
                      <FieldLabel label="GSTIN" fieldName="gstNumber" required />
                      <input
                        disabled={!isEditing}
                        className={`${inputClass} py-2 text-sm ${errors.gstNumber ? "border-rose-500 ring-2 ring-rose-500/5" : ""}`}
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                      />
                    </div>
                  )}

                  {/* PAN / Tax ID + Tax % */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <FieldLabel label={isIndiaBilling ? "PAN" : "Tax ID"} fieldName="pan" />
                      <input
                        disabled={!isEditing}
                        className={`${inputClass} py-2 text-sm ${errors.pan ? "border-rose-500 ring-2 ring-rose-500/5" : ""}`}
                        value={formData.pan}
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Tax %" fieldName="taxPercentage" />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={!isEditing}
                        className={`${inputClass} py-2 text-sm`}
                        value={formData.taxPercentage}
                        onChange={(e) =>
                          setFormData({ ...formData, taxPercentage: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      {/* FOOTER - Fixed at bottom */}
      <div className="p-6 pt-4 border-t border-slate-100 bg-white rounded-b-3xl shrink-0 flex justify-between items-center">
        <button
          type="button"
          onClick={step === 1 ? onClose : () => setStep(1)}
          className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 hover:text-slate-600"
        >
          {step > 1 && <ChevronLeft size={14} />}
          {step === 1 ? "Cancel" : "Back"}
        </button>

        {step === 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          isEditing && (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all"
            >
              Review Details <Eye size={16} />
            </button>
          )
        )}
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
                  { label: "Tax ID / PAN", val: preparedPayload.pan },
                  { label: "GST Status", val: preparedPayload.gststatus },
                  { label: "GSTIN", val: preparedPayload.gstnumber || "-" },
                  { label: "Supply Type", val: preparedPayload.clienttype },
                  { label: "Tax %", val: `${preparedPayload.tax_percentage}%` },
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
                  Registered Address
                </p>
                <p className="font-semibold text-slate-700 leading-relaxed">
                  {preparedPayload.registeredAddress}
                  {preparedPayload.stateName ? `, ${preparedPayload.stateName}` : ""},{" "}
                  {preparedPayload.countryName}
                  {preparedPayload.zip ? ` - ${preparedPayload.zip}` : ""}
                </p>
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
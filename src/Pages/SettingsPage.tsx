import React, { useState, useEffect } from "react";
import { FileSignature, Landmark, Plus } from "lucide-react";
import BankDetailsSidebar from "@/components/forms/BankDetails";
import CustomFieldSidebar from "@/components/forms/AddFields";
import api from "@/api/api";
import SigningAuthoritySidebar from "../components/forms/SigningAuthoritySidebar";
import CurrencySidebar from "@/components/forms/CurrencySidebar";
import { DollarSign } from "lucide-react";
import CompanyProfileSidebar from "@/components/forms/CompanyProfileSidebar";
import { Building2 } from "lucide-react";

// Interfaces matching your Go backend logic
interface BankAccount {
  id?: number;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  bankAddress: string;
  accountType: string;
  swiftCode: string;
  qrCodeUrl: string | null;
  userId: number;
  isDefault?: boolean;
}

interface CustomField {
  id: number;
  label: string;
  type: "Text" | "Date" | "Number";
  isRequired: boolean;
  active: boolean;
}

interface Currency {
  id?: number;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
}

const SettingsPage: React.FC = () => {
  // --- State Management (CLEANED UP - NO DUPLICATES) ---
  
  
  // Bank State
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [isBankSidebarOpen, setIsBankSidebarOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);

  // Custom Field State
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isFieldSidebarOpen, setIsFieldSidebarOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);

  // Signature Authority State
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [selectedAuthority, setSelectedAuthority] = useState<any>(null);
  const [isSignatureSidebarOpen, setIsSignatureSidebarOpen] = useState(false);

  // Currency State
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [isCurrencySidebarOpen, setIsCurrencySidebarOpen] = useState(false);

  // Company Profile State
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false);

  // --- Fetching Data ---
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await api.get("/banking/current");
        const bankList = (res.data.data || []).map((b: any) => ({
          ...b,
          id: b.detailsId,
        }));
        setBanks(bankList);
      } catch (err) {
        console.error("Error fetching banks:", err);
      }
      // Deleted the 'finally' block that had setLoading(false)
    };

    const fetchFields = async () => {
      try {
        const res = await api.get("/custom-fields");
        const rawData = res.data?.fields || [];
        const fieldslist = rawData.map((f: any) => ({
          id: f.fieldId,
          label: f.fieldLabel,
          type: f.fieldType,
          isRequired: f.isRequired,
          active: !f.deletedAt,
        }));
        setCustomFields(fieldslist);
      } catch (err) {
        console.error("Error fetching custom fields:", err);
      }
    };

    const fetchAuthorities = async () => {
      try {
        const res = await api.get("/signature-authorities");
        setAuthorities(res.data || []);
      } catch (err) {
        console.error("Error fetching authorities:", err);
      }
    };

    const fetchCurrencies = async () => {
  try {
    const res = await api.get("/currencies");
    setCurrencies(res.data || []);
  } catch (err) {
    console.error("Error fetching currencies:", err);
  }
};

    const fetchProfiles = async () => {
  try {
    const res = await api.get("/company-profiles");
    setProfiles(res.data || []);
  } catch (err) {
    console.error(
      "Error fetching company profiles:",
      err
    );
  }
};

    fetchBanks();
    fetchFields();
    fetchAuthorities();
    fetchCurrencies();
    fetchProfiles();
  }, []);

  // --- Handlers ---
  const handleSaveBank = (apiResponse: any, formData?: any) => {
    const responseData = apiResponse.data || apiResponse;
    const bankId = responseData.detailsId || responseData.id;
    if (!bankId) return;

    setBanks((prev) => {
      const exists = prev.find((b) => b.id === bankId);
      if (exists) {
        return prev.map((b) =>
          b.id === bankId ? { ...b, ...formData, ...responseData, id: bankId } : b
        );
      }
      const newBankEntry: BankAccount = {
        ...formData,
        ...responseData,
        id: bankId,
      };
      return [...prev, newBankEntry];
    });
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await api.delete(`/banking/${id}`);
      if (res.data.status) {
        setBanks((prev) => prev.filter((bank) => bank.id !== id));
      }
    } catch (err) {
      console.error("Delete request failed:", err);
      alert("Could not delete the bank account. Please try again.");
    }
  };

  const handleEditField = (field: CustomField) => {
    setSelectedField(field);
    setIsFieldSidebarOpen(true);
  };

  const handleSaveField = (decryptedResponse: any, formData?: any, isEdit?: boolean) => {
    if (isEdit) {
      setCustomFields((prev) =>
        prev.map((field) =>
          field.id === decryptedResponse?.id
            ? {
                ...field,
                label: formData?.fieldLabel,
                type:
                  formData?.fieldType === "text"
                    ? "Text"
                    : formData?.fieldType === "number"
                    ? "Number"
                    : formData?.fieldType === "date"
                    ? "Date"
                    : "Text",
                isRequired: Boolean(formData?.isRequired),
              }
            : field
        )
      );
    } else {
      const data = decryptedResponse.data || decryptedResponse;
      const newField: CustomField = {
        id: Number(data.id) || Number(data.fieldId),
        label: formData?.fieldLabel || data.fieldLabel,
        type:
          formData?.fieldType === "text"
            ? "Text"
            : formData?.fieldType === "number"
            ? "Number"
            : formData?.fieldType === "date"
            ? "Date"
            : "Text",
        isRequired: Boolean(formData?.isRequired),
        active: true,
      };
      setCustomFields((prev) => [...prev, newField]);
    }
    setIsFieldSidebarOpen(false);
  };

  const handleDeleteField = async (id: number) => {
    try {
      const res = await api.delete("/custom-fields/" + Number(id));
      if (res.data.status) {
        setCustomFields((prev: any[]) => prev.filter((field) => field.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleSaveAuthority = (response: any, formData?: any, isEdit?: boolean) => {
    if (isEdit) {
      setAuthorities((prev) =>
        prev.map((a) => (a.id === response.id ? { ...a, ...formData } : a))
      );
    } else {
      const data = response.data || response;
      const newAuthority = { ...data };
      setAuthorities((prev) => [...prev, newAuthority]);
    }
    setIsSignatureSidebarOpen(false);
  };

  const handleDeleteAuthority = async (id: number) => {
    try {
      await api.delete(`/signature-authorities/${id}`);
      setAuthorities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

 const handleSaveCurrency = (
  response: any,
  isEdit?: boolean
) => {
  const currency = response.data || response;

  if (isEdit) {
    setCurrencies((prev) =>
      prev.map((c) =>
        c.id === currency.id
          ? { ...c, ...currency }
          : c
      )
    );
  } else {
    setCurrencies((prev) => [...prev, currency]);
  }

  setIsCurrencySidebarOpen(false);
  setSelectedCurrency(null);
};

const handleDeleteCurrency = async (
  id: number
) => {
  try {
    await api.delete(`/currencies/${id}`);

    setCurrencies((prev) =>
      prev.filter((c) => c.id !== id)
    );
  } catch (err) {
    console.error(err);
  }
};


const handleSaveProfile = (
  response: any,
  _formData?: any,
  isEdit?: boolean
) => {
  const profile = response.data || response;

  if (isEdit) {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profile.id
          ? { ...p, ...profile }
          : p
      )
    );
  } else {
    setProfiles((prev) => [
      ...prev,
      profile,
    ]);
  }

  setIsProfileSidebarOpen(false);
  setSelectedProfile(null);
};


const handleDeleteProfile = async (
  id: number
) => {
  try {
    await api.delete(
      `/company-profiles/${id}`
    );

    setProfiles((prev) =>
      prev.filter((p) => p.id !== id)
    );
  } catch (err) {
    console.error(err);
  }
};


  return (
    <div className="p-6 max-w-6xl mx-auto bg-slate-50 min-h-screen text-slate-900 font-sans">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Invoice Settings
        </h1>
        <p className="text-slate-400 font-medium mt-2">
          Configure banking and invoice field settings
        </p>
      </header>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Banking Details Card */}
        <div
          onClick={() => {
            setSelectedBank(null);
            setIsBankSidebarOpen(true);
          }}
          className="cursor-pointer bg-white border border-slate-200 rounded-3xl p-8 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                Banking Details
              </h2>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Add and manage bank accounts used for invoice payments.
              </p>
              <div className="mt-5 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-wider">
                {banks.length} Accounts
              </div>
            </div>
            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-all">
              <Landmark size={34} />
            </div>
          </div>
        </div>

        {/* Custom Fields Card */}
        <div
          onClick={() => {
            setSelectedField(null);
            setIsFieldSidebarOpen(true);
          }}
          className="cursor-pointer bg-white border border-slate-200 rounded-3xl p-8 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                Custom Fields
              </h2>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Configure dynamic invoice fields and metadata.
              </p>
              <div className="mt-5 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-wider">
                {customFields.length} Fields
              </div>
            </div>
            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-all">
              <Plus size={34} />
            </div>
          </div>
        </div>

        {/* Signing Authority Card */}
        <div
          onClick={() => {
            setSelectedAuthority(null);
            setIsSignatureSidebarOpen(true);
          }}
          className="cursor-pointer bg-white border border-slate-200 rounded-3xl p-8 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                Signing Authority
              </h2>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Configure invoice signing authorities.
              </p>
              <div className="mt-5 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-wider">
                Authorities
              </div>
            </div>
            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-all">
  <FileSignature size={34} />
</div>
          </div>
        </div>

          {/* Currency Card */}

        <div
  onClick={() => {
    setSelectedCurrency(null);
    setIsCurrencySidebarOpen(true);
  }}
  className="cursor-pointer bg-white border border-slate-200 rounded-3xl p-8 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group"
>
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-2xl font-black text-slate-800">
        Currency Management
      </h2>

      <p className="text-sm text-slate-400 mt-3">
        Configure currencies available for invoicing.
      </p>

      <div className="mt-5 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-wider">
        {currencies.length} Currencies
      </div>
    </div>

    <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center">
      <DollarSign size={34} />
    </div>
  </div>
</div>
    
    {/* Company Profile Card */}

    <div
  onClick={() => {
    setSelectedProfile(null);
    setIsProfileSidebarOpen(true);
  }}
  className="
    cursor-pointer
    bg-white
    border border-slate-200
    rounded-3xl
    p-8
    hover:border-blue-400
    hover:shadow-2xl
    hover:shadow-blue-500/10
    transition-all
    duration-300
    group
  "
>
  <div className="flex items-center justify-between">

    <div>

      <h2 className="text-2xl font-black text-slate-800">
        Company Profile
      </h2>

      <p className="text-sm text-slate-400 mt-3">
        Configure company details used
        in invoice headers.
      </p>

      <div className="mt-5 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-wider">
        {profiles.length} Profiles
      </div>

    </div>

    <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center">
      <Building2 size={34} />
    </div>

  </div>
</div>

      </div>

      {/* Banking Sidebar */}
      <BankDetailsSidebar
        visible={isBankSidebarOpen}
        onHide={() => {
          setIsBankSidebarOpen(false);
          setSelectedBank(null);
        }}
        onSave={handleSaveBank}
        initialData={selectedBank}
        banks={banks}
        onEdit={(bank) => {
          setSelectedBank(bank);
          setIsBankSidebarOpen(true);
        }}
        onDelete={handleDelete}
      />

      {/* Custom Fields Sidebar */}
      <CustomFieldSidebar
        visible={isFieldSidebarOpen}
        onHide={() => {
          setIsFieldSidebarOpen(false);
          setSelectedField(null);
        }}
        onSave={handleSaveField}
        initialData={selectedField}
        fields={customFields}
        onEdit={handleEditField}
        onDelete={handleDeleteField}
      />

      {/* Signing Authority Sidebar */}
      <SigningAuthoritySidebar
        visible={isSignatureSidebarOpen}
        onHide={() => {
          setIsSignatureSidebarOpen(false);
          setSelectedAuthority(null);
        }}
        authorities={authorities}
        initialData={selectedAuthority}
        onEdit={(authority) => {
          setSelectedAuthority(authority);
          setIsSignatureSidebarOpen(true);
        }}
        onDelete={handleDeleteAuthority}
        onSave={handleSaveAuthority}
      />

      {/* Currency Sidebar */}
      <CurrencySidebar
  visible={isCurrencySidebarOpen}
  onHide={() => {
    setIsCurrencySidebarOpen(false);
    setSelectedCurrency(null);
  }}
  currencies={currencies}
  initialData={selectedCurrency}
  onSave={handleSaveCurrency}
  onEdit={(currency) => {
    setSelectedCurrency(currency);
    setIsCurrencySidebarOpen(true);
  }}
  onDelete={handleDeleteCurrency}
/>

      {/* Company Profile Sidebar */}
      <CompanyProfileSidebar
  visible={isProfileSidebarOpen}
  onHide={() => {
    setIsProfileSidebarOpen(false);
    setSelectedProfile(null);
  }}
  profiles={profiles}
  initialData={selectedProfile}
  onSave={handleSaveProfile}
  onEdit={(profile) => {
    setSelectedProfile(profile);
    setIsProfileSidebarOpen(true);
  }}
  onDelete={handleDeleteProfile}
/>
    </div>
  );
};

export default SettingsPage;
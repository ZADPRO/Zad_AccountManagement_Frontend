import React, { useState, useEffect, useRef } from "react";

import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Building2, UploadCloud } from "lucide-react";

import {
  X,
  Check,
  Edit2,
  Trash2,
} from "lucide-react";

import api from "@/api/api";



interface Props {
  visible: boolean;

  onHide: () => void;

  onSave: (
    data: any,
    formData?: any,
    isEdit?: boolean
  ) => void;

  initialData?: any;

  profiles: any[];

  onEdit: (profile: any) => void;

  onDelete: (id: number) => void;
}

const CompanyProfileSidebar: React.FC<Props> = ({
  visible,
  onHide,
  onSave,
  initialData,
  profiles,
  onEdit,
  onDelete,
}) => {
  const toast = useRef<Toast>(null);

  const [loading, setLoading] = useState(false);

  const isEdit = !!initialData;

  const [logoPreview, setLogoPreview] =useState("");

const [formData, setFormData] = useState({
  companyName: "",

  addressLine1: "",
  addressLine2: "",

  city: "",
  state: "",
  country: "",
  pincode: "",

  gstNumber: "",

  email: "",
  phoneNumber: "",
  website: "",

  logoUrl: "",
});

  useEffect(() => {
  if (initialData) {
    setFormData({
      companyName: initialData.companyName || "",
      addressLine1: initialData.addressLine1 || "",
      addressLine2: initialData.addressLine2 || "",
      city: initialData.city || "",
      state: initialData.state || "",
      country: initialData.country || "",
      pincode: initialData.pincode || "",
      gstNumber: initialData.gstNumber || "",
      email: initialData.email || "",
      phoneNumber: initialData.phoneNumber || "",
      website: initialData.website || "",
      logoUrl: initialData.logoUrl || "",
    });

    setLogoPreview(
      initialData.logoUrl || ""
    );

  } else if (visible) {
    setFormData({
      companyName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      gstNumber: "",
      email: "",
      phoneNumber: "",
      website: "",
      logoUrl: "",
    });

    setLogoPreview(""); //Clear old image
  }
}, [initialData, visible]);

  const handleLogoUpload = (file: File | undefined) => {
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    toast.current?.show({
      severity: "warn",
      summary: "Validation",
      detail: "Logo size should be less than 2MB",
      life: 3000,
    });
    return;
  }

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
  ];

  if (!allowedTypes.includes(file.type)) {
    toast.current?.show({
      severity: "warn",
      summary: "Validation",
      detail: "Only PNG/JPG files are allowed",
      life: 3000,
    });
    return;
  }

  const reader = new FileReader();

  reader.onloadend = () => {
    const base64 = reader.result as string;

    setLogoPreview(base64);

    setFormData((prev) => ({
      ...prev,
      logoUrl: base64,
    }));
  };

  reader.readAsDataURL(file);
};

  const handleSave = async () => {
    // NAME
if (!formData.companyName.trim()) {
  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Company name is required",
    life: 3000,
  });
  return;
}

// DESIGNATION
if (!formData.country.trim()) {
  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Country is required",
    life: 3000,
  });
  return;
}

// CONTACT NUMBER
if (!formData.state.trim()) {
  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "State is required",
    life: 3000,
  });
  return;
}

// ONLY NUMBERS
if (!formData.city.trim()) {
  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "City is required",
    life: 3000,
  });
  return;
}

// LENGTH CHECK
if (!formData.pincode.trim()) {
  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Pincode is required",
    life: 3000,
  });
  return;
}

// EMAIL
if (!formData.email.trim()) {
  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Email is required",
    life: 3000,
  });
  return;
}
// EMAIL FORMAT
const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(formData.email)) {

  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Invalid email format",
    life: 3000,
  });

  return;
}

if (!formData.phoneNumber.trim()) {
  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Phone number is required",
    life: 3000,
  });
  return;
}

if (!formData.website.trim()) {
  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Website is required",
    life: 3000,
  });
  return;
}

if (!/^\d{6}$/.test(formData.pincode)) {
  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Pincode must be 6 digits",
    life: 3000,
  });
  return;
}

const websiteRegex =
  /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i;

if (!websiteRegex.test(formData.website)) {
  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Enter a valid website URL",
    life: 3000,
  });
  return;
}




  const payload = {
  companyName: formData.companyName,

  addressLine1: formData.addressLine1,
  addressLine2: formData.addressLine2,

  city: formData.city,
  state: formData.state,
  country: formData.country,
  pincode: formData.pincode,

  gstNumber: formData.gstNumber,

  email: formData.email,
  phoneNumber: formData.phoneNumber,
  website: formData.website,

  logoUrl: formData.logoUrl,
};
  setLoading(true);

    try {
      let res;

      if (isEdit) {
        res = await api.put(
  `/company-profiles/${initialData.id}`,
  payload
);
      } else {
        res = await api.post(
          "/company-profiles",
          payload
        );
      }

      const responseData =
  res.data.data || res.data;

onSave(
  responseData,
  formData,
  isEdit
);

      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: isEdit
          ? "Company profile updated successfully"
          : "Company profile created successfully",
        life: 3000,
      });

      onHide();
      setLogoPreview("");

    } catch (err: any) {
      console.error(err);

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message ||
          "Something went wrong",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />

      

      <Sidebar
        visible={visible}
        onHide={onHide}
        position="right"
        showCloseIcon={false}
        blockScroll
        style={{ width: "1100px" }}
        className="bg-white border-l border-slate-100 shadow-2xl"
      >
        <div className="h-screen flex flex-col bg-white overflow-hidden">

          {/* HEADER */}
          <div className="px-8 py-7 border-b border-slate-50 flex items-center justify-between shrink-0">

            <div className="flex items-center gap-4">

              <div
                className="
                  w-12 h-12
                  bg-blue-600
                  rounded-2xl
                  flex items-center justify-center
                  text-white
                  shadow-lg shadow-blue-200
                "
              >
                <Building2 size={24} strokeWidth={2.5} />
              </div>

              <div>
                <h2
                  className="
                    text-xl
                    font-black
                    tracking-tight
                    text-slate-900
                    leading-tight
                  "
                >
                  {isEdit
                    ? "Edit Company Profile"
                    : "New Company Profile"}
                </h2>

                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.15em]
                    text-slate-400
                    mt-0.5
                  "
                >
                  Invoice Header Configuration
                </p>
              </div>
            </div>

            <button
              onClick={onHide}
              className="
                p-2.5
                text-slate-400
                hover:text-slate-900
                rounded-xl
                transition-all
              "
            >
              <X size={22} />
            </button>
          </div>

          {/* FORM */}
          <div
            className="
              flex-1
              overflow-y-auto
              px-8
              py-4
              bg-white
              space-y-5
            "
          >

            {/*COMPANY NAME */}
            <div className="space-y-2">

              <label
                className="
                  text-[11px]
                  font-black
                  uppercase
                  tracking-widest
                  text-slate-500
                  ml-1
                "
              >
                Company Name *
              </label>

              <InputText
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    companyName: e.target.value,
                  })
                }
                placeholder="e.g. ZAdroit IT Solutions"
                className="
                  w-full
                  h-14
                  px-5
                  rounded-2xl
                  border-slate-200
                  bg-slate-50/50
                  focus:bg-white
                  focus:ring-4
                  focus:ring-blue-500/10
                  focus:border-blue-500
                  font-bold
                  transition-all
                "
              />
            </div>

            {/* ADDRESS LINE 1 */}
            <div className="space-y-2">

              <label
                className="
                  text-[11px]
                  font-black
                  uppercase
                  tracking-widest
                  text-slate-500
                  ml-1
                "
              >
                Address Line 1 
              </label>

              <InputText
                value={formData.addressLine1}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    addressLine1: e.target.value,
                  })
                }
                placeholder="e.g. 123 Main Street"
                className="
                  w-full
                  h-14
                  px-5
                  rounded-2xl
                  border-slate-200
                  bg-slate-50/50
                  focus:bg-white
                  focus:ring-4
                  focus:ring-blue-500/10
                  focus:border-blue-500
                  font-bold
                  transition-all
                "
              />
            </div>

            {/* ADDRESS LINE 2 */}
            <div className="space-y-2">

              <label
                className="
                  text-[11px]
                  font-black
                  uppercase
                  tracking-widest
                  text-slate-500
                  ml-1
                "
              >
                Address Line 2 
              </label>

              <InputText
                value={formData.addressLine2}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    addressLine2: e.target.value,
                  })
                }
                placeholder="e.g. Apt 4B"
                className="
                  w-full
                  h-14
                  px-5
                  rounded-2xl
                  border-slate-200
                  bg-slate-50/50
                  focus:bg-white
                  focus:ring-4
                  focus:ring-blue-500/10
                  focus:border-blue-500
                  font-bold
                  transition-all
                "
              />
            </div>

            {/* COUNTRY */}
            <div className="space-y-2">
  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
    Country *
  </label>

  <InputText
    value={formData.country}
    onChange={(e) =>
      setFormData({
        ...formData,
        country: e.target.value,
      })
    }
    className="w-full h-14 px-5 rounded-2xl"
  />
</div>


{/* STATE */}

<div className="space-y-2">
  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
    State *
  </label>

  <InputText
    value={formData.state}
    onChange={(e) =>
      setFormData({
        ...formData,
        state: e.target.value,
      })
    }
    className="w-full h-14 px-5 rounded-2xl"
  />
</div>

            {/* CITY */}
            <div className="space-y-2">

              <label
                className="
                  text-[11px]
                  font-black
                  uppercase
                  tracking-widest
                  text-slate-500
                  ml-1
                "
              >
                City *
              </label>

              <InputText
                value={formData.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    city: e.target.value,
                  })
                }
                placeholder="e.g. Chennai"
                className="
                  w-full
                  h-14
                  px-5
                  rounded-2xl
                  border-slate-200
                  bg-slate-50/50
                  focus:bg-white
                  focus:ring-4
                  focus:ring-blue-500/10
                  focus:border-blue-500
                  font-bold
                  transition-all
                "
              />
            </div>

            


{/* PIN CODE */}

<div className="space-y-2">
  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
    Pincode *
  </label>

  <InputText
  value={formData.pincode}
    onChange={(e) =>
      setFormData({
        ...formData,
        pincode: e.target.value,
      })
    }
    className="w-full h-14 px-5 rounded-2xl"
  />
</div>


{/* EMAIL */}

<div className="space-y-2">
  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
    Email *
  </label>

  <InputText
    value={formData.email}
    onChange={(e) =>
      setFormData({
        ...formData,
        email: e.target.value,
      })
    }
    className="w-full h-14 px-5 rounded-2xl"
  />
</div>

{/* PHONE */}

<div className="space-y-2">
  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
    Phone Number *
  </label>

  <InputText
  value={formData.phoneNumber}
    onChange={(e) =>
      setFormData({
        ...formData,
        phoneNumber: e.target.value,
      })
    }
    className="w-full h-14 px-5 rounded-2xl"
  />
</div>


{/* WEBSITE */}

<div className="space-y-2">
  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
    Website *
  </label>

  <InputText
    value={formData.website}
    onChange={(e) =>
      setFormData({
        ...formData,
        website: e.target.value,
      })
    }
    className="w-full h-14 px-5 rounded-2xl"
  />
</div>



{/* GST No */}


<div className="space-y-2">
  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
    GST Number
  </label>

  <InputText
    value={formData.gstNumber}
    onChange={(e) =>
      setFormData({
        ...formData,
        gstNumber: e.target.value,
      })
    }
    className="w-full h-14 px-5 rounded-2xl"
  />
</div>




{/* LOGO */}


            <div className="space-y-3">
  <label
    className="
      text-[11px]
      font-black
      uppercase
      tracking-widest
      text-slate-500
      ml-1
    "
  >
    Logo
  </label>

  <input
    type="file"
    accept="image/png,image/jpeg,image/jpg"
    id="logo-upload"
    className="hidden"
    onChange={(e) =>
      handleLogoUpload(e.target.files?.[0])
    }
  />

  <label
    htmlFor="logo-upload"
    className="
      w-full
      h-36
      border-2
      border-dashed
      border-blue-300
      rounded-3xl
      bg-slate-50/50
      hover:border-blue-400
      hover:bg-blue-50/30
      transition-all
      cursor-pointer
      flex
      flex-col
      items-center
      justify-center
      gap-3
    "
  >
    <UploadCloud size={32} className="text-slate-400" />

    <div className="text-center">
      <p className="text-sm font-bold text-slate-700">
        Upload Logo
      </p>

      <p className="text-[11px] text-slate-400 mt-1">
        PNG / JPG only • Max 2MB
      </p>
    </div>
  </label>

  {logoPreview && (
  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
    
    <div className="flex items-start justify-between">
      
      <img
        src={logoPreview}
        alt="Logo Preview"
        className="h-24 object-contain bg-white rounded-xl border"
      />

      <button
        type="button"
        onClick={() => {
          setLogoPreview("");

          setFormData((prev) => ({
            ...prev,
            logoUrl: "",
          }));
        }}
        className="
          p-2
          rounded-xl
          hover:bg-rose-50
          hover:text-rose-600
          transition-all
        "
      >
        <Trash2 size={18} />
      </button>

    </div>

  </div>
)}

  
</div>

{/* FOOTER */}
          <div className="px-8 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
  
  <button
    onClick={onHide}
    className="
      w-32
      h-11
      rounded-xl
      text-xs
      font-black
      uppercase
      tracking-widest
      text-slate-400
      hover:bg-slate-50
      transition-all
    "
  >
    Cancel
  </button>

  <button
    onClick={handleSave}
    disabled={loading || !formData.companyName}
    className="
      w-64
      h-11
      bg-blue-600
      hover:bg-blue-700
      text-white
      rounded-xl
      text-xs
      font-black
      uppercase
      tracking-[0.15em]
      flex
      items-center
      justify-center
      gap-2
      transition-all
      disabled:opacity-50
    "
  >
    {loading ? (
      "Processing..."
    ) : (
      <>
        <Check size={18} strokeWidth={3} />
        {isEdit ? "Update Company Profile" : "Save Company Profile"}
      </>
    )}
  </button>

</div>



{/* TABLE */}
          <div className="border-t border-slate-100 pt-3 mt-3">

            <div className="pt-3 pb-4 px-8">

              <div className="flex items-center justify-between mb-4">

                <h3
                  className="
                    text-[11px]
                    font-black
                    uppercase
                    tracking-[0.2em]
                    text-slate-400
                  "
                >
                  Existing profiles
                </h3>

                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-400
                  "
                >
                  {profiles.length} Total
                </span>
              </div>

              <div
  className="
    rounded-3xl
    border
    border-slate-200
    px-6
    max-h-[320px]
    overflow-y-auto
  "
>

                <table className="w-full">

                  <thead className="bg-slate-50 border-b border-slate-100">

                    <tr>

                      <th
                        className="
                          text-left
                          px-4 py-3
                          text-[10px]
                          font-black
                          uppercase
                          tracking-widest
                          text-slate-400
                        "
                      >
                        Company
                      </th>

                      <th
                        className="
                          text-left
                          px-4 py-3
                          text-[10px]
                          font-black
                          uppercase
                          tracking-widest
                          text-slate-400
                        "
                      >
                        Email
                      </th>

                      <th
                        className="
                          text-left
                          px-4 py-3
                          text-[10px]
                          font-black
                          uppercase
                          tracking-widest
                          text-slate-400
                        "
                      >
                        Phone
                      </th>

                      <th
  className="
    text-left
    px-4 py-3
    text-[10px]
    font-black
    uppercase
    tracking-widest
    text-slate-400
  "
>
  Website
</th>

                      <th
                        className="
                          text-right
                          px-4 py-3
                          text-[10px]
                          font-black
                          uppercase
                          tracking-widest
                          text-slate-400
                        "
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {profiles.map((profile) => (

                      <tr
                        key={profile.id}
                        className="
                          border-b
                          border-slate-100
                          last:border-0
                          hover:bg-slate-50
                          transition-all
                        "
                      >

                        <td className="px-4 py-4">
  <p className="font-bold text-sm text-slate-800">
    {profile.companyName}
  </p>
</td>
                        <td className="px-4 py-4">
  <p className="text-sm font-medium text-slate-700">
    {profile.email}
  </p>
</td>

                        <td className="px-4 py-4">
  <p className="text-sm font-medium text-slate-700">
    {profile.phoneNumber}
  </p>
</td>

<td className="px-4 py-4">
  <p className="text-sm font-medium text-slate-700">
    {profile.website}
  </p>
</td>

                        <td className="px-4 py-4">

                          <div
                            className="
                              flex
                              items-center
                              justify-end
                              gap-2
                            "
                          >

                            <button
                              onClick={() =>
                                onEdit(profile)
                              }
                              className="
                                p-2
                                rounded-xl
                                hover:bg-blue-50
                                hover:text-blue-600
                                transition-all
                              "
                            >
                              <Edit2 size={16} />
                            </button>

                            <button
                              onClick={() => {
                                confirmDialog({
                                  message:
                                    "Are you sure you want to delete this company profile?",

                                  header:
                                    "Delete Confirmation",

                                  icon:
                                    "pi pi-exclamation-triangle",

                                  acceptClassName:
                                    "p-button-danger",

                                  accept: () => {
                                    onDelete(profile.id);
                                  },

                                  reject: () => {},
                                });
                              }}
                              className="
                                p-2
                                rounded-xl
                                hover:bg-rose-50
                                hover:text-rose-600
                                transition-all
                              "
                            >
                              <Trash2 size={16} />
                            </button>

                          </div>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            </div>
          </div>

          </div>
          

          
          
        </div>
      </Sidebar>
    </>
  );
};

export default CompanyProfileSidebar;
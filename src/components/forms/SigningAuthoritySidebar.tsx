import React, { useState, useEffect, useRef } from "react";

import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import {
  
  confirmDialog,
} from "primereact/confirmdialog";
import { Toast } from "primereact/toast";

import {
  X,
  Check,
  Edit2,
  Trash2,
  ShieldCheck,
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

  authorities: any[];

  onEdit: (authority: any) => void;

  onDelete: (id: number) => void;
}

const SigningAuthoritySidebar: React.FC<Props> = ({
  visible,
  onHide,
  onSave,
  initialData,
  authorities,
  onEdit,
  onDelete,
}) => {
  const toast = useRef<Toast>(null);

  const [loading, setLoading] = useState(false);

  const isEdit = !!initialData;

  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    contactNumber: "",
    email: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        designation: initialData.designation || "",
        contactNumber: initialData.contactNumber || "",
        email: initialData.email || "",
      });
    } else if (visible) {
      setFormData({
        name: "",
        designation: "",
        contactNumber: "",
        email: "",
      });
    }
  }, [initialData, visible]);

  const handleSave = async () => {
    // NAME
if (!formData.name.trim()) {

  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Authority name is required",
    life: 3000,
  });

  return;
}

// DESIGNATION
if (!formData.designation.trim()) {

  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Role in organization is required",
    life: 3000,
  });

  return;
}

// CONTACT NUMBER
if (!formData.contactNumber.trim()) {

  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Contact number is required",
    life: 3000,
  });

  return;
}

// ONLY NUMBERS
const phoneRegex = /^[0-9]+$/;

if (!phoneRegex.test(formData.contactNumber)) {

  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Contact number must contain only numbers",
    life: 3000,
  });

  return;
}

// LENGTH CHECK
if (formData.contactNumber.length !== 10) {

  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Contact number must be 10 digits",
    life: 3000,
  });

  return;
}

// EMAIL
if (!formData.email.trim()) {

  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Email address is required",
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

  const payload = {
  name: formData.name,
  designation: formData.designation,
  contactNumber: formData.contactNumber,
  email: formData.email,
};  

  setLoading(true);

    try {
      let res;

      if (isEdit) {
        res = await api.put(
  `/signature-authorities/${initialData.id}`,
  payload
);
      } else {
        res = await api.post(
          "/signature-authorities",
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
          ? "Authority updated successfully"
          : "Authority created successfully",
        life: 3000,
      });

      onHide();

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
                <ShieldCheck size={24} strokeWidth={2.5} />
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
                    ? "Edit Signing Authority"
                    : "New Signing Authority"}
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
                  Invoice Authorization
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
              py-8
              bg-white
              space-y-8
            "
          >

            {/* NAME */}
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
                Authority Name
              </label>

              <InputText
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
                placeholder="e.g. John Doe"
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

            {/* DESIGNATION */}
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
                Role In Organization
              </label>

              <InputText
                value={formData.designation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    designation: e.target.value,
                  })
                }
                placeholder="e.g. Finance Manager"
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

            {/* CONTACT */}
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
                Contact Number
              </label>

              <InputText
                value={formData.contactNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactNumber: e.target.value,
                  })
                }
                placeholder="e.g. 9876543210"
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

            {/* EMAIL */}
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
                Email Address
              </label>

              <InputText
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                placeholder="e.g. john@company.com"
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
          </div>

          {/* TABLE */}
          <div className="border-t border-slate-100 pt-8 mt-8">

            <div className="pt-6 pb-6 px-10">

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
                  Existing Authorities
                </h3>

                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-400
                  "
                >
                  {authorities.length} Total
                </span>
              </div>

              <div
                className="
                  overflow-hidden
                  rounded-3xl
                  border
                  border-slate-200
                  px-6
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
                        Name
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
                        Role
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
                        Contact
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

                    {authorities.map((authority) => (

                      <tr
                        key={authority.id}
                        className="
                          border-b
                          border-slate-100
                          last:border-0
                          hover:bg-slate-50
                          transition-all
                        "
                      >

                        <td className="px-4 py-4">

                          <p
                            className="
                              font-bold
                              text-sm
                              text-slate-800
                            "
                          >
                            {authority.name}
                          </p>

                          <p
                            className="
                              text-xs
                              text-slate-400
                              mt-1
                            "
                          >
                            {authority.email}
                          </p>
                        </td>

                        <td className="px-4 py-4">

                          <span
                            className="
                              px-3 py-1
                              rounded-full
                              bg-slate-100
                              text-slate-600
                              text-[10px]
                              font-black
                              uppercase
                              tracking-wider
                            "
                          >
                            {authority.designation}
                          </span>
                        </td>

                        <td className="px-4 py-4">

                          <p
                            className="
                              text-sm
                              font-bold
                              text-slate-700
                            "
                          >
                            {authority.contactNumber}
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
                                onEdit(authority)
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
                                    "Are you sure you want to delete this authority?",

                                  header:
                                    "Delete Confirmation",

                                  icon:
                                    "pi pi-exclamation-triangle",

                                  acceptClassName:
                                    "p-button-danger",

                                  accept: () => {
                                    onDelete(authority.id);
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

          {/* FOOTER */}
          <div
            className="
              px-8
              py-6
              border-t
              border-slate-100
              flex
              gap-4
              bg-white
              shadow-2xl
            "
          >

            <button
              onClick={onHide}
              className="
                flex-1
                h-14
                rounded-2xl
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
              disabled={loading || !formData.name}
              className="
                flex-[2]
                h-14
                bg-blue-600
                hover:bg-blue-700
                text-white
                rounded-2xl
                text-xs
                font-black
                uppercase
                tracking-[0.2em]
                shadow-xl
                shadow-blue-900/10
                flex
                items-center
                justify-center
                gap-3
                transition-all
                disabled:opacity-50
              "
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <Check size={18} strokeWidth={3} />

                  {isEdit
                    ? "Update Authority"
                    : "Save Authority"}
                </>
              )}
            </button>

          </div>
        </div>
      </Sidebar>
    </>
  );
};

export default SigningAuthoritySidebar;
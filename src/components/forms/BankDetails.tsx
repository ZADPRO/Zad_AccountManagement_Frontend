import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "primereact/sidebar";
import { confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import {
  Landmark,
  X,
  Check,
  UploadCloud,
  FileImage,
  Edit2,
  Trash2,
} from "lucide-react";
import api from "@/api/api";

interface Props {
  visible: boolean;
  onHide: () => void;
  onSave: any;
  loading?: boolean;
  initialData?: any;
  banks: any[];
  onEdit: (bank: any) => void;
  onDelete: (id: number) => void;
}

const getStoredUserId = () => {
  const id = sessionStorage.getItem("userId");
  return id ? Number(id) : 0;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const BankDetailsSidebar: React.FC<Props> = ({
  visible,
  onHide,
  onSave,
  initialData,
  banks,
  onEdit,
  onDelete,
}) => {
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);
  const [qrPreview, setQrPreview] = useState("");
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    bankAddress: "",
    accountType: "Savings",
    swiftCode: "",
    qrCodeUrl: "",
    userId: getStoredUserId(),
  });

  const isEdit = !!initialData?.detailsId;

  // ✅ Prefill form (EDIT) / Reset form (CREATE)
  useEffect(() => {
    if (initialData) {
      setFormData({
        bankName: initialData.bankName || "",
        accountNumber: initialData.accountNumber || "",
        ifscCode: initialData.ifscCode || "",
        bankAddress: initialData.bankAddress || "",
        accountType: initialData.accountType || "Savings",
        swiftCode: initialData.swiftCode || "",
        qrCodeUrl: initialData.qrCodeUrl || "",
        userId: initialData.userId || getStoredUserId(),
      });
      setQrPreview(initialData.qrCodeUrl || "");
    } else {
      setFormData({
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        bankAddress: "",
        accountType: "Savings",
        swiftCode: "",
        qrCodeUrl: "",
        userId: getStoredUserId(),
      });
      setQrPreview("");
    }
  }, [initialData, visible]);

  const handleQrUpload = (file: File | undefined) => {
    if (!file) return;

    // Validate type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    const allowedExtensions = [".png", ".jpg", ".jpeg"];
    const fileName = file.name.toLowerCase();

    const isValidMime = allowedTypes.includes(file.type);
    const isValidExtension = allowedExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!isValidMime || !isValidExtension) {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid File",
        detail: "Only PNG and JPG images are allowed",
        life: 3000,
      });
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid File",
        detail: "File size must be less than 2MB",
        life: 3000,
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setQrPreview(base64);
      setFormData((prev) => ({
        ...prev,
        qrCodeUrl: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // ---------------- VALIDATIONS ----------------
    if (!formData.bankName.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Bank name is required",
        life: 3000,
      });
      return;
    }

    if (!formData.accountNumber.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Account number is required",
        life: 3000,
      });
      return;
    }

    // Account number should contain only digits
    const accountRegex = /^[0-9]+$/;
    if (!accountRegex.test(formData.accountNumber)) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Account number must contain only numbers",
        life: 3000,
      });
      return;
    }

    // IFSC Validation (Example: HDFC0001234)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(formData.ifscCode.toUpperCase())) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Invalid IFSC code format",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      // Match the Go 'dto.SaveBankingRequest' JSON tags exactly
      const payload = {
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        bankAddress: formData.bankAddress,
        accountType: formData.accountType,
        swiftCode: formData.swiftCode,
        qrCodeUrl: formData.qrCodeUrl, // Mapped to LogoURL in Go
        userId: Number(formData.userId),
      };

      let res;
      if (isEdit) {
        res = await api.put(`/banking/${initialData.detailsId}`, payload);
      } else {
        res = await api.post("/banking", payload);
      }

      if (res.data?.status) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: isEdit ? "Bank updated successfully" : "Bank added successfully",
          life: 3000,
        });

        onSave(res.data, formData);
        onHide();
      } else {
        console.error("API Error: Status was false", res?.data);
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || "An error occurred";

      toast.current?.show({
        severity: "error",
        summary: "Save Failed",
        detail: errorMsg,
        life: 4000,
      });
      console.error("Save failed:", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const accountTypes = [
    { label: "Savings Account", value: "Savings" },
    { label: "Current Account", value: "Current" },
  ];

  return (
    <>
      <Toast ref={toast} position="top-right" />

      <Sidebar
        visible={visible}
        onHide={onHide}
        position="right"
        showCloseIcon={false}
        blockScroll
        style={{ width: "1100px" }}
        className="bg-white border-l border-slate-100 shadow-2xl"
        appendTo="self"
      >
        <div className="h-screen flex flex-col bg-white overflow-hidden">
          <div className="px-8 py-7 border-b border-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Landmark size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 leading-tight">
                  {initialData ? "Edit Bank Account" : "Add Bank Account"}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mt-0.5">
                  Banking Configuration
                </p>
              </div>
            </div>

            <button
              onClick={onHide}
              className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-200"
            >
              <X size={22} />
            </button>
          </div>

          {/* --- SCROLLABLE CONTENT AREA --- */}
          <div className="flex-1 overflow-y-auto px-8 custom-scrollbar min-h-0 bg-white">
            <div className="space-y-7 pb-12 mt-8">
              {/* Bank Name Field */}
              <div className="group space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">
                  Bank Name
                </label>
                <InputText
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                  placeholder="Enter Bank name"
                  className="w-full h-14 px-5 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all placeholder:text-slate-300 placeholder:font-medium"
                />
              </div>

              {/* Grid Fields */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2 group">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">
                    Account Type
                  </label>
                  <Dropdown
                    value={formData.accountType}
                    options={accountTypes}
                    appendTo={document.body}
                    panelClassName="z-[2000]"
                    onChange={(e) =>
                      setFormData({ ...formData, accountType: e.value })
                    }
                    className="w-full h-14 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:ring-4 focus:ring-blue-500/10 font-bold flex items-center transition-all"
                  />
                </div>

                <div className="space-y-2 group ">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">
                    IFSC Code
                  </label>
                  <InputText
                    value={formData.ifscCode}
                    onChange={(e) =>
                      setFormData({ ...formData, ifscCode: e.target.value })
                    }
                    placeholder="IFSC0001"
                    className="w-full h-14 px-5 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all"
                  />
                </div>
              </div>

              {/* Account Number */}
              <div className="group space-y-7 z-10 pt-5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">
                  Account Number
                </label>
                <InputText
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNumber: e.target.value })
                  }
                  placeholder="XXXX XXXX XXXX"
                  className="w-full h-14 px-5 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all"
                />
              </div>

              {/* Swift Code */}
              <div className="group space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">
                  Swift Code{" "}
                  <span className="text-slate-300 lowercase font-medium italic">
                    (Optional)
                  </span>
                </label>
                <InputText
                  value={formData.swiftCode}
                  onChange={(e) =>
                    setFormData({ ...formData, swiftCode: e.target.value })
                  }
                  className="w-full h-14 px-5 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all"
                />
              </div>

              {/* Address */}
              <div className="group space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">
                  Bank Branch Address
                </label>
                <InputTextarea
                  value={formData.bankAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, bankAddress: e.target.value })
                  }
                  rows={4}
                  className="w-full p-5 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all resize-none"
                />
              </div>

              {/* QR CODE UPLOAD */}
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                  <FileImage size={14} />
                  QR Code
                </label>

                {/* Hidden Input */}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  id="qr-upload"
                  className="hidden"
                  onChange={(e) => handleQrUpload(e.target.files?.[0])}
                />

                {/* Custom Upload Button */}
                <label
                  htmlFor="qr-upload"
                  className="
                    w-full
                    h-36
                    border-2
                    border-dashed
                    border-slate-200
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
                      Upload QR Code
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      PNG / JPG only • Max 2MB
                    </p>
                  </div>
                </label>

                {/* Preview */}
                {qrPreview && (
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                    <img
                      src={qrPreview}
                      alt="QR Preview"
                      className="w-44 h-44 object-contain rounded-xl bg-white border"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Existing Accounts Table */}
            <div className="border-t border-slate-100 pt-8 mt-8 pb-12">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Existing Accounts
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {banks.length} Total
                </span>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Bank
                      </th>
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Account
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        QR
                      </th>
                      <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {banks.map((bank) => (
                      <tr
                        key={bank.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-all"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-sm text-slate-800">
                            {bank.bankName}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">
                            {bank.ifscCode}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-sm text-slate-700">
                            {bank.accountNumber}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">
                            {bank.accountType}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {bank.qrCodeUrl ? (
                            <img
                              src={bank.qrCodeUrl}
                              alt="QR Code"
                              className="w-16 h-16 object-cover rounded-xl border border-slate-200"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">
                              No QR
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onEdit(bank)}
                              className="p-2 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                confirmDialog({
                                  message: "Are you sure you want to delete this bank account?",
                                  header: "Delete Confirmation",
                                  icon: "pi pi-exclamation-triangle",
                                  acceptClassName: "p-button-danger",
                                  accept: () => {
                                    onDelete(bank.id);
                                  },
                                  reject: () => {},
                                });
                              }}
                              className="p-2 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all"
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

          {/* --- STICKY FOOTER --- */}
          <div className="px-8 py-6 border-t border-slate-100 flex gap-4 shrink-0 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
            <button
              onClick={onHide}
              className="flex-1 h-14 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-2 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  <Check size={18} strokeWidth={3} /> Save Account
                </>
              )}
            </button>
          </div>
        </div>
      </Sidebar>
    </>
  );
};

export default BankDetailsSidebar;
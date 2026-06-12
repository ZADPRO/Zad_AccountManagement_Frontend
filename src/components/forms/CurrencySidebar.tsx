import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";


import {
  X,
  Check,
  Edit2,
  Trash2,
  DollarSign,
} from "lucide-react";

import api from "@/api/api";

interface Props {
  visible: boolean;

  onHide: () => void;

  onSave: (
    data: any,
    isEdit?: boolean
  ) => void;

  initialData?: any;

  currencies: any[];
onEdit: (currency: any) => void;
onDelete: (id: number) => void;
}

const CurrencySidebar: React.FC<Props> = ({
  visible,
  onHide,
  onSave,
  initialData,
  currencies,
  onEdit,
  onDelete,
}) => {
  const toast = useRef<Toast>(null);

  const [loading, setLoading] = useState(false);

  const isEdit = !!initialData;

  

const [formData, setFormData] = useState({
  currencyCode: "",
  currencyName: "",
  currencySymbol: "",
});

  useEffect(() => {
  if (initialData) {
    setFormData({
      currencyCode: initialData.currencyCode || "",
      currencyName: initialData.currencyName || "",
      currencySymbol: initialData.currencySymbol || "",
    });
  } else if (visible) {
    setFormData({
      currencyCode: "",
      currencyName: "",
      currencySymbol: "",
    });
  }
}, [initialData, visible]);

  

  


  const handleSave = async () => {
    // CURRENCY CODE
if (!formData.currencyCode.trim()) {

  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Currency code is required",
    life: 3000,
  });

  return;
}

// CURRENCY NAME
if (!formData.currencyName.trim()) {

  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Currency name is required",
    life: 3000,
  });

  return;
}

// CURRENCY SYMBOL
if (!formData.currencySymbol.trim()) {

  toast.current?.show({
    severity: "warn",
    summary: "Validation",
    detail: "Currency symbol is required",
    life: 3000,
  });

  return;
}


const payload = {
  currencyCode: formData.currencyCode,
  currencyName: formData.currencyName,
  currencySymbol: formData.currencySymbol,
};

  setLoading(true);

    try {
      let res;

      if (isEdit) {
        res = await api.put(
  `/currencies/${initialData.id}`,
  payload
);
      } else {
        res = await api.post(
          "/currencies",
          payload
        );
      }

      const responseData =
  res.data.data || res.data;

onSave(
  responseData,
  isEdit
);

      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: isEdit
          ? "Currency updated successfully"
          : "Currency created successfully",
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
                <DollarSign size={24} strokeWidth={2.5} />
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
                    ? "Edit Currency"
                    : "New Currency"}
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
                  Currency Management
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
              px-8
              py-4
              bg-white
              space-y-5
            "
          >

            {/* CURRENCY CODE */}
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
                Currency Code
              </label>

              <InputText
                value={formData.currencyCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                     currencyCode: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g. USD"
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

            {/* CURRENCY NAME*/}
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
                Currency Name
              </label>

              <InputText
                value={formData.currencyName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currencyName: e.target.value,
                  })
                }
                placeholder="e.g. US Dollar"
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
    Currency Symbol
  </label>

  <InputText
    value={formData.currencySymbol}
    onChange={(e) =>
      setFormData({
        ...formData,
        currencySymbol: e.target.value,
      })
    }
    placeholder="e.g. $"
    className="
      w-full
      h-14
      px-5
      rounded-2xl
      border-slate-200
      bg-slate-50/50
    "
  />
</div>

            

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
    disabled={
  loading ||
  !formData.currencyCode ||
  !formData.currencyName ||
  !formData.currencySymbol
}
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
       {isEdit ? "Update Currency" : "Save Currency"}
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
                  Existing Currencies
                </h3>

                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-400
                  "
                >
                  {currencies.length} Total
                </span>
              </div>

              <div
  className="
    rounded-3xl
    border
    border-slate-200
    overflow-y-auto
    max-h-[260px]
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
                        Code
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
                        Currency Name
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
                        Symbol
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

                    {currencies.map((currency) => (

                      <tr
                        key={currency.id}
                        className="
                          border-b
                          border-slate-100
                          last:border-0
                          hover:bg-slate-50
                          transition-all
                        "
                      >

                    <td className="px-4 py-4">
  {currency.currencyCode}
</td>

<td className="px-4 py-4">
  {currency.currencyName}
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
    {currency.currencySymbol}
  </span>
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
                                onEdit(currency)
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
                                    "Are you sure you want to delete this currency?",

                                  header:
                                    "Delete Confirmation",

                                  icon:
                                    "pi pi-exclamation-triangle",

                                  acceptClassName:
                                    "p-button-danger",

                                  accept: () => {
                                    onDelete(currency.id);
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
      </Sidebar>
    </>
  );
};

export default CurrencySidebar;
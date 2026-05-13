import { Plus, Trash2 } from "lucide-react";

/* =========================================================
   INTERFACES
========================================================= */

interface Item {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  customFieldValues: {
    fieldId: number;
    label: string;
    value: string;
  }[];
  [key: string]: any;
}

interface CustomFieldValue {
  fieldId: number;
  label: string;
  value: string;
}

interface Props {
  items: Item[];
  onItemsChange: (items: Item[]) => void;
  customFields?: CustomFieldValue[]; // ← user-selected fields from CustomFields component
  currency: string;
}

/* =========================================================
   COMPONENT
========================================================= */

const InvoiceItemsTable = ({
  items,
  onItemsChange,
  customFields = [], // ← matches what parent passes
  currency,
}: Props) => {

  /* =========================================================
     ADD ITEM
  ========================================================= */

  const addItem = () => {
    // Pre-populate dynamic keys for each selected custom field
    const dynamicFields = customFields.reduce((acc: any, field) => {
      acc[field.fieldId] = "";
      return acc;
    }, {});

    onItemsChange([
      ...items,
      {
        id: Date.now().toString(),
        description: "",
        quantity: 1,
        rate: 0,
        amount: 0,
        customFieldValues: [],
        ...dynamicFields,
      },
    ]);
  };

  /* =========================================================
     REMOVE ITEM
  ========================================================= */

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    onItemsChange(items.filter((item) => item.id !== id));
  };

  /* =========================================================
     UPDATE ITEM
  ========================================================= */

  const updateItem = (id: string, field: string, value: any) => {
    const updatedItems = items.map((item) => {
      if (item.id !== id) return item;

      const updatedItem = {
  ...item,
  [field]: value,
};

const quantity = Math.max(
  1,
  Number(updatedItem.quantity)
);

const rate = Math.max(
  0,
  Number(updatedItem.rate)
);

updatedItem.quantity = quantity;
updatedItem.rate = rate;

updatedItem.amount = quantity * rate;

/* =====================================================
   HANDLE CUSTOM FIELD VALUES
===================================================== */

const fieldId = Number(field);

// check if dynamic custom column
if (!isNaN(fieldId)) {

  const existingField =
    updatedItem.customFieldValues.find(
      (f) => f.fieldId === fieldId
    );

  if (existingField) {

    // UPDATE existing value
    existingField.value = value;

  } else {

    // FIND COLUMN DETAILS
    const column = customFields.find(
      (f) => f.fieldId === fieldId
    );

    if (column) {

      // ADD NEW VALUE
      updatedItem.customFieldValues.push({
        fieldId: column.fieldId,
        label: column.label,
        value: value,
      });
    }
  }
}

return updatedItem;

      
    });

    onItemsChange(updatedItems);
  };

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <div className="mt-6">

      {/* TABLE CONTAINER */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full border-collapse text-left">

          {/* TABLE HEADER */}
          <thead className="bg-slate-50 sticky top-0 z-20">
            <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">

              <th className="py-4 px-3 min-w-[250px]">Description</th>
              <th className="py-4 px-3 w-24">Qty</th>
              <th className="py-4 px-3 w-36">Rate ({currency})</th>

              {/* One <th> per user-selected custom field */}
              {customFields.map((col) => (
                <th key={col.fieldId} className="py-4 px-3 min-w-[180px]">
                  {col.label}
                </th>
              ))}

              <th className="py-4 px-3 w-40">Amount ({currency})</th>
              <th className="py-4 px-3 w-14"></th>

            </tr>
          </thead>

         {/* TABLE BODY */}
<tbody className="divide-y divide-slate-100 bg-white">
  {items.map((item) => (
    <tr key={item.id} className="hover:bg-slate-50 transition-all">

      {/* DESCRIPTION */}
      <td className="py-3 px-2 w-[32%]">
        <input
          type="text"
          value={item.description}
          onChange={(e) =>
            updateItem(item.id, "description", e.target.value)
          }
          placeholder="Service / Product"
          className="w-full bg-white border border-slate-400 rounded-2xl px-4 py-3 text-sm text-slate-900 font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
        />
      </td>

      {/* QUANTITY */}
      <td className="py-3 px-2 w-[14%]">
        <input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) =>
            updateItem(
              item.id,
              "quantity",
              Math.max(1, parseInt(e.target.value) || 1)
            )
          }
          className="w-full min-w-[100px] bg-white border border-slate-400 rounded-2xl px-4 py-3 text-sm text-slate-900 font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm no-spinner"
        />
      </td>

      {/* RATE */}
      <td className="py-3 px-2 w-[18%]">
        <input
          type="number"
          min={0}
          value={item.rate}
          onChange={(e) =>
            updateItem(
              item.id,
              "rate",
              Math.max(0, parseFloat(e.target.value) || 0)
            )
          }
          className="w-full min-w-[140px] bg-white border border-slate-400 rounded-2xl px-4 py-3 text-sm text-slate-900 font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm no-spinner"
        />
      </td>

      {/* CUSTOM FIELDS */}
      {customFields.map((col) => (
        <td key={col.fieldId} className="py-3 px-2">
          <input
            type="text"
            value={item[col.fieldId] ?? ""}
            onChange={(e) =>
              updateItem(
                item.id,
                String(col.fieldId),
                e.target.value
              )
            }
            placeholder={col.label}
            className="w-full min-w-[130px] bg-white border border-slate-400 rounded-2xl px-4 py-3 text-sm text-slate-900 font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
          />
        </td>
      ))}

      {/* AMOUNT */}
      <td className="py-3 px-2 w-[16%]">
        <div className="w-full min-w-[140px] bg-slate-50 border border-slate-400 rounded-2xl px-4 py-3 text-sm text-slate-900 font-bold shadow-sm text-right">
          {item.amount.toFixed(2)}
        </div>
      </td>

      {/* DELETE */}
      <td className="py-3 px-2 text-center w-[6%]">
        <button
          type="button"
          onClick={() => removeItem(item.id)}
          className="text-slate-400 hover:text-red-500 transition-all"
        >
          <Trash2 size={18} />
        </button>
      </td>

    </tr>
  ))}
</tbody>

        </table>
      </div>

      {/* ADD ITEM BUTTON */}
      <button
        type="button"
        onClick={addItem}
        className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-all"
      >
        <Plus size={14} />
        Add Item
      </button>

    </div>
  );
};

export default InvoiceItemsTable;
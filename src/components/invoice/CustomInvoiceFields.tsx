import { useState } from "react";

const CustomFields = ({ fieldDefs, onChange }: any) => {
  const [selectedFields, setSelectedFields] = useState<any[]>([]);

  const handleAddField = (fieldId: number) => {
  if (selectedFields.some(f => f.fieldId === fieldId)) return;

  const field = fieldDefs.find((f: any) => f.fieldId === fieldId);
  if (!field) return;
    
  const updated = [
    ...selectedFields,
    {
      fieldId,
      label: field.fieldLabel, // ✅ keep label for DB dictionary
      value: ""
    }
  ];

  setSelectedFields(updated);
  onChange(updated);
};

  const handleValueChange = (index: number, value: string) => {
    const updated = [...selectedFields];
    updated[index].value = value;

    setSelectedFields(updated);
    onChange(updated);
  };

  const removeField = (index: number) => {
    const updated = selectedFields.filter((_, i) => i !== index);
    setSelectedFields(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4 mt-6">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        Custom Fields
      </label>

      <select
        onChange={(e) => handleAddField(parseInt(e.target.value))}
        className="w-full border p-2 rounded-xl"
      >
        <option value="">Select Field</option>
        {fieldDefs.map((f: any) => (
          <option key={f.fieldId} value={f.fieldId}>
            {f.fieldLabel}
          </option>
        ))}
      </select>

      {selectedFields.map((field, index) => (
        <div key={field.fieldId} className="flex gap-2 items-center">
          <span className="w-40 text-sm">{field.label}</span>

          <input
            value={field.value}
            onChange={(e) => handleValueChange(index, e.target.value)}
            className="flex-1 border p-2 rounded-xl"
          />

          <button onClick={() => removeField(index)}>✕</button>
        </div>
      ))}
    </div>
  );
};

export default CustomFields;
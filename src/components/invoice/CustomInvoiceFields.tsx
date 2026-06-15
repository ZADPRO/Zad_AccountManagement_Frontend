
import { Hash, Trash2 } from 'lucide-react';
const CustomFields = ({
  fieldDefs,
  selectedFields,
  onChange,
}: any) => {
  

  const handleAddField = (fieldId: number) => {
  if (selectedFields.some((f: any) => f.fieldId === fieldId)) return;

  const field = fieldDefs.find((f: any) => f.fieldId === fieldId);
  if (!field) return;
    
  const updated = [
    ...selectedFields,
    {
      fieldId,
      label: field.fieldLabel, 
      value: ""
    }
  ];


  onChange(updated);
};

   

  const removeField = (index: number) => {
    const updated = selectedFields.filter(
  (_: any, i: number) => i !== index
);
    onChange(updated);
  };

  console.log("CUSTOM FIELDS COMPONENT =", selectedFields);

  return (
  

 <div className="space-y-2">

    {/* Heading */}
    
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
          <Hash size={12} strokeWidth={3} className="text-blue-600" /> Custom Fields
        </label>

    {/* Dropdown */}
    <select
      onChange={(e) => handleAddField(parseInt(e.target.value))}
      className="w-full bg-white border border-slate-500 rounded-xl p-3 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 transition-all"
    >
      <option value="">Select Field</option>

      {fieldDefs.map((f: any) => (
        <option key={f.fieldId} value={f.fieldId}>
          {f.fieldLabel}
        </option>
      ))}
    </select>

    {/* Selected Fields */}
{selectedFields
  .filter((field: any) => field.label?.trim())
  .map((field: any, index: number) => (
    <div
      key={field.fieldId}
      className="flex gap-3 items-center bg-slate-50 border border-slate-500 rounded-xl p-3"
    >
      <span className="w-40 text-sm font-semibold text-slate-700">
        {field.label}
      </span>

      

      <button
        type="button"
        onClick={() => removeField(index)}
        className="text-slate-400 hover:text-red-500 transition-colors p-1"
      >
        <Trash2 size={16} />
      </button>
    </div>
  ))}

  </div>


  );
};

export default CustomFields;
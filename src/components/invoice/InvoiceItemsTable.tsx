import { Plus, Trash2 } from 'lucide-react'; 

interface Item {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Props {
  items: Item[];
  onItemsChange: (items: Item[]) => void;
}

const InvoiceItemsTable = ({ items, onItemsChange }: Props) => {
  const addItem = () => {
    const newItem = { id: Date.now().toString(), description: '', quantity: 1, rate: 0, amount: 0 };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      onItemsChange(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof Item, value: string | number) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.amount = Number(updatedItem.quantity) * Number(updatedItem.rate);
        return updatedItem;
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  return (
    <div className="mt-8">
      {/* 1. Scrollable Container Wrapper */}
      <div className="max-h-105 overflow-y-auto overflow-x-hidden pr-2 no-scollbar ">
        <table className="w-full text-left border-collapse">
          {/* 2. Sticky Header to keep titles visible while scrolling */}
          <thead className="sticky top-0 bg-white z-20 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="py-4 px-2">Description</th>
              <th className="py-4 px-2 w-24">Qty</th>
              <th className="py-4 px-2 w-32">Rate</th>
              <th className="py-4 px-2 w-32">Amount</th>
              <th className="py-4 px-2 w-10"></th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-50">
            {items.map((item) => (
              <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-2">
                  <input 
                    type="text"
                    className="w-full bg-transparent border-none text-slate-900 font-medium outline-none placeholder:text-slate-400"
                    placeholder="Service name..."
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                </td>

                <td className="py-4 px-2">
                  <input 
                    type="number"
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </td>

                <td className="py-4 px-2">
                  <input 
                    type="number"
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                  />
                </td>

                <td className="py-4 px-2 text-sm font-black text-slate-900">
                  ₹{item.amount.toLocaleString()}
                </td>

                <td className="py-4 px-2 text-right">
                  <button 
                    onClick={() => removeItem(item.id)} 
                    className="text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Button remains outside the scroll area so it's always visible */}
      <button 
        onClick={addItem}
        className="mt-6 flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-[0.2em]"
      >
        <Plus size={14} strokeWidth={3} /> Add Line Item
      </button>
    </div>
  );
};

export default InvoiceItemsTable;
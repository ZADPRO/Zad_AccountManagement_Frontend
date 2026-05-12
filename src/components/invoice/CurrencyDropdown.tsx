// CurrencyDropdown.tsx

interface CurrencyDropdownProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

const CURRENCIES = [
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
];

const CurrencyDropdown = ({
  selectedCurrency,
  onCurrencyChange,
}: CurrencyDropdownProps) => {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
        Currency
      </label>

      <select
        value={selectedCurrency}
        onChange={(e) => onCurrencyChange(e.target.value)}
         className="w-full bg-white border border-slate-500 rounded-xl p-3 text-sm text-slate-900 font-bold outline-none focus:border-blue-500 transition-all"
      >
        {CURRENCIES.map((currency) => (
          <option
            key={currency.value}
            value={currency.value}
          >
            {currency.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencyDropdown;
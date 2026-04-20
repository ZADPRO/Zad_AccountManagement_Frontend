// src/components/ui/StatCard.tsx
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode; 
}

const StatCard = ({ label, value, icon }: StatCardProps) => (
  <div className="bg-white border border-slate-200 p-4 rounded-2xl hover:shadow-md transition-all group">
    <div className="flex items-center gap-4">
      {/* Icon Container: Reduced size to match the compact card */}
      <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
        {icon}
      </div>

      {/* Text Container: Aligned to the right of the icon */}
      <div className="flex flex-col min-w-0">
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest truncate">
          {label}
        </p>
        <p className="text-xl font-black text-slate-900 tracking-tighter leading-none mt-0.5">
          {value}
        </p>
      </div>
    </div>
  </div>
);

export default StatCard;
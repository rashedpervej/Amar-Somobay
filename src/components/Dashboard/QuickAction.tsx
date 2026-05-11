import React from 'react';
import { ChevronRight } from 'lucide-react';

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
  textColor: string;
  onClick?: () => void;
}

export const QuickAction: React.FC<QuickActionProps> = ({ title, description, icon, iconBgColor, textColor, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="w-full bg-card-bg dark:bg-slate-900 rounded-[22px] p-4 flex items-center gap-4 text-left shadow-sm border border-slate-50 dark:border-slate-800 active:scale-[0.99] transition-all duration-300"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBgColor} ${textColor} dark:opacity-90`}>
        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
      </div>
      <div className="flex-1 flex flex-col">
        <h3 className="text-[17px] font-bold text-slate-800 dark:text-slate-100 bangla leading-tight">{title}</h3>
        <p className="text-[13px] text-slate-400 dark:text-slate-500 bangla mt-0.5">{description}</p>
      </div>
      <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
    </button>
  );
};

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
  const getIconContainerClass = (color: string) => {
    if (color.includes('rose')) return 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400';
    if (color.includes('emerald')) return 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400';
    if (color.includes('blue')) return 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400';
    if (color.includes('purple')) return 'bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400';
    if (color.includes('orange')) return 'bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400';
    if (color.includes('primary')) return 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary';
    return `${iconBgColor} ${textColor}`;
  };

  return (
    <button 
      onClick={onClick}
      className="w-full dark-card rounded-[24px] p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-all duration-300"
    >
      <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center shadow-sm shrink-0 transition-transform ${getIconContainerClass(iconBgColor)}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 24, strokeWidth: 2 })}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 bangla leading-tight truncate">{title}</h3>
        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400/80 bangla mt-0.5 truncate">{description}</p>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-slate-600 transition-colors group-hover:text-primary">
        <ChevronRight size={18} />
      </div>
    </button>
  );
};

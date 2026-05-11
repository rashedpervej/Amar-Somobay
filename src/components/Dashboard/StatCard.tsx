import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  textColor: string;
  icon: React.ReactNode;
  iconBgColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, textColor, icon, iconBgColor }) => {
  const isPrimary = textColor === 'text-primary' || iconBgColor === 'bg-primary/10';
  
  return (
    <div className="bg-card-bg dark:bg-slate-900 rounded-[22px] p-4 relative overflow-hidden shadow-sm border border-slate-50 dark:border-slate-800 flex flex-col justify-between h-[120px] transition-colors duration-300">
      <div 
        className={`absolute -top-4 -right-4 w-28 h-28 rounded-full opacity-[0.08] dark:opacity-[0.03]`}
        style={isPrimary ? { backgroundColor: '#10b981' } : undefined} // Fallback for specific predefined types
      />
      
      <div className="z-10 flex flex-col gap-1 w-full">
        <span className="text-[14px] text-slate-500 dark:text-slate-400 bangla font-medium">{label}</span>
      </div>

      <div className="z-10 flex justify-between items-end w-full">
        <span className={`text-[32px] font-bold tracking-tight bangla leading-none ${textColor}`}>{value}</span>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-black/[0.03] dark:shadow-white/[0.01] shrink-0 ${iconBgColor} ${textColor}`}>
          {React.cloneElement(icon as React.ReactElement, { size: 20 })}
        </div>
      </div>
    </div>
  );
};

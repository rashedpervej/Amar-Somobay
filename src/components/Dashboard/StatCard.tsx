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
  
  // Convert explicit colors to translucent ones for better dark mode compatibility
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
    <div className="dark-card rounded-[22px] p-4 relative overflow-hidden flex flex-col justify-between h-[124px]">
      <div 
        className={`absolute -top-4 -right-4 w-32 h-32 rounded-full opacity-[0.06] dark:opacity-[0.04] blur-2xl transition-all duration-500`}
        style={isPrimary ? { backgroundColor: '#10b981' } : undefined}
      />
      
      <div className="z-10 flex flex-col gap-1 w-full">
        <span className="text-[13px] text-slate-500 dark:text-slate-400/80 bangla font-semibold tracking-wide uppercase opacity-80">{label}</span>
      </div>

      <div className="z-10 flex justify-between items-end w-full">
        <span className={`text-[28px] font-extrabold tracking-tight bangla leading-none ${textColor.includes('text-white') ? textColor : (textColor + ' dark:brightness-110')}`}>{value}</span>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm shrink-0 transition-transform active:scale-95 ${getIconContainerClass(iconBgColor)}`}>
          {React.cloneElement(icon as React.ReactElement, { size: 20, strokeWidth: 2.5 })}
        </div>
      </div>
    </div>
  );
};

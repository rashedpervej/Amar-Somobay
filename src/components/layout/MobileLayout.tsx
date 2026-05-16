import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { LayoutDashboard, Users, HandCoins, Settings, Bell, TrendingUp } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface MobileLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, showNav = true }) => {
  const { profile } = useAuthStore();
  const isApproved = profile?.role === 'admin' || profile?.role === 'member';
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="mobile-container">
      <div className="w-full flex-1 px-4 pt-6 pb-[100px] flex flex-col gap-[20px]">
        {children}
      </div>

      {showNav && isApproved && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] h-[76px] bg-white/80 dark:bg-[#0b0f1a]/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 flex items-center z-50 transition-all duration-300">
          <div className="flex justify-around items-center w-full px-2">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `relative flex flex-col items-center gap-1 transition-all h-full pt-3 px-2 ${isActive ? 'text-primary scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary rounded-b-full shadow-[0_2px_10px_rgba(16,185,129,0.5)]" />}
                  <LayoutDashboard size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[11px] bangla font-bold">{isAdmin ? 'ড্যাশবোর্ড' : 'হোম'}</span>
                </>
              )}
            </NavLink>
            
            {isAdmin && (
              <NavLink 
                to="/members" 
                className={({ isActive }) => `relative flex flex-col items-center gap-1 transition-all h-full pt-3 px-2 ${isActive ? 'text-primary scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary rounded-b-full shadow-[0_2px_100px_rgba(16,185,129,0.5)]" />}
                    <Users size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[11px] bangla font-bold">সদস্য</span>
                  </>
                )}
              </NavLink>
            )}
            
            <NavLink 
              to={isAdmin ? "/somobay/manage" : "/somobay/my"} 
              className={({ isActive }) => `relative flex flex-col items-center gap-1 transition-all h-full pt-3 px-2 ${isActive ? 'text-primary scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary rounded-b-full shadow-[0_2px_10px_rgba(16,185,129,0.5)]" />}
                  <TrendingUp size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[11px] bangla font-bold">সমবায়</span>
                </>
              )}
            </NavLink>

            {!isAdmin && (
              <NavLink 
                to="/notifications" 
                className={({ isActive }) => `relative flex flex-col items-center gap-1 transition-all h-full pt-3 px-2 ${isActive ? 'text-primary scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary rounded-b-full shadow-[0_2px_10px_rgba(16,185,129,0.5)]" />}
                    <Bell size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[11px] bangla font-bold">বিজ্ঞপ্তি</span>
                  </>
                )}
              </NavLink>
            )}
            
            <NavLink 
              to="/settings" 
              className={({ isActive }) => `relative flex flex-col items-center gap-1 transition-all h-full pt-3 px-2 ${isActive ? 'text-primary scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary rounded-b-full shadow-[0_2px_10px_rgba(16,185,129,0.5)]" />}
                  <Settings size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[11px] bangla font-bold">সেটিংস</span>
                </>
              )}
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  );
};

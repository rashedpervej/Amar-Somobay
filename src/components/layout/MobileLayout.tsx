import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { LayoutDashboard, Users, PiggyBank, Settings, Bell } from 'lucide-react';
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
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] h-[72px] bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] transition-colors duration-300">
          <div className="flex justify-around items-center w-full px-2">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `relative flex flex-col items-center gap-1 transition-colors h-full pt-3 px-2 ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute top-0 left-0 w-full h-[3px] bg-primary rounded-b-full" />}
                  <LayoutDashboard size={24} />
                  <span className="text-[12px] bangla font-bold">{isAdmin ? 'ড্যাশবোর্ড' : 'হোম'}</span>
                </>
              )}
            </NavLink>
            
            {isAdmin && (
              <NavLink 
                to="/members" 
                className={({ isActive }) => `relative flex flex-col items-center gap-1 transition-colors h-full pt-3 px-2 ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute top-0 left-0 w-full h-[3px] bg-primary rounded-b-full" />}
                    <Users size={24} />
                    <span className="text-[12px] bangla font-bold">সদস্য</span>
                  </>
                )}
              </NavLink>
            )}
            
            <NavLink 
              to="/savings" 
              className={({ isActive }) => `relative flex flex-col items-center gap-1 transition-colors h-full pt-3 px-2 ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute top-0 left-0 w-full h-[3px] bg-primary rounded-b-full" />}
                  <PiggyBank size={24} />
                  <span className="text-[12px] bangla font-bold">সঞ্চয়</span>
                </>
              )}
            </NavLink>

            {!isAdmin && (
              <NavLink 
                to="/notifications" 
                className={({ isActive }) => `relative flex flex-col items-center gap-1 transition-colors h-full pt-3 px-2 ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute top-0 left-0 w-full h-[3px] bg-primary rounded-b-full" />}
                    <Bell size={24} />
                    <span className="text-[12px] bangla font-bold">বিজ্ঞপ্তি</span>
                  </>
                )}
              </NavLink>
            )}
            
            <NavLink 
              to="/settings" 
              className={({ isActive }) => `relative flex flex-col items-center gap-1 transition-colors h-full pt-3 px-2 ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute top-0 left-0 w-full h-[3px] bg-primary rounded-b-full" />}
                  <Settings size={24} />
                  <span className="text-[12px] bangla font-bold">সেটিংস</span>
                </>
              )}
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  );
};

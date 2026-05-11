import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTheme } from '../components/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield, Info, ChevronRight, Bell, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';

export default function Settings() {
  const { profile, signOut } = useAuthStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();
  const theme = useTheme();

  const isAdmin = profile?.role === 'admin';

  const menuItems = [
    { 
      icon: <User size={20} />, 
      label: 'প্রোফাইল আপডেট', 
      color: 'text-indigo-500', 
      bgColor: 'bg-indigo-50',
      path: '/settings/profile'
    },
    { icon: <Bell size={20} />, label: 'নোটিফিকেশন', color: 'text-purple-500', bgColor: 'bg-purple-50' },
    { 
      icon: <Shield size={20} />, 
      label: 'নিরাপত্তা', 
      style: { color: theme.primary, backgroundColor: `${theme.primary}1A` },
      path: '/settings/security'
    },
    { icon: <Info size={20} />, label: 'অ্যাপ সম্পর্কে', color: 'text-slate-500', bgColor: 'bg-slate-50' },
  ];

  const adminItems = [
    { 
      icon: <SettingsIcon size={20} />, 
      label: 'অ্যাপ সেটিংস', 
      style: { color: theme.primary, backgroundColor: `${theme.primary}1A` },
      path: '/admin/app-settings'
    },
  ];

  return (
    <MobileLayout>
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-4">
            <div 
              className="w-[64px] h-[64px] rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0"
              style={{ backgroundColor: `${theme.primary}1A` }}
            >
               {profile?.avatar_url ? (
                 <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-2xl font-bold bangla" style={{ color: theme.primary }}>
                   {profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'ন'}
                 </span>
               )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-[22px] font-bold text-slate-800 dark:text-slate-100 bangla leading-tight">{profile?.full_name}</h1>
              <p className="text-slate-400 dark:text-slate-500 text-[13px] bangla font-medium mt-0.5">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => theme.toggleMode()}
              className="bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-300 active:scale-95 transition-transform"
            >
              {theme.mode === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-[12px]">
          <h2 className="text-[14px] font-bold text-slate-400 bangla px-2 uppercase tracking-widest">সাধারণ</h2>
          <div className="bg-white dark:bg-slate-900 rounded-[22px] overflow-hidden shadow-sm border border-slate-50 dark:border-slate-800">
            {menuItems.map((item: any, index) => (
              <button 
                key={index}
                onClick={() => item.path && item.path !== '#' && navigate(item.path)}
                className={`w-full flex items-center gap-4 p-4 text-left active:bg-slate-50 dark:active:bg-slate-800 transition-colors ${index !== menuItems.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}
              >
                <div 
                  className={`p-3 rounded-[14px] ${item.color || ''}`}
                  style={item.style}
                >
                  {item.icon}
                </div>
                <span className="flex-1 font-bold text-slate-700 bangla text-[16px]">{item.label}</span>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-[12px]">
            <h2 className="text-[14px] font-bold text-slate-400 bangla px-2 uppercase tracking-widest">অ্যাডমিন সেটিংস</h2>
            <div className="bg-white dark:bg-slate-900 rounded-[22px] overflow-hidden shadow-sm border border-slate-50 dark:border-slate-800">
              {adminItems.map((item: any, index) => (
                <button 
                  key={index}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-4 p-4 text-left active:bg-slate-50 dark:active:bg-slate-800 transition-colors ${index !== adminItems.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}
                >
                  <div 
                    className={`p-3 rounded-[14px] ${item.color || ''}`}
                    style={item.style}
                  >
                    {item.icon}
                  </div>
                  <span className="flex-1 font-bold text-slate-700 bangla text-[16px]">{item.label}</span>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-[12px]">
          <h2 className="text-[14px] font-bold text-slate-400 bangla px-2 uppercase tracking-widest">অ্যাকাউন্ট</h2>
          <div className="bg-white dark:bg-slate-900 rounded-[22px] overflow-hidden shadow-sm border border-slate-50 dark:border-slate-800">
            <button 
              onClick={signOut}
              className="w-full flex items-center gap-4 p-4 text-left active:bg-rose-50 dark:active:bg-rose-950 transition-colors text-rose-500"
            >
              <div className="bg-rose-50 p-3 rounded-[14px] text-rose-500">
                <LogOut size={20} />
              </div>
              <span className="flex-1 font-bold bangla text-[16px]">লগ আউট করুন</span>
            </button>
          </div>
        </div>

        <div className="text-center pb-8">
          <p className="text-slate-300 text-[10px] bangla tracking-[0.2em] font-medium uppercase">
            {settings?.app_name || 'Sanchoy App'} v1.0.0
          </p>
        </div>
    </MobileLayout>
  );
}

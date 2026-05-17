import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTheme } from '../components/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield, Info, ChevronRight, Bell, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

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
      bgColor: 'bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400',
      path: '/settings/profile'
    },
    { icon: <Bell size={20} />, label: 'নোটিফিকেশন', color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400' },
    { 
      icon: <Shield size={20} />, 
      label: 'নিরাপত্তা', 
      customStyle: true,
      path: '/settings/security'
    },
    { icon: <Info size={20} />, label: 'অ্যাপ সম্পর্কে', color: 'text-slate-500', bgColor: 'bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400' },
  ];

  const adminItems = [
    { 
      icon: <SettingsIcon size={20} />, 
      label: 'অ্যাপ সেটিংস', 
      customStyle: true,
      path: '/admin/app-settings'
    },
  ];

  return (
    <MobileLayout>
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-4">
            <div 
              className="w-[66px] h-[66px] rounded-full flex items-center justify-center border-2 border-white dark:border-[#1e293b] shadow-md overflow-hidden shrink-0"
              style={{ backgroundColor: `${theme.primary}1A` }}
            >
               {profile?.avatar_url ? (
                 <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-2xl font-black bangla" style={{ color: theme.primary }}>
                   {profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'ন'}
                 </span>
               )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-[22px] font-extrabold text-slate-800 dark:text-slate-100 bangla leading-tight">{profile?.full_name}</h1>
              <p className="text-slate-500 dark:text-slate-400/70 text-[13px] bangla font-semibold mt-0.5">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => theme.toggleMode()}
              className="bg-white/80 dark:bg-[#1e293b]/60 p-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-300 active:scale-95 transition-all backdrop-blur-md"
            >
              {theme.mode === 'light' ? <Moon size={22} className="text-slate-600" /> : <Sun size={22} className="text-yellow-400 outline-none" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-[14px] mt-2">
          <h2 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 bangla px-3 lg:px-4 uppercase tracking-[0.15em]">সাধারণ</h2>
          <div className="dark-card rounded-[28px] overflow-hidden">
            {menuItems.map((item: any, index) => (
              <motion.button 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => item.path && item.path !== '#' && navigate(item.path)}
                className={`w-full flex items-center gap-4 p-4 text-left active:bg-slate-50 dark:active:bg-white/5 transition-all ${index !== menuItems.length - 1 ? 'border-b border-slate-100 dark:border-white/5' : ''}`}
              >
                <div 
                  className={`p-3 rounded-2xl ${item.bgColor || ''}`}
                  style={item.customStyle ? { color: theme.primary, backgroundColor: `${theme.primary}1A` } : undefined}
                >
                  {item.icon}
                </div>
                <span className="flex-1 font-bold text-slate-700 dark:text-slate-200 bangla text-[16px]">{item.label}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-slate-600">
                  <ChevronRight size={18} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-[14px]">
            <h2 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 bangla px-3 lg:px-4 uppercase tracking-[0.15em]">অ্যাডমিন সেটিংস</h2>
            <div className="dark-card rounded-[28px] overflow-hidden">
              {adminItems.map((item: any, index) => (
                <motion.button 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + menuItems.length) * 0.05, duration: 0.3 }}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-4 p-4 text-left active:bg-slate-50 dark:active:bg-white/5 transition-all ${index !== adminItems.length - 1 ? 'border-b border-slate-100 dark:border-white/5' : ''}`}
                >
                  <div 
                    className={`p-3 rounded-2xl`}
                    style={{ color: theme.primary, backgroundColor: `${theme.primary}1A` }}
                  >
                    {item.icon}
                  </div>
                  <span className="flex-1 font-bold text-slate-700 dark:text-slate-200 bangla text-[16px]">{item.label}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-slate-600">
                    <ChevronRight size={18} />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-[14px]">
          <h2 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 bangla px-3 lg:px-4 uppercase tracking-[0.15em]">অ্যাকাউন্ট</h2>
          <div className="dark-card rounded-[28px] overflow-hidden">
            <button 
              onClick={signOut}
              className="w-full flex items-center gap-4 p-4 text-left active:bg-rose-50 dark:active:bg-rose-950 transition-all text-rose-500"
            >
              <div className="bg-rose-50 dark:bg-rose-500/10 p-3 rounded-2xl text-rose-500">
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

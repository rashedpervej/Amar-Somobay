import React, { useEffect } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTheme } from '../components/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  User, 
  ChevronRight, 
  LogOut, 
  CheckCircle2, 
  Circle,
  RefreshCw,
  Camera,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

export default function PendingApproval() {
  const { profile, signOut, initialize } = useAuthStore();
  const { settings, fetchSettings, initialized: settingsInitialized } = useSettingsStore();
  const theme = useTheme();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (!settingsInitialized) {
      fetchSettings();
    }
  }, [settingsInitialized, fetchSettings]);

  // Calculate completion percentage
  const completionItems = [
    { id: 'name', label: 'পূর্ণ নাম', done: !!profile?.full_name, icon: <User size={16} /> },
    { id: 'photo', label: 'প্রোফাইল ছবি', done: !!profile?.avatar_url, icon: <Camera size={16} /> },
    { id: 'bio', label: 'পরিচিতি (Bio)', done: !!profile?.bio, icon: <FileText size={16} /> }
  ];
  
  const completedCount = completionItems.filter(i => i.done).length;
  const percentage = Math.round((completedCount / completionItems.length) * 100);

  const handleRefresh = async () => {
    setRefreshing(true);
    await initialize();
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <MobileLayout>
      <div className="flex flex-col items-center pt-8 pb-12">
        {/* App Branding */}
        <div id="app-logo-container"
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/10 rotate-3 overflow-hidden bg-white border border-slate-50"
        >
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={settings.app_name} className="w-full h-full object-contain p-2" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold" style={{ backgroundColor: theme.primary }}>
              {settings?.app_name?.[0] || 'S'}
            </div>
          )}
        </div>

        {/* User Avatar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-50 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-slate-300" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-slate-50 text-amber-500">
            <Clock size={16} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          className="text-center mb-8 px-4"
        >
          <h1 className="text-[22px] font-bold text-slate-800 bangla leading-tight mb-2">
            নমস্কার, {profile?.full_name || 'সদস্য'}!
          </h1>
          <p className="text-[15px] text-slate-500 bangla leading-relaxed bg-amber-50 px-4 py-2 rounded-full inline-block border border-amber-100/50">
            আপনার একাউন্ট অনুমোদনের অপেক্ষায় আছে
          </p>
        </motion.div>

        {/* Completion Progress Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="w-full bg-white rounded-[28px] p-6 shadow-sm border border-slate-50 mb-6"
        >
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-[14px] font-bold text-slate-700 bangla">প্রোফাইল সম্পন্ন করুন</h3>
            <span className="text-[14px] font-bold bangla" style={{ color: theme.primary }}>{percentage}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              className="h-full rounded-full"
              style={{ backgroundColor: theme.primary }}
            />
          </div>

          <div className="space-y-3">
            {completionItems.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (i * 0.1), duration: 0.4 }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/50 group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${item.done ? 'bg-primary/10 text-primary' : 'bg-white text-slate-400'}`}
                       style={item.done ? { color: theme.primary, backgroundColor: `${theme.primary}1A` } : {}}>
                    {item.icon}
                  </div>
                  <span className={`text-[13px] font-bold bangla ${item.done ? 'text-slate-700' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </div>
                {item.done ? (
                  <CheckCircle2 size={18} style={{ color: theme.primary }} />
                ) : (
                  <Circle size={18} className="text-slate-200" />
                )}
              </motion.div>
            ))}
          </div>

          <button 
            onClick={() => navigate('/settings/profile')}
            className="w-full mt-6 py-4 rounded-2xl font-bold bangla text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] border shadow-sm"
            style={{ 
              backgroundColor: percentage === 100 ? `${theme.primary}1A` : theme.primary,
              borderColor: percentage === 100 ? `${theme.primary}20` : theme.primary,
              color: percentage === 100 ? theme.primary : '#fff'
            }}
          >
            প্রোফাইল এডিট করুন
            <ChevronRight size={18} />
          </button>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full px-1">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-all"
          >
            <div className={`w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 ${refreshing ? 'animate-spin' : ''}`}>
              <RefreshCw size={20} />
            </div>
            <span className="text-[12px] font-bold text-slate-500 bangla">রিফ্রেশ করুন</span>
          </button>

          <button 
            onClick={() => signOut()}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-rose-500">
              <LogOut size={20} />
            </div>
            <span className="text-[12px] font-bold text-rose-500 bangla">লগআউট</span>
          </button>
        </div>

        <p className="mt-12 text-[12px] text-slate-400 text-center bangla px-8 leading-relaxed">
          আপনার প্রোফাইল তথ্য সম্পূর্ণ হলে এডমিন প্যানেল থেকে আপনার একাউন্টটি সক্রিয় করা হবে।
        </p>
      </div>
    </MobileLayout>
  );
}

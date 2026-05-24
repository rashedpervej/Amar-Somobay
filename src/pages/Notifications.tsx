import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTheme } from '../components/ThemeProvider';
import { 
  ChevronLeft, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Trash2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Notifications() {
  const navigate = useNavigate();
  const theme = useTheme();
  const profile = useAuthStore(state => state.profile);
  const notifications = useNotificationStore(state => state.notifications);
  const settings = useSettingsStore(state => state.settings);
  const loading = useNotificationStore(state => state.loading);

  const filteredNotifications = settings?.is_wallet_enabled !== false 
    ? notifications 
    : notifications.filter(n => n.source_module !== 'wallet');
  const fetchNotifications = useNotificationStore(state => state.fetchNotifications);
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead);

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => {};
    
    if (profile?.id) {
      const pId = profile.id;
      fetchNotifications(pId).then(unsub => {
        if (active) unsubscribe = unsub;
        else unsub();
      });
    }
    
    return () => {
      active = false;
      unsubscribe();
    };
  }, [profile?.id, fetchNotifications]);

  const handleMarkAll = () => {
    if (profile?.id) {
      markAllAsRead(profile.id);
    }
  };

  return (
    <MobileLayout>
      <div className="flex items-center justify-between mb-8 text-neutral-800 dark:text-neutral-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#1e293b]/60 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 active:scale-95 transition-all shadow-sm backdrop-blur-md"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <h1 className="text-[22px] font-bold bangla tracking-tight">নোটিফিকেশন</h1>
        </div>

        {filteredNotifications.some(n => !n.is_read) && (
          <button 
            onClick={handleMarkAll}
            className="text-[12px] font-extrabold bangla px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/5"
            style={{ color: theme.primary, backgroundColor: `${theme.primary}1A` }}
          >
            সব পড়া হয়েছে
          </button>
        )}
      </div>

      <div className="flex flex-col gap-[14px] pb-24">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => {
              // Map titles, colors and icons to match the design style
              let displayTitle = notification.title;
              let iconBg = 'bg-primary/5 text-primary';
              let iconStyle: React.CSSProperties | undefined = { backgroundColor: `${theme.primary}1A`, color: theme.primary };
              let icon = <Bell size={24} strokeWidth={2.5} />;

              if (displayTitle === 'কিস্তি জমা সফল' || displayTitle === 'কিস্তি পরিশোধ সফল') {
                displayTitle = 'কিস্তি পরিশোধ';
              } else if (displayTitle === 'কিস্তি জমা হয়েছে (বাল্ক)' || displayTitle === 'বাল্ক কিস্তি জমা সফল হয়েছে') {
                displayTitle = 'কিস্তি পরিশোধ (বাল্ক)';
              } else if (displayTitle === 'জরিমানা যুক্ত করা হয়েছে' || displayTitle === 'জরিমানা যুক্ত করা হয়েছে') {
                displayTitle = 'জরিমানা যুক্ত';
              } else if (displayTitle === 'জরিমানা মওকুফ করা হয়েছে' || displayTitle === 'জরিমানা মওকুফ করা হয়েছে') {
                displayTitle = 'জরিমানা মওকুফ';
              } else if (displayTitle === 'আর্থিক সমন্বয় রেকর্ডকৃত' || displayTitle === 'আর্থিক সমন্বয় সফল') {
                displayTitle = 'সমন্বয়';
              } else if (displayTitle === 'ফেরত বা রিফান্ড সম্পন্ন' || displayTitle === 'রিফান্ড সম্পন্ন') {
                displayTitle = 'টাকা রিফান্ড';
              }

              if (displayTitle === 'কিস্তি পরিশোধ' || displayTitle === 'কিস্তি পরিশোধ (বাল্ক)') {
                iconBg = 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400';
                iconStyle = undefined;
                icon = <CheckCircle2 size={24} strokeWidth={2.5} />;
              } else if (displayTitle === 'জরিমানা যুক্ত') {
                iconBg = 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400';
                iconStyle = undefined;
                icon = <AlertCircle size={24} strokeWidth={2.5} />;
              } else if (displayTitle === 'জরিমানা মওকুফ') {
                iconBg = 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400';
                iconStyle = undefined;
                icon = <CheckCircle2 size={24} strokeWidth={2.5} />;
              } else if (displayTitle === 'সমন্বয়') {
                iconBg = 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400';
                iconStyle = undefined;
                icon = <CheckCircle2 size={24} strokeWidth={2.5} />;
              } else if (displayTitle === 'টাকা রিফান্ড') {
                iconBg = 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400';
                iconStyle = undefined;
                icon = <AlertCircle size={24} strokeWidth={2.5} />;
              } else {
                if (notification.type === 'success') {
                  iconBg = 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400';
                  iconStyle = undefined;
                  icon = <CheckCircle2 size={24} strokeWidth={2.5} />;
                } else if (notification.type === 'warning') {
                  iconBg = 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400';
                  iconStyle = undefined;
                  icon = <AlertCircle size={24} strokeWidth={2.5} />;
                } else if (notification.type === 'error') {
                  iconBg = 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400';
                  iconStyle = undefined;
                  icon = <AlertCircle size={24} strokeWidth={2.5} />;
                }
              }

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.4, ease: "easeOut" }}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                  className={`dark-card rounded-[26px] p-5 shadow-sm transition-all relative border border-transparent ${
                    notification.is_read ? 'opacity-50' : 'shadow-md active:scale-[0.99] cursor-pointer'
                  }`}
                  style={!notification.is_read ? { borderColor: `${theme.primary}20` } : {}}
                >
                  {!notification.is_read && (
                    <div 
                      className="absolute top-6 right-6 w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]" 
                      style={{ backgroundColor: theme.primary }}
                    />
                  )}
                  
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`} style={iconStyle}>
                      {icon}
                    </div>

                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 bangla leading-tight">
                        {displayTitle}
                      </h3>
                      <p className="text-[13px] text-slate-500 dark:text-slate-400 bangla leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                        <Clock size={12} strokeWidth={2.5} />
                        {new Date(notification.created_at).toLocaleDateString('bn-BD')}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : !loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-6">
              <div className="w-24 h-24 rounded-[36px] bg-slate-50 dark:bg-white/5 flex items-center justify-center relative">
                <Bell size={44} className="text-slate-300 dark:text-slate-700" />
                <div className="absolute top-0 right-0 w-8 h-8 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                </div>
              </div>
              <p className="text-[16px] font-bold text-slate-400 dark:text-slate-500 bangla">কোন নোটিফিকেশন নেই</p>
            </div>
          ) : (
            <div className="py-24 flex justify-center">
              <Clock className="animate-spin text-slate-200 dark:text-slate-800" size={32} />
            </div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}

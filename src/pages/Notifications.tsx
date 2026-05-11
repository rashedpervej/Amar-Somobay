import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
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
  const loading = useNotificationStore(state => state.loading);
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
      <div className="flex items-center justify-between mb-6 text-neutral-800">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-transform shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[20px] font-bold bangla">নোটিফিকেশন</h1>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={handleMarkAll}
            className="text-[12px] font-bold bangla text-primary px-3 py-1.5 rounded-lg bg-primary/5 active:scale-95 transition-all"
            style={{ color: theme.primary, backgroundColor: `${theme.primary}0D` }}
          >
            সব পড়া হয়েছে
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 pb-24">
        <AnimatePresence mode="popLayout">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
                className={`bg-white rounded-[24px] p-5 shadow-sm border transition-all relative ${
                  notification.is_read ? 'border-slate-50 opacity-60' : 'border-primary/10 shadow-md'
                }`}
                style={!notification.is_read ? { borderColor: `${theme.primary}1A` } : {}}
              >
                {!notification.is_read && (
                  <div 
                    className="absolute top-5 right-5 w-2 h-2 rounded-full" 
                    style={{ backgroundColor: theme.primary }}
                  />
                )}
                
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    notification.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                    notification.type === 'warning' ? 'bg-amber-50 text-amber-500' :
                    notification.type === 'error' ? 'bg-rose-50 text-rose-500' :
                    'bg-primary/5 text-primary'
                  }`}
                  style={notification.type === 'info' ? { backgroundColor: `${theme.primary}0D`, color: theme.primary } : {}}
                  >
                    {notification.type === 'success' ? <CheckCircle2 size={24} /> :
                     notification.type === 'warning' ? <AlertCircle size={24} /> :
                     notification.type === 'error' ? <AlertCircle size={24} /> :
                     <Bell size={24} />}
                  </div>

                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <h3 className="text-[15px] font-bold text-slate-800 bangla leading-tight">
                      {notification.title}
                    </h3>
                    <p className="text-[13px] text-slate-500 bangla leading-relaxed">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <Clock size={12} />
                      {new Date(notification.created_at).toLocaleDateString('bn-BD')}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : !loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-30">
              <div className="w-20 h-20 rounded-[32px] bg-slate-100 flex items-center justify-center">
                <Bell size={40} className="text-slate-400" />
              </div>
              <p className="text-[15px] font-bold bangla">কোন নোটিফিকেশন নেই</p>
            </div>
          ) : (
            <div className="py-20 flex justify-center">
              <Clock className="animate-spin text-slate-200" size={32} />
            </div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}

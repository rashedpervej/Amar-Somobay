import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTheme } from '../components/ThemeProvider';

export default function Splash() {
  const navigate = useNavigate();
  const { user, profile, initialized } = useAuthStore();
  const { settings } = useSettingsStore();
  const theme = useTheme();

  useEffect(() => {
    if (initialized) {
      const timer = setTimeout(() => {
        if (!user) {
          navigate('/login');
        } else if (profile?.role === 'pending') {
          navigate('/pending');
        } else {
          navigate('/dashboard');
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [initialized, user, profile, navigate]);

  return (
    <div className="mobile-container flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-32 h-32 bg-white p-6 rounded-[40px] shadow-2xl mb-10 flex items-center justify-center relative"
        style={{ boxShadow: `0 20px 25px -5px ${theme.primary}1A` }}
      >
        <div className="absolute inset-0 rounded-[40px] blur-2xl" style={{ backgroundColor: `${theme.primary}0D` }} />
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain relative z-10" />
        ) : (
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative z-10" style={{ backgroundColor: `${theme.primary}0D` }}>
            <span className="text-4xl"> </span>
          </div>
        )}
      </motion.div>
      
      <div className="text-center space-y-3">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-800 dark:text-white text-4xl font-bold bangla tracking-tight leading-tight"
        >
          {settings?.app_name || 'গ্রামীণ সমিতি'}
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[18px] font-bold bangla tracking-wide"
          style={{ color: theme.primary }}
        >
          {settings?.app_tagline || 'ক্ষুদ্র সঞ্চয়, সমৃদ্ধ ভবিষ্যৎ'}
        </motion.p>
      </div>
      
      <div className="absolute bottom-16">
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '0ms', backgroundColor: `${theme.primary}33` }}></div>
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '200ms', backgroundColor: `${theme.primary}66` }}></div>
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '400ms', backgroundColor: theme.primary }}></div>
        </div>
      </div>
    </div>
  );
}

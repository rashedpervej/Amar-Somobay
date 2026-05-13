import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTheme } from '../components/ThemeProvider';
import { Mail, Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithEmail, user, loading: authLoading } = useAuthStore();
  const { settings, loading: settingsLoading } = useSettingsStore();
  const theme = useTheme();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loading = authLoading || settingsLoading;

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      setError(err.message || 'Error signing in');
    }
  };

  if (settingsLoading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <Loader2 className="animate-spin" style={{ color: theme.primary }} size={32} />
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="flex-1 flex flex-col items-center px-8 pt-16 pb-12 overflow-y-auto no-scrollbar">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center gap-10"
        >
          {/* Logo Section */}
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[32px] shadow-xl flex items-center justify-center p-5 relative" style={{ boxShadow: `0 20px 25px -5px ${theme.primary}1A` }}>
              <div className="absolute inset-0 rounded-[32px] blur-xl" style={{ backgroundColor: `${theme.primary}0D` }} />
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain relative z-10" />
              ) : (
                <div className="w-full h-full rounded-2xl flex items-center justify-center relative z-10 dark:bg-white/5" style={{ backgroundColor: `${theme.primary}0D` }}>
                  <span className="text-4xl">🌱</span>
                </div>
              )}
            </div>
            
            <div className="text-center space-y-1.5">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 bangla tracking-tight leading-tight">
                {settings?.app_name || 'সঞ্চয় অ্যাপ'}
              </h1>
              <p className="text-[15px] bangla font-bold tracking-wide" style={{ color: theme.primary }}>
                {settings?.app_tagline || 'নির্ভরযোগ্য ও নিরাপদ সঞ্চয় প্ল্যাটফর্ম'}
              </p>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="text-center px-2">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 bangla leading-relaxed">
              {settings?.welcome_text || 'আসসালামু আলাইকুম, স্বাগতম জানাই আমাদের ডিজিটাল প্ল্যাটফর্মে'}
            </h2>
          </div>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">ইমেইল ঠিকানা</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[18px] py-4 pl-12 pr-4 outline-none transition-all font-sans text-[15px] shadow-sm text-slate-800 dark:text-slate-100 focus:ring-4"
                  style={{ '--tw-ring-color': `${theme.primary}0D` } as any}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">পাসওয়ার্ড</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[18px] py-4 pl-12 pr-4 outline-none transition-all font-sans text-[15px] shadow-sm text-slate-800 dark:text-slate-100 focus:ring-4"
                  style={{ '--tw-ring-color': `${theme.primary}0D` } as any}
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-4 rounded-[18px] border border-rose-100 dark:border-rose-500/20"
              >
                <AlertCircle size={18} className="shrink-0" />
                <span className="text-[13px] bangla font-bold leading-tight">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white rounded-[20px] h-[60px] mt-2 font-bold bangla text-[17px] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ backgroundColor: theme.primary, boxShadow: `0 20px 25px -5px ${theme.primary}33` }}
            >
              {authLoading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  লগইন করুন
                  <LogIn size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pb-8">
            <p className="text-slate-500 text-[14px] bangla font-medium">
              নতুন সদস্য?{' '}
              <Link to="/signup" className="font-bold ml-1 hover:underline" style={{ color: theme.primary }}>
                নিবন্ধন করুন
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <div className="py-8 bg-slate-50/50 dark:bg-white/5 text-center border-t border-slate-100 dark:border-white/5 mt-auto">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 bangla uppercase tracking-[0.15em] font-bold">
          {settings?.organization_name || 'গ্রামীণ সমিতি লিমিটেড'}
        </p>
        <p className="text-[12px] text-slate-400 dark:text-slate-500 bangla mt-1 font-medium">
          {settings?.footer_text || 'পরিচালনায়: গ্রামীণ ক্ষুদ্র সঞ্চয় সমিতি'}
        </p>
      </div>
    </div>
  );
}

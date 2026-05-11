import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../components/ThemeProvider';
import { Mail, Lock, User, UserPlus, AlertCircle } from 'lucide-react';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      navigate('/pending');
    } catch (err: any) {
      setError(err.message || 'Error signing up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container flex flex-col p-8">
      <div className="mt-8 mb-8">
        <h1 className="text-3xl font-bold text-slate-800 bangla">সদস্য হন</h1>
        <p className="text-slate-500 bangla mt-2">আপনার তথ্য দিয়ে একাউন্ট তৈরি করুন</p>
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600 bangla ml-1">পূর্ণ নাম</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="আপনার নাম লিখুন"
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all bangla focus:ring-4"
              style={{ '--tw-ring-color': `${theme.primary}0D`, borderColor: fullName ? theme.primary : '#e2e8f0' } as any}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600 bangla ml-1">ইমেইল</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-sans focus:ring-4"
              style={{ '--tw-ring-color': `${theme.primary}0D`, borderColor: email ? theme.primary : '#e2e8f0' } as any}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600 bangla ml-1">পাসওয়ার্ড</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-sans focus:ring-4"
              style={{ '--tw-ring-color': `${theme.primary}0D`, borderColor: password ? theme.primary : '#e2e8f0' } as any}
              required
              minLength={6}
            />
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl border border-red-100"
          >
            <AlertCircle size={18} />
            <span className="text-xs bangla">{error}</span>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full text-white rounded-2xl py-4 mt-4 font-bold bangla text-lg shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ backgroundColor: theme.primary, boxShadow: `0 10px 15px -3px ${theme.primary}33` }}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              সাইন আপ করুন
              <UserPlus size={20} />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 mb-8 text-center bg-white p-4 rounded-2xl border border-slate-100">
        <p className="text-slate-500 text-sm bangla">
          ইতিমধ্যে একাউন্ট আছে?{' '}
          <Link to="/login" className="font-bold ml-1 hover:underline" style={{ color: theme.primary }}>
            লগইন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}

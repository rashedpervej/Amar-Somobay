import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../components/ThemeProvider';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, 
  Lock, 
  Shield, 
  Loader2, 
  CheckCircle2,
  Save,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Security() {
  const navigate = useNavigate();
  const { user, updatePassword } = useAuthStore();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage({ text: 'সবগুলো ঘর পূরণ করুন', type: 'error' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ text: 'নতুন পাসওয়ার্ড দুটি মিলছে না', type: 'error' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ text: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      // 1. Verify old password by attempting sign in
      if (!user?.email) throw new Error('User email not found');
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.oldPassword
      });

      if (signInError) {
        throw new Error('পুরাতন পাসওয়ার্ডটি সঠিক নয়');
      }

      // 2. Update to new password
      await updatePassword(formData.newPassword);

      setMessage({ text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে', type: 'success' });
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => navigate('/settings'), 1500);
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <div className="flex items-center gap-4 mb-8 text-neutral-800">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-transform shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-[20px] font-bold bangla">নিরাপত্তা (Security)</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Info Card */}
        <div className="bg-amber-50 border border-amber-100 rounded-[22px] p-5 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle className="text-amber-600" size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-[14px] font-bold text-amber-900 bangla">সতর্কতা</h3>
            <p className="text-[12px] text-amber-700/80 bangla leading-relaxed">
              পাসওয়ার্ড পরিবর্তন করার জন্য অবশ্যই আপনার বর্তমান (পুরাতন) পাসওয়ার্ড দিতে হবে।
            </p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSave} className="flex flex-col gap-5 pb-10">
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-slate-50 flex flex-col gap-5 text-neutral-800">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.primary}1A` }}>
                <Shield size={20} style={{ color: theme.primary }} />
              </div>
              <h3 className="text-[16px] font-bold bangla text-slate-700">পাসওয়ার্ড পরিবর্তন</h3>
            </div>

            {/* Old Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-slate-500 bangla ml-1">পুরাতন পাসওয়ার্ড</label>
              <div className="relative flex items-center">
                <input 
                  type={showOld ? "text" : "password"} 
                  value={formData.oldPassword}
                  onChange={e => setFormData(p => ({ ...p, oldPassword: e.target.value }))}
                  placeholder="বর্তমান পাসওয়ার্ড দিন"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[14px] px-4 py-3.5 pl-11 pr-11 text-[14px] outline-none transition-all focus:ring-4"
                  style={{ '--tw-ring-color': `${theme.primary}0D`, borderColor: formData.oldPassword ? theme.primary : '#f1f5f9' } as any}
                />
                <Lock className="absolute left-4 text-slate-300" size={18} />
                <button 
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-4 text-slate-400"
                >
                  {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-50 w-full" />

            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-slate-500 bangla ml-1">নতুন পাসওয়ার্ড</label>
              <div className="relative flex items-center">
                <input 
                  type={showNew ? "text" : "password"} 
                  value={formData.newPassword}
                  onChange={e => setFormData(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="নতুন পাসওয়ার্ড লিখুন"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[14px] px-4 py-3.5 pl-11 pr-11 text-[14px] outline-none transition-all focus:ring-4"
                  style={{ '--tw-ring-color': `${theme.primary}0D`, borderColor: formData.newPassword ? theme.primary : '#f1f5f9' } as any}
                />
                <Lock className="absolute left-4 text-slate-300" size={18} />
                <button 
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 text-slate-400"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-slate-500 bangla ml-1">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
              <div className="relative flex items-center">
                <input 
                  type={showNew ? "text" : "password"} 
                  value={formData.confirmPassword}
                  onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="আবারও লিখুন"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[14px] px-4 py-3.5 pl-11 text-[14px] outline-none transition-all focus:ring-4"
                  style={{ '--tw-ring-color': `${theme.primary}0D`, borderColor: formData.confirmPassword === formData.newPassword && formData.confirmPassword ? theme.primary : '#f1f5f9' } as any}
                />
                <Shield className="absolute left-4 text-slate-300" size={18} />
              </div>
            </div>
          </div>

          {message.text && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-2 p-4 rounded-[14px] border transition-all ${
                message.type === 'success' 
                  ? 'text-primary' 
                  : 'bg-rose-50 border-rose-100 text-rose-500'
              }`}
              style={{ 
                backgroundColor: message.type === 'success' ? `${theme.primary}0D` : undefined,
                borderColor: message.type === 'success' ? `${theme.primary}1A` : undefined
              }}
            >
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <span>❌</span>}
              <span className="text-[13px] bangla font-bold">{message.text}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white h-[60px] rounded-[22px] font-bold bangla text-[16px] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ backgroundColor: theme.primary, boxShadow: `0 15px 25px -5px ${theme.primary}33` }}
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            পাসওয়ার্ড পরিবর্তন করুন
          </button>
        </form>
      </div>
    </MobileLayout>
  );
}

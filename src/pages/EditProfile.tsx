import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../components/ThemeProvider';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, 
  User, 
  Camera, 
  Loader2, 
  CheckCircle2,
  Save,
  Lock,
  FileText,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';

export default function EditProfile() {
  const navigate = useNavigate();
  const profile = useAuthStore(state => state.profile);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const updatePassword = useAuthStore(state => state.updatePassword);
  const user = useAuthStore(state => state.user);
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
    bio: ''
  });

  // Sync with profile when it loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'ছবির সাইজ ২ মেগাবাইটের কম হতে হবে', type: 'error' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; // Folders by user ID for better RLS

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      setMessage({ text: 'ছবি আপলোড সফল হয়েছে', type: 'success' });
    } catch (err: any) {
      console.error('Upload error:', err);
      setMessage({ text: 'আপলোড ব্যর্থ হয়েছে। SQL এবং Storage Bucket চেক করুন।', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name) {
      setMessage({ text: 'নাম আবশ্যিক', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Update Profile info
      await updateProfile({
        full_name: formData.full_name,
        avatar_url: formData.avatar_url,
        bio: formData.bio
      });

      setMessage({ text: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে', type: 'success' });
      setTimeout(() => navigate('/settings'), 1500);
    } catch (err: any) {
      setMessage({ text: err.message || 'আপডেট করতে ত্রুটি হয়েছে', type: 'error' });
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
        <h1 className="text-[20px] font-bold bangla">প্রোফাইল আপডেট</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Avatar Section */}
        <div className="bg-white rounded-[22px] p-6 shadow-sm border border-slate-50 flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-slate-50 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center relative group">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <User className="text-slate-300" size={40} />
            )}
            
            <label 
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full shadow-lg flex items-center justify-center cursor-pointer border-2 border-white active:scale-90 transition-transform z-20"
              style={{ backgroundColor: theme.primary }}
            >
              <Upload className="text-white" size={14} />
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
            </label>

            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-full">
                <Loader2 className="animate-spin" style={{ color: theme.primary }} size={24} />
              </div>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-slate-800 font-bold bangla">প্রোফাইল ছবি</h3>
            <p className="text-[12px] text-slate-400 bangla mt-1">পছন্দমতো ছবি আপলোড করুন</p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSave} className="flex flex-col gap-5 pb-10">
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-slate-50 flex flex-col gap-5 text-neutral-800">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-slate-500 bangla ml-1">আপনার নাম</label>
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={formData.full_name}
                  onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="আপনার পূর্ণ নাম লিখুন"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[14px] px-4 py-3.5 pl-11 bangla text-[15px] outline-none transition-all font-bold focus:ring-4"
                  style={{ '--tw-ring-color': `${theme.primary}0D`, borderColor: formData.full_name ? theme.primary : '#f1f5f9' } as any}
                />
                <User className="absolute left-4 text-slate-300" size={18} />
              </div>
            </div>

            {/* Short Bio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-slate-500 bangla ml-1">সংক্ষিপ্ত পরিচিতি (Bio)</label>
              <div className="relative flex">
                <textarea 
                  value={formData.bio}
                  onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                  placeholder="নিজের সম্পর্কে কিছু লিখুন..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[14px] px-4 py-3.5 pl-11 bangla text-[14px] outline-none transition-all focus:ring-4 resize-none"
                  style={{ '--tw-ring-color': `${theme.primary}0D`, borderColor: formData.bio ? theme.primary : '#f1f5f9' } as any}
                />
                <FileText className="absolute left-4 top-4 text-slate-300" size={18} />
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
            disabled={loading || uploading}
            className="w-full text-white h-[60px] rounded-[22px] font-bold bangla text-[16px] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ backgroundColor: theme.primary, boxShadow: `0 15px 25px -5px ${theme.primary}33` }}
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            পরিবর্তন সেভ করুন
          </button>
        </form>
      </div>
    </MobileLayout>
  );
}

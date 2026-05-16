import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  EyeOff,
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../lib/cropUtils';

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

  // Cropper State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

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

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'ছবির সাইজ ৫ মেগাবাইটের কম হতে হবে', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result as string);
    });
    reader.readAsDataURL(file);
  };

  const handleApplyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels || !user) return;

    setUploading(true);
    setImageSrc(null); // Close cropper
    
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedBlob) throw new Error('Could not crop image');

      const fileName = `${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      setMessage({ text: 'ছবি আপলোড সফল হয়েছে', type: 'success' });
    } catch (err: any) {
      console.error('Crop/Upload error:', err);
      setMessage({ text: 'আপলোড ব্যর্থ হয়েছে।', type: 'error' });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      <div className="flex items-center gap-4 mb-8 text-neutral-800 dark:text-neutral-100">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white/80 dark:bg-[#1e293b]/60 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 active:scale-95 transition-all shadow-sm backdrop-blur-md"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <h1 className="text-[20px] font-bold bangla">প্রোফাইল আপডেট</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Avatar Section */}
        <div className="dark-card rounded-[22px] p-6 flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center relative group">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <User className="text-slate-300 dark:text-slate-700" size={40} />
            )}
            
            <label 
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full shadow-lg flex items-center justify-center cursor-pointer border-2 border-white dark:border-[#151c2c] active:scale-90 transition-transform z-20"
              style={{ backgroundColor: theme.primary }}
            >
              <Camera className="text-white" size={14} />
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect} 
              />
            </label>

            {uploading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-[#151c2c]/80 flex items-center justify-center rounded-full">
                <Loader2 className="animate-spin" style={{ color: theme.primary }} size={24} />
              </div>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-slate-800 dark:text-slate-100 font-bold bangla">প্রোফাইল ছবি</h3>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 bangla mt-1">পছন্দমতো ছবি আপলোড করুন</p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSave} className="flex flex-col gap-5 pb-10">
          <div className="dark-card rounded-[22px] p-6 flex flex-col gap-5">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">আপনার নাম</label>
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={formData.full_name}
                  onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="আপনার পূর্ণ নাম লিখুন"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[14px] px-4 py-3.5 pl-11 bangla text-[15px] font-bold outline-none transition-all focus:ring-4 text-slate-800 dark:text-slate-100"
                  style={{ '--tw-ring-color': `${theme.primary}0D` } as any}
                />
                <User className="absolute left-4 text-slate-300 dark:text-slate-600" size={18} />
              </div>
            </div>

            {/* Short Bio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">সংক্ষিপ্ত পরিচিতি (Bio)</label>
              <div className="relative flex">
                <textarea 
                  value={formData.bio}
                  onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                  placeholder="নিজের সম্পর্কে কিছু লিখুন..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[14px] px-4 py-3.5 pl-11 bangla text-[14px] outline-none transition-all focus:ring-4 resize-none text-slate-800 dark:text-slate-100"
                  style={{ '--tw-ring-color': `${theme.primary}0D` } as any}
                />
                <FileText className="absolute left-4 top-4 text-slate-300 dark:text-slate-600" size={18} />
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
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-500 dark:text-rose-400'
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
            className="w-full text-white h-[60px] rounded-[22px] font-extrabold bangla text-[16px] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ backgroundColor: theme.primary, boxShadow: `0 15px 25px -5px ${theme.primary}33` }}
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} strokeWidth={2.5} />}
            পরিবর্তন সেভ করুন
          </button>
        </form>
      </div>

      {/* Image Cropper Modal */}
      <AnimatePresence>
        {imageSrc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-lg" 
              onClick={() => setImageSrc(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="font-bold bangla text-slate-800 dark:text-slate-100">ছবি ক্রপ করুন</h3>
                <button onClick={() => setImageSrc(null)} className="p-2 rounded-full bg-slate-50 dark:bg-white/5 text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="relative h-[400px] w-full bg-slate-900">
                <Cropper
                  image={imageSrc}
                   crop={crop}
                   zoom={zoom}
                   aspect={1}
                   onCropChange={setCrop}
                   onCropComplete={onCropComplete}
                   onZoomChange={setZoom}
                   cropShape="round"
                   showGrid={false}
                   objectFit="cover"
                />
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <span>জুম</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={0.8}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full appearance-none cursor-pointer accent-primary"
                    style={{ '--tw-accent-color': theme.primary } as any}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setImageSrc(null)}
                    className="flex-1 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-500 font-bold bangla active:scale-95 transition-all"
                  >
                    বাতিল
                  </button>
                  <button
                    onClick={handleApplyCrop}
                    className="flex-1 h-14 rounded-2xl text-white font-bold bangla flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                    style={{ backgroundColor: theme.primary, boxShadow: `0 8px 20px -4px ${theme.primary}40` }}
                  >
                    <Check size={20} strokeWidth={3} />
                    নিশ্চিত করুন
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}

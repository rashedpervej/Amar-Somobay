import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTheme } from '../components/ThemeProvider';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, 
  Save, 
  Upload, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Palette
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AppSettings() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettingsStore();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form State
  const [formData, setFormData] = useState({
    app_name: settings?.app_name || '',
    app_tagline: settings?.app_tagline || '',
    welcome_text: settings?.welcome_text || '',
    footer_text: settings?.footer_text || '',
    organization_name: settings?.organization_name || '',
    logo_url: settings?.logo_url || '',
    primary_color: settings?.primary_color || '#10b981',
    secondary_color: settings?.secondary_color || '#059669'
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Math.random()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      setMessage({ text: 'লোগো সফলভাবে আপলোড হয়েছে', type: 'success' });
    } catch (error: any) {
      console.error('Upload Error:', error);
      setMessage({ 
        text: error.message?.includes('bucket_id') 
          ? 'স্টোরেজ বাকেট (branding) পাওয়া যায়নি। দয়া করে SQL রান করুন।' 
          : 'লোগো আপলোডে সমস্যা হয়েছে', 
        type: 'error' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await updateSettings(formData);
      setMessage({ text: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে', type: 'success' });
    } catch (error: any) {
      setMessage({ text: 'সেটিংস সংরক্ষণে সমস্যা হয়েছে', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <div className="flex items-center gap-4 px-1">
        <button 
          onClick={() => navigate('/settings')}
          className="bg-white/80 dark:bg-[#1e293b]/60 p-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 active:scale-95 transition-all backdrop-blur-md"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <h1 className="text-[20px] font-bold text-slate-800 dark:text-slate-100 bangla">অ্যাপ সেটিংস</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Logo Section */}
        <div className="dark-card rounded-[22px] p-6 flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-[28px] border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center relative group">
            {formData.logo_url ? (
              <img src={formData.logo_url} alt="Logo Preview" className="w-full h-full object-contain p-4" />
            ) : (
              <ImageIcon className="text-slate-300 dark:text-slate-600" size={32} />
            )}
            
            <label 
              className="absolute bottom-[-8px] right-[-8px] w-10 h-10 rounded-full shadow-lg flex items-center justify-center cursor-pointer border-4 border-white dark:border-[#151c2c] active:scale-90 transition-transform z-20"
              style={{ backgroundColor: theme.primary }}
            >
              <Upload className="text-white" size={18} />
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </label>
            
            {uploading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-[#151c2c]/80 flex items-center justify-center rounded-[28px]">
                <Loader2 className="animate-spin" style={{ color: theme.primary }} size={24} />
              </div>
            )}
          </div>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bangla uppercase tracking-widest">অ্যাপ লোগো</span>
        </div>

        {/* Dynamic Theme Colors */}
        <div className="dark-card rounded-[22px] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.primary}1A` }}>
              <Palette size={20} style={{ color: theme.primary }} />
            </div>
            <h3 className="text-[17px] font-bold text-slate-800 dark:text-slate-100 bangla">অ্যাপ কালার থিম</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-slate-400 dark:text-slate-500 bangla ml-1 uppercase">প্রাইমারি কালার</label>
              <div className="relative flex items-center">
                <input 
                  type="color"
                  value={formData.primary_color}
                  onChange={e => setFormData(p => ({ ...p, primary_color: e.target.value }))}
                  className="w-full h-12 rounded-xl cursor-pointer border-none p-0 overflow-hidden bg-transparent"
                />
                <div className="absolute right-3 pointer-events-none text-[12px] font-mono font-bold text-white mix-blend-difference">
                  {formData.primary_color.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-slate-400 dark:text-slate-500 bangla ml-1 uppercase">সেকেন্ডারি কালার</label>
              <div className="relative flex items-center">
                <input 
                  type="color"
                  value={formData.secondary_color}
                  onChange={e => setFormData(p => ({ ...p, secondary_color: e.target.value }))}
                  className="w-full h-12 rounded-xl cursor-pointer border-none p-0 overflow-hidden bg-transparent"
                />
                <div className="absolute right-3 pointer-events-none text-[12px] font-mono font-bold text-white mix-blend-difference">
                  {formData.secondary_color.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branding Form */}
        <div className="dark-card rounded-[22px] p-6 flex flex-col gap-5">
          {[
            { id: 'app_name', label: 'অ্যাপের নাম', placeholder: 'e.g. গ্রামীণ সমিতি' },
            { id: 'app_tagline', label: 'ট্যাগলাইন', placeholder: 'e.g. সঞ্চয় ও ঋণের নির্ভরযোগ্য মাধ্যম' },
            { id: 'welcome_text', label: 'স্বাগতম বার্তা (Login Screen)', isTextarea: true },
            { id: 'organization_name', label: 'প্রতিষ্ঠানের নাম' },
            { id: 'footer_text', label: 'ফুটার টেক্সট' }
          ].map((field) => (
            <div key={field.id} className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">{field.label}</label>
              {field.isTextarea ? (
                <textarea 
                  rows={2}
                  value={(formData as any)[field.id]}
                  onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[14px] px-4 py-3.5 bangla text-[15px] text-slate-800 dark:text-slate-100 outline-none transition-all resize-none focus:ring-4"
                  style={{ '--tw-ring-color': `${theme.primary}0D` } as any}
                />
              ) : (
                <input 
                  type="text" 
                  value={(formData as any)[field.id]}
                  onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[14px] px-4 py-3.5 bangla text-[15px] text-slate-800 dark:text-slate-100 outline-none transition-all focus:ring-4"
                  style={{ '--tw-ring-color': `${theme.primary}0D` } as any}
                />
              )}
            </div>
          ))}

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
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-[13px] bangla font-bold">{message.text}</span>
            </motion.div>
          )}

          <button
            onClick={handleSave}
            disabled={loading || uploading}
            className="w-full text-white h-[60px] rounded-[22px] font-extrabold bangla text-[16px] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
            style={{ backgroundColor: theme.primary, boxShadow: `0 15px 25px -5px ${theme.primary}33` }}
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} strokeWidth={2.5} />}
            সেটিংস সেভ করুন
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}

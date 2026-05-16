import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useWalletStore } from '../store/useWalletStore';
import { useTheme } from '../components/ThemeProvider';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, 
  User, 
  Wallet, 
  Save, 
  Loader2, 
  CheckCircle2,
  Search,
  MessageSquare,
  Banknote
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SingleDeposit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const adminProfile = useAuthStore(state => state.profile);
  const addTransaction = useWalletStore(state => state.addTransaction);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    amount: '',
    type: 'savings' as 'savings' | 'installment' | 'deposit',
    note: ''
  });

  useEffect(() => {
    const memberId = searchParams.get('memberId');
    if (memberId) {
      fetchSingleMember(memberId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedMember) {
      fetchMembers();
    }
  }, [searchTerm, selectedMember]);

  const fetchSingleMember = async (id: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, member_wallets(balance)')
      .eq('id', id)
      .single();
    
    if (data) {
      setSelectedMember(data);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, member_wallets(balance)')
        .in('role', ['member', 'admin'])
        .ilike('full_name', `%${searchTerm}%`)
        .order('full_name')
        .limit(10);
      
      if (error) {
        console.error('Error fetching members:', error);
        // Fallback without wallets
        const { data: fallbackData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .in('role', ['member', 'admin'])
          .ilike('full_name', `%${searchTerm}%`)
          .order('full_name')
          .limit(10);
        setMembers(fallbackData || []);
      } else {
        setMembers(data || []);
      }
    } catch (err) {
      console.error('Fetch members error:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !formData.amount) {
      setMessage({ text: 'সদস্য এবং টাকার পরিমাণ নির্বাচন করুন', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (!adminProfile) throw new Error('Admin not found');

      await addTransaction({
        member_id: selectedMember.id,
        amount: Number(formData.amount),
        type: formData.type,
        note: formData.note,
        admin_id: adminProfile.id
      });

      const typeLabels: Record<string, string> = {
        savings: 'সঞ্চয়',
        installment: 'কিস্তি',
        deposit: 'জমা',
        loan: 'ঋণ',
        fine: 'জরিমানা'
      };
      const typeLabel = typeLabels[formData.type] || 'লেনদেন';
      setMessage({ text: `${typeLabel} সফলভাবে রেকর্ড করা হয়েছে`, type: 'success' });
      setFormData({ amount: '', type: 'savings', note: '' });
      setSelectedMember(null);
      setTimeout(() => navigate('/savings'), 1500);
    } catch (err: any) {
      setMessage({ text: err.message || 'Error processing deposit', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <div className="flex items-center gap-4 mb-8 text-neutral-800 dark:text-neutral-100">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white dark:bg-[#1e293b]/60 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 active:scale-90 transition-transform shadow-sm backdrop-blur-md"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-[20px] font-bold bangla">টাকা জমা দিন (Deposit)</h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6 pb-20">
        {/* Member Selector */}
        <div className="dark-card rounded-[28px] p-6 flex flex-col gap-4">
          <label className="text-[14px] font-bold text-slate-600 dark:text-slate-400 bangla ml-1">সদস্য নির্বাচন করুন</label>
          
          <div className="relative">
            <input 
              type="text"
              placeholder="নাম লিখে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[18px] px-11 py-4 text-[14px] dark:text-neutral-200 outline-none focus:ring-4 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              style={{ '--tw-ring-color': `${theme.primary}0D` } as any}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
          </div>

          {members.length > 0 && !selectedMember && (
            <div className="flex flex-col gap-2 mt-2">
              {members.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMember(m);
                    setSearchTerm('');
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/5 text-neutral-800 dark:text-neutral-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                    {m.avatar_url ? <img src={m.avatar_url} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400 dark:text-slate-600" />}
                  </div>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-[14px] font-bold bangla truncate w-full text-left">{m.full_name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold bangla tracking-wide border ${
                        m.role === 'admin' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-100 dark:border-amber-500/20' : 
                        'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-100 dark:border-emerald-500/20'
                      }`}>
                        {m.role === 'admin' ? 'অ্যাডমিন' : 'সদস্য'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-600">৳{m.member_wallets?.[0]?.balance?.toLocaleString() || '০'}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedMember && (
            <div className="flex items-center justify-between p-4 rounded-2xl border transition-all text-neutral-800 dark:text-neutral-200"
                 style={{ backgroundColor: `${theme.primary}0D`, borderColor: `${theme.primary}1A` }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm overflow-hidden">
                  {selectedMember.avatar_url ? <img src={selectedMember.avatar_url} className="w-full h-full object-cover" /> : <User size={24} style={{ color: theme.primary }} />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-bold bangla truncate">{selectedMember.full_name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold bangla tracking-wide border ${
                      selectedMember.role === 'admin' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-100 dark:border-amber-500/20' : 
                      'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-100 dark:border-emerald-500/20'
                    }`}>
                      {selectedMember.role === 'admin' ? 'অ্যাডমিন' : 'সদস্য'}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <Wallet size={10} />
                      ৳{selectedMember.member_wallets?.[0]?.balance?.toLocaleString() || '০'}
                    </div>
                  </div>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedMember(null)}
                className="text-[12px] font-bold text-rose-500 bangla px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 active:scale-95 transition-all"
              >
                পরিবর্তন
              </button>
            </div>
          )}
        </div>

        {/* Deposit Details */}
        <div className="dark-card rounded-[28px] p-6 flex flex-col gap-5 text-neutral-800 dark:text-neutral-200">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">টাকার পরিমাণ (Amount)</label>
            <div className="relative">
              <input 
                type="number" 
                value={formData.amount}
                onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-12 py-4 text-[18px] font-bold dark:text-neutral-100 outline-none focus:ring-4 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                style={{ '--tw-ring-color': `${theme.primary}0D` } as any}
              />
              <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700" size={20} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-600">৳</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">লেনদেনের ধরন (Type)</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'savings', label: 'সঞ্চয়' },
                { id: 'installment', label: 'কিস্তি' },
                { id: 'deposit', label: 'জমা' },
                { id: 'loan', label: 'ঋণ' },
                { id: 'fine', label: 'জরিমানা' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, type: t.id as any }))}
                  className={`py-3 rounded-xl font-bold bangla text-[13px] transition-all border ${
                    formData.type === t.id 
                      ? 'text-white shadow-lg' 
                      : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-white/5'
                  }`}
                  style={formData.type === t.id ? { backgroundColor: theme.primary, borderColor: theme.primary, boxShadow: `0 8px 15px -4px ${theme.primary}40` } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">নোট (ঐচ্ছিক)</label>
            <div className="relative">
              <textarea 
                value={formData.note}
                onChange={e => setFormData(p => ({ ...p, note: e.target.value }))}
                placeholder="কোন মন্তব্য থাকলে লিখুন..."
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-11 py-4 text-[14px] dark:text-neutral-200 outline-none focus:ring-4 min-h-[100px] resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                style={{ '--tw-ring-color': `${theme.primary}0D` } as any}
              />
              <MessageSquare className="absolute left-4 top-4 text-slate-300 dark:text-slate-700" size={18} />
            </div>
          </div>
        </div>

        {message.text && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2 p-4 rounded-[18px] border ${
              message.type === 'success' ? 'text-primary' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-500'
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
          className="group relative w-full text-white h-[65px] rounded-[24px] font-bold bangla text-[16px] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 overflow-hidden"
          style={{ backgroundColor: theme.primary, boxShadow: `0 15px 30px -5px ${theme.primary}40` }}
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
          {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
          জমা নিশ্চিত করুন
        </button>
      </form>
    </MobileLayout>
  );
}

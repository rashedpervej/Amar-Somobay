import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useWalletStore } from '../store/useWalletStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTheme } from '../components/ThemeProvider';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, 
  Users, 
  Save, 
  Loader2, 
  CheckCircle2,
  Banknote,
  AlertTriangle,
  Search,
  Filter,
  CheckSquare,
  Square,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function BulkDeposit() {
  const navigate = useNavigate();
  const theme = useTheme();
  const settings = useSettingsStore(state => state.settings);
  const adminProfile = useAuthStore(state => state.profile);
  const bulkDeposit = useWalletStore(state => state.bulkDeposit);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showConfirm, setShowConfirm] = useState(false);
  const [successSummary, setSuccessSummary] = useState<{
    memberCount: number;
    totalAmount: number;
    type: string;
    note: string;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    type: 'savings' as 'savings' | 'installment' | 'deposit',
    note: 'মাসিক সঞ্চয়'
  });

  useEffect(() => {
    if (settings?.is_wallet_enabled === false) {
      navigate('/dashboard');
    }
  }, [settings, navigate]);

  useEffect(() => {
    fetchMembers();
  }, [statusFilter, categoryFilter, searchTerm]);

  const fetchMembers = async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          avatar_url, 
          role, 
          member_wallets(balance)
        `)
        .in('role', ['member', 'admin'])
        .ilike('full_name', `%${searchTerm}%`)
        .order('full_name');
      
      if (error) {
        console.error('Error fetching members for bulk:', error);
        // Fallback to simple fetch
        const { data: fallbackData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .in('role', ['member', 'admin'])
          .ilike('full_name', `%${searchTerm}%`)
          .order('full_name');
        setMembers(fallbackData || []);
      } else {
        setMembers(data || []);
      }
    } catch (err) {
      console.error('Bulk fetch error:', err);
    } finally {
      setFetching(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === members.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map(m => m.id));
    }
  };

  const toggleMember = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getTxTypeLabel = (type: string) => {
    switch (type) {
      case 'savings': return 'সঞ্চয়';
      case 'installment': return 'কিস্তি';
      case 'deposit': return 'জমা';
      case 'loan': return 'ঋণ';
      case 'fine': return 'জরিমানা';
      default: return 'লেনদেন';
    }
  };

  const handleBulkAction = async () => {
    if (!formData.amount || selectedIds.length === 0) {
      setMessage({ text: 'টাকার পরিমাণ এবং অন্তত একজন সদস্য নির্বাচন করুন', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    setShowConfirm(false);

    try {
      if (!adminProfile) throw new Error('Admin not found');

      // Add a small delay for better UI feedback of the process starting
      await new Promise(resolve => setTimeout(resolve, 500));

      await bulkDeposit({
        member_ids: selectedIds,
        amount: Number(formData.amount),
        type: formData.type as any,
        note: formData.note,
        admin_id: adminProfile.id
      });

      setSuccessSummary({
        memberCount: selectedIds.length,
        totalAmount: Number(formData.amount) * selectedIds.length,
        type: getTxTypeLabel(formData.type),
        note: formData.note
      });
      
      setMessage({ text: `${selectedIds.length} জন সদস্যের লেনদেন সফলভাবে সম্পন্ন হয়েছে`, type: 'success' });
      setFormData({ amount: '', type: 'savings', note: 'মাসিক সঞ্চয়' });
      setSelectedIds([]);
    } catch (err: any) {
      setMessage({ text: err.message || 'Error processing bulk deposit', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <div className="flex items-center gap-4 mb-6 text-neutral-800 dark:text-neutral-100">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white dark:bg-[#1e293b]/60 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 active:scale-90 transition-transform shadow-sm backdrop-blur-md"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-[20px] font-bold bangla">বাল্ক ডিপোজিট (Selection)</h1>
      </div>

      <div className="flex flex-col gap-5 pb-24">
        {/* Step 1: Filters & Selection */}
        <div className="dark-card rounded-[32px] p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 px-1">
            <Filter size={16} className="text-slate-400 dark:text-slate-600" />
            <h3 className="text-[14px] font-bold text-slate-700 dark:text-slate-200 bangla">সদস্য বাছাই করুন</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-bold bangla outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="all">সকল স্ট্যাটাস</option>
              <option value="active">সক্রিয় সদস্য</option>
              <option value="inactive">নিষ্ক্রিয় সদস্য</option>
            </select>
            <select 
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-bold bangla outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="all">সকল ক্যাটাগরি</option>
              <option value="General">General</option>
              <option value="Premium">Premium</option>
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
            <input 
              type="text"
              placeholder="নাম দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[18px] px-11 py-4 text-[14px] dark:text-neutral-200 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
            />
          </div>

          <div className="border-t border-slate-50 dark:border-white/5 pt-4 flex items-center justify-between px-1">
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-[13px] font-bold bangla text-slate-600 dark:text-slate-400"
            >
              {selectedIds.length === members.length && members.length > 0 ? (
                <CheckSquare size={18} style={{ color: theme.primary }} />
              ) : (
                <Square size={18} className="text-slate-300 dark:text-slate-700" />
              )}
              সবাইকে সিলেক্ট করুন
            </button>
            <span className="text-[12px] font-bold text-slate-400 dark:text-slate-600 bangla">
              সিলেক্টেড: <span style={{ color: theme.primary }}>{selectedIds.length}</span>
            </span>
          </div>

          <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
            {fetching ? (
              <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-200 dark:text-slate-800" /></div>
            ) : members.length > 0 ? (
              members.map((member, i) => (
                <motion.button
                  key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => toggleMember(member.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    selectedIds.includes(member.id) 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5'
                  }`}
                  style={selectedIds.includes(member.id) ? { borderColor: `${theme.primary}33`, backgroundColor: `${theme.primary}0D` } : {}}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    selectedIds.includes(member.id) ? 'text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5'
                  }`}
                  style={selectedIds.includes(member.id) ? { backgroundColor: theme.primary } : {}}
                  >
                    {selectedIds.includes(member.id) && <CheckSquare size={14} />}
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                    {member.avatar_url ? <img src={member.avatar_url} className="w-full h-full object-cover" /> : <User size={18} className="text-slate-300 dark:text-slate-600" />}
                  </div>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 bangla truncate">{member.full_name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold bangla tracking-wide border ${
                        member.role === 'admin' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-100 dark:border-amber-500/20' : 
                        'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-100 dark:border-emerald-500/20'
                      }`}>
                        {member.role === 'admin' ? 'অ্যাডমিন' : 'সদস্য'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-600">৳{member.member_wallets?.[0]?.balance?.toLocaleString() || '০'}</span>
                    </div>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="py-10 text-center text-slate-400 dark:text-slate-600 bangla text-[13px]">সদস্য পাওয়া যায়নি</div>
            )}
          </div>
        </div>

        {/* Step 2: Amount & Type */}
        <div className="dark-card rounded-[32px] p-8 flex flex-col gap-6 text-neutral-800 dark:text-neutral-100">
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">টাকার পরিমাণ (সবার জন্য)</label>
            <div className="relative">
              <input 
                type="number" 
                value={formData.amount}
                onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-12 py-5 text-[24px] font-bold outline-none focus:ring-4 text-center dark:text-neutral-100 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                style={{ '--tw-ring-color': `${theme.primary}0D` } as any}
              />
              <Banknote className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700" size={24} />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-600">৳</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">লেনদেনের ধরন</label>
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
                  onClick={() => setFormData(p => ({ ...p, type: t.id as any }))}
                  className={`py-4 rounded-2xl font-bold bangla text-[13px] transition-all border ${
                    formData.type === t.id 
                      ? 'text-white shadow-xl' 
                      : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-white/5'
                  }`}
                  style={formData.type === t.id ? { backgroundColor: theme.primary, borderColor: theme.primary } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
             <label className="text-[14px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">নোট / বিস্তারিত</label>
             <input 
               type="text"
               value={formData.note}
               onChange={e => setFormData(p => ({ ...p, note: e.target.value }))}
               className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 text-[14px] dark:text-neutral-200 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
             />
          </div>
        </div>

        {message.text && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2 p-5 rounded-[22px] border ${
              message.type === 'success' ? 'text-primary' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-500'
            }`}
            style={{ 
              backgroundColor: message.type === 'success' ? `${theme.primary}0D` : undefined,
              borderColor: message.type === 'success' ? `${theme.primary}1A` : undefined
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <span>❌</span>}
            <span className="text-[14px] bangla font-bold">{message.text}</span>
          </motion.div>
        )}

        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading || !formData.amount || selectedIds.length === 0}
          className="w-full text-white h-[65px] rounded-[28px] font-bold bangla text-[16px] flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50"
          style={{ backgroundColor: theme.primary, boxShadow: `0 20px 35px -8px ${theme.primary}50` }}
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
          জমা নিশ্চিত করুন ({selectedIds.length})
        </button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#1e293b] w-full max-w-[340px] rounded-[36px] p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-white/5 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 rounded-[28px] bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-100 dark:border-amber-500/20">
                <AlertTriangle className="text-amber-500" size={40} />
              </div>
              
              <h3 className="text-[20px] font-bold text-slate-800 dark:text-slate-100 bangla mb-3">নিশ্চিত করুন</h3>
              <p className="text-[14px] text-slate-500 dark:text-slate-400 bangla leading-relaxed mb-8 px-2">
                আপনি <span className="font-bold text-slate-800 dark:text-slate-100">{selectedIds.length}</span> জন সদস্যর জন্য <span className="font-bold text-slate-800 dark:text-slate-100 underline">৳{formData.amount}</span> করে জমা করতে যাচ্ছেন।
              </p>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={handleBulkAction}
                  className="w-full text-white py-4 rounded-2xl font-bold bangla text-[15px] shadow-xl active:scale-[0.98] transition-all"
                  style={{ backgroundColor: theme.primary }}
                >
                  হ্যাঁ, নিশ্চিত
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-full bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 py-4 rounded-2xl font-bold bangla text-[15px] active:scale-[0.98] transition-all"
                >
                  বাতিল
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Summary Modal */}
      <AnimatePresence>
        {successSummary && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-[360px] rounded-[40px] p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-[28px] bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle2 className="text-emerald-500" size={40} />
              </div>
              
              <h3 className="text-[22px] font-bold text-slate-800 dark:text-slate-100 bangla mb-1">জমা সফল হয়েছে!</h3>
              <p className="text-[14px] text-slate-400 bangla mb-8 tracking-wide">আর্থিক বিবরণ সারসংক্ষেপ</p>

              <div className="w-full space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[13px] text-slate-400 bangla">নির্বাচিত সদস্য</span>
                  <span className="text-[15px] font-bold text-slate-700 dark:text-slate-200 bangla">{successSummary.memberCount} জন</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[13px] text-slate-400 bangla">জমার ধরন</span>
                  <span className="text-[15px] font-bold text-slate-700 dark:text-slate-200 bangla">{successSummary.type}</span>
                </div>
                <div className="flex flex-col gap-1 p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10">
                  <span className="text-[13px] text-slate-400 bangla">মোট জমার পরিমাণ</span>
                  <span className="text-[24px] font-black text-primary bangla">৳{successSummary.totalAmount.toLocaleString()}</span>
                </div>
                {successSummary.note && (
                  <div className="flex flex-col gap-1 px-4 text-left">
                    <span className="text-[11px] text-slate-300 bangla uppercase tracking-widest">নোট</span>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 bangla italic">"{successSummary.note}"</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/savings')}
                className="w-full text-white py-4.5 rounded-[22px] font-bold bangla text-[16px] shadow-xl active:scale-[0.98] transition-all"
                style={{ backgroundColor: theme.primary, boxShadow: `0 12px 24px -6px ${theme.primary}40` }}
              >
                ঠিক আছে
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </MobileLayout>
  );
}

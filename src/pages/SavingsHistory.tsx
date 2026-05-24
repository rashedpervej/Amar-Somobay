import React, { useEffect, useState } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useWalletStore } from '../store/useWalletStore';
import { useSomobayStore } from '../store/useSomobayStore';
import { useTheme } from '../components/ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  PiggyBank, 
  Clock, 
  Filter, 
  Search, 
  ChevronDown, 
  X,
  Calendar as CalendarIcon,
  User as UserIcon,
  TrendingUp,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/useSettingsStore';
import { supabase } from '../lib/supabase';

export default function SavingsHistory() {
  const profile = useAuthStore(state => state.profile);
  const settings = useSettingsStore(state => state.settings);
  const { allActivity, fetchUnifiedActivity, loading } = useWalletStore();
  const { plans, fetchPlans } = useSomobayStore();
  const theme = useTheme();
  const navigate = useNavigate();

  const isAdmin = profile?.role === 'admin';
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    memberId: '',
    planId: '',
    type: ''
  });
  const [members, setMembers] = useState<any[]>([]);
  const [membersInPlan, setMembersInPlan] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.id) {
      const initialFilters = isAdmin ? {} : { memberId: profile.id };
      fetchUnifiedActivity(initialFilters);
      if (isAdmin) {
        fetchPlans();
        fetchMembers();
      }
    }
  }, [profile?.id, isAdmin]);

  const fetchMembers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'member');
    if (data) {
      setMembers(data);
      setMembersInPlan(data);
    }
  };

  const fetchMembersOfPlan = async (planId: string) => {
    if (!planId) {
      setMembersInPlan(members);
      return;
    }
    const { data } = await supabase
      .from('member_plans')
      .select('member_id, profiles(id, full_name)')
      .eq('plan_id', planId);
    
    if (data) {
      const planMembers = data.map((mp: any) => mp.profiles).filter(Boolean);
      setMembersInPlan(planMembers);
    }
  };

  const handleApplyFilters = () => {
    fetchUnifiedActivity({
      memberId: filters.memberId || (isAdmin ? undefined : profile?.id),
      planId: filters.planId
    });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ memberId: '', planId: '', type: '' });
    fetchUnifiedActivity(isAdmin ? {} : { memberId: profile?.id });
    setShowFilters(false);
  };

  const getTxTypeLabel = (type: string) => {
    switch (type) {
      case 'savings': return 'সঞ্চয় জমা';
      case 'deposit': return 'আমানত';
      case 'plan_payment': return 'কিস্তি পরিশোধ';
      case 'installment': return 'কিস্তি (ওয়ালেট)';
      case 'loan': return 'ঋণ প্রদান';
      case 'fine': return 'জরিমানা';
      case 'adjustment': return 'সমন্বয়';
      default: return 'লেনদেন';
    }
  };

  const getTxTypeColor = (type: string) => {
    switch (type) {
      case 'savings': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'plan_payment': return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
      case 'installment': return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400';
      case 'loan': return 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400';
      case 'fine': return 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
      case 'deposit': return 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400';
      default: return 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400';
    }
  };

  const filteredItems = (settings?.is_wallet_enabled !== false)
    ? (filters.type ? allActivity.filter(tx => tx.transaction_type === filters.type) : allActivity)
    : allActivity.filter(tx => tx.source_module !== 'wallet');

  return (
    <MobileLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
          >
            <motion.div whileTap={{ x: -3 }}>
              <ArrowDownLeft className="rotate-45 text-slate-400" size={24} />
            </motion.div>
          </button>
          <h1 className="text-[22px] font-bold text-slate-800 dark:text-slate-100 bangla leading-tight">
            {settings?.is_wallet_enabled !== false ? 'আর্থিক লেনদেন' : 'কিস্তির ইতিহাস'}
          </h1>
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-2xl transition-all shadow-sm border ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-white/5'}`}
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Filters Modal/Sheet Entry */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="dark-card rounded-[28px] p-6 mb-6 shadow-xl border border-primary/10 relative z-30"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 bangla">ফিল্টার করুন</h3>
              <button onClick={() => setShowFilters(false)} className="text-slate-400"><X size={20} /></button>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500 bangla uppercase tracking-widest pl-1">প্ল্যান নির্বাচন</span>
                <select 
                  value={filters.planId}
                  onChange={(e) => {
                    const newPlanId = e.target.value;
                    setFilters(f => ({ ...f, planId: newPlanId, memberId: '' }));
                    fetchMembersOfPlan(newPlanId);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl p-3.5 text-[14px] bangla focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-slate-900">সকল প্ল্যান</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 font-medium">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500 bangla uppercase tracking-widest pl-1">সদস্য নির্বাচন</span>
                  <select 
                    value={filters.memberId}
                    onChange={(e) => setFilters(f => ({ ...f, memberId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl p-3.5 text-[14px] bangla focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 dark:text-white cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-slate-900">{filters.planId ? 'প্ল্যানের সকল সদস্য' : 'সকল সদস্য'}</option>
                    {membersInPlan.map(m => (
                      <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 font-medium">
                        {m.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500 bangla uppercase tracking-widest pl-1">লেনদেনের ধরণ</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'plan_payment', source: 'plan' },
                    { id: 'savings', source: 'wallet' },
                    { id: 'loan', source: 'wallet' },
                    { id: 'fine', source: 'wallet' }
                  ].filter(t => t.source === 'plan' || settings?.is_wallet_enabled !== false).map(t => (
                    <button
                      key={t.id}
                      onClick={() => setFilters(f => ({ ...f, type: f.type === t.id ? '' : t.id }))}
                      className={`py-2 px-3 rounded-xl text-[12px] font-bold bangla border transition-all ${filters.type === t.id ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-500'}`}
                    >
                      {getTxTypeLabel(t.id)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={clearFilters}
                  className="flex-1 py-3.5 rounded-2xl font-bold bangla text-slate-500 bg-slate-100 dark:bg-slate-800 active:scale-95 transition-all text-[15px]"
                >
                  ক্লিয়ার
                </button>
                <button 
                   onClick={handleApplyFilters}
                   className="flex-3 py-3.5 rounded-2xl font-bold bangla text-white shadow-lg active:scale-95 transition-all text-[15px]"
                   style={{ backgroundColor: theme.primary }}
                >
                  ফিল্টার প্রয়োগ করুন
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-[18px] font-bold text-slate-800 dark:text-slate-200 bangla">
            {isAdmin ? 'মাস্টার ট্রানজেকশন লগ' : 'আমার লেনদেন ইতিহাস'}
          </h2>
          <div className="text-[12px] text-slate-400 bangla">
            {filteredItems.length} টি রেকর্ড পাওয়া গেছে
          </div>
        </div>
        
        <div className="flex flex-col gap-3 relative before:content-[''] before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100 dark:before:bg-white/5 before:hidden sm:before:block">
          {loading ? (
             <div className="flex justify-center p-12">
               <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((tx, i) => (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.4, ease: "easeOut" }}
                className="dark-card p-5 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all relative z-10"
              >
                <div className="flex items-start justify-between">
                  {(() => {
                    let iconBg = getTxTypeColor(tx.transaction_type);
                    let label = getTxTypeLabel(tx.transaction_type);
                    let isDeposit = tx.transaction_type === 'savings' || tx.transaction_type === 'deposit' || (tx.transaction_type === 'plan_payment' && tx.type !== 'refund' && tx.type !== 'fine' && tx.type !== 'fine_payment' && tx.amount >= 0);
                    let isNegative = tx.amount < 0 || tx.type === 'refund' || tx.type === 'fine' || tx.type === 'fine_payment';
                    let displayAmountClass = isNegative ? 'text-rose-500' : 'text-emerald-500';
                    let displayAmountPrefix = isNegative ? '-' : '+';

                    if (tx.transaction_type === 'plan_payment') {
                      if (tx.type === 'fine' || tx.type === 'fine_payment') {
                        iconBg = 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
                        label = 'জরিমানা যুক্ত';
                        isDeposit = false;
                        isNegative = true;
                        displayAmountClass = 'text-rose-500 font-bold';
                        displayAmountPrefix = '-';
                      } else if (tx.type === 'waiver') {
                        iconBg = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400';
                        label = 'জরিমানা মওকুফ';
                        isDeposit = true;
                        isNegative = false;
                        displayAmountClass = 'text-emerald-500 font-bold';
                        displayAmountPrefix = '+';
                      } else if (tx.type === 'refund') {
                        iconBg = 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
                        label = 'টাকা রিফান্ড';
                        isDeposit = false;
                        isNegative = true;
                        displayAmountClass = 'text-rose-500 font-black';
                        displayAmountPrefix = '-';
                      } else if (tx.type === 'adjustment') {
                        iconBg = 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
                        label = tx.amount >= 0 ? 'সমন্বয় (বৃদ্ধি)' : 'সমন্বয় (হ্রাস)';
                        isDeposit = tx.amount >= 0;
                        isNegative = tx.amount < 0;
                        displayAmountClass = tx.amount >= 0 ? 'text-blue-500 font-bold' : 'text-rose-500 font-bold';
                        displayAmountPrefix = tx.amount >= 0 ? '+' : '-';
                      } else {
                        iconBg = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
                        label = 'কিস্তি পরিশোধ';
                        isDeposit = true;
                        isNegative = false;
                        displayAmountClass = 'text-emerald-500';
                        displayAmountPrefix = '+';
                      }
                    } else if (tx.transaction_type === 'fine') {
                      iconBg = 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
                      label = 'জরিমানা যুক্ত';
                      isDeposit = false;
                      isNegative = true;
                      displayAmountClass = 'text-rose-500 font-bold';
                      displayAmountPrefix = '-';
                    } else if (tx.transaction_type === 'savings') {
                      iconBg = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
                      isDeposit = true;
                      isNegative = false;
                      displayAmountClass = 'text-emerald-500';
                      displayAmountPrefix = '+';
                    } else if (tx.transaction_type === 'deposit') {
                      iconBg = 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400';
                      isDeposit = true;
                      isNegative = false;
                      displayAmountClass = 'text-cyan-500';
                      displayAmountPrefix = '+';
                    }

                    return (
                      <>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
                            {isDeposit ? <ArrowDownLeft size={24} strokeWidth={2.5} /> : <ArrowUpRight size={24} strokeWidth={2.5} />}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[16px] font-bold text-slate-800 dark:text-slate-100 bangla leading-none">
                                {label}
                              </span>
                              {tx.plan_name && (
                                 <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold bangla uppercase tracking-wider">
                                   {tx.plan_name}
                                 </span>
                              )}
                            </div>
                            <span className="text-[12px] text-slate-400 dark:text-slate-500 font-bold bangla mt-1 flex items-center gap-1.5 flex-wrap">
                              <CalendarIcon size={12} className="opacity-60" />
                              {new Date(tx.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                              <span className="opacity-30">•</span>
                              {new Date(tx.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className={`text-[19px] font-black bangla ${displayAmountClass}`}>
                            {displayAmountPrefix}৳{Math.abs(tx.amount).toLocaleString('bn-BD')}
                          </span>
                          {tx.penalty_paid > 0 && (
                            <span className="text-[10px] text-rose-500 font-bold bangla mt-1">
                              + বিলম্ব ফি: ৳{tx.penalty_paid}
                            </span>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-y-3 gap-x-6">
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                        <UserIcon size={12} className="text-slate-400" />
                      </div>
                      <span className="text-[13px] font-bold text-slate-600 dark:text-slate-400 bangla">
                        সদস্য: {tx.profiles?.full_name || 'অজানা'}
                      </span>
                    </div>
                  )}
                  {tx.note && (
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5">
                      <span className="text-[12px] text-slate-400 dark:text-slate-500 bangla italic truncate max-w-[200px]">
                        "{tx.note}"
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
             <div className="p-16 text-center text-slate-300 bangla bg-slate-50 dark:bg-slate-950 rounded-[34px] border-2 border-dashed border-slate-100 dark:border-slate-900">
               <History className="mx-auto mb-4 opacity-10" size={64} />
               এখনও কোনো লেনদেন রেকর্ড পাওয়া যায়নি
             </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

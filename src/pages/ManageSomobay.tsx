import React, { useEffect, useState } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useSomobayStore, SomobayPlan } from '../store/useSomobayStore';
import { useTheme } from '../components/ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Settings, 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  PiggyBank,
  Bell,
  LayoutGrid
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function ManageSomobay() {
  const { profile } = useAuthStore();
  const { plans, memberPlans, fetchPlans, fetchMemberPlans, createPlan, updatePlan, loading } = useSomobayStore();
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    duration_months: 12,
    installment_amount: 1000,
    frequency: 'monthly' as 'weekly' | 'monthly' | 'custom',
    due_day: 0,
    due_date: 1,
    target_amount: 12000,
    profit_percentage: 10,
    late_fee_amount: 50,
    status: 'active' as 'active' | 'paused' | 'completed',
    created_at: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchPlans();
    fetchMemberPlans();
  }, [fetchPlans, fetchMemberPlans]);

  const handleCreatePlan = async () => {
    try {
      const planData: any = { 
        name: newPlan.name,
        description: newPlan.description,
        duration_months: Number(newPlan.duration_months),
        installment_amount: Number(newPlan.installment_amount),
        frequency: newPlan.frequency,
        target_amount: Number(newPlan.target_amount),
        profit_percentage: Number(newPlan.profit_percentage),
        late_fee_amount: Number(newPlan.late_fee_amount),
        status: newPlan.status,
        is_active: newPlan.status === 'active',
        created_at: new Date(newPlan.created_at).toISOString()
      };
      
      if (newPlan.frequency === 'weekly') {
        planData.due_day = newPlan.due_day;
        planData.due_date = null;
      } else if (newPlan.frequency === 'monthly') {
        planData.due_date = newPlan.due_date;
        planData.due_day = null;
      }

      if (isEditing && editingPlanId) {
        await updatePlan(editingPlanId, planData);
      } else {
        await createPlan(planData);
      }
      
      setShowAddPlan(false);
      resetPlanForm();
    } catch (e: any) {
      alert('Error: ' + (e.message || 'Unknown error'));
    }
  };

  const resetPlanForm = () => {
    setNewPlan({
      name: '',
      description: '',
      duration_months: 12,
      installment_amount: 1000,
      frequency: 'monthly',
      due_day: 0,
      due_date: 1,
      target_amount: 12000,
      profit_percentage: 10,
      late_fee_amount: 50,
      status: 'active',
      created_at: new Date().toISOString().split('T')[0]
    });
    setIsEditing(false);
    setEditingPlanId(null);
  };

  const startEditPlan = (plan: SomobayPlan) => {
    setNewPlan({
      name: plan.name,
      description: plan.description || '',
      duration_months: plan.duration_months,
      installment_amount: plan.installment_amount,
      frequency: plan.frequency,
      due_day: plan.due_day ?? 0,
      due_date: plan.due_date ?? 1,
      target_amount: plan.target_amount,
      profit_percentage: plan.profit_percentage,
      late_fee_amount: plan.late_fee_amount,
      status: plan.status || 'active',
      created_at: plan.created_at ? new Date(plan.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsEditing(true);
    setEditingPlanId(plan.id);
    setShowAddPlan(true);
  };

  const handleSendReminders = async () => {
    const { sendReminders } = useSomobayStore.getState();
    setIsSendingReminders(true);
    try {
      const result = await sendReminders();
      alert(`রিমাইন্ডার পাঠানো হয়েছে!\nনতুন নোটিফিকেশন: ${result.sent}`);
    } catch (e: any) {
      alert('রিমাইন্ডার পাঠাতে সমস্যা হয়েছে');
    } finally {
      setIsSendingReminders(false);
    }
  };

  const overdueMembers = memberPlans.filter(mp => 
    mp.status === 'active' && 
    mp.next_due_date && 
    new Date(mp.next_due_date) < new Date()
  );
  const overdueCount = overdueMembers.length;
  const overdueAmount = overdueMembers.reduce((sum, mp) => {
    const plan = plans.find(p => p.id === mp.plan_id);
    return sum + (plan?.installment_amount || 0);
  }, 0);

  return (
    <MobileLayout>
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-[22px] font-bold text-slate-800 dark:text-slate-100 bangla">সমবায় ব্যবস্থাপনা</h1>
        <button 
          onClick={() => setShowAddPlan(true)}
          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Due Summary Card */}
      {overdueCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 dark:bg-rose-500/10 rounded-[20px] p-4 mb-1 border border-rose-100 dark:border-rose-500/20 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-rose-500">
              <AlertCircle size={26} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 bangla leading-tight">{overdueCount} জন (৳{overdueAmount.toLocaleString('bn-BD')}) কিস্তি বকেয়া</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 bangla">সদস্যদের দ্রুত নোটিফিকেশন পাঠান</p>
            </div>
          </div>
          <button 
            disabled={isSendingReminders}
            onClick={handleSendReminders}
            className={`w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 active:scale-95 transition-all ${isSendingReminders ? 'opacity-50 grayscale' : ''}`}
          >
            {isSendingReminders ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Bell size={22} />
            )}
          </button>
        </motion.div>
      )}

      {/* Plans Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6 px-1">
          <LayoutGrid size={18} className="text-slate-400" />
          <h2 className="text-[16px] font-bold text-slate-500 dark:text-slate-400 bangla uppercase tracking-wider">সক্রিয় সমবায় প্ল্যানসমূহ</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-5">
          {plans.map((plan, i) => {
            const planEnrollments = memberPlans.filter(mp => mp.plan_id === plan.id);
            const activeInPlan = planEnrollments.filter(mp => mp.status === 'active').length;
            const overdueInPlan = planEnrollments.filter(mp => 
              mp.status === 'active' && mp.next_due_date && new Date(mp.next_due_date) < new Date()
            ).length;

            const totalPlanCollected = planEnrollments.reduce((acc, mp) => acc + mp.total_collected, 0);
            const totalPlanTarget = plan.target_amount * planEnrollments.length;
            const progress = totalPlanTarget > 0 ? Math.min(100, (totalPlanCollected / totalPlanTarget) * 100) : 0;

            const frequencyText = plan.frequency === 'weekly' 
              ? `প্রতি ${['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'][plan.due_day ?? 0]}`
              : plan.frequency === 'monthly'
                ? `প্রতি মাসের ${plan.due_date ?? 1} তারিখ`
                : 'কাস্টম সময়সূচী';

            return (
              <motion.div 
                key={plan.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                onClick={() => navigate(`/somobay/manage/${plan.id}`)}
                className="bg-white dark:bg-slate-900 premium-shine rounded-[32px] p-6 shadow-sm border border-slate-50 dark:border-slate-800 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
                
                <div className="flex justify-between items-start mb-4 relative z-20">
                  <div>
                    <h3 className="text-[18px] font-black text-slate-800 dark:text-slate-100 bangla group-hover:text-primary transition-colors">{plan.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold bangla flex items-center gap-1.5">
                        <Calendar size={12} className="text-primary" />
                        {frequencyText}
                      </p>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                        plan.status === 'active' ? 'bg-emerald-50 text-emerald-500' : 
                        plan.status === 'paused' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                      }`}>
                        {plan.status === 'active' ? 'সক্রিয়' : plan.status === 'paused' ? 'লুকানো' : 'সম্পন্ন'}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                    <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                   <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-center">
                     <span className="block text-[10px] text-slate-400 uppercase font-black mb-0.5">মাসিক কিস্তি</span>
                     <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200 bangla">৳{plan.installment_amount.toLocaleString()}</span>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-center">
                     <span className="block text-[10px] text-slate-400 uppercase font-black mb-0.5">সক্রিয় সদস্য</span>
                     <span className="text-[14px] font-bold text-primary bangla">{activeInPlan} জন</span>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-center">
                     <span className="block text-[10px] text-slate-400 uppercase font-black mb-0.5">বকেয়া</span>
                     <span className={`text-[14px] font-bold bangla ${overdueInPlan > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{overdueInPlan} জন</span>
                   </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <span>সংগ্রহ অগ্রগতি</span>
                    <span className="text-primary">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full`} 
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-800/50 pt-4 relative z-30">
                  <div className="flex items-center gap-2 text-[12px] text-slate-400 font-bold bangla bg-slate-50 dark:bg-slate-800/80 px-3 py-1 rounded-full">
                    <Clock size={12} />
                    <span>সময়কাল: {plan.duration_months} মাস</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/somobay/manage/${plan.id}`);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-[12px] font-bold bangla transition-all"
                  >
                    <PiggyBank size={14} />
                    <span>কিস্তি জমা দিন</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Add Plan Modal */}
      <AnimatePresence>
        {showAddPlan && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowAddPlan(false); resetPlanForm(); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 500 }} className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-t-[40px] p-8 pb-10 relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[20px] font-bold text-slate-800 dark:text-slate-100 bangla">{isEditing ? 'প্ল্যান আপডেট করুন' : 'নতুন সমবায় প্ল্যান তৈরি করুন'}</h3>
                <button onClick={() => { setShowAddPlan(false); resetPlanForm(); }} className="p-2 text-slate-400 hover:text-slate-600">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-400 bangla ml-1">প্ল্যান এর নাম</label>
                  <input 
                    placeholder="যেমনঃ স্বপ্ন সঞ্চয় প্ল্যান" 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-400 bangla ml-1">প্ল্যান শুরুর তারিখ</label>
                  <input 
                    type="date"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                    value={newPlan.created_at}
                    onChange={(e) => setNewPlan({...newPlan, created_at: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-400 bangla ml-1">প্ল্যান স্ট্যাটাস</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'active', label: 'Active', sub: 'সক্রিয়' },
                      { id: 'paused', label: 'Pause', sub: 'লুকানো' },
                      { id: 'completed', label: 'Done', sub: 'সম্পন্ন' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setNewPlan({...newPlan, status: s.id as any})}
                        className={`flex-1 py-3 rounded-xl text-[12px] font-bold bangla transition-all flex flex-col items-center justify-center gap-0.5 ${newPlan.status === s.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                      >
                        <span>{s.label}</span>
                        <span className="text-[9px] opacity-80">{s.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-400 bangla ml-1">Duration (সময়কাল - মাস)</label>
                    <input 
                      type="number" 
                      placeholder="যেমনঃ ১২" 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                      value={newPlan.duration_months}
                      onChange={(e) => setNewPlan({...newPlan, duration_months: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-400 bangla ml-1">Instalment (কিস্তির পরিমাণ)</label>
                    <input 
                      type="number" 
                      placeholder="যেমনঃ ৫০০" 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                      value={newPlan.installment_amount}
                      onChange={(e) => setNewPlan({...newPlan, installment_amount: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-400 bangla ml-1">কিস্তির ফ্রিকোয়েন্সি</label>
                  <div className="flex gap-2">
                    {['weekly', 'monthly', 'custom'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setNewPlan({...newPlan, frequency: f as any})}
                        className={`flex-1 py-3 rounded-xl text-[13px] font-bold bangla transition-all ${newPlan.frequency === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                      >
                        {f === 'weekly' ? 'সাপ্তাহিক' : f === 'monthly' ? 'মাসিক' : 'কাস্টম'}
                      </button>
                    ))}
                  </div>
                </div>

                {newPlan.frequency === 'weekly' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[12px] font-bold text-slate-400 bangla ml-1">সপ্তাহের কোন দিন কিস্তি?</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'].map((day, idx) => (
                        <button
                          key={idx}
                          onClick={() => setNewPlan({...newPlan, due_day: idx})}
                          className={`py-2 rounded-lg text-[12px] font-bold bangla transition-all ${newPlan.due_day === idx ? 'bg-indigo-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {newPlan.frequency === 'monthly' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[12px] font-bold text-slate-400 bangla ml-1">মাসের কত তারিখ কিস্তি?</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="31"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                      value={newPlan.due_date}
                      onChange={(e) => setNewPlan({...newPlan, due_date: parseInt(e.target.value) || 1})}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-400 bangla ml-1">Target Amount (লক্ষ্যমাত্রা)</label>
                    <input 
                      type="number" 
                      placeholder="যেমনঃ ১০০০" 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                      value={newPlan.target_amount}
                      onChange={(e) => setNewPlan({...newPlan, target_amount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-400 bangla ml-1">Profit (লভ্যাংশ %)</label>
                    <input 
                      type="number" 
                      placeholder="যেমনঃ ১০" 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                      value={newPlan.profit_percentage}
                      onChange={(e) => setNewPlan({...newPlan, profit_percentage: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-400 bangla ml-1">Late Fee (বিলম্ব ফি)</label>
                    <input 
                      type="number" 
                      placeholder="যেমনঃ ৫০" 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                      value={newPlan.late_fee_amount}
                      onChange={(e) => setNewPlan({...newPlan, late_fee_amount: parseFloat(e.target.value) || 0})}
                    />
                </div>

                <button 
                  onClick={handleCreatePlan}
                  className="w-full py-4.5 bg-primary text-white rounded-2xl font-bold bangla shadow-lg shadow-primary/20 mt-4 active:scale-95 transition-transform"
                >
                  {isEditing ? 'আপডেট করুন' : 'প্ল্যান তৈরি করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </MobileLayout>
  );
}

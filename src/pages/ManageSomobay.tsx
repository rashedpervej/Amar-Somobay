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
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  PiggyBank,
  Bell,
  History
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ManageSomobay() {
  const { profile } = useAuthStore();
  const { plans, memberPlans, fetchPlans, fetchMemberPlans, createPlan, updatePlan, enrollMember, recordPayment, sendReminders, loading } = useSomobayStore();
  const theme = useTheme();
  
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [selectedMemberPlan, setSelectedMemberPlan] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);

  // Form states
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    duration_months: 12,
    installment_amount: 1000,
    frequency: 'monthly',
    due_day: 0,
    due_date: 1,
    target_amount: 12000,
    profit_percentage: 10,
    late_fee_amount: 50
  });

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    penalty: 0,
    note: ''
  });

  useEffect(() => {
    fetchPlans();
    fetchMemberPlans();
    
    // Fetch members for enrollment
    const loadMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, phone, role')
          .eq('role', 'member');
        
        if (error) {
          console.error('Error fetching members:', error);
          // Try a very simple query as fallback
          const { data: simpleData, error: simpleError } = await supabase.from('profiles').select('id, full_name, role');
          if (!simpleError && simpleData) {
            setMembers(simpleData.filter(p => p.role === 'member'));
          }
        } else if (data) {
          setMembers(data);
        }
      } catch (err) {
        console.error('Failed to load members:', err);
      }
    };

    loadMembers();
  }, [fetchPlans, fetchMemberPlans]);

  const handleCreatePlan = async () => {
    try {
      console.log('Saving plan...', { isEditing, editingPlanId, newPlan });
      
      // Sanitize fields based on frequency
      const planData: any = { 
        name: newPlan.name,
        description: newPlan.description,
        duration_months: Number(newPlan.duration_months),
        installment_amount: Number(newPlan.installment_amount),
        frequency: newPlan.frequency,
        target_amount: Number(newPlan.target_amount),
        profit_percentage: Number(newPlan.profit_percentage),
        late_fee_amount: Number(newPlan.late_fee_amount)
      };
      
      if (newPlan.frequency === 'weekly') {
        planData.due_day = newPlan.due_day;
        planData.due_date = null;
      } else if (newPlan.frequency === 'monthly') {
        planData.due_date = newPlan.due_date;
        planData.due_day = null;
      } else {
        planData.due_day = null;
        planData.due_date = null;
      }

      if (isEditing && editingPlanId) {
        const activeParticipants = memberPlans.filter(mp => mp.plan_id === editingPlanId && mp.status === 'active').length;
        
        // Use a simpler check if confirm is problematic
        let shouldSave = true;
        if (activeParticipants > 0) {
          shouldSave = window.confirm(
            `এই প্ল্যানটিতে ${activeParticipants} জন সক্রিয় সদস্য রয়েছেন। পরিবর্তন করলে তাদের হিসাবে সমস্যা হতে পারে। আপনি কি নিশ্চিত?`
          );
        }
        
        if (!shouldSave) return;
        
        await updatePlan(editingPlanId, planData);
      } else {
        await createPlan(planData);
      }
      
      setShowAddPlan(false);
      resetPlanForm();
    } catch (e: any) {
      console.error('Save error:', e);
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
      late_fee_amount: 50
    });
    setIsEditing(false);
    setEditingPlanId(null);
  };

  const startEditPlan = (plan: SomobayPlan) => {
    // Check for participants but allow editing even if they exist (with warning handled in handleCreatePlan confirm)
    // We already have a confirmation in handleCreatePlan, we don't necessarily need to block opening the modal
    
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
      late_fee_amount: plan.late_fee_amount
    });
    setIsEditing(true);
    setEditingPlanId(plan.id);
    setShowAddPlan(true);
  };

  const handleEnroll = async () => {
    if (!selectedProfile || !selectedPlan) return;
    try {
      await enrollMember(
        selectedProfile.id, 
        selectedPlan.id, 
        selectedPlan.duration_months,
        selectedPlan.frequency
      );
      setShowEnroll(false);
      setSelectedProfile(null);
    } catch (e: any) {
      alert('Enrollment error: ' + (e.message || 'Member already enrolled or error occurred'));
    }
  };

  const handlePayment = async () => {
    if (!selectedMemberPlan || !profile) return;
    try {
      await recordPayment({
        memberPlanId: selectedMemberPlan.id,
        amount: paymentData.amount,
        penalty: paymentData.penalty,
        adminId: profile.id,
        note: paymentData.note
      });
      setShowPayment(false);
      setSelectedMemberPlan(null);
    } catch (e: any) {
      alert('Error recording payment: ' + (e.message || 'Unknown error'));
    }
  };

  const handleSendReminders = async () => {
    setIsSendingReminders(true);
    try {
      const result = await sendReminders();
      alert(`রিমাইন্ডার পাঠানো হয়েছে!\nনতুন নোটিফিকেশন: ${result.sent}\nআজকে পাঠানো হয়েছে এমন সদস্য: ${result.alreadyNotified}`);
    } catch (e: any) {
      alert('রিমাইন্ডার পাঠাতে সমস্যা হয়েছে: ' + (e.message || 'Unknown error'));
    } finally {
      setIsSendingReminders(false);
    }
  };

  const overdueCount = memberPlans.filter(mp => 
    mp.status === 'active' && 
    mp.next_due_date && 
    new Date(mp.next_due_date) < new Date()
  ).length;

  return (
    <MobileLayout>
      <div className="flex justify-between items-center mb-6">
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
          className="bg-rose-50 dark:bg-rose-500/10 rounded-[32px] p-6 mb-8 border border-rose-100 dark:border-rose-500/20 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-rose-500">
              <AlertCircle size={26} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 bangla leading-tight">{overdueCount} জনের কিস্তি বকেয়া</h3>
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
        <div className="flex items-center gap-2 mb-4 px-1">
          <Settings size={18} className="text-slate-400" />
          <h2 className="text-[16px] font-bold text-slate-500 dark:text-slate-400 bangla uppercase tracking-wider">সক্রিয় প্ল্যানসমূহ</h2>
        </div>
        
      <div className="relative -mx-4 px-4 overflow-hidden">
        <motion.div 
          drag="x"
          dragConstraints={{ left: -((plans.length - 1) * 300), right: 0 }}
          dragElastic={0.1}
          className="flex gap-5 pb-6 cursor-grab active:cursor-grabbing"
        >
          {plans.map((plan, i) => (
            <motion.div 
              key={plan.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
              className="min-w-[280px] w-[280px] bg-white dark:bg-slate-900 premium-shine rounded-[32px] p-6 shadow-sm border border-slate-50 dark:border-slate-800 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8" />
              <div className="flex justify-between items-start mb-2 relative z-20">
                <h3 className="text-[18px] font-bold text-slate-800 dark:text-slate-200 bangla">{plan.name}</h3>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startEditPlan(plan);
                  }}
                  className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 transition-all active:scale-90 shadow-sm border border-slate-100 dark:border-slate-700"
                >
                  <Settings size={20} />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-400 bangla mb-4">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{plan.duration_months} মাস</span>
                </div>
                <span className="opacity-25">•</span>
                <div className="flex items-center gap-1">
                  <TrendingUp size={12} />
                  <span>{plan.profit_percentage}% লাভ</span>
                </div>
                <span className="opacity-25">•</span>
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{plan.frequency === 'monthly' ? `প্রতি মাসের ${plan.due_date || 1} তারিখ` : plan.frequency === 'weekly' ? `প্রতি ${['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'][plan.due_day ?? 0]}বার` : 'কাস্টম'}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end border-t border-slate-50 dark:border-slate-800/50 pt-4">
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400 bangla uppercase">প্রতি কিস্তি</span>
                  <span className="text-[17px] font-black text-primary bangla">৳{plan.installment_amount.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedPlan(plan);
                    setShowEnroll(true);
                  }}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[12px] font-bold bangla active:scale-95 transition-transform"
                >
                  সদস্য যোগ করুন
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>

      {/* Member Enrollments Section */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-1">
          <Users size={18} className="text-slate-400" />
          <h2 className="text-[16px] font-bold text-slate-500 dark:text-slate-400 bangla uppercase tracking-wider">সদস্যের প্ল্যান স্ট্যাটাস</h2>
        </div>

        <div className="flex flex-col gap-3">
          {memberPlans.map((mp: any, i) => {
            const isOverdue = mp.status === 'active' && 
                             mp.next_due_date && 
                             new Date(mp.next_due_date) < new Date();
            
            return (
              <motion.div 
                key={mp.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i + 2) * 0.05, duration: 0.4, ease: "easeOut" }}
                onClick={() => {
                  setSelectedMemberPlan(mp);
                  setPaymentData({ ...paymentData, amount: mp.plan?.installment_amount || 0 });
                  setShowPayment(true);
                }}
                className={`group rounded-[24px] p-4 flex flex-col gap-3 shadow-sm border transition-all duration-300 relative overflow-hidden ${
                  isOverdue 
                    ? 'bg-rose-50/40 dark:bg-rose-500/5 border-rose-200/60 dark:border-rose-500/20 shadow-rose-100/50 dark:shadow-none active:scale-[0.98]' 
                    : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800'
                }`}
              >
                {/* Floating Overdue Badge */}
                {isOverdue && (
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
                )}
                
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[16px] font-bold text-slate-800 dark:text-slate-200 bangla">{mp.profiles?.full_name}</span>
                    <span className="text-[12px] text-slate-400 bangla font-medium">প্ল্যান: {mp.plan?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOverdue && (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold bangla bg-rose-500 text-white shadow-sm shadow-rose-500/20 flex items-center gap-1">
                        <Clock size={10} strokeWidth={3} />
                        বকেয়া
                      </span>
                    )}
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold bangla uppercase tracking-wider ${
                      mp.status === 'active' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {mp.status === 'active' ? 'সক্রিয়' : 'বন্ধ'}
                    </div>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden relative z-10">
                  <div 
                    className={`h-full rounded-full ${isOverdue ? 'bg-rose-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, (mp.total_collected / (mp.plan?.target_amount || 1)) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] bangla text-slate-400 font-medium relative z-10">
                  <div className="flex flex-col gap-0.5">
                    <span>সংগৃহীত</span>
                    <span className={`text-[14px] font-black ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>৳{mp.total_collected.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right">
                    <span>পরবর্তী কিস্তি</span>
                    <span className={`text-[13px] font-bold ${isOverdue ? 'text-rose-500 animate-pulse' : 'text-orange-500'}`}>
                      {(() => {
                        const [y, m, d] = mp.next_due_date.split('-').map(Number);
                        const date = new Date(y, m - 1, d);
                        const dayName = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'][date.getDay()];
                        return `${date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })} (${dayName})`;
                      })()}
                    </span>
                  </div>
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

      {/* Enroll Member Modal */}
      <AnimatePresence>
        {showEnroll && selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEnroll(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-[32px] p-6 relative z-10 shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Users size={28} />
              </div>
              <h3 className="text-[18px] font-bold text-slate-800 dark:text-slate-100 bangla mb-2">সদস্য যোগ করুন</h3>
              <p className="text-[13px] text-slate-400 bangla mb-6">"{selectedPlan.name}" প্ল্যান এ সদস্য নির্বাচন করুন।</p>
              
              <div className="max-h-[300px] overflow-y-auto mb-6 custom-scrollbar">
                {members.map((m) => (
                  <button 
                    key={m.id}
                    onClick={() => setSelectedProfile(m)}
                    className={`w-full p-4 mb-2 rounded-2xl flex items-center gap-3 transition-colors ${selectedProfile?.id === m.id ? 'bg-primary/10 border border-primary/20' : 'bg-slate-50 dark:bg-slate-800 border border-transparent'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-primary">
                      {m.full_name[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100 bangla">{m.full_name}</p>
                      <p className="text-[11px] text-slate-400">{m.phone}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button 
                disabled={!selectedProfile}
                onClick={handleEnroll}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold bangla disabled:opacity-50"
              >নিশ্চিত করুন</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {showPayment && selectedMemberPlan && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPayment(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 500 }} animate={{ y: 0 }} exit={{ y: 500 }} className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-t-[40px] p-8 relative z-10">
              <div className="items-center mb-6 flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <PiggyBank size={24} />
                </div>
                <div>
                   <h3 className="text-[18px] font-bold text-slate-800 dark:text-slate-100 bangla">কিস্তি জমা দিন</h3>
                   <p className="text-[12px] text-slate-400 bangla">সদস্য: {selectedMemberPlan.profiles?.full_name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 bangla ml-1 uppercase">কিস্তির পরিমাণ</label>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-slate-700 dark:text-slate-200"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 bangla ml-1 uppercase">জরিমানা (যদি থাকে)</label>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-rose-500"
                      value={paymentData.penalty}
                      onChange={(e) => setPaymentData({...paymentData, penalty: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <input 
                  placeholder="নোট বা মন্তব্য..." 
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                  value={paymentData.note}
                  onChange={(e) => setPaymentData({...paymentData, note: e.target.value})}
                />
                <button 
                  onClick={handlePayment}
                  className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-bold bangla shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform mt-4"
                >জমা নিশ্চিত করুন</button>
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

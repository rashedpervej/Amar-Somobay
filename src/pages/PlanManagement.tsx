import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useSomobayStore, SomobayPlan, MemberPlan } from '../store/useSomobayStore';
import { useTheme } from '../components/ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronLeft, 
  Users, 
  TrendingUp, 
  Clock, 
  Calendar,
  Settings, 
  Download, 
  ArrowLeftRight,
  UserPlus,
  UserMinus,
  CheckCircle2,
  XCircle,
  Activity,
  History,
  AlertCircle,
  PiggyBank,
  MoreVertical,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PlanManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const theme = useTheme();
  const { 
    plans, 
    memberPlans, 
    fetchPlans, 
    fetchMemberPlans, 
    transferMember, 
    releaseMember, 
    updateMemberPlanStatus,
    recordPayment,
    loading: storeLoading 
  } = useSomobayStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'transactions'>('overview');
  const [currentPlan, setCurrentPlan] = useState<SomobayPlan | null>(null);
  const [enrolledMembers, setEnrolledMembers] = useState<MemberPlan[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showEnroll, setShowEnroll] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  
  // Selection state
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [targetMemberId, setTargetMemberId] = useState<string>('');
  const [selectedMemberPlan, setSelectedMemberPlan] = useState<MemberPlan | null>(null);
  const [menuOpenMemberId, setMenuOpenMemberId] = useState<string | null>(null);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<MemberPlan | null>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [newStatus, setNewStatus] = useState<MemberPlan['status']>('active');

  const [editPlanForm, setEditPlanForm] = useState({
    name: '',
    description: '',
    installment_amount: 0,
    late_fee_amount: 0,
    target_amount: 0,
    profit_percentage: 0,
    duration_months: 0,
    frequency: 'monthly' as any,
    due_date: 1,
    due_day: 0,
    status: 'active' as 'active' | 'paused' | 'completed',
    created_at: new Date().toISOString().split('T')[0]
  });

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    penalty: 0,
    note: ''
  });

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Get Plan Details
        const { data: planData } = await supabase
          .from('somobay_plans')
          .select('*')
          .eq('id', id)
          .single();
        
        if (planData) setCurrentPlan(planData);

        // 2. Refresh store plans and member plans
        await fetchPlans();
        await fetchMemberPlans();

        // 3. Fetch all members for enrollment/transfer
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, phone, avatar_url')
          .eq('role', 'member');
        if (profileData) setAllProfiles(profileData);

        // 4. Fetch Payments for this plan
        const { data: payData } = await supabase
          .from('plan_payments')
          .select(`
            *,
            member_plans!inner(plan_id, profiles:member_id(full_name))
          `)
          .eq('member_plans.plan_id', id)
          .order('payment_date', { ascending: false });
        
        if (payData) setPayments(payData);

      } catch (err) {
        console.error('Error loading plan management data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, fetchPlans, fetchMemberPlans]);

  // Sync enrolled members specifically for this plan
  useEffect(() => {
    if (id) {
      setEnrolledMembers(memberPlans.filter(mp => mp.plan_id === id));
    }
  }, [id, memberPlans]);

  const sortedMembers = React.useMemo(() => {
    return [...enrolledMembers].sort((a, b) => {
      const isAOverdue = a.status === 'active' && a.next_due_date && new Date(a.next_due_date) < new Date();
      const isBOverdue = b.status === 'active' && b.next_due_date && new Date(b.next_due_date) < new Date();

      // Priority 1: Overdue
      if (isAOverdue && !isBOverdue) return -1;
      if (!isAOverdue && isBOverdue) return 1;

      // Priority 2: Active (but not overdue)
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;

      // Priority 3: Closed (at bottom)
      if (a.status === 'closed' && b.status !== 'closed') return 1;
      if (a.status !== 'closed' && b.status === 'closed') return -1;

      return 0;
    });
  }, [enrolledMembers]);

  if (loading || !currentPlan) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  const overdueMembers = enrolledMembers.filter(m => 
    m.status === 'active' && 
    m.next_due_date && 
    new Date(m.next_due_date) < new Date()
  );

  const totalCollected = enrolledMembers.reduce((acc, curr) => acc + (curr.total_collected || 0), 0);
  const activeCount = enrolledMembers.filter(m => m.status === 'active').length;

  const handleEnroll = async () => {
    if (!selectedProfile || !id || !currentPlan) return;
    try {
      const { enrollMember } = useSomobayStore.getState();
      await enrollMember(
        selectedProfile.id, 
        id, 
        currentPlan.duration_months,
        currentPlan.frequency
      );
      setShowEnroll(false);
      setSelectedProfile(null);
    } catch (e: any) {
      alert('Enrollment error: ' + (e.message || 'Error occurred'));
    }
  };

  const handleTransfer = async () => {
    if (!selectedMemberPlan || !targetMemberId || !profile) return;
    try {
      await transferMember(selectedMemberPlan.id, selectedMemberPlan.member_id, targetMemberId, profile.id);
      setShowTransfer(false);
      setSelectedMemberPlan(null);
      setTargetMemberId('');
      alert('সদস্য সফলভাবে হস্তান্তর করা হয়েছে।');
    } catch (e: any) {
      alert('Transfer error: ' + (e.message || 'Error occurred'));
    }
  };

  const handleRelease = async () => {
    if (!selectedMemberPlan || !profile) return;
    try {
      await releaseMember(selectedMemberPlan.id, profile.id);
      setShowRelease(false);
      setSelectedMemberPlan(null);
      alert('সদস্য সফলভাবে রিলিজ করা হয়েছে।');
    } catch (e: any) {
      alert('Release error: ' + (e.message || 'Error occurred'));
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedMemberPlan || !profile) return;
    try {
      await updateMemberPlanStatus(selectedMemberPlan.id, newStatus, profile.id);
      setShowStatusUpdate(false);
      setSelectedMemberPlan(null);
      alert('স্ট্যাটাস আপডেট করা হয়েছে।');
    } catch (e: any) {
      alert('Status update error: ' + (e.message || 'Error occurred'));
    }
  };

  const handlePayment = async () => {
    if (!selectedMemberForPayment || !profile) return;
    try {
      await recordPayment({
        memberPlanId: selectedMemberForPayment.id,
        amount: paymentData.amount,
        penalty: paymentData.penalty,
        adminId: profile.id,
        note: paymentData.note
      });
      setShowPayment(false);
      setSelectedMemberForPayment(null);
      // Refresh local payments
      const { data: payData } = await supabase
          .from('plan_payments')
          .select(`
            *,
            member_plans!inner(plan_id, profiles:member_id(full_name))
          `)
          .eq('member_plans.plan_id', id!)
          .order('payment_date', { ascending: false });
      if (payData) setPayments(payData);
    } catch (e: any) {
      alert('Error recording payment: ' + (e.message || 'Unknown error'));
    }
  };

  const startEditPlan = () => {
    if (!currentPlan) return;
    setEditPlanForm({
      name: currentPlan.name,
      description: currentPlan.description || '',
      installment_amount: currentPlan.installment_amount,
      late_fee_amount: currentPlan.late_fee_amount,
      target_amount: currentPlan.target_amount,
      profit_percentage: currentPlan.profit_percentage,
      duration_months: currentPlan.duration_months,
      frequency: currentPlan.frequency,
      due_date: currentPlan.due_date || 1,
      due_day: currentPlan.due_day || 0,
      status: currentPlan.status || 'active',
      created_at: currentPlan.created_at ? new Date(currentPlan.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowEditPlan(true);
  };

  const handleUpdatePlanDetails = async () => {
    if (!id) return;
    try {
      const { updatePlan: storeUpdatePlan } = useSomobayStore.getState();
      await storeUpdatePlan(id, {
        name: editPlanForm.name,
        description: editPlanForm.description,
        installment_amount: Number(editPlanForm.installment_amount),
        late_fee_amount: Number(editPlanForm.late_fee_amount),
        target_amount: Number(editPlanForm.target_amount),
        profit_percentage: Number(editPlanForm.profit_percentage),
        duration_months: Number(editPlanForm.duration_months),
        frequency: editPlanForm.frequency,
        due_date: editPlanForm.frequency === 'monthly' ? editPlanForm.due_date : null,
        due_day: editPlanForm.frequency === 'weekly' ? editPlanForm.due_day : null,
        status: editPlanForm.status,
        is_active: editPlanForm.status === 'active',
        created_at: new Date(editPlanForm.created_at).toISOString()
      } as any);
      
      // Update local state
      setCurrentPlan({ ...currentPlan, ...editPlanForm } as any);
      setShowEditPlan(false);
    } catch (e: any) {
      alert('Update error: ' + (e.message || 'Unknown error'));
    }
  };

  const handleDownloadReport = () => {
    try {
      // Create CSV content (BOM for Excel Bengali support)
      const BOM = '\uFEFF';
      const headers = ['সদস্যের নাম', 'যোগদানের তারিখ', 'মোট জমা', 'অবস্থা', 'পরবর্তী কিস্তি'];
      const rows = enrolledMembers.map(m => [
        m.profiles?.full_name || 'N/A',
        new Date(m.start_date).toLocaleDateString('bn-BD'),
        m.total_collected,
        m.status === 'active' ? 'সক্রিয়' : m.status,
        m.next_due_date ? new Date(m.next_due_date).toLocaleDateString('bn-BD') : 'N/A'
      ]);

      const csvContent = BOM + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${currentPlan.name}_রিপোর্ট_${new Date().toLocaleDateString('bn-BD')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('রিপোর্ট ডাউনলোড করতে সমস্যা হয়েছে');
    }
  };

  return (
    <MobileLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/somobay/manage')}
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-[20px] font-bold text-slate-800 dark:text-slate-100 bangla">{currentPlan.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownloadReport}
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-transform"
          >
            <Download size={20} />
          </button>
          <button 
            onClick={startEditPlan}
            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-transform"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[22px] mb-6">
        {[
          { id: 'overview', label: 'ওভারভিউ', icon: <Activity size={16} /> },
          { id: 'members', label: 'সদস্যবৃন্দ', icon: <Users size={16} /> },
          { id: 'transactions', label: 'লেনদেন', icon: <History size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 rounded-[18px] text-[13px] font-bold bangla flex items-center justify-center gap-2 transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-50 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <PiggyBank size={20} />
                </div>
                <span className="text-[11px] text-slate-400 bangla uppercase font-bold tracking-wider">মোট সংগ্রহ</span>
                <p className="text-[20px] font-black text-slate-800 dark:text-slate-100 bangla">৳{totalCollected.toLocaleString()}</p>
              </div>
              
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-50 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                  <Users size={20} />
                </div>
                <span className="text-[11px] text-slate-400 bangla uppercase font-bold tracking-wider">সক্রিয় সদস্য</span>
                <p className="text-[20px] font-black text-slate-800 dark:text-slate-100 bangla">{activeCount} জন</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-50 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3">
                  <Clock size={20} />
                </div>
                <span className="text-[11px] text-slate-400 bangla uppercase font-bold tracking-wider">বকেয়া কিস্তি</span>
                <p className="text-[20px] font-black text-slate-800 dark:text-slate-100 bangla">{overdueMembers.length} জন</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-50 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                  <TrendingUp size={20} />
                </div>
                <span className="text-[11px] text-slate-400 bangla uppercase font-bold tracking-wider">টার্গেট</span>
                <p className="text-[20px] font-black text-slate-800 dark:text-slate-100 bangla">৳{(currentPlan.target_amount * activeCount).toLocaleString()}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-700">
              <h3 className="text-[14px] font-bold text-slate-500 dark:text-slate-400 bangla uppercase mb-4 px-1">কুইক অ্যাকশনস</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowEnroll(true)}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex flex-col items-center gap-2 border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-transform"
                >
                  <UserPlus className="text-primary" size={24} />
                  <span className="text-[12px] font-bold bangla">সদস্য যোগ</span>
                </button>
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex flex-col items-center gap-2 border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-transform"
                >
                  <History className="text-indigo-500" size={24} />
                  <span className="text-[12px] font-bold bangla">ডিটেইল লগ</span>
                </button>
              </div>
            </div>

            {/* Plan Info & Logic Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-50 dark:border-slate-800 shadow-sm overflow-hidden group">
               <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-6 text-white relative">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <h3 className="text-[18px] font-bold bangla">{currentPlan.name}</h3>
                      <p className="text-[12px] opacity-80 bangla">{currentPlan.description || 'সমবায় সঞ্চয় প্ল্যান'}</p>
                    </div>
                    <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-tighter backdrop-blur-md">
                      {currentPlan.frequency === 'monthly' ? 'মাসিক' : currentPlan.frequency === 'weekly' ? 'সাপ্তাহিক' : 'কাস্টম'}
                    </div>
                  </div>
               </div>
               
               <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar size={13} strokeWidth={2.5} />
                        <span className="text-[10px] uppercase font-black tracking-wider">শুরুর তারিখ</span>
                      </div>
                      <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 bangla">
                        {currentPlan.created_at ? new Date(currentPlan.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-500">
                        <TrendingUp size={13} strokeWidth={2.5} />
                        <span className="text-[10px] uppercase font-black tracking-wider">লভ্যাংশ</span>
                      </div>
                      <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 bangla">
                        {currentPlan.profit_percentage}% (মুনাফা)
                      </p>
                    </div>
                  </div>

                  <div className="h-[1px] bg-slate-50 dark:bg-slate-800" />

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-indigo-500">
                        <Clock size={13} strokeWidth={2.5} />
                        <span className="text-[10px] uppercase font-black tracking-wider">কিস্তির সময়</span>
                      </div>
                      <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 bangla">
                        {currentPlan.frequency === 'monthly' 
                          ? `প্রতি মাসের ${currentPlan.due_date} তারিখ` 
                          : currentPlan.frequency === 'weekly' 
                            ? `সপ্তাহের ${['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'][currentPlan.due_day || 0]}`
                            : 'সংশ্লিষ্ট তারিখে'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-orange-500">
                        <Activity size={13} strokeWidth={2.5} />
                        <span className="text-[10px] uppercase font-black tracking-wider">অবশিষ্ট কিস্তি</span>
                      </div>
                      <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 bangla">
                        {(() => {
                           if (!currentPlan?.created_at || !currentPlan?.duration_months) return 'N/A';
                           const start = new Date(currentPlan.created_at);
                           const end = new Date(start);
                           end.setMonth(start.getMonth() + currentPlan.duration_months);
                           const now = new Date();
                           if (now > end) return '০টি (সম্পন্ন)';
                           
                           let remain = 0;
                           if (currentPlan.frequency === 'monthly') {
                             const yearDiff = end.getFullYear() - now.getFullYear();
                             const monthDiff = end.getMonth() - now.getMonth();
                             remain = Math.max(0, yearDiff * 12 + monthDiff);
                           } else if (currentPlan.frequency === 'weekly') {
                             const diffTime = end.getTime() - now.getTime();
                             remain = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)));
                           } else {
                             const yearDiff = end.getFullYear() - now.getFullYear();
                             const monthDiff = end.getMonth() - now.getMonth();
                             remain = Math.max(0, yearDiff * 12 + monthDiff);
                           }
                           return `${remain.toLocaleString('bn-BD')}টি কিস্তি`;
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase font-black block mb-1">কিস্তির পরিমাণ</span>
                      <p className="text-[15px] font-black text-primary bangla">৳{currentPlan.installment_amount.toLocaleString('bn-BD')}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase font-black block mb-1">বিলম্ব ফি</span>
                      <p className="text-[15px] font-black text-rose-500 bangla">৳{currentPlan.late_fee_amount.toLocaleString('bn-BD')}</p>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'members' && (
          <motion.div
            key="members"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center px-1">
               <h3 className="text-[14px] font-bold text-slate-500 dark:text-slate-400 bangla uppercase">মোট এনরোলমেন্ট ({enrolledMembers.length})</h3>
               <button 
                onClick={() => setShowEnroll(true)}
                className="flex items-center gap-1.5 text-[12px] font-bold text-primary bangla"
               >
                 <Plus size={16} strokeWidth={3} />
                 নতুন যোগ করুন
               </button>
            </div>

            <div className="flex flex-col gap-3 pb-20">
              {sortedMembers.map((mp, i) => {
                const isOverdue = mp.status === 'active' && 
                                 mp.next_due_date && 
                                 new Date(mp.next_due_date) < new Date();
                
                return (
                  <motion.div 
                    key={mp.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-white dark:bg-slate-900 rounded-[32px] p-5 border shadow-sm transition-all relative group ${
                      menuOpenMemberId === mp.id 
                        ? 'overflow-visible z-50 ring-2 ring-primary/10 border-primary/20' 
                        : 'overflow-hidden border-slate-50 dark:border-slate-800'
                    } ${
                      isOverdue && menuOpenMemberId !== mp.id 
                        ? 'border-rose-200 dark:border-rose-500/20 bg-gradient-to-br from-rose-50/50 to-white dark:from-rose-500/5 dark:to-slate-900 shadow-lg shadow-rose-500/5' 
                        : ''
                    }`}
                  >
                    {/* Floating Overdue Badge */}
                    {isOverdue && (
                      <div className="absolute top-4 right-14 z-20 flex items-center gap-1 bg-rose-500 text-white px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-lg shadow-rose-500/20 animate-in fade-in zoom-in duration-300">
                        <AlertCircle size={10} strokeWidth={3} />
                        বকেয়া
                      </div>
                    )}

                    {/* Decorative blobs */}
                    {isOverdue && menuOpenMemberId !== mp.id && (
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/15 transition-colors pointer-events-none" />
                    )}

                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-primary text-[18px]">
                          {mp.profiles?.full_name?.[0]}
                        </div>
                        <div>
                          <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 bangla">{mp.profiles?.full_name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                            mp.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}>
                            {mp.status === 'active' ? 'সক্রিয়' : mp.status === 'closed' ? 'বন্ধ' : mp.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMemberForPayment(mp);
                            setPaymentData({ ...paymentData, amount: currentPlan.installment_amount });
                            setShowPayment(true);
                            setMenuOpenMemberId(null);
                          }}
                          className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <PiggyBank size={18} />
                        </button>
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenMemberId(menuOpenMemberId === mp.id ? null : mp.id);
                            }}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                              menuOpenMemberId === mp.id 
                                ? 'bg-primary text-white' 
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                           <MoreVertical size={18} />
                          </button>
                          
                          {/* Floating menu in card for member actions */}
                          <AnimatePresence>
                            {menuOpenMemberId === mp.id && (
                               <motion.div 
                                 initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                 animate={{ opacity: 1, scale: 1, y: 0 }}
                                 exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                 className="absolute right-0 top-11 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] shadow-2xl z-[100] p-2 space-y-1 backdrop-blur-xl"
                               >
                                  <button onClick={() => { setSelectedMemberPlan(mp); setShowTransfer(true); setMenuOpenMemberId(null); }} className="w-full text-left p-3 rounded-xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <ArrowLeftRight size={16} className="text-blue-500" />
                                    <span className="text-[12px] font-bold bangla">সদস্য হস্তান্তর</span>
                                  </button>
                                  <button onClick={() => { setSelectedMemberPlan(mp); setShowStatusUpdate(true); setMenuOpenMemberId(null); }} className="w-full text-left p-3 rounded-xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    <span className="text-[12px] font-bold bangla">ডিটেইল/স্ট্যাটাস</span>
                                  </button>
                                  <button onClick={() => { setSelectedMemberPlan(mp); setShowRelease(true); setMenuOpenMemberId(null); }} className="w-full text-left p-3 rounded-xl flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-900/10 text-rose-500 transition-colors">
                                    <UserMinus size={16} />
                                    <span className="text-[12px] font-bold bangla">রিলিজ/বন্ধ</span>
                                  </button>
                                  <div className="h-[1px] bg-slate-50 dark:bg-slate-700/50 mx-2 my-1" />
                                  <button onClick={() => setMenuOpenMemberId(null)} className="w-full p-2 text-center text-[11px] font-bold text-slate-400 bangla hover:text-slate-600 dark:hover:text-slate-300">বন্ধ করুন</button>
                               </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[11px] font-bold bangla">
                          <span className="text-slate-400">ব্যালেন্স</span>
                          <span className="text-primary">৳{mp.total_collected.toLocaleString()} / ৳{currentPlan.target_amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isOverdue ? 'bg-rose-500' : 'bg-primary'} transition-all duration-1000`}
                            style={{ width: `${Math.min(100, (mp.total_collected / currentPlan.target_amount) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                         <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 bangla uppercase font-bold">পরবর্তী কিস্তি</span>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className={isOverdue ? 'text-rose-500' : 'text-slate-400'} />
                              <span className={`text-[12px] font-bold bangla ${isOverdue ? 'text-rose-500 animate-pulse' : 'text-slate-600 dark:text-slate-400'}`}>
                                {mp.next_due_date ? new Date(mp.next_due_date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) : 'N/A'}
                              </span>
                            </div>
                         </div>
                         <div className="flex flex-col text-right">
                            <span className="text-[10px] text-slate-400 bangla uppercase font-bold">জরিমানা বাকি</span>
                            <span className="text-[13px] font-bold text-rose-500 bangla">৳০</span>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'transactions' && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4 pb-20"
          >
            <div className="flex justify-between items-center px-1">
               <h3 className="text-[14px] font-bold text-slate-500 dark:text-slate-400 bangla uppercase">সাম্প্রতিক লেনদেন ({payments.length})</h3>
               <button className="text-[11px] font-bold text-primary flex items-center gap-1 bangla">
                 <FileText size={14} />
                 ফুল রিপোর্ট
               </button>
            </div>

            <div className="flex flex-col gap-3">
              {payments.length === 0 ? (
                <div className="p-10 text-center space-y-3 bg-white dark:bg-slate-900 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800">
                   <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <History size={32} />
                   </div>
                   <p className="text-[13px] text-slate-400 bangla">এখনও কোনো লেনদেন হয়নি</p>
                </div>
              ) : (
                payments.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 rounded-[28px] shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                       <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <Activity size={20} />
                       </div>
                       <div>
                          <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100 bangla">{p.member_plans?.profiles?.full_name}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">{new Date(p.payment_date).toLocaleDateString('bn-BD')} • {new Date(p.payment_date).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[15px] font-black text-emerald-600 bangla">+৳{p.amount.toLocaleString()}</p>
                       {p.penalty_paid > 0 && <p className="text-[10px] font-bold text-rose-500 bangla">বিলম্ব ফি ৳{p.penalty_paid}</p>}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Modals --- */}

      {/* Enroll Member Modal */}
      <AnimatePresence>
        {showEnroll && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEnroll(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-[32px] p-6 relative z-10 shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center mb-4">
                <UserPlus size={28} />
              </div>
              <h3 className="text-[18px] font-bold text-slate-800 dark:text-slate-100 bangla mb-2">সদস্য যোগ করুন</h3>
              <p className="text-[13px] text-slate-400 bangla mb-6">"{currentPlan.name}" প্ল্যান এ সদস্য নির্বাচন করুন।</p>
              
              <div className="max-h-[300px] overflow-y-auto mb-6 custom-scrollbar pr-1">
                {allProfiles.filter(p => !enrolledMembers.some(em => em.member_id === p.id)).map((m) => (
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
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold bangla disabled:opacity-50 active:scale-95 transition-transform shadow-lg shadow-primary/20"
              >নিশ্চিত করুন</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Member Modal */}
      <AnimatePresence>
        {showTransfer && selectedMemberPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTransfer(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-[32px] p-6 relative z-10 shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                <ArrowLeftRight size={28} />
              </div>
              <h3 className="text-[18px] font-bold text-slate-800 dark:text-slate-100 bangla mb-2">সদস্য হস্তান্তর</h3>
              <p className="text-[13px] text-slate-400 bangla mb-6">"{selectedMemberPlan.profiles?.full_name}" এর পরিবর্তে কাকে যুক্ত করতে চান?</p>
              
              <div className="max-h-[300px] overflow-y-auto mb-6 custom-scrollbar pr-1">
                {allProfiles.filter(p => !enrolledMembers.some(em => em.member_id === p.id)).map((m) => (
                  <button 
                    key={m.id}
                    onClick={() => setTargetMemberId(m.id)}
                    className={`w-full p-4 mb-2 rounded-2xl flex items-center gap-3 transition-colors ${targetMemberId === m.id ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-slate-50 dark:bg-slate-800 border border-transparent'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-blue-500">
                      {m.full_name[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100 bangla">{m.full_name}</p>
                      <p className="text-[11px] text-slate-400">{m.phone}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/5 p-4 rounded-2xl mb-6 border border-amber-100 dark:border-amber-500/10">
                 <p className="text-[11px] text-amber-600 dark:text-amber-400 bangla leading-relaxed">
                   সদস্য হস্তান্তর করলে আগের সকল কিস্তির রেকর্ড নতুন সদস্যের প্রোফাইলে যুক্ত হবে। এটি একটি অপরিবর্তনযোগ্য প্রক্রিয়া।
                 </p>
              </div>

              <button 
                disabled={!targetMemberId}
                onClick={handleTransfer}
                className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold bangla disabled:opacity-50 active:scale-95 transition-transform shadow-lg shadow-blue-500/20"
              >হস্তান্তর করুন</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {showPayment && selectedMemberForPayment && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPayment(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 500 }} animate={{ y: 0 }} exit={{ y: 500 }} className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-t-[40px] p-8 pb-12 relative z-10">
              <div className="items-center mb-6 flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <PiggyBank size={24} />
                </div>
                <div>
                   <h3 className="text-[18px] font-bold text-slate-800 dark:text-slate-100 bangla">কিস্তি জমা দিন</h3>
                   <p className="text-[12px] text-slate-400 bangla">সদস্য: {selectedMemberForPayment.profiles?.full_name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 bangla ml-1 uppercase underline decoration-emerald-200">কিস্তির পরিমাণ</label>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-slate-700 dark:text-slate-200"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 bangla ml-1 uppercase underline decoration-rose-200">জরিমানা (যদি থাকে)</label>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-rose-500"
                      value={paymentData.penalty}
                      onChange={(e) => setPaymentData({...paymentData, penalty: parseFloat(e.target.value) || 0})}
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

      {/* Status Update Modal */}
      <AnimatePresence>
        {showStatusUpdate && selectedMemberPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStatusUpdate(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-[32px] p-8 relative z-10 shadow-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 mx-auto">
                <Activity size={32} />
              </div>
              <h3 className="text-[20px] font-bold text-slate-800 dark:text-slate-100 bangla mb-2">স্ট্যাটাস আপডেট</h3>
              <p className="text-[13px] text-slate-400 bangla mb-6 italic">সদস্য: {selectedMemberPlan.profiles?.full_name}</p>
              
              <div className="grid grid-cols-1 gap-2 mb-8">
                {[
                  { value: 'active', label: 'সক্রিয় (Active)', icon: <CheckCircle2 size={16} />, color: 'emerald' },
                  { value: 'closed', label: 'বন্ধ (Closed)', icon: <XCircle size={16} />, color: 'rose' },
                  { value: 'completed', label: 'সম্পন্ন (Completed)', icon: <CheckCircle2 size={16} />, color: 'blue' }
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setNewStatus(s.value as any)}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border ${
                      newStatus === s.value 
                        ? `bg-${s.color}-500/10 border-${s.color}-500 text-${s.color}-600` 
                        : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {s.icon}
                      <span className="text-[14px] font-bold bangla">{s.label}</span>
                    </div>
                    {newStatus === s.value && <CheckCircle2 size={18} />}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowStatusUpdate(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold bangla active:scale-95 transition-transform"
                >বাতিল</button>
                <button 
                  onClick={handleStatusUpdate}
                  className="flex-2 py-4 bg-primary text-white rounded-2xl font-bold bangla active:scale-95 transition-transform shadow-lg shadow-primary/20"
                >আপডেট করুন</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Release Member Modal */}
      <AnimatePresence>
        {showRelease && selectedMemberPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRelease(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-[32px] p-8 relative z-10 shadow-2xl text-center">
              <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6 mx-auto">
                <UserMinus size={40} />
              </div>
              <h3 className="text-[20px] font-bold text-slate-800 dark:text-slate-100 bangla mb-3">আপনি কি নিশ্চিত?</h3>
              <p className="text-[13px] text-slate-400 bangla mb-8 leading-relaxed">
                "{selectedMemberPlan.profiles?.full_name}" কে এই প্ল্যান থেকে রিলিজ বা বাদ দিতে চান? এটি করলে তার প্ল্যান স্ট্যাটাস "বন্ধ" হয়ে যাবে।
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowRelease(false)}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold bangla active:scale-95 transition-transform"
                >না, থাক</button>
                <button 
                  onClick={handleRelease}
                  className="flex-2 py-4 bg-rose-500 text-white rounded-2xl font-bold bangla active:scale-95 transition-transform shadow-lg shadow-rose-500/20"
                >হ্যাঁ, রিলিজ করুন</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Plan Modal */}
      <AnimatePresence>
        {showEditPlan && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditPlan(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 500 }} animate={{ y: 0 }} exit={{ y: 500 }} className="w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-t-[40px] p-8 pb-10 relative z-10 max-h-[92vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[20px] font-bold text-slate-800 dark:text-slate-100 bangla">প্ল্যান আপডেট করুন</h3>
                <button onClick={() => setShowEditPlan(false)} className="p-2 text-slate-400">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-400 bangla ml-1">প্ল্যান এর নাম</label>
                  <input 
                    placeholder="নাম..." 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px] font-bold"
                    value={editPlanForm.name}
                    onChange={(e) => setEditPlanForm({...editPlanForm, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-400 bangla ml-1">প্ল্যান শুরুর তারিখ</label>
                    <input 
                      type="date"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                      value={editPlanForm.created_at}
                      onChange={(e) => setEditPlanForm({...editPlanForm, created_at: e.target.value})}
                    />
                  </div>
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
                        onClick={() => setEditPlanForm({...editPlanForm, status: s.id as any})}
                        className={`flex-1 py-3 rounded-xl text-[12px] font-bold bangla transition-all flex flex-col items-center justify-center gap-0.5 ${editPlanForm.status === s.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                      >
                        <span>{s.label}</span>
                        <span className="text-[9px] opacity-80">{s.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-400 bangla ml-1">সংক্ষিপ্ত বর্ণনা</label>
                  <input 
                    placeholder="বর্ণনা..." 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                    value={editPlanForm.description}
                    onChange={(e) => setEditPlanForm({...editPlanForm, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-400 bangla ml-1">সময়কাল (মাস)</label>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                      value={editPlanForm.duration_months}
                      onChange={(e) => setEditPlanForm({...editPlanForm, duration_months: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-400 bangla ml-1">কিস্তির পরিমাণ</label>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px] font-bold text-primary"
                      value={editPlanForm.installment_amount}
                      onChange={(e) => setEditPlanForm({...editPlanForm, installment_amount: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-400 bangla ml-1">কিস্তির ফ্রিকোয়েন্সি</label>
                  <div className="flex gap-2">
                    {['weekly', 'monthly', 'custom'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setEditPlanForm({...editPlanForm, frequency: f as any})}
                        className={`flex-1 py-3 rounded-xl text-[13px] font-bold bangla transition-all ${editPlanForm.frequency === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                      >
                        {f === 'weekly' ? 'সাপ্তাহিক' : f === 'monthly' ? 'মাসিক' : 'কাস্টম'}
                      </button>
                    ))}
                  </div>
                </div>

                {editPlanForm.frequency === 'weekly' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[12px] font-bold text-slate-400 bangla ml-1">সপ্তাহের কোন দিন কিস্তি?</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'].map((day, idx) => (
                        <button
                          key={idx}
                          onClick={() => setEditPlanForm({...editPlanForm, due_day: idx})}
                          className={`py-2 rounded-lg text-[12px] font-bold bangla transition-all ${editPlanForm.due_day === idx ? 'bg-indigo-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {editPlanForm.frequency === 'monthly' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <label className="text-[12px] font-bold text-slate-400 bangla ml-1">মাসের কত তারিখ কিস্তি?</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="31"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                      value={editPlanForm.due_date}
                      onChange={(e) => setEditPlanForm({...editPlanForm, due_date: parseInt(e.target.value) || 1})}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-400 bangla ml-1">ব্যক্তিগত টার্গেট</label>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                      value={editPlanForm.target_amount}
                      onChange={(e) => setEditPlanForm({...editPlanForm, target_amount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-400 bangla ml-1">লভ্যাংশ %</label>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                      value={editPlanForm.profit_percentage}
                      onChange={(e) => setEditPlanForm({...editPlanForm, profit_percentage: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-400 bangla ml-1">বিলম্ব ফি</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px] text-rose-500 font-bold"
                    value={editPlanForm.late_fee_amount}
                    onChange={(e) => setEditPlanForm({...editPlanForm, late_fee_amount: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <button 
                  onClick={handleUpdatePlanDetails}
                  className="w-full py-4.5 bg-primary text-white rounded-2xl font-bold bangla shadow-lg shadow-primary/20 mt-4 active:scale-95 transition-transform"
                >
                  পরিবর্তন নিশ্চিত করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </MobileLayout>
  );
}

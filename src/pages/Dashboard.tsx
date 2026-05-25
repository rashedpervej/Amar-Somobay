import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useWalletStore } from '../store/useWalletStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSomobayStore } from '../store/useSomobayStore';
import { useTheme } from '../components/ThemeProvider';
import { StatCard } from '../components/Dashboard/StatCard';
import { QuickAction } from '../components/Dashboard/QuickAction';
import { 
  Users, 
  Clock, 
  HandCoins, 
  CreditCard, 
  Bell,
  BarChart3,
  Sun,
  Moon,
  ChevronRight,
  User,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  TrendingUp,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export default function Dashboard() {
  const profile = useAuthStore(state => state.profile);
  const settings = useSettingsStore(state => state.settings);
  const totalSavings = useWalletStore(state => state.totalSavings);
  const fetchTotalSavings = useWalletStore(state => state.fetchTotalSavings);
  const wallet = useWalletStore(state => state.wallet);
  const fetchWallet = useWalletStore(state => state.fetchWallet);
  const { transactions, allActivity, fetchTransactions, fetchUnifiedActivity } = useWalletStore();
  const { memberPlans, fetchMemberPlans, adminStats, fetchAdminStats } = useSomobayStore();
  const { notifications, unreadCount, fetchNotifications } = useNotificationStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [imgErr, setImgErr] = useState(false);
  
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => {};
    
    if (profile?.id) {
      const pId = profile.id;
      fetchNotifications(pId).then(unsub => {
        if (active) unsubscribe = unsub;
        else unsub();
      });

      if (!isAdmin) {
        fetchMemberPlans(pId);
        fetchUnifiedActivity({ memberId: pId });
        if (settings?.is_wallet_enabled !== false) {
          fetchWallet(pId);
          fetchTransactions(pId);
        }
      } else {
        fetchAdminStats();
      }
    }
    
    return () => {
      active = false;
      unsubscribe();
    };
  }, [profile?.id, fetchNotifications, isAdmin, fetchWallet, fetchTransactions, fetchMemberPlans, fetchAdminStats, settings?.is_wallet_enabled, fetchUnifiedActivity]);

  useEffect(() => {
    if (isAdmin) {
      setLoading(false);
    } else if (profile?.id) {
      setLoading(false);
    }
  }, [isAdmin, profile?.id]);

  const overdueMemberPlans = memberPlans.filter(mp => 
    mp.status === 'active' && 
    mp.next_due_date && 
    new Date(mp.next_due_date) < new Date(new Date().setHours(0,0,0,0))
  );

  const activePlansCount = memberPlans.filter(p => p.status === 'active').length;
  const activeUserPlans = memberPlans.filter(mp => mp.plan);
  const overallProgress = activeUserPlans.length > 0
    ? Math.max(0, Math.min(100, Math.round((activeUserPlans.reduce((acc, curr) => {
        const target = curr.plan?.target_amount || 1;
        const ratio = (curr.total_collected || 0) / target;
        return acc + Math.min(1, Math.max(0, ratio));
      }, 0) / activeUserPlans.length) * 100)))
    : 0;
  
  const earliestNextDue = memberPlans
    .filter(mp => mp.status === 'active' && mp.next_due_date)
    .sort((a, b) => new Date(a.next_due_date!).getTime() - new Date(b.next_due_date!).getTime())[0]?.next_due_date;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "সুপ্রভাত";
    if (hour < 18) return "শুভ দুপুর";
    return "শুভ সন্ধ্যা";
  };

  const filteredUnreadCount = settings?.is_wallet_enabled !== false 
    ? unreadCount 
    : notifications.filter(n => {
        if (n.is_read) return false;
        // If source_module is explicitly wallet, hide it.
        // Default to showing if not marked or if marked as plan.
        return n.source_module !== 'wallet';
      }).length;

  const renderHeader = () => (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0" style={{ backgroundColor: `${theme.primary}1A` }}>
           {profile?.avatar_url ? (
             <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
           ) : (
             <span className="text-lg font-bold bangla" style={{ color: theme.primary }}>
               {profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'ন'}
             </span>
           )}
        </div>
        <div className="flex flex-col">
          <span className="text-[14px] text-slate-400 dark:text-slate-500 bangla font-medium leading-none mb-1">{getGreeting()}</span>
          <h1 className="text-[22px] font-bold text-slate-800 dark:text-slate-100 bangla leading-tight">{profile?.full_name || 'সদস্য'}</h1>
          <div 
            className="mt-1 px-3 py-0.5 rounded-full w-fit" 
            style={{ 
              backgroundColor: profile?.role === 'admin' ? `${theme.primary}1A` : (theme.mode === 'light' ? '#f1f5f9' : '#1e293b'),
            }}
          >
            <span 
              className="text-[11px] font-bold bangla" 
              style={{ color: profile?.role === 'admin' ? theme.primary : '#64748b' }}
            >
              {profile?.role === 'admin' ? 'অ্যাডমিন (Admin)' : profile?.role === 'member' ? 'সদস্য (Member)' : 'অপেক্ষমান (Pending)'}
            </span>
          </div>
        </div>
      </div>
      <button 
        onClick={() => navigate('/notifications')}
        className="bg-white/80 dark:bg-[#1e293b]/60 p-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 active:scale-95 transition-all relative backdrop-blur-md"
      >
        <Bell size={22} strokeWidth={2.2} />
        {filteredUnreadCount > 0 && (
          <div 
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-[#0b0f1a] flex items-center justify-center text-[10px] font-extrabold text-white shadow-lg animate-pulse"
            style={{ backgroundColor: theme.primary }}
          >
            {filteredUnreadCount > 9 ? '9+' : filteredUnreadCount}
          </div>
        )}
      </button>
    </div>
  );

  if (isAdmin) {
    return (
      <MobileLayout>
        {renderHeader()}

        <div className="grid grid-cols-2 gap-[12px] mt-4">
          {[
            { id: 'total-members', label: "মোট সদস্য", value: adminStats.totalMembers, color: "text-primary", icon: <Users />, bg: "bg-primary/10" },
            { id: 'total-collections', label: "মোট কালেকশন", value: `৳${adminStats.totalCollections.toLocaleString()}`, color: "text-emerald-600 dark:text-emerald-400", icon: <HandCoins />, bg: "bg-emerald-50 dark:bg-emerald-500/10" },
            { 
              id: 'merged-plans', 
              label: "প্ল্যান ও এনরোলমেন্ট", 
              customValue: (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[24px] font-extrabold bangla">{adminStats.activePlanTypes}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 bangla font-bold">প্ল্যান</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[18px] font-bold text-blue-500/80 dark:text-blue-400 bangla">{adminStats.activeEnrollments}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 bangla font-medium">এনরোলমেন্ট</span>
                  </div>
                </div>
              ),
              color: "text-blue-500 dark:text-blue-400", 
              icon: <Activity />, 
              bg: "bg-blue-50 dark:bg-blue-500/10" 
            },
            { 
              id: 'merged-overdue', 
              label: "বকেয়া ও পেন্ডিং", 
              customValue: (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[24px] font-extrabold bangla text-rose-500">{adminStats.overdueMembers}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 bangla font-bold">সদস্য</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[16px] font-bold text-orange-500/80 bangla">৳{adminStats.pendingDues.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 bangla font-medium">বকেয়া</span>
                  </div>
                </div>
              ),
              color: "text-rose-500 dark:text-rose-400", 
              icon: <Clock />, 
              bg: "bg-rose-50 dark:bg-rose-500/10" 
            },
            settings?.is_wallet_enabled !== false && { id: 'total-savings', label: "মোট সঞ্চয়", value: `৳${totalSavings.toLocaleString()}`, color: "text-slate-600 dark:text-slate-400", icon: <HandCoins />, bg: "bg-slate-100 dark:bg-white/5" },
          ].filter(Boolean).map((stat: any, i) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
              onClick={() => {
                if (stat.id === 'merged-overdue') {
                  navigate('/members?filter=overdue');
                }
              }}
              className={stat.id === 'total-savings' ? "col-span-2" : "col-span-1"}
            >
              {stat.customValue ? (
                <div className={`dark-card rounded-[22px] p-4 relative overflow-hidden flex flex-col justify-between h-[124px] ${stat.id === 'merged-overdue' ? 'cursor-pointer active:scale-[0.98] transition-all hover:border-rose-200 dark:hover:border-rose-900/30' : ''}`}>
                  <div className="z-10 flex flex-col gap-1 w-full">
                    <span className="text-[13px] text-slate-500 dark:text-slate-400/80 bangla font-semibold tracking-wide uppercase opacity-80">{stat.label}</span>
                  </div>
                  <div className="z-10 flex justify-between items-end w-full">
                    {stat.customValue}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm shrink-0 transition-transform active:scale-95 ${stat.bg} ${stat.color}`}>
                      {React.cloneElement(stat.icon as React.ReactElement, { size: 20, strokeWidth: 2.5 })}
                    </div>
                  </div>
                </div>
              ) : (
                <StatCard 
                  label={stat.label}
                  value={loading ? '-' : stat.value}
                  textColor={stat.color}
                  icon={stat.icon}
                  iconBgColor={stat.bg}
                />
              )}
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col gap-[16px] mt-6">
          <h2 className="text-[18px] font-bold text-slate-800 dark:text-slate-200 bangla px-1">দ্রুত কার্যক্রম</h2>
          
          <div className="flex flex-col gap-[12px]">
            {[
              { id: 'members', title: "সদস্য ব্যবস্থাপনা", desc: "সদস্য দেখুন ও পরিচালনা করুন", icon: <Users />, color: "text-primary", bg: "bg-primary/10", path: "/members" },
              settings?.is_wallet_enabled !== false && { id: 'deposit', title: "জমা বা সঞ্চয়", desc: "সদস্যের ওয়ালেটে টাকা জমা দিন", icon: <HandCoins />, color: "text-emerald-500", bg: "bg-emerald-50", path: "/savings/deposit" },
              settings?.is_wallet_enabled !== false && { id: 'bulk', title: "সবার জমা (Bulk)", desc: "একসাথে সবার জন্য সমপরিমাণ জমা", icon: <Users />, color: "text-blue-500", bg: "bg-blue-50", path: "/savings/bulk" },
              { id: 'savings', title: "আর্থিক বিবরণ (লেনদেন)", desc: settings?.is_wallet_enabled !== false ? "সঞ্চয় ও কিস্তি আদায়ের সারসংক্ষেপ" : "কিস্তি আদায়ের বিস্তারিত ইতিহাস", icon: <BarChart3 />, color: "text-primary", bg: "bg-primary/10", path: "/savings" },
              { id: 'somobay', title: "সমবায় ব্যবস্থাপনা", desc: "ফিক্সড ডিপোজিট ও সাপ্তাহিক সঞ্চয় ব্যবস্থাপনা", icon: <TrendingUp size={22} />, color: "text-purple-600", bg: "bg-purple-50", path: "/somobay/manage" }
            ].filter(Boolean).map((action: any, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i + 4) * 0.05, duration: 0.4, ease: "easeOut" }}
              >
                <QuickAction 
                  title={action.title}
                  description={action.desc}
                  icon={action.icon}
                  iconBgColor={action.bg}
                  textColor={action.color}
                  onClick={() => navigate(action.path)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </MobileLayout>
    );
  }

  const displayActivity = settings?.is_wallet_enabled !== false 
    ? allActivity 
    : allActivity.filter(tx => tx.source_module !== 'wallet');

  // Member Dashboard UI
  return (
    <MobileLayout>
      {renderHeader()}

      {/* Due Alert for Members */}
      {overdueMemberPlans.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => navigate('/somobay/my')}
          className="mt-0 bg-rose-50 dark:bg-rose-500/10 rounded-[20px] p-3 flex items-center gap-4 border border-rose-100 dark:border-rose-500/20 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-rose-500 shadow-sm shrink-0">
            <AlertCircle size={24} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 bangla leading-tight">কিস্তি জমা দেওয়ার সময় হয়েছে</h3>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 bangla mt-0.5">আপনার {overdueMemberPlans.length}টি কিস্তি বকেয়া আছে। দ্রুত জমা দিন।</p>
          </div>
          <div className="ml-auto text-rose-300 dark:text-rose-500/50">
            <ChevronRight size={20} />
          </div>
        </motion.div>
      )}

      {/* Member Main Card - Somobay Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full mt-0 relative rounded-[24px] overflow-hidden text-white shadow-2xl border border-white/5"
        style={{ 
          height: "201px", 
          backgroundColor: "#02362F",
          backgroundImage: "url('https://jkxmcbzipmcmyiwfqupx.supabase.co/storage/v1/object/public/branding/cad%20bg.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="relative w-full h-full p-[16px] pb-[12px] flex flex-col justify-between z-10">
          {/* Header element */}
          <div 
            className="relative flex justify-between items-center z-10 transition-transform duration-150"
            style={{
              transform: "translate(0px, 0px) scale(1)",
              transformOrigin: 'left center'
            }}
          >
            <div>
              <h3 className="font-bold text-[14.5px] sm:text-[15.5px] bangla tracking-wide">সমবায় সারসংক্ষেপ</h3>
              <div className="w-[44px] h-[2.5px] bg-emerald-400 mt-1 rounded" />
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/savings/insights');
              }}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 active:scale-95 cursor-pointer border border-white/20 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] bangla font-bold transition-all relative z-20"
            >
              <span>বিস্তারিত দেখুন</span> <ChevronRight size={10} />
            </button>
          </div>

          {/* Main progress stats grid wrapper */}
          <div className="relative grid grid-cols-[114px_1fr] gap-4 items-center z-10 mb-1 mt-1">
            
            {/* Progress Circular visual segment */}
            <div 
              className="relative w-[114px] h-[114px] flex flex-col items-center justify-center transition-transform duration-150"
              style={{
                transform: "translate(0px, 0px) scale(1.4)",
                transformOrigin: 'center'
              }}
            >
              {/* SVG Ring representing dynamic progress */}
              <svg className="absolute inset-0 w-full h-full -rotate-[225deg]" viewBox="-10 -10 100 100">
                <defs>
                  <filter id="progress-ring-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Background circle track */}
                <circle 
                  cx="40" 
                  cy="40" 
                  r="34" 
                  className="stroke-white/10" 
                  strokeWidth="5.5" 
                  fill="transparent" 
                />
                {/* Animated foreground progress circle */}
                <circle 
                  cx="40" 
                  cy="40" 
                  r="34" 
                  className="stroke-emerald-400 transition-all duration-500 ease-out" 
                  strokeWidth="5.5" 
                  fill="transparent"
                  strokeDasharray="213.6"
                  strokeDashoffset={213.6 - (213.6 * (overallProgress || 0)) / 100}
                  strokeLinecap="round"
                  filter="url(#progress-ring-glow)"
                />
              </svg>

              {/* Centered Liquid container fitting inside the ring track */}
              <div className="absolute inset-[21px] rounded-full overflow-hidden bg-emerald-950/40 flex flex-col items-center justify-center z-10 border border-white/5 shadow-inner">
                {/* 1. Neon Liquid Background (shining through behind masks with 35% opacity) */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-600 via-emerald-400 to-[#00ffbb] z-0 opacity-35" />

                {/* 2. Overlaid Rotating Masks (color matches the card background #02362F) */}
                {/* These masks dynamically cover the neon background from the computed level upwards */}
                <div 
                  className="absolute left-[-35px] w-[142px] h-[142px] transition-all duration-1000 ease-out z-10"
                  style={{ bottom: `${overallProgress}%` }}
                >
                  {/* First Mask (slow spin) */}
                  <div 
                    className="absolute inset-0 rounded-[38%] bg-[#02362F]/80 animate-[spin_10s_linear_infinite]"
                    style={{ transformOrigin: 'center' }}
                  />
                  {/* Second Mask (faster counter spin, higher roundedness for layered crest wave) */}
                  <div 
                    className="absolute inset-0 rounded-[41%] bg-[#02362F] animate-[spin_6s_linear_infinite]"
                    style={{ transformOrigin: 'center' }}
                  />
                </div>

                {/* Glassy reflection sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 z-20 pointer-events-none" />

                {/* Text centered inside the water wave */}
                <div className="relative z-30 flex flex-col items-center justify-center text-white drop-shadow-md">
                  <span className="text-[20px] sm:text-[22px] font-extrabold leading-none">{overallProgress}%</span>
                  <span className="text-[9.5px] sm:text-[10px] opacity-90 bangla mt-0.5 whitespace-nowrap">গড় অগ্রগতি</span>
                </div>
               </div>
            </div>

            {/* Stats text details sidebar segment */}
            <div 
              className="flex flex-col justify-between text-[14px] pl-3 border-l-2 h-[90px] border-white/10 bangla transition-transform duration-150 ml-3"
              style={{
                transform: "translate(0px, 0px) scale(1.1)",
                transformOrigin: 'left center',
                marginLeft: '6px'
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                  <Calendar size={15} />
                </div>
                <div>
                  <p className="text-[11px] sm:text-[12px] opacity-70">পরবর্তী কিস্তি</p>
                  <p className="font-bold leading-tight text-[13px] sm:text-[14.5px]">
                    {earliestNextDue 
                      ? new Date(earliestNextDue).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }) 
                      : 'কিস্তি নেই'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertCircle size={15} />
                </div>
                <div>
                  <p className="text-[11px] sm:text-[12px] opacity-70">বকেয়া কিস্তি</p>
                  <p className="font-bold leading-tight text-[13px] sm:text-[14.5px]">
                    {overdueMemberPlans.length > 0 ? `${overdueMemberPlans.length.toLocaleString('bn-BD')} টি` : 'বকেয়া নেই'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Wallet Card - Small version if enabled */}
      {settings?.is_wallet_enabled !== false && (
        <motion.div 
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           onClick={() => navigate('/savings')}
           className="mt-4 dark-card p-5 rounded-[28px] border border-slate-100 dark:border-white/5 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <HandCoins size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] text-slate-400 dark:text-slate-500 bangla font-bold uppercase tracking-tight">ওয়ালেট ব্যালেন্স</span>
              <span className="text-[18px] font-extrabold text-slate-800 dark:text-slate-100 bangla">৳{wallet?.balance?.toLocaleString() || '০'}</span>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-300" />
        </motion.div>
      )}

      {/* Quick Actions Grid for Members */}
      {settings?.is_member_quick_actions_enabled !== false && (
        <div className="mt-2 flex flex-col gap-4">
          <h2 className="text-[18px] font-bold text-slate-800 dark:text-slate-200 bangla px-1">দ্রুত কার্যক্রম</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              settings?.is_wallet_enabled !== false && { id: 'history', title: 'সঞ্চয় ইতিহাস', icon: <History />, color: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400', path: '/savings' },
              { id: 'somobay', title: 'সমবায় প্ল্যান', icon: <TrendingUp />, color: 'bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400', path: '/somobay/my' },
              { id: 'profile', title: 'প্রোফাইল', icon: <User />, color: 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400', path: '/settings/profile' },
              { id: 'notifications', title: 'বিজ্ঞপ্তি', icon: <Bell />, color: 'bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400', path: '/notifications' },
            ].filter(Boolean).map((action: any, i) => (
                <motion.button
                  key={action.id + i}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: (i + 2) * 0.05, duration: 0.4, ease: "easeOut" }}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 group"
                >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/5 transition-all group-active:scale-90 ${action.color}`}>
                  {React.cloneElement(action.icon as React.ReactElement, { size: 24, strokeWidth: 2 })}
                </div>
                <span className="text-[12px] font-bold text-slate-600 dark:text-slate-400/80 bangla truncate w-full text-center">{action.title}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Savings Goal Banner Card (Bangla Target Card) */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        className="mt-0 bg-[#110d29] rounded-[20px] p-2 px-3 sm:px-4 flex items-center border border-white/5 relative overflow-hidden shadow-2xl group transition-all"
      >
        {/* Soft decorative background circles from original reference UI to match image exactly */}
        <div className="absolute top-1/2 left-[-10px] -translate-y-1/2 w-28 h-28 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
        <div className="absolute top-1/2 right-[-20px] -translate-y-1/2 w-24 h-24 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />

        {/* Layout container with proportional wide side layout */}
        <div className="flex items-center w-full gap-2 relative z-10 justify-between">
          
          {/* Left section: Illustration and details grouped together as a single proportional block */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Target Illustration Section with high-fidelity vector SVG fallback */}
            <div className="shrink-0 transition-transform duration-300 group-hover:scale-[1.05] flex items-center justify-center">
              {!imgErr ? (
                <img 
                  src="https://cdn3d.iconscout.com/3d/premium/thumb/finance-target-3d-icon-png-download-13750580.png" 
                  alt="Savings Target" 
                  className="w-[78px] h-[78px] sm:w-[92px] sm:h-[92px] object-contain" 
                  onError={() => {
                    console.log("Saving target image failed to load, invoking vector fallback.");
                    setImgErr(true);
                  }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                /* Highly detailed Vector Fallback: Concentric Target, Stack of Coins, Leaves, and Arrow */
                <div className="w-[78px] h-[78px] sm:w-[92px] sm:h-[92px]">
                  <svg viewBox="0 0 160 160" className="w-full h-full">
                    <defs>
                      <radialGradient id="target-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                      </radialGradient>
                      <filter id="vector-shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="1" dy="3" stdDeviation="2.5" floodOpacity="0.5" />
                      </filter>
                    </defs>
                    
                    <circle cx="80" cy="80" r="60" fill="url(#target-glow)" />
                    
                    {/* Sprout Green leaves background */}
                    <path d="M40 70 C30 55, 35 35, 52 42 C50 55, 45 65, 40 70 Z" fill="#22c55e" filter="url(#vector-shadow)" opacity="0.95" />
                    <path d="M40 70 C43 55, 48 48, 52 42" stroke="#15803d" strokeWidth="1" strokeLinecap="round" />
                    <path d="M35 85 C22 75, 20 58, 36 62 C38 72, 38 78, 35 85 Z" fill="#4ade80" filter="url(#vector-shadow)" opacity="0.9" />
                    <path d="M125 110 C132 100, 130 90, 122 88 C120 95, 122 105, 125 110 Z" fill="#16a34a" filter="url(#vector-shadow)" opacity="0.9" />

                    {/* Target ring */}
                    <g transform="rotate(-15 80 80)">
                      {/* Blue Rim */}
                      <circle cx="80" cy="80" r="42" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.5" filter="url(#vector-shadow)" />
                      {/* White Ring */}
                      <circle cx="80" cy="80" r="32" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      {/* Blue Center Outer */}
                      <circle cx="80" cy="80" r="22" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
                      {/* Inner White */}
                      <circle cx="80" cy="80" r="13" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
                      {/* Blue Center absolute bullseye */}
                      <circle cx="80" cy="80" r="6" fill="#1d4ed8" />
                    </g>

                    {/* Gold coins stack at bottom left */}
                    <g filter="url(#vector-shadow)">
                      {/* Back stack of coin cylinders */}
                      <ellipse cx="50" cy="115" rx="14" ry="4.5" fill="#ca8a04" />
                      <path d="M36 115 v-4 a 14 4.5 0 0 0 28 0 v 4 Z" fill="#eab308" />
                      <ellipse cx="50" cy="111" rx="14" ry="4.5" fill="#fde047" stroke="#ca8a04" strokeWidth="0.5" />
                      
                      <ellipse cx="50" cy="107" rx="14" ry="4.5" fill="#ca8a04" />
                      <path d="M36 107 v-4 a 14 4.5 0 0 0 28 0 v 4 Z" fill="#eab308" />
                      <ellipse cx="50" cy="103" rx="14" ry="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
                    </g>

                    {/* Front stack of coin cylinders */}
                    <g filter="url(#vector-shadow)">
                      <ellipse cx="72" cy="122" rx="14" ry="4.5" fill="#ca8a04" />
                      <path d="M58 122 v-4 a 14 4.5 0 0 0 28 0 v 4 Z" fill="#eab308" />
                      <ellipse cx="72" cy="118" rx="14" ry="4.5" fill="#fde047" stroke="#ca8a04" strokeWidth="0.5" />

                      <ellipse cx="72" cy="114" rx="14" ry="4.5" fill="#ca8a04" />
                      <path d="M58 114 v-4 a 14 4.5 0 0 0 28 0 v 4 Z" fill="#eab308" />
                      <ellipse cx="72" cy="110" rx="14" ry="4.5" fill="#fde047" stroke="#ca8a04" strokeWidth="0.5" />
                      
                      <ellipse cx="72" cy="106" rx="14" ry="4.5" fill="#ca8a04" />
                      <path d="M58 106 v-4 a 14 4.5 0 0 0 28 0 v 4 Z" fill="#eab308" />
                      <ellipse cx="72" cy="102" rx="14" ry="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
                    </g>

                    {/* Red/Brown Arrow hitting Center */}
                    <g filter="url(#vector-shadow)">
                      <line x1="135" y1="30" x2="84" y2="76" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
                      <path d="M123 35 L132 27 L138 31 L131 42 Z" fill="#3b82f6" />
                      <path d="M117 40 L126 32 L132 36 L125 47 Z" fill="#1d4ed8" />
                      <polygon points="85,73 80,80 88,80" fill="#475569" />
                    </g>

                    {/* Fine Sparkles */}
                    <g transform="translate(115, 60)">
                      <path d="M8 0 L10 6 L16 8 L10 10 L8 16 L6 10 L0 8 L6 6 Z" fill="#fef08a" />
                    </g>
                    <g transform="translate(25, 30)">
                      <path d="M4 0 L5 3 L8 4 L5 5 L4 8 L3 5 L0 4 L3 3 Z" fill="#fef08a" opacity="0.8" />
                    </g>
                  </svg>
                </div>
              )}
            </div>

            {/* Texts Details area with proper responsive margins inside left block */}
            <div className="flex-1 flex flex-col min-w-0">
              <h4 className="text-[14px] xs:text-[15px] sm:text-[17px] font-bold text-white bangla flex items-center gap-1 leading-tight truncate">
                ছোট সঞ্চয়, বড় স্বপ্ন <span className="text-amber-400">✨</span>
              </h4>
              <div className="text-[11px] xs:text-[11.5px] sm:text-[13px] text-slate-300/80 bangla leading-relaxed mt-1 line-clamp-2">
                <p>নিয়মিত সঞ্চয় করুন,</p>
                <p>ভবিষ্যৎ হবে সুরক্ষিত।</p>
              </div>
            </div>
          </div>



          {/* Goal tracker section aligned beautifully to the right (keeping only the progress bar and limiting its width limit) */}
          <div className="shrink-0 flex flex-col items-end justify-center hidden min-[325px]:flex text-right select-none pr-1 w-20 xs:w-20 sm:w-20">
             <span className="text-[11px] xs:text-[12px] sm:text-[13px] text-slate-300 font-semibold bangla whitespace-nowrap">লক্ষ্য: ৳১২,০০০</span>
             <div className="mt-1 px-0.5 sm:mt-1.5 w-full">
               <div className="h-[6px] sm:h-1.5 bg-white/10 rounded-full overflow-hidden w-full">
                 <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" style={{ width: '80%' }} />
               </div>
             </div>
          </div>

        </div>

      </motion.div>

      {/* Recent Transactions for Members */}
      <div className="mt-1 flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-[18px] font-bold text-slate-800 dark:text-slate-200 bangla">সাম্প্রতিক লেনদেন</h2>
          <button onClick={() => navigate('/savings')} className="text-primary text-[14px] font-bold bangla">সব দেখুন</button>
        </div>
        
        <div className="flex flex-col gap-3">
          {displayActivity.slice(0, 3).length > 0 ? (
            displayActivity.slice(0, 3).map((tx, i) => (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0, x: -10, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: (i + 6) * 0.06, duration: 0.4, ease: "easeOut" }}
                className="dark-card p-4 rounded-[24px] flex items-center justify-between shadow-sm active:scale-[0.98] cursor-pointer"
                onClick={() => navigate('/savings')}
              >
                {(() => {
                  let iconBg = 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400';
                  let label = 'লেনদেন';
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
                    label = 'সঞ্চয় জমা';
                    isDeposit = true;
                    isNegative = false;
                    displayAmountClass = 'text-emerald-500';
                    displayAmountPrefix = '+';
                  } else if (tx.transaction_type === 'deposit') {
                    iconBg = 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400';
                    label = 'আমানত জমা';
                    isDeposit = true;
                    isNegative = false;
                    displayAmountClass = 'text-cyan-500';
                    displayAmountPrefix = '+';
                  } else if (tx.transaction_type === 'loan') {
                    iconBg = 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400';
                    label = 'ঋণ গ্রহণ';
                    isDeposit = false;
                    isNegative = true;
                    displayAmountClass = 'text-purple-500 font-bold';
                    displayAmountPrefix = '-';
                  }

                  return (
                    <>
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${iconBg}`}>
                          {isDeposit ? <ArrowDownLeft size={20} strokeWidth={2.5} /> : <ArrowUpRight size={20} strokeWidth={2.5} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-slate-800 dark:text-slate-100 bangla leading-none mb-1">
                            {label}
                          </span>
                          <span className="text-[12px] text-slate-400 dark:text-slate-500 bangla font-medium">
                            {new Date(tx.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })}
                            {tx.plan_name && ` • ${tx.plan_name}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-[17px] font-extrabold bangla ${displayAmountClass}`}>
                          {displayAmountPrefix}৳{Math.abs(tx.amount).toLocaleString('bn-BD')}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            ))
          ) : (
             <div className="p-8 text-center text-slate-400 bangla bg-slate-50 dark:bg-slate-950 rounded-[20px] border-2 border-dashed border-slate-100 dark:border-white/5">
               এখনও কোনো লেনদেন রেকর্ড নেই
             </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

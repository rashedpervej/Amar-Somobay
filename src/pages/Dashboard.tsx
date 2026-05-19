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
  AlertCircle
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
  const overallProgress = memberPlans.length > 0 
    ? Math.round((memberPlans.reduce((acc, curr) => {
        const target = curr.plan?.target_amount || 1;
        return acc + (curr.total_collected / target);
      }, 0) / memberPlans.length) * 100)
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
          className="mt-6 bg-rose-50 dark:bg-rose-500/10 rounded-[28px] p-5 flex items-center gap-4 border border-rose-100 dark:border-rose-500/20 cursor-pointer active:scale-[0.98] transition-transform"
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
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-6 rounded-[34px] overflow-hidden shadow-2xl shadow-primary/25 relative cursor-pointer group"
        style={{ 
          background: `linear-gradient(225deg, ${theme.primary}, ${theme.secondary}, ${theme.primary})`,
        }}
        onClick={() => navigate('/somobay/my')}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/25 rounded-full -mr-32 -mt-32 blur-3xl transition-all duration-1000 group-hover:bg-white/30" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 rounded-full -ml-20 -mb-20 blur-3xl opacity-60" />
        
        <div className="p-8 text-white relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div className="flex flex-col gap-1">
              <span className="text-[13px] bangla font-bold text-white/90 uppercase tracking-widest opacity-80">সমবায় সারসংক্ষেপ</span>
              <div className="h-0.5 w-8 bg-white/50 rounded-full" />
            </div>
            <div className="bg-white/20 backdrop-blur-xl px-4 py-1.5 rounded-2xl flex items-center gap-2 border border-white/25 shadow-sm">
              <Activity size={14} className="animate-pulse" />
              <span className="text-[11px] bangla font-black tracking-tighter uppercase">{activePlansCount}টি সক্রিয়</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 mb-10">
            <div className="flex justify-between items-end">
              <span className="text-[38px] font-black bangla leading-none drop-shadow-md">{overallProgress}%</span>
              <span className="text-[13px] bangla font-bold opacity-80 uppercase tracking-widest">গড় অগ্রগতি</span>
            </div>
            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden border border-white/10 p-[1px]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/20">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] bangla text-white/80 font-bold uppercase tracking-tight opacity-75">পরবর্তী কিস্তি</span>
              <span className="text-[16px] font-black bangla tracking-tight leading-none">
                {earliestNextDue ? new Date(earliestNextDue).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) : 'নেই'}
              </span>
            </div>
            <div className="flex flex-col gap-1 border-l border-white/10 pl-6">
              <span className="text-[12px] bangla text-white/80 font-bold uppercase tracking-tight opacity-75">বকেয়া কিস্তি</span>
              <span className="text-[20px] font-black bangla tracking-tight leading-none">
                {overdueMemberPlans.length > 0 ? overdueMemberPlans.length : '০'}টি
              </span>
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
        <div className="mt-8 flex flex-col gap-4">
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

      {/* Recent Transactions for Members */}
      <div className="mt-8 flex flex-col gap-4">
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
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tx.transaction_type.includes('payment') || tx.transaction_type === 'savings' || tx.transaction_type === 'deposit' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                    {tx.transaction_type.includes('payment') || tx.transaction_type === 'savings' || tx.transaction_type === 'deposit' ? <ArrowDownLeft size={20} strokeWidth={2.5} /> : <ArrowUpRight size={20} strokeWidth={2.5} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[16px] font-bold text-slate-800 dark:text-slate-100 bangla leading-none mb-1">
                      {tx.transaction_type === 'plan_payment' ? 'কিস্তি জমা' : tx.transaction_type === 'savings' ? 'সঞ্চয় জমা' : tx.transaction_type === 'deposit' ? 'আমানত জমা' : tx.transaction_type === 'loan' ? 'ঋণ গ্রহণ' : tx.transaction_type === 'fine' ? 'জরিমানা' : 'লেনদেন'}
                    </span>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 bangla font-medium">
                      {new Date(tx.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[17px] font-extrabold bangla ${tx.transaction_type.includes('payment') || tx.transaction_type === 'savings' || tx.transaction_type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {tx.transaction_type.includes('payment') || tx.transaction_type === 'savings' || tx.transaction_type === 'deposit' ? '+' : '-'}৳{tx.amount.toLocaleString()}
                  </span>
                </div>
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

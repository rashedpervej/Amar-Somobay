import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useWalletStore } from '../store/useWalletStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSomobayStore } from '../store/useSomobayStore';
import { useTheme } from '../components/ThemeProvider';
import { StatCard } from '../components/Dashboard/StatCard';
import { QuickAction } from '../components/Dashboard/QuickAction';
import { 
  Users, 
  Clock, 
  PiggyBank, 
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
  const totalSavings = useWalletStore(state => state.totalSavings);
  const fetchTotalSavings = useWalletStore(state => state.fetchTotalSavings);
  const wallet = useWalletStore(state => state.wallet);
  const fetchWallet = useWalletStore(state => state.fetchWallet);
  const transactions = useWalletStore(state => state.transactions);
  const fetchTransactions = useWalletStore(state => state.fetchTransactions);
  const { memberPlans, fetchMemberPlans } = useSomobayStore();
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const fetchNotifications = useNotificationStore(state => state.fetchNotifications);
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingMembers: 0,
    activeLoans: "১,২০,৫০০"
  });
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
        fetchWallet(pId);
        fetchTransactions(pId);
        fetchMemberPlans(pId);
      }
    }
    
    return () => {
      active = false;
      unsubscribe();
    };
  }, [profile?.id, fetchNotifications, isAdmin, fetchWallet, fetchTransactions, fetchMemberPlans]);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      if (!isMounted) return;
      
      // If not admin, we skip admin stats fetching
      if (!isAdmin) {
        setLoading(false);
        return;
      }

      try {
        await Promise.all([
          (async () => {
            const { count: total, error: totalError } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .in('role', ['admin', 'member']);
            
            const { count: pending, error: pendingError } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('role', 'pending');
            
            if (isMounted) {
              setStats(prev => ({
                ...prev,
                totalMembers: totalError ? prev.totalMembers : (total || 0),
                pendingMembers: pendingError ? prev.pendingMembers : (pending || 0)
              }));
            }
          })(),
          fetchTotalSavings()
        ]);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => { isMounted = false; };
  }, [fetchTotalSavings, isAdmin]);

  const overdueMemberPlans = memberPlans.filter(mp => 
    mp.status === 'active' && 
    mp.next_due_date && 
    new Date(mp.next_due_date) <= new Date()
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "সুপ্রভাত";
    if (hour < 18) return "শুভ দুপুর";
    return "শুভ সন্ধ্যা";
  };

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
        className="bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-300 active:scale-95 transition-transform relative"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <div 
            className="absolute top-0 right-0 w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
            style={{ backgroundColor: theme.primary }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
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
          <StatCard 
            label="মোট সদস্য"
            value={loading ? '-' : stats.totalMembers}
            textColor="text-primary"
            icon={<Users />}
            iconBgColor="bg-primary/10"
          />
          <StatCard 
            label="অপেক্ষমান"
            value={loading ? '-' : stats.pendingMembers}
            textColor="text-orange-500"
            icon={<Clock />}
            iconBgColor="bg-orange-50"
          />
          <StatCard 
            label="মোট সঞ্চয়"
            value={loading ? '-' : `৳${totalSavings.toLocaleString()}`}
            textColor="text-emerald-600"
            icon={<PiggyBank />}
            iconBgColor="bg-blue-50"
          />
          <StatCard 
            label="সক্রিয় ঋণ"
            value={loading ? '-' : stats.activeLoans}
            textColor="text-rose-500"
            icon={<CreditCard />}
            iconBgColor="bg-purple-50"
          />
        </div>

        <div className="flex flex-col gap-[16px] mt-6">
          <h2 className="text-[18px] font-bold text-slate-800 dark:text-slate-200 bangla px-1">দ্রুত কার্যক্রম</h2>
          
          <div className="flex flex-col gap-[12px]">
            <QuickAction 
              title="সদস্য ব্যবস্থাপনা"
              description="সদস্য দেখুন ও পরিচালনা করুন"
              icon={<Users />}
              iconBgColor="bg-primary/10"
              textColor="text-primary"
              onClick={() => navigate('/members')}
            />

            <QuickAction 
              title="জমা বা সঞ্চয়"
              description="সদস্যের ওয়ালেটে টাকা জমা দিন"
              icon={<PiggyBank />}
              iconBgColor="bg-emerald-50"
              textColor="text-emerald-500"
              onClick={() => navigate('/savings/deposit')}
            />
            
            <QuickAction 
              title="সবার জমা (Bulk)"
              description="একসাথে সবার জন্য সমপরিমাণ জমা"
              icon={<Users />}
              iconBgColor="bg-blue-50"
              textColor="text-blue-500"
              onClick={() => navigate('/savings/bulk')}
            />
            
            <QuickAction 
              title="আর্থিক বিবরণ"
              description="সঞ্চয় ও ঋণ পর্যালোচনা"
              icon={<BarChart3 />}
              iconBgColor="bg-primary/10"
              textColor="text-primary"
              onClick={() => navigate('/savings')}
            />

            <QuickAction 
              title="সমবায় ব্যবস্থাপনা"
              description="ফিক্সড ডিপোজিট ও সাপ্তাহিক সঞ্চয় ব্যবস্থাপনা"
              icon={<TrendingUp size={22} />}
              iconBgColor="bg-purple-50"
              textColor="text-purple-600"
              onClick={() => navigate('/somobay/manage')}
            />
          </div>
        </div>
      </MobileLayout>
    );
  }

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

      {/* Member Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-6 rounded-[32px] overflow-hidden shadow-xl shadow-primary/20 relative cursor-pointer group"
        style={{ 
          background: `linear-gradient(225deg, ${theme.primary}, ${theme.secondary}, ${theme.primary})`,
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full -mr-20 -mt-20 blur-3xl transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-12 -mb-12 blur-2xl" />
        
        <div className="p-7 text-white relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div className="flex flex-col">
              <span className="text-[14px] bangla font-semibold text-white/90 tracking-wide">মোট ব্যালেন্স</span>
              <div className="h-0.5 w-8 bg-white/40 rounded-full mt-1" />
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-2xl flex items-center gap-2 border border-white/20 shadow-sm">
              <Activity size={14} className="animate-pulse" />
              <span className="text-[12px] bangla font-bold tracking-tight">সক্রিয়</span>
            </div>
          </div>
          
          <div className="flex items-baseline gap-1.5 mb-8">
            <span className="text-[44px] font-black bangla leading-none">৳{wallet?.balance?.toLocaleString() || '০'}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/15">
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] bangla text-white/80 font-medium">সঞ্চয় জমা</span>
              <span className="text-[18px] font-extrabold bangla">৳{wallet?.total_deposit?.toLocaleString() || '০'}</span>
            </div>
            <div className="flex flex-col gap-0.5 border-l border-white/10 pl-4">
              <span className="text-[12px] bangla text-white/80 font-medium">বকেয়া পরিমাণ</span>
              <span className="text-[18px] font-extrabold bangla">৳০</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions Grid for Members */}
      <div className="mt-8 flex flex-col gap-4">
        <h2 className="text-[18px] font-bold text-slate-800 dark:text-slate-200 bangla px-1">দ্রুত কার্যক্রম</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { id: 'history', title: 'সঞ্চয় ইতিহাস', icon: <History />, color: 'bg-emerald-50 text-emerald-500', path: '/savings' },
            { id: 'somobay', title: 'সমবায় প্ল্যান', icon: <TrendingUp />, color: 'bg-orange-50 text-orange-500', path: '/somobay/my' },
            { id: 'profile', title: 'প্রোফাইল', icon: <User />, color: 'bg-indigo-50 text-indigo-500', path: '/settings/profile' },
            { id: 'notifications', title: 'বিজ্ঞপ্তি', icon: <Bell />, color: 'bg-purple-50 text-purple-500', path: '/notifications' },
          ].map((action, i) => (
            <motion.button
              key={action.id + i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-slate-50 dark:border-slate-800 ${action.color}`}>
                {React.cloneElement(action.icon as React.ReactElement, { size: 24 })}
              </div>
              <span className="text-[12px] font-bold text-slate-600 dark:text-slate-400 bangla">{action.title}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent Transactions for Members */}
      <div className="mt-8 flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-[18px] font-bold text-slate-800 dark:text-slate-200 bangla">সাম্প্রতিক লেনদেন</h2>
          <button onClick={() => navigate('/savings')} className="text-primary text-[14px] font-bold bangla">সব দেখুন</button>
        </div>
        
        <div className="flex flex-col gap-3">
          {transactions.slice(0, 3).length > 0 ? (
            transactions.slice(0, 3).map((tx, i) => (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-slate-900 p-4 rounded-[20px] flex items-center justify-between border border-slate-50 dark:border-slate-800 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.transaction_type === 'savings' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                    {tx.transaction_type === 'savings' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[16px] font-bold text-slate-800 dark:text-slate-100 bangla">
                      {tx.transaction_type === 'savings' ? 'সঞ্চয় জমা' : tx.transaction_type === 'installment' ? 'কিস্তি জমা' : 'লেনদেন'}
                    </span>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 bangla font-medium">
                      {new Date(tx.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                </div>
                <span className="text-[17px] font-bold text-emerald-500 bangla">
                  +৳{tx.amount.toLocaleString()}
                </span>
              </motion.div>
            ))
          ) : (
             <div className="p-8 text-center text-slate-400 bangla bg-slate-50 dark:bg-slate-950 rounded-[20px]">
               এখনও কোনো লেনদেন নেই
             </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

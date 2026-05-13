import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useWalletStore } from '../store/useWalletStore';
import { useTheme } from '../components/ThemeProvider';
import { 
  User, 
  Mail, 
  Calendar, 
  ChevronLeft, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Wallet,
  History,
  TrendingUp,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';

interface MemberProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'member' | 'pending';
  created_at: string;
  avatar_url?: string;
  bio?: string;
}

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const currentUser = useAuthStore(state => state.profile);
  const wallet = useWalletStore(state => state.wallet);
  const transactions = useWalletStore(state => state.transactions);
  const fetchWallet = useWalletStore(state => state.fetchWallet);
  const fetchTransactions = useWalletStore(state => state.fetchTransactions);
  
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingRole, setPendingRole] = useState<'admin' | 'member' | 'pending' | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        navigate('/members');
      } else {
        setMember(data);
        fetchWallet(id);
        fetchTransactions(id);
      }
      setLoading(false);
    };

    loadData();
  }, [id, navigate, fetchWallet, fetchTransactions]);

  const confirmRoleChange = (newRole: 'admin' | 'member' | 'pending') => {
    setPendingRole(newRole);
    setShowConfirm(true);
  };

  const handleRoleChange = async () => {
    if (!id || !member || !pendingRole) return;
    setUpdating(true);
    setMessage({ text: '', type: '' });
    setShowConfirm(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: pendingRole })
        .eq('id', id);

      if (error) throw error;
      
      setMember({ ...member, role: pendingRole });
      setMessage({ text: 'রোল সফলভাবে পরিবর্তন করা হয়েছে', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating role', type: 'error' });
    } finally {
      setUpdating(false);
      setPendingRole(null);
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </MobileLayout>
    );
  }

  if (!member) return null;

  return (
    <MobileLayout>
        <div className="flex items-center gap-4 px-1 mb-6">
          <button 
            onClick={() => navigate('/members')}
            className="bg-white dark:bg-[#1e293b]/60 p-2.5 rounded-full shadow-sm border border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 active:scale-95 transition-all backdrop-blur-md"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[20px] font-bold text-slate-800 dark:text-slate-100 bangla">সদস্য বিস্তারিত</h1>
        </div>

        {/* Profile Card */}
        <div className="dark-card rounded-[32px] p-8 flex flex-col items-center gap-4 relative overflow-hidden mb-6">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.1]" style={{ backgroundColor: theme.primary }} />
          
          <div 
            className="w-24 h-24 rounded-[32px] flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden relative z-10"
            style={{ backgroundColor: theme.primary }}
          >
            {member.avatar_url ? (
              <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-white" />
            )}
          </div>
          
          <div className="text-center relative z-10">
            <h2 className="text-[24px] font-bold text-slate-800 dark:text-slate-100 bangla leading-tight">{member.full_name}</h2>
            <div className="mt-2 inline-block px-4 py-1.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className={`text-[12px] font-bold bangla tracking-wide`} style={{ color: member.role === 'admin' ? theme.primary : member.role === 'member' ? theme.primary : '#64748b' }}>
                {member.role === 'admin' ? 'অ্যাডমিন (Admin)' : member.role === 'member' ? 'সদস্য (Member)' : 'অপেক্ষমান (Pending)'}
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Summary */}
        {member.role !== 'pending' && (
          <div className="flex flex-col gap-[14px] mb-6">
            <div className="flex justify-between items-end px-2">
              <h3 className="text-[14px] font-bold text-slate-400 dark:text-slate-600 bangla uppercase tracking-widest">ওয়ালেট ও সঞ্চয়</h3>
              {isAdmin && (
                <button 
                  onClick={() => navigate(`/savings/deposit?memberId=${id}`)}
                  className="flex items-center gap-1.5 text-[12px] font-bold bangla px-4 py-2 rounded-xl active:scale-95 transition-all shadow-lg shadow-primary/5"
                  style={{ color: theme.primary, backgroundColor: `${theme.primary}1A` }}
                >
                  <Plus size={14} />
                  টাকা জমা
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="dark-card rounded-[24px] p-5 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 bangla font-bold uppercase tracking-wider">বর্তমান ব্যালেন্স</span>
                  <span className="text-[20px] font-black text-slate-800 dark:text-slate-100">৳{wallet?.balance?.toLocaleString() || '0'}</span>
                </div>
              </div>

              <div className="dark-card rounded-[24px] p-5 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 bangla font-bold uppercase tracking-wider">মোট জমা</span>
                  <span className="text-[20px] font-black text-slate-800 dark:text-slate-100">৳{wallet?.total_deposit?.toLocaleString() || '0'}</span>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="dark-card rounded-[28px] p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-slate-400 dark:text-slate-600" />
                  <h4 className="text-[15px] font-bold text-slate-700 dark:text-slate-200 bangla">লেনদেনের ইতিহাস</h4>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          tx.transaction_type === 'savings' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 
                          tx.transaction_type === 'installment' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' : 'bg-purple-50 dark:bg-purple-500/10 text-purple-500'
                        }`}>
                          <Plus size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 bangla uppercase tracking-wide">
                            {tx.transaction_type === 'savings' ? 'সঞ্চয়' : tx.transaction_type === 'installment' ? 'কিস্তি' : 'জমা'}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold">
                            {new Date(tx.created_at).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[15px] font-black text-slate-800 dark:text-slate-100">+৳{tx.amount.toLocaleString()}</span>
                        {tx.note && <span className="text-[10px] text-slate-400 dark:text-slate-600 bangla mt-0.5">{tx.note}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-200 dark:text-slate-800">
                       <History size={24} />
                    </div>
                    <p className="text-[13px] font-bold text-slate-400 dark:text-slate-600 bangla">কোন লেনদেন পাওয়া যায়নি</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info List */}
        <div className="flex flex-col gap-[14px] mb-6">
          <h3 className="text-[14px] font-bold text-slate-400 dark:text-slate-600 bangla px-2 uppercase tracking-widest">তথ্যসমূহ</h3>
          
          <div className="dark-card rounded-[28px] overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
            <div className="p-5 flex items-center gap-4 text-neutral-800">
              <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-[16px] text-amber-500">
                <Shield size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 bangla uppercase font-bold tracking-wider">পরিচিতি (Bio)</span>
                <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200 bangla leading-relaxed">
                  {member.bio || 'কোন পরিচিতি যোগ করা হয়নি'}
                </span>
              </div>
            </div>

            <div className="p-5 flex items-center gap-4 text-neutral-800">
              <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-[16px] text-blue-500">
                <Mail size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 bangla uppercase font-bold tracking-wider">ইমেইল ঠিকানা</span>
                <span className="text-[15px] font-bold text-slate-700 dark:text-slate-200">{member.email}</span>
              </div>
            </div>

            <div className="p-5 flex items-center gap-4">
              <div className="bg-purple-50 dark:bg-purple-500/10 p-3 rounded-[16px] text-purple-500">
                <Calendar size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 bangla uppercase font-bold tracking-wider">নিবন্ধনের তারিখ</span>
                <span className="text-[15px] font-bold text-slate-700 dark:text-slate-200">
                  {new Date(member.created_at).toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex flex-col gap-[14px] pb-10">
            <h3 className="text-[14px] font-bold text-slate-400 dark:text-slate-600 bangla px-2 uppercase tracking-widest">অ্যাডমিন কন্ট্রোল</h3>
            
            <div className="dark-card rounded-[28px] p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">রোল পরিবর্তন করুন</span>
                <div className="flex flex-wrap gap-2">
                  {member.role === 'pending' && (
                    <button
                      onClick={() => confirmRoleChange('member')}
                      disabled={updating}
                      className="flex-1 py-4 px-4 rounded-[18px] bangla text-[14px] font-bold transition-all bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-white/5 active:scale-[0.98]"
                    >
                      সদস্য হিসেবে অনুমোদন দিন
                    </button>
                  )}
                  {member.role === 'member' && (
                    <button
                      onClick={() => confirmRoleChange('pending')}
                      disabled={updating}
                      className="flex-1 py-4 px-4 rounded-[18px] bangla text-[14px] font-bold transition-all bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-500/20 active:scale-[0.98]"
                    >
                      সদস্যপদ বাতিল করুন
                    </button>
                  )}
                  {member.role === 'admin' && (
                    <div className="flex-1 p-5 bg-amber-50 dark:bg-amber-500/5 rounded-[18px] border border-amber-100 dark:border-amber-500/10 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                        <Shield size={18} className="text-amber-600 dark:text-amber-500" />
                      </div>
                      <span className="text-[14px] font-bold text-slate-700 dark:text-slate-400 bangla">অ্যাডমিন রোল পরিবর্তনযোগ্য নয়</span>
                    </div>
                  )}
                </div>
              </div>

              {message.text && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center gap-3 p-4 rounded-[18px] border ${
                    message.type === 'success' 
                      ? 'bg-primary/10 border-primary/20 text-primary' 
                      : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-500'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span className="text-[13px] bangla font-bold">{message.text}</span>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white dark:bg-[#1e293b] w-full max-w-[340px] rounded-[40px] p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-white/10 flex flex-col items-center text-center"
            >
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: `${theme.primary}1A` }}
              >
                <Shield size={32} style={{ color: theme.primary }} />
              </div>
              
              <h3 className="text-[20px] font-bold text-slate-800 dark:text-slate-100 bangla mb-3">আপনি কি নিশ্চিত?</h3>
              <p className="text-[14px] text-slate-500 dark:text-slate-400 bangla leading-relaxed mb-8">
                আপনি কি এই সদস্যের রোল <span className="font-bold underline" style={{ color: theme.primary }}>
                  {pendingRole === 'admin' ? 'অ্যাডমিন' : pendingRole === 'member' ? 'সদস্য' : 'অপেক্ষমান'}
                </span> হিসেবে পরিবর্তন করতে চান?
              </p>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={handleRoleChange}
                  className="w-full text-white py-4 rounded-2xl font-bold bangla text-[16px] shadow-lg active:scale-[0.98] transition-all"
                  style={{ backgroundColor: theme.primary, boxShadow: `0 12px 24px -6px ${theme.primary}60` }}
                >
                  হ্যাঁ, পরিবর্তন করুন
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-full bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 py-4 rounded-2xl font-bold bangla text-[16px] active:scale-[0.98] transition-all"
                >
                  বাতিল করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
    </MobileLayout>
  );
}

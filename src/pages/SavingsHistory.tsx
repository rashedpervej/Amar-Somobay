import React, { useEffect } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useWalletStore } from '../store/useWalletStore';
import { useTheme } from '../components/ThemeProvider';
import { motion } from 'motion/react';
import { ArrowDownLeft, ArrowUpRight, History, PiggyBank, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SavingsHistory() {
  const profile = useAuthStore(state => state.profile);
  const { wallet, transactions, fetchWallet, fetchTransactions, fetchAllTransactions, loading } = useWalletStore();
  const theme = useTheme();
  const navigate = useNavigate();

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (profile?.id) {
      if (isAdmin) {
        fetchAllTransactions();
      } else {
        fetchWallet(profile.id);
        fetchTransactions(profile.id);
      }
    }
  }, [profile?.id, isAdmin, fetchWallet, fetchTransactions, fetchAllTransactions]);

  const getTxTypeLabel = (type: string) => {
    switch (type) {
      case 'savings': return 'সঞ্চয় জমা';
      case 'deposit': return 'আমানত';
      case 'installment': return 'কিস্তি';
      case 'loan': return 'ঋণ প্রদান';
      case 'fine': return 'জরিমানা';
      default: return 'লেনদেন';
    }
  };

  const getTxTypeColor = (type: string) => {
    switch (type) {
      case 'savings': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'deposit': return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
      case 'loan': return 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400';
      case 'fine': return 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
      default: return 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400';
    }
  };

  return (
    <MobileLayout>
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
        >
          <motion.div whileTap={{ x: -5 }}>
            <ArrowDownLeft className="rotate-45 text-slate-400" size={24} />
          </motion.div>
        </button>
        <h1 className="text-[22px] font-bold text-slate-800 dark:text-slate-100 bangla leading-tight">
          {isAdmin ? 'আর্থিক বিবরণ' : 'আমার সঞ্চয়'}
        </h1>
      </div>

      {!isAdmin && (
        /* Balance Overview Card - Only for Members */
        <div className="dark-card rounded-[32px] p-7 shadow-lg shadow-primary/5 mb-8 mt-2 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <PiggyBank size={28} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] text-slate-400 dark:text-slate-500 bangla font-bold tracking-tight uppercase">মোট ব্যালেন্স</span>
              <span className="text-[28px] font-black text-slate-800 dark:text-emerald-500 bangla leading-tight drop-shadow-sm">
                ৳{wallet?.balance?.toLocaleString() || '০'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-5 border-t border-slate-100 dark:border-white/5">
             <div className="flex flex-col gap-1">
               <span className="text-[11px] text-slate-400 dark:text-slate-500 bangla uppercase font-bold tracking-wider">মোট জমা</span>
               <span className="text-[18px] font-extrabold text-slate-800 dark:text-slate-100 bangla">৳{wallet?.total_deposit?.toLocaleString() || '০'}</span>
             </div>
             <div className="flex flex-col gap-1 border-l border-slate-100 dark:border-white/5 pl-8">
               <span className="text-[11px] text-slate-400 dark:text-slate-500 bangla uppercase font-bold tracking-wider">বকেয়া</span>
               <span className="text-[18px] font-extrabold text-orange-500 bangla">৳০</span>
             </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-[18px] font-bold text-slate-800 dark:text-slate-200 bangla">
            {isAdmin ? 'সকল লেনদেনের ইতিহাস' : 'লেনদেন ইতিহাস'}
          </h2>
          {isAdmin && (
            <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold bangla uppercase tracking-wider">
              অ্যাডমিন ভিউ
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-3">
          {loading ? (
             <div className="flex justify-center p-12">
               <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : transactions.length > 0 ? (
            transactions.map((tx, i) => (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="dark-card p-4 rounded-[28px] flex flex-col gap-3 shadow-sm hover:translate-y-[-2px] transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${getTxTypeColor(tx.transaction_type)}`}>
                      {tx.transaction_type === 'savings' || tx.transaction_type === 'deposit' ? <ArrowDownLeft size={22} strokeWidth={2.5} /> : <ArrowUpRight size={22} strokeWidth={2.5} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[16px] font-bold text-slate-800 dark:text-slate-100 bangla leading-none mb-1">
                        {getTxTypeLabel(tx.transaction_type)}
                      </span>
                      <span className="text-[12px] text-slate-400 dark:text-slate-500 bangla font-medium">
                        {new Date(tx.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[17px] font-black bangla ${tx.transaction_type === 'savings' || tx.transaction_type === 'deposit' ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-200'}`}>
                      {tx.transaction_type === 'savings' || tx.transaction_type === 'deposit' ? '+' : '-'}৳{tx.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {(isAdmin || tx.note) && (
                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <History size={10} className="text-slate-400" />
                        </div>
                        <span className="text-[13px] font-bold text-slate-600 dark:text-slate-400 bangla">
                          সদস্য: {tx.profiles?.full_name || 'অজানা'}
                        </span>
                      </div>
                    )}
                    {tx.note && (
                      <span className="text-[12px] text-slate-400 dark:text-slate-500 bangla italic ml-auto truncate max-w-[200px]">
                        "{tx.note}"
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
             <div className="p-12 text-center text-slate-300 bangla bg-slate-50 dark:bg-slate-950 rounded-[28px] border-2 border-dashed border-slate-100 dark:border-slate-900">
               <History className="mx-auto mb-3 opacity-20" size={48} />
               এখনও কোনো লেনদেন নেই
             </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

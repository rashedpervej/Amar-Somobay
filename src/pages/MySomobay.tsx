import React, { useEffect } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useSomobayStore } from '../store/useSomobayStore';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  Clock, 
  ShieldCheck,
  AlertTriangle,
  History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MySomobay() {
  const { profile } = useAuthStore();
  const { memberPlans, fetchMemberPlans, loading } = useSomobayStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.id) {
      fetchMemberPlans(profile.id);
    }
  }, [profile?.id]);

  return (
    <MobileLayout>
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={24} className="text-slate-400" />
        </button>
        <h1 className="text-[22px] font-bold text-slate-800 dark:text-slate-100 bangla">আমার সমবায়</h1>
      </div>

      {loading && memberPlans.length === 0 ? (
        <div className="flex justify-center p-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : memberPlans.length > 0 ? (
        <div className="flex flex-col gap-6">
          {memberPlans.map((mp: any) => {
            const progress = (mp.total_collected / mp.plan?.target_amount) * 100;
            const isOverdue = new Date(mp.next_due_date) < new Date();
            
            return (
              <motion.div 
                key={mp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-50 dark:border-slate-800"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col">
                    <span className="text-[18px] font-bold text-slate-800 dark:text-slate-200 bangla mb-1">{mp.plan?.name}</span>
                    <div className="flex items-center gap-2 text-[12px] text-slate-400 bangla font-medium">
                      <Clock size={14} />
                      <span>{mp.plan?.duration_months} মাসের প্ল্যান</span>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[11px] font-bold bangla border ${
                    mp.status === 'active' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    {mp.status === 'active' ? 'সক্রিয় প্ল্যান' : 'বন্ধ'}
                  </div>
                </div>

                {/* Progress Visual */}
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-3 px-1">
                    <div className="flex flex-col">
                      <span className="text-[12px] text-slate-400 bangla mb-0.5">সংগৃহীত পরিমাণ</span>
                      <span className="text-[24px] font-black text-slate-800 dark:text-slate-100 bangla leading-none">
                        ৳{mp.total_collected.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[14px] font-bold text-primary bangla">{Math.round(progress)}%</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100/50 dark:border-slate-800/50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)]"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3 text-[11px] text-slate-400 bangla px-1">
                    <span>শুরু: {new Date(mp.start_date).toLocaleDateString('bn-BD')}</span>
                    <span>লক্ষ্য: ৳{mp.plan?.target_amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Due Info */}
                <div className={`p-4 rounded-2xl flex items-center justify-between mb-2 ${isOverdue ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20' : 'bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOverdue ? 'bg-rose-100 text-rose-500' : 'bg-orange-100 text-orange-500'}`}>
                      {isOverdue ? <AlertTriangle size={20} /> : <Calendar size={20} />}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[12px] bangla font-bold ${isOverdue ? 'text-rose-500' : 'text-orange-500'}`}>
                        {isOverdue ? 'কিস্তি বকেয়া' : 'পরবর্তী কিস্তির তারিখ'}
                      </span>
                      <span className="text-[15px] font-bold text-slate-700 dark:text-slate-300 bangla uppercase tracking-tight">
                        {new Date(mp.next_due_date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {isOverdue && (
                  <div className="text-[11px] text-rose-400 bangla px-1 mt-1 flex items-center gap-1">
                    <ShieldCheck size={12} />
                    <span>দ্রুত কিস্তি জমা দিন এবং জরিমানা এড়িয়ে চলুন।</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800">
          <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6">
            <History size={40} className="text-slate-300" />
          </div>
          <h3 className="text-[18px] font-bold text-slate-800 dark:text-slate-200 bangla mb-2">কোনো সমবায় প্ল্যান নেই</h3>
          <p className="text-[14px] text-slate-400 bangla">আপনার অ্যাকাউন্টে কোনো সমবায় প্ল্যান সক্রিয় করা নেই। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
        </div>
      )}

      {/* Safety Info */}
      <div className="mt-8 p-6 bg-primary/5 dark:bg-primary/10 rounded-[28px] border border-primary/10 flex gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
          <ShieldCheck className="text-primary" size={24} />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 bangla">নিরাপদ সঞ্চয়</h4>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 bangla leading-relaxed">
            আপনার সঞ্চিত অর্থ আমাদের কাছে নিরাপদ। ম্যাচুরিটি বা মেয়াদ শেষ হওয়ার সাথে সাথেই আপনি প্রফিট সহ টাকা পেয়ে যাবেন।
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}

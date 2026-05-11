import React, { useEffect, useState } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { supabase } from '../lib/supabase';
import { Search, User, ChevronRight, Filter, ChevronDown, SortAsc, SortDesc, Calendar, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../components/ThemeProvider';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'member' | 'pending';
  avatar_url?: string;
  created_at: string;
  member_wallets?: { balance: number }[];
}

type SortOption = 'name' | 'date' | 'balance';

export default function MemberList() {
  const theme = useTheme();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          member_wallets (
            balance
          )
        `);

      if (error) {
        console.error('Error fetching members:', error);
        const { data: basicData, error: basicError } = await supabase
          .from('profiles')
          .select('*');
        
        if (basicError) throw basicError;
        setMembers(basicData || []);
      } else {
        setMembers(data || []);
      }
    } catch (err) {
      console.error('Fatal error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedMembers = members
    .filter(member => {
      const matchesSearch = 
        member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.full_name || '').localeCompare(b.full_name || '');
      } else if (sortBy === 'date') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'balance') {
        const balanceA = a.member_wallets?.[0]?.balance || 0;
        const balanceB = b.member_wallets?.[0]?.balance || 0;
        comparison = balanceA - balanceB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <MobileLayout>
        <div className="flex justify-between items-center px-1">
          <h1 className="text-[24px] font-bold text-slate-800 bangla uppercase tracking-tight">সদস্য তালিকা</h1>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-full shadow-sm border transition-all active:scale-95 ${
              showFilters || roleFilter !== 'all' || sortBy !== 'name'
                ? 'bg-primary text-white border-primary' 
                : 'bg-white text-slate-400 border-slate-100'
            }`}
            style={showFilters || roleFilter !== 'all' || sortBy !== 'name' ? { backgroundColor: theme.primary, borderColor: theme.primary } : {}}
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="সদস্যের নাম বা ইমেইল খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-[22px] py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all bangla text-sm shadow-sm"
          />
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm flex flex-col gap-5 mb-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider ml-1">রোল ফিল্টার</span>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'admin', 'member', 'pending'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={`px-4 py-1.5 rounded-xl text-[12px] font-bold bangla border transition-all ${
                          roleFilter === r 
                            ? 'bg-primary/10 text-primary border-primary/20' 
                            : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}
                        style={roleFilter === r ? { color: theme.primary, backgroundColor: `${theme.primary}1A`, borderColor: `${theme.primary}33` } : {}}
                      >
                        {r === 'all' ? 'সবাই' : r === 'admin' ? 'অ্যাডমিন' : r === 'member' ? 'সদস্য' : 'পেন্ডিং'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider ml-1">সর্টিং অপশন</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy('name')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold bangla border transition-all ${
                        sortBy === 'name' 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}
                      style={sortBy === 'name' ? { color: theme.primary, backgroundColor: `${theme.primary}1A`, borderColor: `${theme.primary}33` } : {}}
                    >
                      <User size={14} /> নাম
                    </button>
                    <button
                      onClick={() => setSortBy('date')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold bangla border transition-all ${
                        sortBy === 'date' 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}
                      style={sortBy === 'date' ? { color: theme.primary, backgroundColor: `${theme.primary}1A`, borderColor: `${theme.primary}33` } : {}}
                    >
                      <Calendar size={14} /> তারিখ
                    </button>
                    <button
                      onClick={() => setSortBy('balance')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold bangla border transition-all ${
                        sortBy === 'balance' 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}
                      style={sortBy === 'balance' ? { color: theme.primary, backgroundColor: `${theme.primary}1A`, borderColor: `${theme.primary}33` } : {}}
                    >
                      <Wallet size={14} /> ব্যালেন্স
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider ml-1">সর্টিং ক্রম</span>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-[12px] font-bold text-slate-600 border border-slate-100"
                  >
                    {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                    {sortOrder === 'asc' ? 'ছোট থেকে বড়' : 'বড় থেকে ছোট'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        <div className="flex flex-col gap-[12px] pb-24">
          {loading ? (
            <div className="flex flex-col gap-[12px]">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-[72px] bg-white animate-pulse rounded-[22px] border border-slate-50" />
              ))}
            </div>
          ) : filteredAndSortedMembers.length > 0 ? (
            filteredAndSortedMembers.map((member) => (
              <Link 
                key={member.id}
                to={`/members/${member.id}`}
                className="bg-white p-4 rounded-[22px] shadow-sm border border-slate-50 flex items-center gap-4 active:scale-[0.99] transition-transform"
              >
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 shrink-0 overflow-hidden shadow-inner">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-[16px] font-bold text-slate-800 bangla truncate leading-tight">{member.full_name}</h3>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[12px] font-bold text-emerald-600">৳{member.member_wallets?.[0]?.balance?.toLocaleString() || '০'}</span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">ব্যালেন্স</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-[10px] font-bold bangla tracking-wide border ${
                      member.role === 'admin' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                      member.role === 'member' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {member.role === 'admin' ? 'অ্যাডমিন' : member.role === 'member' ? 'সদস্য' : 'অপেক্ষমান'}
                    </span>
                    <span className="text-[12px] text-slate-400 truncate opacity-80">{member.email}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 shrink-0" />
              </Link>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 bangla">কোন সদস্য পাওয়া যায়নি</p>
            </div>
          )}
        </div>
    </MobileLayout>
  );
}

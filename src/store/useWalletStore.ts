import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  total_deposit: number;
  updated_at: string;
}

export interface Transaction {
  id: string;
  member_id: string;
  admin_id: string;
  amount: number;
  transaction_type: string;
  note: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  allActivity: Transaction[];
  totalSavings: number;
  loading: boolean;
  fetchWallet: (userId: string) => Promise<void>;
  fetchTransactions: (userId: string) => Promise<void>;
  fetchAllTransactions: () => Promise<void>;
  fetchTotalSavings: () => Promise<void>;
  addTransaction: (data: {
    member_id: string;
    amount: number;
    type: 'savings' | 'installment' | 'deposit' | 'loan' | 'fine';
    note: string;
    admin_id: string;
  }) => Promise<void>;
  bulkDeposit: (data: {
    member_ids: string[];
    amount: number;
    note: string;
    type: 'savings' | 'installment' | 'deposit' | 'loan' | 'fine';
    admin_id: string;
  }) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallet: null,
  transactions: [],
  allActivity: [],
  totalSavings: 0,
  loading: false,

  fetchWallet: async (userId) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('member_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!error && JSON.stringify(data) !== JSON.stringify(get().wallet)) {
        set({ wallet: data });
      }
    } catch (err) {
      console.error('Wallet fetch error:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchTransactions: async (userId) => {
    try {
      // Fetch both deposits and special actions for member view
      const [txRes, actionRes] = await Promise.all([
        supabase.from('wallet_transactions').select('*').eq('member_id', userId),
        supabase.from('member_actions').select('*').eq('member_id', userId)
      ]);
      
      const merged = [
        ...(txRes.data || []),
        ...(actionRes.data?.map(a => ({ ...a, transaction_type: a.action_type })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (JSON.stringify(merged) !== JSON.stringify(get().transactions)) {
        set({ transactions: merged });
      }
    } catch (err) {
      console.error('Transactions fetch error:', err);
    }
  },

  fetchAllTransactions: async () => {
    try {
      // Fetch everything for master admin log
      const [txRes, actionRes] = await Promise.all([
        supabase.from('wallet_transactions').select('*, profiles:member_id(full_name)').order('created_at', { ascending: false }),
        supabase.from('member_actions').select('*, profiles:member_id(full_name)').order('created_at', { ascending: false })
      ]);
      
      const merged = [
        ...(txRes.data || []),
        ...(actionRes.data?.map(a => ({ ...a, transaction_type: a.action_type })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (JSON.stringify(merged) !== JSON.stringify(get().transactions)) {
        set({ transactions: merged });
      }
    } catch (err) {
      console.error('All transactions fetch error:', err);
    }
  },

  fetchTotalSavings: async () => {
    try {
      const { data, error } = await supabase
        .from('member_wallets')
        .select('balance');
      
      if (!error && data) {
        const total = data.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
        if (total !== get().totalSavings) {
          set({ totalSavings: total });
        }
      }
    } catch (err) {
      console.error('Total savings fetch error:', err);
    }
  },

  addTransaction: async (data) => {
    const isSpecial = ['loan', 'fine'].includes(data.type);
    const table = isSpecial ? 'member_actions' : 'wallet_transactions';
    
    const insertData: any = {
      member_id: data.member_id,
      amount: data.amount,
      note: data.note,
      admin_id: data.admin_id
    };

    if (isSpecial) {
      insertData.action_type = data.type;
    } else {
      insertData.transaction_type = data.type;
    }

    const { error } = await supabase.from(table).insert([insertData]);
    
    if (error) throw error;

    // If it's an installment, also ensure it's in plan_payments table
    // Plan payments is our source of truth for somobay progression
    if (data.type === 'installment') {
      const { data: memberPlans } = await supabase
        .from('member_plans')
        .select('id')
        .eq('member_id', data.member_id)
        .eq('status', 'active')
        .limit(1);

      if (memberPlans && memberPlans.length > 0) {
        await supabase.from('plan_payments').insert([{
          member_plan_id: memberPlans[0].id,
          amount: data.amount,
          penalty_paid: 0,
          admin_id: data.admin_id,
          note: data.note || 'Wallet Installment',
          status: 'approved'
        }]);
        // The DB trigger handles updating member_plans summary
      }
    }

    // Create notification for member
    const typeLabel = data.type === 'loan' ? 'ঋণ' : data.type === 'fine' ? 'জরিমানা' : 'জমা';
    await supabase.from('notifications').insert([{
      user_id: data.member_id,
      title: `নতুন ${typeLabel} রেকর্ডকৃত`,
      message: `${data.amount.toLocaleString()} টাকা পরিমাণ ${typeLabel} আপনার অ্যাকাউন্টে রেকর্ড করা হয়েছে।`,
      type: isSpecial ? 'info' : 'success'
    }]);
    
    // Refresh relevant data
    get().fetchWallet(data.member_id);
    get().fetchTransactions(data.member_id);
    get().fetchTotalSavings();
  },

  bulkDeposit: async (data) => {
    const isSpecial = ['loan', 'fine'].includes(data.type);
    
    if (isSpecial) {
      // For bulk special actions, we insert into member_actions individually or in bulk if allowed
      const actionItems = data.member_ids.map(mid => ({
        member_id: mid,
        amount: data.amount,
        action_type: data.type,
        note: data.note || `Bulk ${data.type}`,
        admin_id: data.admin_id
      }));
      
      const { error } = await supabase.from('member_actions').insert(actionItems);
      if (error) throw error;
    } else {
      // Use existing RPC for savings/deposit types
      const { error } = await supabase.rpc('bulk_deposit_selected', {
        member_ids: data.member_ids,
        deposit_amount: data.amount,
        admin_uuid: data.admin_id,
        deposit_note: data.note || 'Bulk Deposit',
        dep_type: data.type
      });
      if (error) throw error;

      // Ensure bulk installments are recorded in plan_payments
      if (data.type === 'installment') {
        for (const mid of data.member_ids) {
          const { data: mps } = await supabase
            .from('member_plans')
            .select('id')
            .eq('member_id', mid)
            .eq('status', 'active')
            .limit(1);

          if (mps && mps.length > 0) {
            await supabase.from('plan_payments').insert([{
              member_plan_id: mps[0].id,
              amount: data.amount,
              penalty_paid: 0,
              admin_id: data.admin_id,
              note: data.note || 'Bulk Wallet Installment',
              status: 'approved'
            }]);
          }
        }
      }
    }

    // Create notifications for all members in bulk
    const typeLabel = data.type === 'loan' ? 'ঋণ' : data.type === 'fine' ? 'জরিমানা' : 'জমা';
    const notifications = data.member_ids.map(mid => ({
      user_id: mid,
      title: `বাল্ক ${typeLabel} সফল হয়েছে`,
      message: `${data.amount.toLocaleString()} টাকা পরিমাণ ${typeLabel} আপনার অ্যাকাউন্টে রেকর্ড করা হয়েছে।`,
      type: isSpecial ? 'info' : 'success'
    }));

    await supabase.from('notifications').insert(notifications);

    get().fetchTotalSavings();
    get().fetchAllTransactions(); // Refresh master log
  }
}));

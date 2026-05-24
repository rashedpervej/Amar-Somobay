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
  allActivity: any[];
  totalSavings: number;
  loading: boolean;
  fetchWallet: (userId: string) => Promise<void>;
  fetchTransactions: (userId: string) => Promise<void>;
  fetchAllTransactions: () => Promise<void>;
  fetchUnifiedActivity: (filters?: { memberId?: string, planId?: string, startDate?: string, endDate?: string }) => Promise<void>;
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
      set({ loading: true });
      // Fetch everything for master admin log
      const [txRes, actionRes, planPaymentsRes] = await Promise.all([
        supabase.from('wallet_transactions').select('*, profiles:member_id(full_name)').order('created_at', { ascending: false }),
        supabase.from('member_actions').select('*, profiles:member_id(full_name)').order('created_at', { ascending: false }),
        supabase.from('plan_payments').select('*, member_plans(member_id, plan_id, plan:somobay_plans(name), profiles:member_id(full_name))').order('payment_date', { ascending: false })
      ]);
      
      const planPaymentsMerged = (planPaymentsRes.data || []).map(p => ({
        id: p.id,
        member_id: (p.member_plans as any)?.member_id,
        amount: p.amount,
        transaction_type: 'plan_payment',
        type: p.type || 'payment',
        note: p.note || `কিস্তি জমা: ${(p.member_plans as any)?.plan?.name || 'প্ল্যান'}`,
        created_at: p.payment_date,
        profiles: (p.member_plans as any)?.profiles,
        plan_name: (p.member_plans as any)?.plan?.name,
        penalty_paid: p.penalty_paid
      }));

      const merged = [
        ...(txRes.data?.map(tx => ({ ...tx, source_module: 'wallet' })) || []),
        ...(actionRes.data?.map(a => ({ ...a, transaction_type: a.action_type, source_module: 'wallet' })) || []),
        ...planPaymentsMerged.map(p => ({ ...p, source_module: 'plan' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      set({ allActivity: merged });
      // Keep transactions for backward compat if needed
      set({ transactions: merged.slice(0, 50) });
    } catch (err) {
      console.error('All transactions fetch error:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchUnifiedActivity: async (filters) => {
    try {
      set({ loading: true });
      let txQuery = supabase.from('wallet_transactions').select('*, profiles:member_id(full_name)');
      let actionQuery = supabase.from('member_actions').select('*, profiles:member_id(full_name)');
      let planQuery = supabase.from('plan_payments').select(`
        *, 
        member_plans!inner(member_id, plan_id, plan:somobay_plans(name), profiles:member_id(full_name))
      `);

      if (filters?.memberId) {
        txQuery = txQuery.eq('member_id', filters.memberId);
        actionQuery = actionQuery.eq('member_id', filters.memberId);
        planQuery = planQuery.eq('member_plans.member_id', filters.memberId);
      }

      if (filters?.planId) {
        planQuery = planQuery.eq('member_plans.plan_id', filters.planId);
      }

      const [txRes, actionRes, planRes] = await Promise.all([
        txQuery.order('created_at', { ascending: false }),
        actionQuery.order('created_at', { ascending: false }),
        planQuery.order('payment_date', { ascending: false })
      ]);

      const planPayments = (planRes.data || []).map(p => ({
        id: p.id,
        member_id: (p.member_plans as any)?.member_id,
        amount: p.amount,
        transaction_type: 'plan_payment',
        type: p.type || 'payment',
        note: p.note || `কিস্তি জমা: ${(p.member_plans as any)?.plan?.name || 'প্ল্যান'}`,
        created_at: p.payment_date,
        profiles: (p.member_plans as any)?.profiles,
        plan_name: (p.member_plans as any)?.plan?.name,
        plan_id: (p.member_plans as any)?.plan_id,
        penalty_paid: p.penalty_paid,
        source_module: 'plan'
      }));

      const merged = [
        ...(txRes.data?.map(tx => ({ ...tx, source_module: 'wallet' })) || []),
        ...(actionRes.data?.map(a => ({ ...a, transaction_type: a.action_type, source_module: 'wallet' })) || []),
        ...planPayments
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      set({ allActivity: merged });
    } catch (err) {
      console.error('Unified activity fetch error:', err);
    } finally {
      set({ loading: false });
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
      type: isSpecial ? 'info' : 'success',
      source_module: 'wallet'
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
      if (data.type === 'installment' || data.type === 'savings') {
        for (const mid of data.member_ids) {
          const { data: mps } = await supabase
            .from('member_plans')
            .select('id, plan:somobay_plans(name)')
            .eq('member_id', mid)
            .eq('status', 'active')
            .limit(1);

          if (mps && mps.length > 0) {
            await supabase.from('plan_payments').insert([{
              member_plan_id: mps[0].id,
              amount: data.amount,
              penalty_paid: 0,
              admin_id: data.admin_id,
              note: data.note || 'Bulk Deposit',
              status: 'approved'
            }]);

            // Notify Member about the plan payment
            await supabase.from('notifications').insert([{
              user_id: mid,
              title: 'কিস্তি পরিশোধ (বাল্ক)',
              message: `আপনার "${(mps[0] as any).plan?.name}" প্ল্যানে ${data.amount.toLocaleString()} টাকা কিস্তি জমা দেওয়া হয়েছে। তারিখ: ${new Date().toLocaleDateString('bn-BD')}`,
              type: 'success',
              source_module: 'plan'
            }]);
          }
        }
      }
    }

    // Create notifications for all members for the wallet deposit if applicable
    if (data.type === 'savings' || data.type === 'deposit') {
      const notifications = data.member_ids.map(mid => ({
        user_id: mid,
        title: `বাল্ক ${data.type === 'savings' ? 'সঞ্চয়' : 'আমানত'} সফল হয়েছে`,
        message: `${data.amount.toLocaleString()} টাকা আপনার ওয়ালেটে জমা দেওয়া হয়েছে।`,
        type: 'success',
        source_module: 'wallet'
      }));
      await supabase.from('notifications').insert(notifications);
    }

    get().fetchTotalSavings();
    get().fetchAllTransactions(); // Refresh master log
  }
}));

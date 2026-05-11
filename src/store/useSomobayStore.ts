import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface SomobayPlan {
  id: string;
  name: string;
  description: string;
  duration_months: number;
  installment_amount: number;
  frequency: 'weekly' | 'monthly' | 'custom';
  due_day?: number; // 0-6 for weekly (Sunday-Saturday)
  due_date?: number; // 1-31 for monthly
  target_amount: number;
  profit_percentage: number;
  late_fee_amount: number;
  is_active: boolean;
}

export interface MemberPlan {
  id: string;
  member_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'matured' | 'cancelled';
  total_collected: number;
  next_due_date: string | null;
  plan?: SomobayPlan;
  profile?: {
    full_name: string;
  };
}

export interface PlanPayment {
  id: string;
  member_plan_id: string;
  amount: number;
  penalty_paid: number;
  payment_date: string;
  admin_id: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string;
}

interface SomobayState {
  plans: SomobayPlan[];
  memberPlans: MemberPlan[];
  loading: boolean;
  
  fetchPlans: () => Promise<void>;
  fetchMemberPlans: (userId?: string) => Promise<void>;
  createPlan: (plan: Omit<SomobayPlan, 'id' | 'is_active'>) => Promise<void>;
  updatePlan: (id: string, plan: Partial<SomobayPlan>) => Promise<void>;
  enrollMember: (memberId: string, planId: string, durationMonths: number, frequency: string) => Promise<void>;
  recordPayment: (data: {
    memberPlanId: string;
    amount: number;
    penalty: number;
    adminId: string;
    note: string;
  }) => Promise<void>;
  sendReminders: () => Promise<{ sent: number; alreadyNotified: number }>;
}

export const useSomobayStore = create<SomobayState>((set, get) => ({
  plans: [],
  memberPlans: [],
  loading: false,

  fetchPlans: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('somobay_plans')
      .select('*')
      .eq('is_active', true);
    
    if (!error) set({ plans: data || [] });
    set({ loading: false });
  },

  fetchMemberPlans: async (userId) => {
    set({ loading: true });
    // Use explicit join syntax with table names to avoid ambiguity
    let query = supabase
      .from('member_plans')
      .select(`
        *,
        plan:somobay_plans(*),
        profiles:member_id(full_name)
      `);
    
    if (userId) {
      query = query.eq('member_id', userId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching member plans:', error);
    } else {
      set({ memberPlans: (data as any) || [] });
    }
    set({ loading: false });
  },

  createPlan: async (plan) => {
    const { error } = await supabase.from('somobay_plans').insert([plan]);
    if (error) throw error;
    get().fetchPlans();
  },

  updatePlan: async (id, plan) => {
    const { error } = await supabase.from('somobay_plans').update(plan).eq('id', id);
    if (error) throw error;
    get().fetchPlans();
  },

  enrollMember: async (memberId, planId, durationMonths, frequency) => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Get plan details to respect due settings
    const { data: plan } = await supabase.from('somobay_plans').select('due_day, due_date').eq('id', planId).single();

    // Calculate initial next due date based on frequency and plan settings
    const nextDue = new Date();
    nextDue.setHours(0, 0, 0, 0); // Normalize to start of day

    if (frequency === 'weekly') {
      const targetDay = plan?.due_day ?? 0;
      const currentDay = nextDue.getDay();
      let daysToAdd = (targetDay - currentDay + 7) % 7;
      
      // If today is target day, let's see if we should start today or next week
      // For enrollment, usually we start from the next upcoming one
      if (daysToAdd === 0) daysToAdd = 7; 
      
      nextDue.setDate(nextDue.getDate() + daysToAdd);
    } else if (frequency === 'monthly') {
      const targetDate = plan?.due_date ?? 1;
      const currentMonthDay = nextDue.getDate();
      
      if (currentMonthDay >= targetDate) {
        // Target date for this month has passed or is today, go to next month
        nextDue.setMonth(nextDue.getMonth() + 1);
      }
      nextDue.setDate(targetDate);
    }

    const { error } = await supabase.from('member_plans').insert([{
      member_id: memberId,
      plan_id: planId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      next_due_date: nextDue.toISOString().split('T')[0],
      status: 'active'
    }]);

    if (error) throw error;
    get().fetchMemberPlans();
  },

  recordPayment: async (data) => {
    // 1. Insert payment record - Source of Truth
    const { error: pError } = await supabase.from('plan_payments').insert([{
      member_plan_id: data.memberPlanId,
      amount: data.amount,
      penalty_paid: data.penalty,
      admin_id: data.adminId,
      note: data.note,
      status: 'approved'
    }]);

    if (pError) throw pError;

    // We no longer manually update member_plans here.
    // The database trigger trg_sync_member_plan_summary handles it.
    
    // Refresh to get updated data from the DB
    get().fetchMemberPlans();
  },

  sendReminders: async () => {
    const { memberPlans } = get();
    const today = new Date();
    const overduePlans = memberPlans.filter(mp => 
      mp.status === 'active' && 
      mp.next_due_date && 
      new Date(mp.next_due_date) <= today
    );

    let sent = 0;
    let alreadyNotified = 0;

    for (const plan of overduePlans) {
      // Check if we already sent a reminder today to this user for this plan
      const { data: existingReminders } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', plan.member_id)
        .eq('type', 'warning')
        .ilike('message', `%${plan.plan?.name}%`)
        .gte('created_at', today.toISOString().split('T')[0]);

      if (existingReminders && existingReminders.length > 0) {
        alreadyNotified++;
        continue;
      }

      await supabase.from('notifications').insert([{
        user_id: plan.member_id,
        title: 'কিস্তি জমা দেওয়ার সময় হয়েছে',
        message: `আপনার "${plan.plan?.name}" প্ল্যান এর কিস্তি জমা দেওয়ার তারিখ পার হয়েছে। অনুগ্রহ করে দ্রুত জমা দিন।`,
        type: 'warning'
      }]);
      sent++;
    }

    return { sent, alreadyNotified };
  }
}));

-- SQL Fixes for Database Schema Issues
-- 1. Add missing columns to profiles and somobay_plans
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'somobay_plans' AND column_name = 'due_day') THEN
        ALTER TABLE public.somobay_plans ADD COLUMN due_day integer;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'somobay_plans' AND column_name = 'due_date') THEN
        ALTER TABLE public.somobay_plans ADD COLUMN due_date integer;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'somobay_plans' AND column_name = 'status') THEN
        ALTER TABLE public.somobay_plans ADD COLUMN status text DEFAULT 'active';
    END IF;
END $$;

-- 2. Fix member_wallets foreign key to point to public.profiles(id)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'member_wallets_user_id_fkey') THEN
        ALTER TABLE public.member_wallets DROP CONSTRAINT member_wallets_user_id_fkey;
    END IF;
    
    ALTER TABLE public.member_wallets 
    ADD CONSTRAINT member_wallets_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Constraint fix failed, might already be applied or missing base table.';
END $$;

-- 3. Unified Policy Management (Prevents "already exists" errors)
DO $$
BEGIN
    -- Drop existing problematic policies if they exist before recreating
    DROP POLICY IF EXISTS "Admin manage payments" ON public.plan_payments;
    DROP POLICY IF EXISTS "Public read somobay_plans" ON public.somobay_plans;
    DROP POLICY IF EXISTS "Admins manage somobay_plans" ON public.somobay_plans;
    DROP POLICY IF EXISTS "Users view own member_plans" ON public.member_plans;
    DROP POLICY IF EXISTS "Admins manage member_plans" ON public.member_plans;
    
    -- Plan Payments
    CREATE POLICY "Admin manage payments" ON public.plan_payments FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

    -- Somobay Plans
    CREATE POLICY "Public read somobay_plans" ON public.somobay_plans FOR SELECT USING (true);
    CREATE POLICY "Admins manage somobay_plans" ON public.somobay_plans FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

    -- Member Plans
    CREATE POLICY "Users view own member_plans" ON public.member_plans FOR SELECT 
    USING (member_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    CREATE POLICY "Admins manage member_plans" ON public.member_plans FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
END $$;

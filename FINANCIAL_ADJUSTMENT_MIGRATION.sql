-- Migration to support Financial Adjustment System for Somobay plan payments
-- Run this in your Supabase SQL Editor.

-- 1. Add/modify 'type' column to public.plan_payments table if it doesn't already exist.
-- Possible types: 'payment', 'fine', 'adjustment', 'waiver', 'refund', 'installment_payment', 'fine_payment'
-- We support legacy types for perfect backward compatibility.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'plan_payments' AND column_name = 'type'
    ) THEN
        ALTER TABLE public.plan_payments ADD COLUMN type text DEFAULT 'payment';
    END IF;
    
    -- Recreate constraint with complete list of audit-safe and legacy types
    ALTER TABLE public.plan_payments DROP CONSTRAINT IF EXISTS chk_plan_payment_type;
    ALTER TABLE public.plan_payments 
    ADD CONSTRAINT chk_plan_payment_type 
    CHECK (type IN ('payment', 'fine', 'adjustment', 'waiver', 'refund', 'installment_payment', 'fine_payment'));
END $$;

-- 2. Update the sync_member_plan_summary function to compute the balance formula:
-- Only standard installment_payments (and legacy payments), adjustments, minus refunds are counted for installment balances.
-- Fines, waivers, and penalties are a separate stream and DO NOT affect installment progress.
CREATE OR REPLACE FUNCTION sync_member_plan_summary(p_member_plan_id UUID)
RETURNS VOID AS $func$
DECLARE
    r RECORD;
    v_total_installment NUMERIC := 0;
    v_total_adjustment NUMERIC := 0;
    v_total_refund NUMERIC := 0;
    v_running_pending_fine NUMERIC := 0;
    v_fine_adjusted NUMERIC;
    v_installment_part NUMERIC;
    v_total_collected NUMERIC;

    v_plan_id UUID;
    v_installment_amount NUMERIC;
    v_frequency TEXT;
    v_due_day INTEGER;
    v_due_date INTEGER;
    v_start_date DATE;
    v_installments_collected INTEGER;
    v_next_due DATE;
    v_current_month_start DATE;
    v_i INTEGER;
BEGIN
    -- Chronological loop over approved payments for this member plan to calculate the exact effective collected balance
    FOR r IN 
        SELECT amount, type
        FROM public.plan_payments
        WHERE member_plan_id = p_member_plan_id AND status = 'approved'
        ORDER BY payment_date ASC, created_at ASC, id ASC
    LOOP
        IF r.type = 'fine' OR r.type = 'fine_payment' THEN
            v_running_pending_fine := v_running_pending_fine + COALESCE(r.amount, 0);
        ELSIF r.type = 'waiver' THEN
            v_running_pending_fine := GREATEST(0, v_running_pending_fine - COALESCE(r.amount, 0));
        ELSIF r.type = 'adjustment' THEN
            v_total_adjustment := v_total_adjustment + COALESCE(r.amount, 0);
        ELSIF r.type = 'refund' THEN
            v_total_refund := v_total_refund + COALESCE(r.amount, 0);
        ELSIF r.type = 'installment_payment' OR r.type = 'payment' OR r.type = 'installment' THEN
            v_fine_adjusted := LEAST(COALESCE(r.amount, 0), v_running_pending_fine);
            v_running_pending_fine := v_running_pending_fine - v_fine_adjusted;
            v_installment_part := COALESCE(r.amount, 0) - v_fine_adjusted;
            v_total_installment := v_total_installment + v_installment_part;
        END IF;
    END LOOP;

    -- effectiveInstallmentBalance = totalInstallment + totalAdjustment - totalRefund - totalPendingFine
    v_total_collected := v_total_installment + v_total_adjustment - v_total_refund - v_running_pending_fine;

    -- Fetch plan details and enrollment info
    SELECT 
        p.installment_amount, p.frequency, p.due_day, p.due_date, mp.start_date::DATE, mp.plan_id
    INTO 
        v_installment_amount, v_frequency, v_due_day, v_due_date, v_start_date, v_plan_id
    FROM public.member_plans mp
    JOIN public.somobay_plans p ON mp.plan_id = p.id
    WHERE mp.id = p_member_plan_id;

    -- Safety exit if no plan/member relationship found
    IF v_plan_id IS NULL THEN
        RETURN;
    END IF;

    -- Calculate how many full installments have been paid
    v_installments_collected := FLOOR(v_total_collected / NULLIF(v_installment_amount, 0));

    -- Calculate the first due date (must be after start_date)
    v_next_due := v_start_date;

    IF v_frequency = 'weekly' THEN
        -- Find the first occurrence of v_due_day after start_date
        v_next_due := v_next_due + ((COALESCE(v_due_day, 0) - EXTRACT(DOW FROM v_next_due)::INTEGER + 7) % 7) * INTERVAL '1 day';
        IF v_next_due <= v_start_date THEN
            v_next_due := v_next_due + INTERVAL '7 days';
        END IF;
        -- Progress due date by the number of installments collected
        v_next_due := v_next_due + (v_installments_collected * 7) * INTERVAL '1 day';

    ELSIF v_frequency = 'monthly' THEN
        -- Initial target date in the enrollment month
        v_current_month_start := date_trunc('month', v_start_date)::DATE;
        v_next_due := (v_current_month_start + (COALESCE(v_due_date, 1) - 1) * INTERVAL '1 day')::DATE;
        
        -- Correct if it overflowed to next month (e.g. Feb 30)
        IF EXTRACT(MONTH FROM v_next_due) != EXTRACT(MONTH FROM v_current_month_start) THEN
            v_next_due := (date_trunc('month', v_next_due) - INTERVAL '1 day')::DATE;
        END IF;

        -- If it's already passed or is today (enrollment day), move to next cycle
        IF v_next_due <= v_start_date THEN
            v_current_month_start := (v_current_month_start + INTERVAL '1 month')::DATE;
            v_next_due := (v_current_month_start + (COALESCE(v_due_date, 1) - 1) * INTERVAL '1 day')::DATE;
            -- Overflow check
            IF EXTRACT(MONTH FROM v_next_due) != EXTRACT(MONTH FROM v_current_month_start) THEN
                v_next_due := (date_trunc('month', v_next_due) - INTERVAL '1 day')::DATE;
            END IF;
        END IF;
        
        -- Move forward for each collected installment
        FOR v_i IN 1..v_installments_collected LOOP
            v_current_month_start := (v_current_month_start + INTERVAL '1 month')::DATE;
            v_next_due := (v_current_month_start + (COALESCE(v_due_date, 1) - 1) * INTERVAL '1 day')::DATE;
            -- Overflow check
            IF EXTRACT(MONTH FROM v_next_due) != EXTRACT(MONTH FROM v_current_month_start) THEN
                v_next_due := (date_trunc('month', v_next_due) - INTERVAL '1 day')::DATE;
            END IF;
        END LOOP;
    END IF;

    -- Update the cache in member_plans
    UPDATE public.member_plans
    SET 
        total_collected = v_total_collected,
        next_due_date = v_next_due
    WHERE id = p_member_plan_id;
END;
$func$ LANGUAGE plpgsql;

-- 3. Run a sync to ensure existing data is synchronized with the new calculation logic
DO $do$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.member_plans LOOP
        PERFORM sync_member_plan_summary(r.id);
    END LOOP;
END;
$do$;

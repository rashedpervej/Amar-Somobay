-- 1. Create the core synchronization function
-- This function calculates the total collected amount and predicts the next due date
-- based on the plan's frequency, due day/date, and the enrollment start date.
CREATE OR REPLACE FUNCTION sync_member_plan_summary(p_member_plan_id UUID)
RETURNS VOID AS $func$
DECLARE
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
    -- Calculate total collected from approved payments
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_collected
    FROM public.plan_payments
    WHERE member_plan_id = p_member_plan_id AND status = 'approved';

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

-- 2. Create the trigger function wrapper
CREATE OR REPLACE FUNCTION trg_func_sync_plan_payment()
RETURNS TRIGGER AS $func$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM sync_member_plan_summary(OLD.member_plan_id);
    ELSE
        PERFORM sync_member_plan_summary(NEW.member_plan_id);
    END IF;
    RETURN NULL;
END;
$func$ LANGUAGE plpgsql;

-- 3. Attach the trigger to the plan_payments table
DROP TRIGGER IF EXISTS trg_sync_member_plan_summary ON public.plan_payments;
CREATE TRIGGER trg_sync_member_plan_summary
AFTER INSERT OR UPDATE OR DELETE ON public.plan_payments
FOR EACH ROW
EXECUTE FUNCTION trg_func_sync_plan_payment();

-- 4. Initial sync for existing data
DO $do$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.member_plans LOOP
        PERFORM sync_member_plan_summary(r.id);
    END LOOP;
END;
$do$;

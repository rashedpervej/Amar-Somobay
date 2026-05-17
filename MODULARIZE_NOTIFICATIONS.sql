-- Migration to add source_module to notifications for isolation
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS source_module TEXT DEFAULT 'plan' CHECK (source_module IN ('plan', 'wallet'));

-- Update existing notifications (best effort)
UPDATE public.notifications 
SET source_module = 'wallet' 
WHERE title ILIKE '%সঞ্চয়%' 
   OR title ILIKE '%ডিপোজিট%' 
   OR title ILIKE '%ব্যালেন্স%' 
   OR title ILIKE '%wallet%' 
   OR title ILIKE '%savings%';

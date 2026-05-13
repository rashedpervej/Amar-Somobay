-- CLEARING AND RESETTING APP SETTINGS
-- This script fixes the "column not found" and "uuid syntax" issues once and for all.

-- 1. DROP the table if it was created with the wrong ID type (TEXT) in the past.
-- If you see errors about "invalid input syntax for uuid", you MUST drop the table.
DROP TABLE IF EXISTS public.app_settings CASCADE;

-- 2. Clean recreate
CREATE TABLE public.app_settings (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000',
    app_name TEXT DEFAULT 'সঞ্চয় অ্যাপ',
    app_tagline TEXT DEFAULT 'সঞ্চয় ও ঋণের নির্ভরযোগ্য মাধ্যম',
    welcome_text TEXT DEFAULT 'স্বাগতম জানাই আমাদের ডিজিটাল প্ল্যাটফর্মে',
    logo_url TEXT,
    primary_color TEXT DEFAULT '#10b981',
    secondary_color TEXT DEFAULT '#059669',
    footer_text TEXT DEFAULT 'পরিচালনায়: গ্রামীণ ক্ষুদ্র সঞ্চয় সমিতি',
    organization_name TEXT DEFAULT 'গ্রামীণ সমিতি লিমিটেড',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Public read app_settings" ON public.app_settings
    FOR SELECT USING (true);

CREATE POLICY "Admin manage app_settings" ON public.app_settings
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 5. Seed Initial Row
INSERT INTO public.app_settings (id)
VALUES ('00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- 6. Storage Support (Branding Bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- SELECT
DROP POLICY IF EXISTS "Public branding access" ON storage.objects;
CREATE POLICY "Public branding access" ON storage.objects
    FOR SELECT USING (bucket_id = 'branding');

-- INSERT
DROP POLICY IF EXISTS "Admin branding upload" ON storage.objects;
CREATE POLICY "Admin branding upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'branding' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- UPDATE/ALL
DROP POLICY IF EXISTS "Admin branding update" ON storage.objects;
CREATE POLICY "Admin branding update" ON storage.objects
    FOR ALL USING (
        bucket_id = 'branding' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RELOAD SCHEMA CACHE (Supabase specific notification)
NOTIFY pgrst, 'reload schema';

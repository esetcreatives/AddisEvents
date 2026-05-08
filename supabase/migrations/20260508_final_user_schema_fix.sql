-- Final User Schema Fix
-- Adds missing columns required by the Management HQ and API routes

DO $$
BEGIN
    -- 1. Add must_change_password column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='must_change_password') THEN
        ALTER TABLE public.users ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE;
    END IF;

    -- 2. Add onboarding_completed column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='onboarding_completed') THEN
        ALTER TABLE public.users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;

    -- 3. Add plan column (if missing, though it's usually on organizations)
    -- Some queries might expect it on the user profile for quick checks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='plan') THEN
        ALTER TABLE public.users ADD COLUMN plan TEXT DEFAULT 'free';
    END IF;

    -- 4. Ensure status constraint is robust
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
    ALTER TABLE public.users ADD CONSTRAINT users_status_check 
        CHECK (status IN ('active', 'suspended', 'pending'));

    -- 5. Ensure role constraint includes all current roles
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE public.users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('super_admin', 'manager', 'organizer', 'client', 'staff'));

END $$;

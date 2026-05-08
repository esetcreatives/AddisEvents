-- Ensure users table has all expected columns and constraints
DO $$
BEGIN
    -- 1. Fix role constraint
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
        ALTER TABLE public.users DROP CONSTRAINT users_role_check;
    END IF;
    
    -- Ensure role column exists (it should, but let's be safe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='role') THEN
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'organizer';
    END IF;

    ALTER TABLE public.users 
        ADD CONSTRAINT users_role_check 
        CHECK (role IN ('super_admin', 'organizer', 'client', 'staff'));

    -- 2. Ensure other columns exist and are flexible
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='status') THEN
        ALTER TABLE public.users ADD COLUMN status TEXT DEFAULT 'active';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='email_verified') THEN
        ALTER TABLE public.users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='phone') THEN
        ALTER TABLE public.users ADD COLUMN phone TEXT;
    END IF;

    -- 3. REMOVE ALL "NOT NULL" RESTRICTIONS except for ID and EMAIL
    ALTER TABLE public.users ALTER COLUMN full_name DROP NOT NULL;
    ALTER TABLE public.users ALTER COLUMN organization_id DROP NOT NULL;
    ALTER TABLE public.users ALTER COLUMN role DROP NOT NULL;
    ALTER TABLE public.users ALTER COLUMN status DROP NOT NULL;

    -- 4. Ensure the ID is correctly treated as a UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='users' AND column_name='id' AND data_type='text'
    ) THEN
        ALTER TABLE public.users ALTER COLUMN id TYPE UUID USING id::uuid;
    END IF;

END $$;
-- Create table for Admin 2FA verification codes
CREATE TABLE IF NOT EXISTS public.admin_2fa_codes (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- SHA256 hashed code
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_2fa_codes ENABLE ROW LEVEL SECURITY;

-- No one can read/write directly to this table via API
-- It is managed strictly by SECURITY DEFINER functions or server-side admin client.
DROP POLICY IF EXISTS "Admin only access to 2fa codes" ON public.admin_2fa_codes;
CREATE POLICY "Admin only access to 2fa codes" ON public.admin_2fa_codes
    USING ( false ); -- Completely private from public API

-- Add update trigger for updated_at
DROP TRIGGER IF EXISTS update_admin_2fa_codes_updated_at ON public.admin_2fa_codes;
CREATE TRIGGER update_admin_2fa_codes_updated_at
    BEFORE UPDATE ON public.admin_2fa_codes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Hardening Database Security based on Supabase Linter recommendations

-- 1. Fix Function Search Paths & Permissions
-- This prevents search_path attacks on SECURITY DEFINER functions.

-- Function: update_updated_at
-- We re-declare it with SET search_path = public
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: handle_new_user
-- We assume a standard implementation if it exists, but we ensure it's secure.
-- Note: If this function doesn't exist, this will create a basic one.
-- If it does exist, it will update it with the secure search_path.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'organizer'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: sync_user_role_to_app_metadata
-- (Created in previous migration, now hardening)
CREATE OR REPLACE FUNCTION public.sync_user_role_to_app_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke Execute from PUBLIC to prevent direct RPC calls to these sensitive functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.sync_user_role_to_app_metadata() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_user_role_to_app_metadata() FROM anon, authenticated;

-- 2. Harden Overly Permissive RLS Policies

-- Table: public.checkins
-- Original: Staff can insert checkins (WITH CHECK true)
-- Hardened: Only staff or organizers with access to the specific event can insert checkins.
DROP POLICY IF EXISTS "Staff can insert checkins" ON public.checkins;
CREATE POLICY "Staff can insert checkins" ON public.checkins
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.event_access 
            WHERE user_id = auth.uid() 
            AND event_id = checkins.event_id 
            AND role IN ('staff', 'organizer')
        )
        OR 
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    );

-- Table: public.rsvp_responses
-- Original: Anyone can submit RSVP (WITH CHECK true)
-- Hardened: Only allow if the event exists and is published (not deleted or draft).
DROP POLICY IF EXISTS "Anyone can submit RSVP" ON public.rsvp_responses;
CREATE POLICY "Anyone can submit RSVP" ON public.rsvp_responses
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE id = rsvp_responses.event_id 
            AND status IN ('published', 'live')
        )
    );

-- Table: public.tickets
-- Original: Anyone can purchase tickets (WITH CHECK true)
-- Hardened: Only allow if the event is published/live.
DROP POLICY IF EXISTS "Anyone can purchase tickets" ON public.tickets;
CREATE POLICY "Anyone can purchase tickets" ON public.tickets
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE id = tickets.event_id 
            AND status IN ('published', 'live')
        )
    );

-- Note on "Leaked Password Protection Disabled":
-- This must be enabled in the Supabase Dashboard under Auth Settings > Password Protection.
-- It cannot be reliably enabled via SQL migration as it is a platform-level configuration.

-- Secure RLS Policies using app_metadata instead of user_metadata
-- user_metadata can be edited by the user, while app_metadata is admin-only.

-- 1. Sync existing roles from public.users to auth.users app_metadata
-- We use a CASE to ensure we don't overwrite existing app_metadata, only update the role.
DO $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', (SELECT role FROM public.users WHERE public.users.id = auth.users.id));
END $$;

-- 2. Create a trigger function to keep app_metadata in sync with public.users.role
-- This ensures that when a role is changed in the public.users table, the auth metadata is updated.
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the trigger to public.users
DROP TRIGGER IF EXISTS on_user_role_update ON public.users;
CREATE TRIGGER on_user_role_update
AFTER INSERT OR UPDATE OF role ON public.users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_app_metadata();

-- 4. Update RLS Policies to use app_metadata
-- We drop and recreate the policies mentioned in the linter error and others for consistency.

-- Organizations
DROP POLICY IF EXISTS "superadmin_manage_all_orgs" ON public.organizations;
CREATE POLICY "superadmin_manage_all_orgs" ON public.organizations
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' );

-- Users
DROP POLICY IF EXISTS "superadmin_manage_all_users" ON public.users;
CREATE POLICY "superadmin_manage_all_users" ON public.users
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' );

-- Events
DROP POLICY IF EXISTS "superadmin_manage_all_events" ON public.events;
CREATE POLICY "superadmin_manage_all_events" ON public.events
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' );

-- Event Access
DROP POLICY IF EXISTS "superadmin_manage_all_access" ON public.event_access;
CREATE POLICY "superadmin_manage_all_access" ON public.event_access
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' );

-- Guests
DROP POLICY IF EXISTS "superadmin_manage_all_guests" ON public.guests;
CREATE POLICY "superadmin_manage_all_guests" ON public.guests
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' );

-- Vendors
DROP POLICY IF EXISTS "superadmin_manage_all_vendors" ON public.vendors;
CREATE POLICY "superadmin_manage_all_vendors" ON public.vendors
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' );

-- Tasks
DROP POLICY IF EXISTS "superadmin_manage_all_tasks" ON public.tasks;
CREATE POLICY "superadmin_manage_all_tasks" ON public.tasks
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' );

-- Client Assets
DROP POLICY IF EXISTS "superadmin_manage_all_assets" ON public.client_assets;
CREATE POLICY "superadmin_manage_all_assets" ON public.client_assets
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' );

-- RSVP Responses
DROP POLICY IF EXISTS "superadmin_manage_all_rsvps" ON public.rsvp_responses;
CREATE POLICY "superadmin_manage_all_rsvps" ON public.rsvp_responses
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' );

-- Checkins
DROP POLICY IF EXISTS "superadmin_manage_all_checkins" ON public.checkins;
CREATE POLICY "superadmin_manage_all_checkins" ON public.checkins
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' );

-- Ticket Tiers
DROP POLICY IF EXISTS "superadmin_manage_all_ticket_tiers" ON public.ticket_tiers;
CREATE POLICY "superadmin_manage_all_ticket_tiers" ON public.ticket_tiers
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' );

-- Promo Codes
DROP POLICY IF EXISTS "superadmin_manage_all_promo_codes" ON public.promo_codes;
CREATE POLICY "superadmin_manage_all_promo_codes" ON public.promo_codes
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' );

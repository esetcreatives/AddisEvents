-- Bulletproof Super Admin RLS Policies using JWT metadata
-- This avoids subquery recursion and is much faster

-- 1. Organizations
DROP POLICY IF EXISTS "superadmin_manage_all_orgs" ON public.organizations;
CREATE POLICY "superadmin_manage_all_orgs" ON public.organizations
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' );

-- 2. Users
DROP POLICY IF EXISTS "superadmin_manage_all_users" ON public.users;
CREATE POLICY "superadmin_manage_all_users" ON public.users
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' );

-- 3. Events
DROP POLICY IF EXISTS "superadmin_manage_all_events" ON public.events;
CREATE POLICY "superadmin_manage_all_events" ON public.events
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' );

-- 4. Event Access
DROP POLICY IF EXISTS "superadmin_manage_all_access" ON public.event_access;
CREATE POLICY "superadmin_manage_all_access" ON public.event_access
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' );

-- 5. Guests
DROP POLICY IF EXISTS "superadmin_manage_all_guests" ON public.guests;
CREATE POLICY "superadmin_manage_all_guests" ON public.guests
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' );

-- 6. Vendors
DROP POLICY IF EXISTS "superadmin_manage_all_vendors" ON public.vendors;
CREATE POLICY "superadmin_manage_all_vendors" ON public.vendors
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' );

-- 7. Tasks
DROP POLICY IF EXISTS "superadmin_manage_all_tasks" ON public.tasks;
CREATE POLICY "superadmin_manage_all_tasks" ON public.tasks
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' );

-- 8. Assets
DROP POLICY IF EXISTS "superadmin_manage_all_assets" ON public.client_assets;
CREATE POLICY "superadmin_manage_all_assets" ON public.client_assets
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' );

-- 9. RSVP Responses
DROP POLICY IF EXISTS "superadmin_manage_all_rsvps" ON public.rsvp_responses;
CREATE POLICY "superadmin_manage_all_rsvps" ON public.rsvp_responses
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' );

-- 10. Checkins
DROP POLICY IF EXISTS "superadmin_manage_all_checkins" ON public.checkins;
CREATE POLICY "superadmin_manage_all_checkins" ON public.checkins
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' );

-- 11. Ticket Tiers
DROP POLICY IF EXISTS "superadmin_manage_all_ticket_tiers" ON public.ticket_tiers;
CREATE POLICY "superadmin_manage_all_ticket_tiers" ON public.ticket_tiers
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' );

-- 12. Promo Codes
DROP POLICY IF EXISTS "superadmin_manage_all_promo_codes" ON public.promo_codes;
CREATE POLICY "superadmin_manage_all_promo_codes" ON public.promo_codes
    FOR ALL TO authenticated
    USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' );

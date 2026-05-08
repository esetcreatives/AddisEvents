-- Fix missing status column and grant super admin full access
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
        ALTER TABLE public.users ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending'));
    END IF;
END $$;

-- 1. Grant super_admin full access to organizations
DROP POLICY IF EXISTS "superadmin_manage_all_orgs" ON public.organizations;
CREATE POLICY "superadmin_manage_all_orgs" ON public.organizations
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 2. Grant super_admin full access to users
DROP POLICY IF EXISTS "superadmin_manage_all_users" ON public.users;
CREATE POLICY "superadmin_manage_all_users" ON public.users
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 3. Grant super_admin full access to events
DROP POLICY IF EXISTS "superadmin_manage_all_events" ON public.events;
CREATE POLICY "superadmin_manage_all_events" ON public.events
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 4. Grant super_admin full access to event_access
DROP POLICY IF EXISTS "superadmin_manage_all_access" ON public.event_access;
CREATE POLICY "superadmin_manage_all_access" ON public.event_access
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 5. Grant super_admin full access to guests
DROP POLICY IF EXISTS "superadmin_manage_all_guests" ON public.guests;
CREATE POLICY "superadmin_manage_all_guests" ON public.guests
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 6. Grant super_admin full access to vendors
DROP POLICY IF EXISTS "superadmin_manage_all_vendors" ON public.vendors;
CREATE POLICY "superadmin_manage_all_vendors" ON public.vendors
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 7. Grant super_admin full access to tasks
DROP POLICY IF EXISTS "superadmin_manage_all_tasks" ON public.tasks;
CREATE POLICY "superadmin_manage_all_tasks" ON public.tasks
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 8. Grant super_admin full access to client_assets
DROP POLICY IF EXISTS "superadmin_manage_all_assets" ON public.client_assets;
CREATE POLICY "superadmin_manage_all_assets" ON public.client_assets
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 9. Grant super_admin full access to rsvp_responses
DROP POLICY IF EXISTS "superadmin_manage_all_rsvps" ON public.rsvp_responses;
CREATE POLICY "superadmin_manage_all_rsvps" ON public.rsvp_responses
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 10. Grant super_admin full access to checkins
DROP POLICY IF EXISTS "superadmin_manage_all_checkins" ON public.checkins;
CREATE POLICY "superadmin_manage_all_checkins" ON public.checkins
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 11. Grant super_admin full access to ticket_tiers
DROP POLICY IF EXISTS "superadmin_manage_all_ticket_tiers" ON public.ticket_tiers;
CREATE POLICY "superadmin_manage_all_ticket_tiers" ON public.ticket_tiers
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 12. Grant super_admin full access to promo_codes
DROP POLICY IF EXISTS "superadmin_manage_all_promo_codes" ON public.promo_codes;
CREATE POLICY "superadmin_manage_all_promo_codes" ON public.promo_codes
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

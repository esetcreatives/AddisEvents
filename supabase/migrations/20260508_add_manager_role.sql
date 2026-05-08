-- ============================================
-- Add 'manager' role to RBAC system
-- ============================================

-- Update role constraint to include manager
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('organizer', 'client', 'staff', 'super_admin', 'manager'));

-- Grant managers the same RLS access as super_admin on key tables
-- (Super admin and manager both bypass RLS via service role in API routes,
--  but this ensures direct DB access also works if needed)

-- Managers can read all users
CREATE POLICY IF NOT EXISTS "managers_read_all_users" ON public.users FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'manager')
);

-- Managers can read all organizations
CREATE POLICY IF NOT EXISTS "managers_read_all_orgs" ON public.organizations FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'manager')
);

-- Managers can read all events
CREATE POLICY IF NOT EXISTS "managers_read_all_events" ON public.events FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'manager')
);

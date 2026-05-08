-- Allow users to read their own event access records
-- This is critical for the Client Portal to verify access during login
DROP POLICY IF EXISTS "users_read_own_event_access" ON public.event_access;
CREATE POLICY "users_read_own_event_access" ON public.event_access
    FOR SELECT TO authenticated
    USING ( auth.uid() = user_id );

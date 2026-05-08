-- Allow users to read their own profile
-- This is necessary for client-side role checks and profile fetching
DROP POLICY IF EXISTS "users_read_own_profile" ON public.users;
CREATE POLICY "users_read_own_profile" ON public.users
    FOR SELECT TO authenticated
    USING ( auth.uid() = id );

-- Allow users to update their own non-sensitive profile info
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
CREATE POLICY "users_update_own_profile" ON public.users
    FOR UPDATE TO authenticated
    USING ( auth.uid() = id )
    WITH CHECK ( auth.uid() = id );

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export type UserRole = 'organizer' | 'client' | 'staff';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  organization_id: string | null;
  full_name: string | null;
  phone: string | null;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setUser(null);
          setLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        setUser(profile as UserProfile);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        getUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user,
    role: user?.role,
    organizationId: user?.organization_id,
    loading,
    error,
    isOrganizer: user?.role === 'organizer',
    isClient: user?.role === 'client',
    isStaff: user?.role === 'staff',
  };
}

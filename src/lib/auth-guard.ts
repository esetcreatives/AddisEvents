import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Shared auth guard for Management HQ routes.
 * Allows access for: super_admin, manager
 * super_admin has full access; manager has restricted access (no admin management).
 */
export async function requireHQAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const admin = createAdminClient()
  const { data: currentUser } = await admin.from('users').select('role').eq('id', user.id).single()
  const role = currentUser?.role || user.user_metadata?.role

  const hasAccess = role === 'super_admin' || role === 'manager'
  if (!hasAccess) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  return { user, admin, role: role as 'super_admin' | 'manager' }
}

/**
 * Stricter guard — super_admin only (for managing admins, danger zone actions, etc.)
 */
export async function requireSuperAdmin() {
  const result = await requireHQAccess()
  if (result.error) return result

  if (result.role !== 'super_admin') {
    return { error: NextResponse.json({ error: 'Super admin access required.' }, { status: 403 }) }
  }

  return result
}

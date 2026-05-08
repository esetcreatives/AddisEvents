import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth-guard'

/**
 * Dedicated API for managing HQ administrators (super_admin + manager).
 * Completely separated from the platform users directory.
 * Only super_admin can access this.
 */
export async function GET() {
  const auth = await requireSuperAdmin()
  if (auth.error) return auth.error

  const { data, error } = await auth.admin
    .from('users')
    .select('id, full_name, email, phone, role, status, created_at')
    .in('role', ['super_admin', 'manager'])
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ admins: data || [] })
}

import { NextResponse } from 'next/server'
import { requireHQAccess } from '@/lib/auth-guard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const auth = await requireHQAccess()
  if (auth.error) return auth.error
  const admin = auth.admin

  try {
    // Run all stats queries in parallel for maximum speed
    // Exclude super_admin and manager from "platform users" count
    const [
      usersRes,
      adminsRes,
      orgsRes,
      eventsRes,
      recentUsers,
      recentOrgs
    ] = await Promise.all([
      admin.from('users').select('id', { count: 'exact', head: true }).not('role', 'in', '("super_admin","manager")'),
      admin.from('users').select('id', { count: 'exact', head: true }).in('role', ['super_admin', 'manager']),
      admin.from('organizations').select('id', { count: 'exact', head: true }),
      admin.from('events').select('id', { count: 'exact', head: true }).in('status', ['published', 'live']),
      admin.from('users').select('id, full_name, email, role, created_at').not('role', 'in', '("super_admin","manager")').order('created_at', { ascending: false }).limit(5),
      admin.from('organizations').select('id, name, contact_email').order('created_at', { ascending: false }).limit(5),
    ])

    // Inquiries count — handled separately in case the table doesn't exist yet
    let inquiriesCount = 0
    try {
      const { count } = await admin.from('contact_submissions').select('id', { count: 'exact', head: true })
      inquiriesCount = count || 0
    } catch {
      // table not yet migrated — ignore
    }

    return NextResponse.json({
      stats: {
        users: usersRes.count ?? 0,
        admins: adminsRes.count ?? 0,
        organizations: orgsRes.count ?? 0,
        activeEvents: eventsRes.count ?? 0,
        inquiries: inquiriesCount,
      },
      recentUsers: recentUsers.data || [],
      recentOrganizations: recentOrgs.data || [],
    })
  } catch (error) {
    console.error('Admin overview fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch platform metrics' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth-guard'

/**
 * TEMPORARY: Test Data Cleanup API
 * This deletes all non-admin data for testing purposes.
 * Only accessible by super_admin.
 */
export async function POST() {
  const auth = await requireSuperAdmin()
  if (auth.error) return auth.error
  const admin = auth.admin

  try {
    // Delete in reverse dependency order
    await admin.from('checkins').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await admin.from('rsvp_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await admin.from('guests').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await admin.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await admin.from('event_vendors').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await admin.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await admin.from('vendors').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await admin.from('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Note: We don't delete users to avoid locking ourselves out, 
    // but we could delete non-admin users if requested.
    // For now, cleaning events/orgs is sufficient for a "clean" dashboard.
    
    return NextResponse.json({ success: true, message: 'Platform data wiped successfully.' })
  } catch (error) {
    console.error('Data wipe error:', error)
    return NextResponse.json({ error: 'Failed to wipe data.' }, { status: 500 })
  }
}

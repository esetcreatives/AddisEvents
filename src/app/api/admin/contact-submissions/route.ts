import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const admin = createAdminClient()
  const { data: currentUser } = await admin.from('users').select('role').eq('id', user.id).single()
  const isSuperAdmin = currentUser?.role === 'super_admin' || user.user_metadata?.role === 'super_admin'

  if (!isSuperAdmin) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  return { user, admin }
}

export async function GET() {
  const auth = await requireSuperAdmin()
  if (auth.error) return auth.error

  const { data, error } = await auth.admin
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ submissions: data || [] })
}

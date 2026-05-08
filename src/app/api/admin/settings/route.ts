import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enforceSameOrigin } from '@/lib/security'

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const admin = createAdminClient()
  const { data: currentUser } = await admin.from('users').select('role').eq('id', user.id).single()
  const isSuperAdmin = currentUser?.role === 'super_admin' || user.app_metadata?.role === 'super_admin' || user.user_metadata?.role === 'super_admin'

  if (!isSuperAdmin) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  return { user, admin }
}

export async function GET() {
  const auth = await requireSuperAdmin()
  if (auth.error) return auth.error

  const { data, error } = await auth.admin.from('platform_settings').select('*')
  
  if (error) {
    // If table doesn't exist, return defaults
    return NextResponse.json({
      signup_enabled: true,
      client_portal_enabled: true,
      staff_pins_required: true
    })
  }

  const settings: Record<string, any> = {}
  data.forEach((s: any) => {
    settings[s.key] = s.value
  })

  return NextResponse.json(settings)
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request)
  if (originError) return originError

  const auth = await requireSuperAdmin()
  if (auth.error) return auth.error

  const body = await request.json()
  
  const updates = Object.entries(body).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString()
  }))

  const { error } = await auth.admin.from('platform_settings').upsert(updates)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

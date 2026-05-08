import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enforceSameOrigin, sanitizeText } from '@/lib/security'

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin()
  if (auth.error) return auth.error

  const { id } = await params

  // Try with status column first, fall back without it if column doesn't exist yet
  const { data, error } = await auth.admin
    .from('users')
    .select('id, full_name, email, phone, role, status, organization_id')
    .eq('id', id)
    .single()

  if (error && (error.message.includes('status') || error.message.includes('schema cache'))) {
    const { data: fallbackData, error: fallbackError } = await auth.admin
      .from('users')
      .select('id, full_name, email, phone, role, organization_id')
      .eq('id', id)
      .single()

    if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 })
    if (!fallbackData) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    return NextResponse.json({ user: { ...fallbackData, status: 'active' } })
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  return NextResponse.json({ user: data })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = enforceSameOrigin(request)
  if (originError) return originError

  const auth = await requireSuperAdmin()
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}
  if (body.full_name !== undefined) updates.full_name = sanitizeText(body.full_name, 120)
  if (body.phone !== undefined) updates.phone = sanitizeText(body.phone, 30)
  if (body.role !== undefined && ['super_admin', 'organizer', 'client', 'staff'].includes(body.role)) {
    updates.role = body.role
  }
  if (body.organization_id !== undefined) updates.organization_id = body.organization_id || null

  // Try updating with status, fall back without it
  if (body.status !== undefined && ['active', 'suspended', 'pending'].includes(body.status)) {
    updates.status = body.status
  }

  const { error } = await auth.admin.from('users').update(updates).eq('id', id)

  if (error && (error.message.includes('status') || error.message.includes('schema cache'))) {
    const safeUpdates = { ...updates }
    delete safeUpdates.status
    const { error: fallbackError } = await auth.admin.from('users').update(safeUpdates).eq('id', id)
    if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 })
  } else if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also update auth metadata to keep in sync
  if (updates.role) {
    await auth.admin.auth.admin.updateUserById(id, {
      user_metadata: { role: updates.role },
      app_metadata: { role: updates.role },
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = enforceSameOrigin(request)
  if (originError) return originError

  const auth = await requireSuperAdmin()
  if (auth.error) return auth.error

  const { id } = await params

  // Delete from users table first (cascades from auth.users FK)
  const { error } = await auth.admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

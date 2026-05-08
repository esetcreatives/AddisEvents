import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enforceSameOrigin, sanitizeText } from '@/lib/security'
import { requireHQAccess, requireSuperAdmin } from '@/lib/auth-guard'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireHQAccess()
  if (auth.error) return auth.error

  const { id } = await params

  let { data: org, error } = await auth.admin
    .from('organizations')
    .select('id, name, contact_email, contact_phone, address, plan, onboarding_completed, logo_url, created_at')
    .eq('id', id)
    .single()

  if (error && (error.message.includes('plan') || error.message.includes('onboarding_completed') || error.message.includes('column'))) {
    const { data: fallbackOrg, error: fallbackError } = await auth.admin
      .from('organizations')
      .select('id, name, contact_email, contact_phone, address, logo_url, created_at')
      .eq('id', id)
      .single()
    
    if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 })
    
    org = { 
      ...fallbackOrg, 
      plan: 'professional', 
      onboarding_completed: false 
    } as any
  } else if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!org) return NextResponse.json({ error: 'Organization not found.' }, { status: 404 })

  // Fetch members
  const { data: members } = await auth.admin
    .from('users')
    .select('id, full_name, email, role, created_at')
    .eq('organization_id', id)
    .order('created_at', { ascending: false })

  // Fetch event count
  const { count: eventCount } = await auth.admin
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', id)

  return NextResponse.json({
    organization: org,
    members: members || [],
    event_count: eventCount || 0,
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = enforceSameOrigin(request)
  if (originError) return originError

  const auth = await requireHQAccess()
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) {
    const name = sanitizeText(body.name, 200)
    if (!name) return NextResponse.json({ error: 'Organization name cannot be empty.' }, { status: 400 })
    updates.name = name
  }
  if (body.contact_email !== undefined) updates.contact_email = sanitizeText(body.contact_email, 200) || null
  if (body.contact_phone !== undefined) updates.contact_phone = sanitizeText(body.contact_phone, 30) || null
  if (body.address !== undefined) updates.address = sanitizeText(body.address, 500) || null
  if (body.plan !== undefined && ['starter', 'professional', 'enterprise'].includes(body.plan)) {
    updates.plan = body.plan
  }
  if (body.onboarding_completed !== undefined) updates.onboarding_completed = Boolean(body.onboarding_completed)

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  const { error } = await auth.admin.from('organizations').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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

  // Check if org has members — warn but allow deletion
  const { count } = await auth.admin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', id)

  if (count && count > 0) {
    // Unlink users from org before deleting
    await auth.admin
      .from('users')
      .update({ organization_id: null })
      .eq('organization_id', id)
  }

  const { error } = await auth.admin.from('organizations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

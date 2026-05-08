import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enforceSameOrigin, sanitizeText } from '@/lib/security'
import { requireHQAccess } from '@/lib/auth-guard'

export async function GET() {
  const auth = await requireHQAccess()
  if (auth.error) return auth.error

  const { data, error } = await auth.admin
    .from('organizations')
    .select('id, name, contact_email, contact_phone, address, plan, onboarding_completed, logo_url, created_at')
    .order('created_at', { ascending: false })

  if (error && (error.message.includes('plan') || error.message.includes('column') || error.message.includes('schema cache'))) {
    const { data: fallbackData, error: fallbackError } = await auth.admin
      .from('organizations')
      .select('id, name, contact_email, contact_phone, address, logo_url, created_at')
      .order('created_at', { ascending: false })

    if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 })
    
    // Enrich fallback data with default values
    const enrichedFallback = (fallbackData || []).map(org => ({ 
      ...org, 
      plan: 'professional', 
      onboarding_completed: false 
    }))
    return respondWithCounts(enrichedFallback)
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return respondWithCounts(data || [])
}

async function respondWithCounts(data: any[]) {
  const admin = createAdminClient()
  const orgIds = data.map((o: { id: string }) => o.id)
  if (orgIds.length === 0) return NextResponse.json({ organizations: [] })

  const { data: memberData } = await admin
    .from('users')
    .select('organization_id')
    .in('organization_id', orgIds)

  const memberCounts: Record<string, number> = {}
  for (const m of memberData || []) {
    const orgId = (m as { organization_id: string }).organization_id
    memberCounts[orgId] = (memberCounts[orgId] || 0) + 1
  }

  const enriched = data.map((org: { id: string }) => ({
    ...org,
    member_count: memberCounts[org.id] || 0,
  }))

  return NextResponse.json({ organizations: enriched })
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request)
  if (originError) return originError

  const auth = await requireHQAccess()
  if (auth.error) return auth.error

  const body = await request.json()
  const name = sanitizeText(body.name || '', 200)
  if (!name) return NextResponse.json({ error: 'Organization name is required.' }, { status: 400 })

  const insert: Record<string, unknown> = { name }
  if (body.contact_email) insert.contact_email = sanitizeText(body.contact_email, 200)
  if (body.contact_phone) insert.contact_phone = sanitizeText(body.contact_phone, 30)
  if (body.address) insert.address = sanitizeText(body.address, 500)
  if (body.plan && ['starter', 'professional', 'enterprise'].includes(body.plan)) {
    insert.plan = body.plan
  }

  const { data, error } = await auth.admin.from('organizations').insert(insert).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ organization: data })
}

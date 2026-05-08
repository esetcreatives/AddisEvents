import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enforceSameOrigin, sanitizeText } from '@/lib/security'

type CreateEventBody = {
  title?: string
  description?: string
  start_date?: string
  end_date?: string
  venue_name?: string
  venue_address?: string
  capacity?: number
  event_type?: 'wedding' | 'corporate'
  is_ticketed?: boolean
  slug?: string
  status?: 'draft' | 'published' | 'live' | 'completed'
}

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const supabase = await createClient()
    const admin = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('id, role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: profileError?.message || 'Profile not found.' }, { status: 404 })
    }

    if (profile.role !== 'organizer' && user.user_metadata?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only organizers can create events.' }, { status: 403 })
    }

    const body = (await request.json()) as CreateEventBody
    if (!body.title || !body.start_date || !body.end_date || !body.event_type || !body.slug) {
      return NextResponse.json({ error: 'Missing required event fields.' }, { status: 400 })
    }

    const slug = sanitizeText(body.slug, 120).toLowerCase()
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json({ error: 'Event slug must contain lowercase letters, numbers, and hyphens only.' }, { status: 400 })
    }

    const startDate = new Date(body.start_date)
    const endDate = new Date(body.end_date)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      return NextResponse.json({ error: 'Enter a valid event date range.' }, { status: 400 })
    }

    const capacity = Number(body.capacity || 100)
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000) {
      return NextResponse.json({ error: 'Capacity must be between 1 and 100000.' }, { status: 400 })
    }

    const { data: event, error } = await admin
      .from('events')
      .insert({
        organizer_id: user.id,
        organization_id: profile.organization_id,
        title: sanitizeText(body.title, 180),
        description: body.description ? sanitizeText(body.description, 3000) : null,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        venue_name: body.venue_name ? sanitizeText(body.venue_name, 180) : null,
        venue_address: body.venue_address ? sanitizeText(body.venue_address, 500) : null,
        capacity,
        event_type: body.event_type,
        is_ticketed: Boolean(body.is_ticketed),
        slug,
        status: body.status || 'draft',
      })
      .select('id, slug')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create event.' },
      { status: 500 }
    )
  }
}

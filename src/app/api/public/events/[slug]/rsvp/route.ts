import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  enforceSameOrigin,
  getClientIp,
  isValidEmail,
  normalizeEmail,
  rateLimit,
  sanitizeText,
  secureToken,
} from '@/lib/security'

type PublicRsvpBody = {
  name?: string
  email?: string
  phone?: string
  status?: 'confirmed' | 'declined'
  dietary?: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const originError = enforceSameOrigin(request)
  if (originError) return originError

  const rateLimitError = rateLimit(`public-rsvp:${getClientIp(request)}`, {
    limit: 12,
    windowMs: 15 * 60 * 1000,
  })
  if (rateLimitError) return rateLimitError

  const { slug } = await params
  const body = (await request.json()) as PublicRsvpBody
  const status = body.status === 'declined' ? 'declined' : 'confirmed'
  const name = sanitizeText(body.name || '', 120)
  const email = body.email ? normalizeEmail(body.email) : ''
  const phone = sanitizeText(body.phone || '', 40)
  const dietary = sanitizeText(body.dietary || '', 500)

  if (name.length < 2) {
    return NextResponse.json({ error: 'Full name is required.' }, { status: 400 })
  }

  if (!email && !phone) {
    return NextResponse.json({ error: 'Email or phone is required.' }, { status: 400 })
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id, title, capacity, is_ticketed')
    .eq('slug', slug)
    .eq('is_public', true)
    .in('status', ['published', 'live'])
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
  }

  if (event.is_ticketed) {
    return NextResponse.json({ error: 'Ticketed events must use checkout.' }, { status: 400 })
  }

  if (event.capacity && status === 'confirmed') {
    const { count } = await admin
      .from('rsvp_responses')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'confirmed')

    if ((count || 0) >= event.capacity) {
      return NextResponse.json({ error: 'Sorry, this event has reached capacity.' }, { status: 409 })
    }
  }

  const { data: guest, error: guestError } = await admin
    .from('guests')
    .insert({
      event_id: event.id,
      full_name: name,
      email: email || null,
      phone: phone || null,
      rsvp_status: status,
    })
    .select('id')
    .single()

  if (guestError || !guest) {
    return NextResponse.json({ error: guestError?.message || 'Unable to create guest.' }, { status: 500 })
  }

  const qrCode = status === 'confirmed'
    ? `AE-${guest.id}-${secureToken().slice(0, 6).toUpperCase()}`
    : null

  const { error: rsvpError } = await admin
    .from('rsvp_responses')
    .insert({
      event_id: event.id,
      guest_id: guest.id,
      respondent_name: name,
      respondent_email: email || null,
      respondent_phone: phone || null,
      status,
      dietary_restrictions: dietary || null,
      qr_code: qrCode,
      responded_at: new Date().toISOString(),
    })

  if (rsvpError) {
    return NextResponse.json({ error: rsvpError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, status, qrCode })
}


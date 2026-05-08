import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: event, error } = await admin
    .from('events')
    .select('id, title, slug, description, event_type, status, venue_name, venue_address, start_date, end_date, capacity, cover_image, theme_color, is_ticketed, is_public')
    .eq('slug', slug)
    .eq('is_public', true)
    .in('status', ['published', 'live'])
    .single()

  if (error || !event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
  }

  const { data: ticketTiers } = event.is_ticketed
    ? await admin
        .from('ticket_tiers')
        .select('id, name, description, price, currency, quantity, sold')
        .eq('event_id', event.id)
        .order('price', { ascending: true })
    : { data: [] }

  return NextResponse.json({ event, ticketTiers: ticketTiers || [] })
}


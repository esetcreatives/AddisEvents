import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', session.user.id)
    .single();

  // Organizer – full guest data for events belonging to their organization
  if (user?.role === 'organizer') {
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organization_id', user.organization_id)
      .single();
    if (!event) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { data: guests, error } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', eventId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ guests });
  }

  // Client – limited fields, only if they have access to the event
  if (user?.role === 'client') {
    const { data: access } = await supabase
      .from('event_access')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('event_id', eventId)
      .eq('role', 'client')
      .single();
    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { data: guests, error } = await supabase
      .from('guests')
      .select('id, full_name, rsvp_status, checkin_status, seat_assignment, guest_type')
      .eq('event_id', eventId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ guests });
  }

  // Staff – check‑in data only, and only for their assigned event
  if (user?.role === 'staff') {
    const { data: access } = await supabase
      .from('event_access')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('event_id', eventId)
      .eq('role', 'staff')
      .single();
    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { data: guests, error } = await supabase
      .from('guests')
      .select('id, full_name, rsvp_status, checkin_status, seat_assignment, qr_code')
      .eq('event_id', eventId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ guests });
  }

  // Anything else is not allowed
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

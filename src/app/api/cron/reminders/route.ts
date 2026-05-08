import { NextResponse } from 'next/server';
import { sendRSVPConfirmation } from '@/lib/resend';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type PendingGuest = {
  email?: string | null
  full_name?: string | null
}

/**
 * Vercel Cron Job: Sends RSVP reminders to pending guests
 * Recommended Schedule: Every day at 09:00 AM
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('id, title, rsvp_deadline, start_date')
      .lte('rsvp_deadline', threeDaysFromNow.toISOString())
      .gte('rsvp_deadline', new Date().toISOString());

    if (eventError) throw eventError;

    let totalRemindersSent = 0;

    for (const event of events) {
      const { data: pendingGuests, error: guestError } = await supabase
        .from('rsvp_responses')
        .select('*, guests(full_name, email)')
        .eq('event_id', event.id)
        .eq('status', 'pending');

      if (guestError) continue;

      for (const rsvp of pendingGuests) {
        const guest = Array.isArray(rsvp.guests)
          ? (rsvp.guests[0] as PendingGuest | undefined)
          : (rsvp.guests as PendingGuest | null);
        if (!guest?.email) continue;

        const { success } = await sendRSVPConfirmation(
          guest.email, 
          guest.full_name || 'Guest',
          `Reminder: ${event.title}`, 
          rsvp.id
        );

        if (success) {
          await supabase
            .from('guests')
            .update({ 
              reminder_sent: true,
              last_reminder_at: new Date().toISOString()
            })
            .eq('id', rsvp.guest_id);
          
          totalRemindersSent++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      eventsProcessed: events.length,
      remindersSent: totalRemindersSent 
    });

  } catch (error) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Reminder cron failed.' }, { status: 500 });
  }
}

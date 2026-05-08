import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Vercel Cron Job: Updates event statuses based on time
 * Recommended Schedule: Every hour
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const now = new Date().toISOString();

    // 1. Move ended events to 'past'
    const { data: endedEvents, error: endError } = await supabase
      .from('events')
      .update({ status: 'past' })
      .lt('end_date', now)
      .neq('status', 'past')
      .select('id, title');

    if (endError) throw endError;

    return NextResponse.json({ 
      success: true, 
      eventsArchived: endedEvents?.length || 0 
    });

  } catch (error) {
    console.error('Cron Status Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Cron status failed.' }, { status: 500 });
  }
}

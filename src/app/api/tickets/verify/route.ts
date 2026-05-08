import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPayment } from '@/lib/chapa'

type VerifyBody = {
  tx_ref?: string
}

async function verifyTicket(txRef: string) {
  const admin = createAdminClient()
  const payment = await verifyPayment(txRef)

  if (payment.status !== 'success' || payment.data?.status !== 'success') {
    return NextResponse.json({ error: 'Payment is not verified.' }, { status: 400 })
  }

  const { data: ticket, error } = await admin
    .from('tickets')
    .update({ payment_status: 'paid' })
    .eq('chapa_reference', txRef)
    .select('*, events(*), ticket_tiers(*)')
    .single()

  if (error || !ticket) {
    return NextResponse.json({ error: error?.message || 'Ticket not found.' }, { status: 404 })
  }

  return NextResponse.json({ success: true, ticket })
}

export async function GET(request: Request) {
  const txRef = new URL(request.url).searchParams.get('tx_ref')
  if (!txRef) {
    return NextResponse.json({ error: 'Transaction reference is required.' }, { status: 400 })
  }

  return verifyTicket(txRef)
}

export async function POST(request: Request) {
  const { tx_ref: txRef } = (await request.json()) as VerifyBody
  if (!txRef) {
    return NextResponse.json({ error: 'Transaction reference is required.' }, { status: 400 })
  }

  return verifyTicket(txRef)
}

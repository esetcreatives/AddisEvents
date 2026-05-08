import { NextResponse } from 'next/server';
import { initializePayment } from '@/lib/chapa';
import { createAdminClient, getSiteUrl } from '@/lib/supabase/admin';
import { enforceSameOrigin, isValidEmail, normalizeEmail, sanitizeText, secureToken } from '@/lib/security';

type CheckoutBody = {
  eventId?: string
  tierId?: string
  email?: string
  name?: string
  quantity?: number
  promoCode?: string
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  const admin = createAdminClient();
  const body = (await request.json()) as CheckoutBody;

  const { eventId, tierId, email, name, promoCode } = body;
  const quantity = Number(body.quantity || 1);

  if (!eventId || !tierId || !email || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const normalizedEmail = normalizeEmail(email);
  const cleanName = sanitizeText(name, 120);

  if (!isValidEmail(normalizedEmail)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    return NextResponse.json({ error: 'Quantity must be between 1 and 10.' }, { status: 400 });
  }

  const { data: tier, error: tierError } = await admin
    .from('ticket_tiers')
    .select('id, event_id, name, price, currency, quantity, sold')
    .eq('id', tierId)
    .eq('event_id', eventId)
    .single();

  if (tierError || !tier) {
    return NextResponse.json({ error: 'Ticket tier not found.' }, { status: 404 });
  }

  const available = Number(tier.quantity || 0) - Number(tier.sold || 0);
  if (available < quantity) {
    return NextResponse.json({ error: 'Not enough tickets are available.' }, { status: 409 });
  }

  const total = Number(tier.price) * quantity;
  if (!Number.isFinite(total) || total <= 0) {
    return NextResponse.json({ error: 'Ticket price is invalid.' }, { status: 400 });
  }

  const tx_ref = `AE-TKT-${Date.now()}-${secureToken().slice(0, 8).toUpperCase()}`;

  const { error: ticketError } = await admin
    .from('tickets')
    .insert({
      event_id: eventId,
      tier_id: tierId,
      ticket_number: tx_ref,
      payment_status: 'pending',
      chapa_reference: tx_ref,
      metadata: { 
        email: normalizedEmail,
        name: cleanName,
        quantity, 
        total, 
        promoCode: promoCode ? sanitizeText(promoCode, 50) : null
      }
    })

  if (ticketError) {
    return NextResponse.json({ error: ticketError.message }, { status: 500 });
  }

  const [firstName, ...lastNameParts] = cleanName.split(' ');
  const lastName = lastNameParts.join(' ') || 'Guest';
  const siteUrl = getSiteUrl();

  const chapaData = {
    amount: total,
    currency: tier.currency || 'ETB',
    email: normalizedEmail,
    first_name: firstName,
    last_name: lastName,
    tx_ref: tx_ref,
    callback_url: `${siteUrl}/api/tickets/verify`,
    return_url: `${siteUrl}/tickets/callback?tx_ref=${tx_ref}`,
    customization: {
      title: 'Addis Events Ticket',
      description: `Payment for ${tier.name}`,
    }
  };

  const paymentResponse = await initializePayment(chapaData);

  if (paymentResponse.status === 'success') {
    return NextResponse.json({ checkoutUrl: paymentResponse.data.checkout_url });
  } else {
    return NextResponse.json({ error: 'Failed to initialize payment with Chapa' }, { status: 500 });
  }
}

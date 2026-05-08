import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  enforceSameOrigin,
  getClientIp,
  isValidEmail,
  normalizeEmail,
  rateLimit,
  sanitizeText,
} from '@/lib/security'

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request)
  if (originError) return originError

  // Rate limit: max 5 submissions per IP per 15 minutes
  const ip = getClientIp(request)
  const rateLimitError = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 })
  if (rateLimitError) return rateLimitError

  try {
    const body = await request.json()
    const { name, email, phone, eventType, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
    }

    const cleanEmail = normalizeEmail(email)
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const cleanName = sanitizeText(name, 120)
    const cleanMessage = sanitizeText(message, 2000)
    const cleanPhone = phone ? sanitizeText(phone, 30) : null
    const cleanEventType = eventType ? sanitizeText(eventType, 50) : null

    const admin = createAdminClient()

    const { error } = await admin.from('contact_submissions').insert({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      event_type: cleanEventType,
      message: cleanMessage,
      ip_address: ip,
    })

    if (error) {
      // If table doesn't exist yet, still return success to user (graceful degradation)
      console.error('Contact submission error:', error.message)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unable to submit inquiry.' }, { status: 500 })
  }
}

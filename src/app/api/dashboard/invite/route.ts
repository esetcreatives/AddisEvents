import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, getSiteUrl } from '@/lib/supabase/admin'
import {
  enforceSameOrigin,
  escapeHtml,
  getClientIp,
  isValidEmail,
  normalizeEmail,
  randomNumericCode,
  rateLimit,
  sanitizeText,
  secureToken,
} from '@/lib/security'

type InviteBody = {
  email?: string
  fullName?: string
  role?: 'client' | 'staff'
  organizationId?: string
  eventId?: string
}

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const { email, fullName, role, organizationId, eventId } = (await request.json()) as InviteBody

    if (!email || !fullName || !role || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedEmail = normalizeEmail(email)
    const cleanFullName = sanitizeText(fullName, 120)

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    if (!['client', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Invalid invite role.' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify current user is an organizer
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitError = rateLimit(`dashboard-invite:${user.id}:${getClientIp(request)}`, {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    })
    if (rateLimitError) return rateLimitError

    const { data: currentUserData } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (currentUserData?.role !== 'organizer' || currentUserData.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    if (eventId) {
      const { data: event } = await adminSupabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .eq('organization_id', organizationId)
        .single()

      if (!event) {
        return NextResponse.json({ error: 'Event does not belong to this organization.' }, { status: 403 })
      }
    }

    // Check if user already exists
    const { data: existingUsers, error: listError } = await adminSupabase.auth.admin.listUsers()
    
    if (listError) {
       console.error("Admin List Users Error", listError)
       // Fallback for local dev if admin listing fails
    } else {
        const existing = existingUsers?.users?.find(u => u.email?.toLowerCase() === normalizedEmail)
        if (existing) {
             // Just update their org if they exist
             await adminSupabase.from('users').update({
                 organization_id: organizationId,
                 role: role
             }).eq('id', existing.id)
             if (eventId && (role === 'client' || role === 'staff')) {
               await adminSupabase.from('event_access').upsert({
                 user_id: existing.id,
                 event_id: eventId,
                 role,
                 pin_code: role === 'staff' ? randomNumericCode(6) : null
               })
             }
             return NextResponse.json({ success: true, message: 'User updated' })
        }
    }

    // Auto-generate a secure random password for the invitee
    // They will reset it when they accept the invite (or we can just use magic links)
    const tempPassword = `${secureToken()}A1!`

    const { data: newUser, error: inviteError } = await adminSupabase.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true, // Auto confirm for now, in prod you'd use inviteUserByEmail
      user_metadata: {
        full_name: cleanFullName,
        role: role,
        organization_id: organizationId
      }
    })

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    if (eventId && newUser.user && (role === 'client' || role === 'staff')) {
      const pin = role === 'staff' ? randomNumericCode(6) : null
      await adminSupabase.from('event_access').upsert({
        user_id: newUser.user.id,
        event_id: eventId,
        role,
        pin_code: pin
      })

      const { data: tokenRow } = await adminSupabase
        .from('invite_tokens')
        .insert({
          user_id: newUser.user.id,
          event_id: eventId,
          role
        })
        .select('token')
        .single()

      const shouldSendEmail = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your_resend_api_key')
      if (shouldSendEmail) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const inviteUrl = role === 'client' && tokenRow?.token
          ? `${getSiteUrl()}/portal/accept-invite?token=${tokenRow.token}`
          : `${getSiteUrl()}/checkin/${eventId}`
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Addis Events <noreply@addisevents.com>',
          to: [normalizedEmail],
          subject: role === 'client' ? "You've been invited to track your event" : 'You have been assigned to event check-in',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px">
              <h1 style="color:#91091E">Addis Events Invitation</h1>
              <p>Hello ${escapeHtml(cleanFullName)},</p>
              <p>${role === 'client' ? 'You have been invited to access the client portal.' : 'You have been assigned to help with guest check-in.'}</p>
              <p><a href="${inviteUrl}" style="background:#91091E;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">Open invitation</a></p>
              ${role === 'staff' ? `<p><strong>Temporary password:</strong> ${escapeHtml(tempPassword)}</p><p><strong>PIN:</strong> ${escapeHtml(pin || '')}</p>` : ''}
            </div>
          `
        })
      } else if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Email delivery must be configured before inviting users in production.' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, userId: newUser.user?.id })

  } catch (error) {
    console.error("Invite Error", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

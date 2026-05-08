import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  enforceSameOrigin,
  getClientIp,
  isStrongPassword,
  rateLimit,
  sanitizeText,
} from '@/lib/security'

type AcceptInviteBody = {
  token?: string
  fullName?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const rateLimitError = rateLimit(`accept-invite:${getClientIp(request)}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    })
    if (rateLimitError) return rateLimitError

    const { token, fullName, password } = (await request.json()) as AcceptInviteBody
    if (!token || !fullName || !password) {
      return NextResponse.json({ error: 'Token, full name, and password are required.' }, { status: 400 })
    }

    if (!/^[a-f0-9-]{24,80}$/i.test(token)) {
      return NextResponse.json({ error: 'Invite not found.' }, { status: 404 })
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 10 characters and include uppercase, lowercase, and a number.' },
        { status: 400 }
      )
    }

    const cleanFullName = sanitizeText(fullName, 120)
    if (cleanFullName.length < 2) {
      return NextResponse.json({ error: 'Full name is too short.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: invite, error } = await admin
      .from('invite_tokens')
      .select('id, user_id, role, event_id, expires_at, accepted_at')
      .eq('token', token)
      .single()

    if (error || !invite) {
      return NextResponse.json({ error: 'Invite not found.' }, { status: 404 })
    }

    if (invite.accepted_at) {
      return NextResponse.json({ error: 'Invite has already been accepted.' }, { status: 400 })
    }

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invite has expired.' }, { status: 400 })
    }

    await admin.auth.admin.updateUserById(invite.user_id, {
      password,
      user_metadata: {
        full_name: cleanFullName,
        role: invite.role,
        must_change_password: false,
      },
    })

    await admin.from('users').update({
      full_name: cleanFullName,
      status: 'active',
      must_change_password: false,
    }).eq('id', invite.user_id)

    await admin.from('invite_tokens').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to accept invite.' },
      { status: 500 }
    )
  }
}

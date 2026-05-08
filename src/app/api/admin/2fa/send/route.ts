import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  enforceSameOrigin,
  escapeHtml,
  getClientIp,
  randomNumericCode,
  rateLimit,
  sha256,
} from '@/lib/security'

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ 
        error: 'Database configuration missing. Ensure SUPABASE_SERVICE_ROLE_KEY is set in production.' 
      }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or expired.' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: dbUser } = await admin
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single()

    const isAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'manager' || 
                    user.app_metadata?.role === 'super_admin' || user.app_metadata?.role === 'manager' ||
                    user.user_metadata?.role === 'super_admin' || user.user_metadata?.role === 'manager'

    if (!isAdmin || dbUser?.status === 'suspended') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rateLimitError = rateLimit(`admin-2fa-send:${user.id}:${getClientIp(request)}`, {
      limit: 3,
      windowMs: 10 * 60 * 1000,
    })
    if (rateLimitError) return rateLimitError

    const code = randomNumericCode(6)
    const codeHash = sha256(`${user.id}:${code}`)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await admin.from('admin_2fa_codes').delete().eq('user_id', user.id)
    const { error } = await admin.from('admin_2fa_codes').insert({
      user_id: user.id,
      code: codeHash,
      expires_at: expiresAt,
      attempts: 0,
    })

    if (error) {
      const canFallbackToCookie =
        error.message.includes('admin_2fa_codes') ||
        error.message.includes('schema cache')

      if (!canFallbackToCookie) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const cookieStore = await cookies()
      cookieStore.set('ae_admin_2fa_code', `${user.id}|${codeHash}|${expiresAt}|0`, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60,
        path: '/',
      })
    }

    const shouldSendEmail = Boolean(
      process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY !== 'your_resend_api_key'
    )

    if (!shouldSendEmail && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Email delivery must be configured before using admin 2FA in production.' },
        { status: 500 }
      )
    }

    if (shouldSendEmail) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Addis Events <noreply@addisevents.com>',
        to: [user.email],
        subject: 'Your Addis Events admin verification code',
        html: `<p>Your Addis Events admin code is <strong style="font-size:24px;letter-spacing:4px">${escapeHtml(code)}</strong>. It expires in 10 minutes.</p>`,
      })
    }

    return NextResponse.json({
      success: true,
      devCode: shouldSendEmail ? undefined : code,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to send 2FA code.' },
      { status: 500 }
    )
  }
}

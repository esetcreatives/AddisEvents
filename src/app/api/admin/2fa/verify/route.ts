import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enforceSameOrigin, getClientIp, rateLimit, safeEqual, sha256 } from '@/lib/security'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type VerifyBody = {
  code?: string
}

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const { code } = (await request.json()) as VerifyBody
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitError = rateLimit(`admin-2fa-verify:${user.id}:${getClientIp(request)}`, {
      limit: 8,
      windowMs: 10 * 60 * 1000,
    })
    if (rateLimitError) return rateLimitError

    const admin = createAdminClient()
    const { data: record, error } = await admin
      .from('admin_2fa_codes')
      .select('id, code, attempts, expires_at')
      .eq('user_id', user.id)
      .single()

    if (error || !record) {
      const cookieStore = await cookies()
      const cookieRecord = cookieStore.get('ae_admin_2fa_code')?.value
      const [cookieUserId, cookieCodeHash, cookieExpiresAt, cookieAttempts = '0'] = (cookieRecord || '').split('|')

      if (cookieUserId !== user.id || !cookieCodeHash || !cookieExpiresAt) {
        return NextResponse.json({ error: 'Verification code not found.' }, { status: 404 })
      }

      const attempts = Number(cookieAttempts)
      if (attempts >= 3) {
        return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 })
      }

      if (new Date(cookieExpiresAt).getTime() < Date.now()) {
        return NextResponse.json({ error: 'Verification code expired.' }, { status: 400 })
      }

      if (!safeEqual(cookieCodeHash, sha256(`${user.id}:${code}`))) {
        cookieStore.set('ae_admin_2fa_code', `${user.id}|${cookieCodeHash}|${cookieExpiresAt}|${attempts + 1}`, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 10 * 60,
          path: '/',
        })
        return NextResponse.json({ error: 'Invalid code.' }, { status: 400 })
      }

      cookieStore.delete('ae_admin_2fa_code')
      cookieStore.set('ae_admin_2fa', 'verified', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 8,
        path: '/',
      })

      return NextResponse.json({ success: true })
    }

    if (record.attempts >= 3) {
      return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 })
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Verification code expired.' }, { status: 400 })
    }

    if (!safeEqual(record.code, sha256(`${user.id}:${code}`))) {
      await admin
        .from('admin_2fa_codes')
        .update({ attempts: record.attempts + 1 })
        .eq('id', record.id)

      return NextResponse.json({ error: 'Invalid code.' }, { status: 400 })
    }

    await admin.from('admin_2fa_codes').delete().eq('id', record.id)
    const cookieStore = await cookies()
    cookieStore.set('ae_admin_2fa', 'verified', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed.' },
      { status: 500 }
    )
  }
}

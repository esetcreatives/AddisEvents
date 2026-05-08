import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { enforceSameOrigin, getClientIp, rateLimit } from '@/lib/security'

type AccessRecord = {
  users?: { email?: string | null } | Array<{ email?: string | null }> | null
}

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_STAFF_PIN_LOGIN !== 'true') {
      return NextResponse.json(
        { error: 'Staff PIN login is disabled in production. Use email and password.' },
        { status: 403 }
      )
    }

    const rateLimitError = rateLimit(`pin-login:${getClientIp(request)}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    })
    if (rateLimitError) return rateLimitError

    const { pin } = await request.json()

    if (!pin || !/^\d{4,8}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const adminSupabase = createAdminClient()

    // Find the event_access record with this PIN
    const { data: accessRecord, error } = await adminSupabase
      .from('event_access')
      .select('user_id, role, users(email)')
      .eq('pin_code', pin)
      .eq('role', 'staff')
      .single()

    if (error || !accessRecord) {
      return NextResponse.json({ error: 'Invalid PIN code' }, { status: 401 })
    }

    // Now we need to create a session for this user.
    // In a real app we might exchange the pin for a custom JWT, or use OTP.
    // For this prototype, we'll generate an admin JWT for the user or use a magic link approach.
    // Since we don't have their password, the simplest way is to issue a custom token or 
    // update a secure token table, but Supabase auth doesn't easily let us "assume" a user 
    // without password or OTP. 
    
    // Instead, since it's a prototype, let's use the Admin API to get an email OTP
    // or just mock the login by setting a custom cookie that middleware respects.
    // A better approach: generate a magic link and instantly verify it.
    
    const relatedUsers = (accessRecord as AccessRecord).users
    const staffEmail = Array.isArray(relatedUsers) ? relatedUsers[0]?.email : relatedUsers?.email
    if (!staffEmail) {
      return NextResponse.json({ error: 'Staff account email not found' }, { status: 500 })
    }

    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: staffEmail,
    })

    if (linkError) {
       return NextResponse.json({ error: 'Failed to generate auth token' }, { status: 500 })
    }

    // Now we extract the token hash from the generated link to verify it directly
    const url = new URL(linkData.properties.action_link)
    const tokenHash = url.searchParams.get('token_hash')
    
    if (!tokenHash) {
         return NextResponse.json({ error: 'Token generation failed' }, { status: 500 })
    }

    // Now instantiate a regular client and verify the OTP
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'email',
    })

    if (authError) {
         return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: authData.user })

  } catch (error) {
    console.error("PIN Login Error", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

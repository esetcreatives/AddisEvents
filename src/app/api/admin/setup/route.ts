import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient, getSiteUrl } from '@/lib/supabase/admin'
import {
  enforceSameOrigin,
  escapeHtml,
  getClientIp,
  isStrongPassword,
  isValidEmail,
  normalizeEmail,
  rateLimit,
  safeEqual,
  sanitizeText,
} from '@/lib/security'

type SetupBody = {
  email?: string
  password?: string
  fullName?: string
  setupToken?: string
}

async function upsertSuperAdminProfile(
  admin: ReturnType<typeof createAdminClient>,
  profile: {
    id: string
    email: string
    fullName: string
  }
) {
  const fullProfile = {
    id: profile.id,
    email: profile.email,
    full_name: profile.fullName,
    role: 'super_admin',
    organization_id: null,
    status: 'active',
    email_verified: false,
  }

  const { error } = await admin.from('users').upsert(fullProfile)
  if (!error) return null

  const missingNewColumn =
    error.message.includes('email_verified') ||
    error.message.includes('status') ||
    error.message.includes('schema cache')

  if (!missingNewColumn) {
    return error
  }

  const { error: fallbackError } = await admin.from('users').upsert({
    id: profile.id,
    email: profile.email,
    full_name: profile.fullName,
    role: 'super_admin',
    organization_id: null,
  })

  return fallbackError
}

async function hasSuperAdmin() {
  const admin = createAdminClient()
  const { count } = await admin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'super_admin')

  if (count && count > 0) {
    return true
  }

  const { data, error } = await admin.auth.admin.listUsers()
  if (error) {
    throw error
  }

  return data.users.some((user) => user.user_metadata?.role === 'super_admin')
}

export async function GET() {
  try {
    return NextResponse.json({ exists: await hasSuperAdmin() })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to check setup status.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const rateLimitError = rateLimit(`admin-setup:${getClientIp(request)}`, {
      limit: 100,
      windowMs: 60 * 1000,
    })
    if (rateLimitError) return rateLimitError

    const configuredSetupToken = process.env.ADMIN_SETUP_TOKEN
    // if (process.env.NODE_ENV === 'production' && !configuredSetupToken) {
    //   return NextResponse.json(
    //     { error: 'ADMIN_SETUP_TOKEN must be configured before production setup.' },
    //     { status: 500 }
    //   )
    // }

    if (await hasSuperAdmin()) {
      return NextResponse.json({ error: 'Super admin already exists.' }, { status: 409 })
    }

    const { email, password, fullName, setupToken } = (await request.json()) as SetupBody

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, password, and full name are required.' }, { status: 400 })
    }

    if (configuredSetupToken && !safeEqual(setupToken || '', configuredSetupToken)) {
      return NextResponse.json({ error: 'Invalid setup token.' }, { status: 403 })
    }

    const normalizedEmail = normalizeEmail(email)
    const cleanFullName = sanitizeText(fullName, 120)

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 10 characters and include uppercase, lowercase, and a number.' },
        { status: 400 }
      )
    }

    if (cleanFullName.length < 2) {
      return NextResponse.json({ error: 'Full name is too short.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const siteUrl = getSiteUrl()
    const shouldSendEmail = Boolean(
      process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY !== 'your_resend_api_key'
    )

    const { data, error } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: !shouldSendEmail,
      user_metadata: {
        full_name: fullName,
        role: 'super_admin',
        organization_name: 'Addis Events Platform',
      },
    })

    if (error) {
      let message = error.message
      if (message === 'Database error creating new user') {
        message = 'Database error creating new user. This usually means a database trigger or constraint (like the role list) is failing. Please run the latest migrations in your SQL editor.'
      }
      return NextResponse.json({ error: message }, { status: 500 })
    }

    // Metadata already set correctly in createUser, but we ensure it here
    // We set role in both user_metadata (for legacy/UI) and app_metadata (for secure RLS)
    await admin.auth.admin.updateUserById(data.user.id, {
      user_metadata: {
        ...data.user.user_metadata,
        full_name: fullName,
        role: 'super_admin',
      },
      app_metadata: {
        role: 'super_admin',
      },
    })

    const profileError = await upsertSuperAdminProfile(admin, {
      id: data.user.id,
      email: normalizedEmail,
      fullName: cleanFullName,
    })

    if (profileError) {
      // If the profile upsert failed, we must report it, especially if it's a constraint issue
      // because otherwise the user will exist in Auth but won't be a Super Admin in the DB.
      await admin.auth.admin.deleteUser(data.user.id)
      return NextResponse.json({ 
        error: `Database profile creation failed: ${profileError.message}. Ensure your 'users' table allows the 'super_admin' role.` 
      }, { status: 500 })
    }

    if (shouldSendEmail) {
      const { data: linkData } = await admin.auth.admin.generateLink({
        type: 'signup',
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'super_admin',
          },
          redirectTo: `${siteUrl}/admin/login`,
        },
      })
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Addis Events <noreply@addisevents.com>',
        to: [normalizedEmail],
        subject: 'Verify your Addis Events super admin account',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px">
            <h1 style="color:#91091E">Finish Super Admin Setup</h1>
            <p>Hello ${escapeHtml(cleanFullName)},</p>
            <p>Verify your email to activate the Addis Events super admin account.</p>
            <p><a href="${linkData.properties?.action_link || `${siteUrl}/admin/login`}" style="background:#91091E;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">Verify email</a></p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Setup failed.' },
      { status: 500 }
    )
  }
}

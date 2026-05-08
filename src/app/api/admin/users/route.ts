import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, getSiteUrl } from '@/lib/supabase/admin'
import { requireHQAccess, requireSuperAdmin } from '@/lib/auth-guard'
import {
  enforceSameOrigin,
  escapeHtml,
  isValidEmail,
  normalizeEmail,
  sanitizeText,
  secureToken,
} from '@/lib/security'

type CreateUserBody = {
  email?: string
  fullName?: string
  phone?: string
  role?: 'organizer' | 'client' | 'staff' | 'super_admin' | 'manager'
  organizationId?: string
  password?: string
}

export async function GET() {
  const auth = await requireHQAccess()
  if (auth.error) return auth.error

  // Only return platform users — admins are managed separately via /api/admin/admins
  const { data, error } = await auth.admin
    .from('users')
    .select('id, full_name, email, phone, role, status, organization_id, organizations(name), created_at')
    .not('role', 'in', '("super_admin","manager")')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data || [] })
}

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request)
    if (originError) return originError

    const auth = await requireHQAccess()
    if (auth.error) return auth.error
    const admin = auth.admin

    const { email, fullName, phone, role, organizationId, password } = (await request.json()) as CreateUserBody
    
    // Basic validation
    if (!email || !fullName || !role) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    // Role-based security: Only super_admin can create super_admin or manager
    if ((role === 'super_admin' || role === 'manager') && auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can create other admins.' }, { status: 403 })
    }

    const normalizedEmail = normalizeEmail(email)
    const cleanFullName = sanitizeText(fullName, 120)
    const cleanPhone = phone ? sanitizeText(phone, 30) : null

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    // Create or use temporary password
    const temporaryPassword = password && password.trim().length >= 6 
      ? password.trim() 
      : `${secureToken().slice(0, 10)}A1!`
    
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: cleanFullName,
        role,
        organization_id: organizationId || null,
        must_change_password: true,
      },
      app_metadata: {
        role,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // 2. Create/Update profile in public.users
    // We use upsert because a DB trigger might have already created a basic profile
    const { error: profileError } = await admin.from('users').upsert({
      id: authData.user.id,
      email: normalizedEmail,
      full_name: cleanFullName,
      phone: cleanPhone,
      role,
      organization_id: organizationId || null,
      status: 'active',
      must_change_password: true,
      email_verified: true,
    }, { onConflict: 'id' })

    if (profileError) {
      // Rollback auth user if profile creation fails and it was a new user
      // Note: In an upsert scenario, we might not want to delete if it already existed, 
      // but here authData.user is definitely new from step 1.
      await admin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // 3. Send welcome email with temporary password
    const resendApiKey = process.env.RESEND_API_KEY
    const hasResend = resendApiKey && resendApiKey !== 'your_resend_api_key'
    
    if (hasResend) {
      try {
        const resend = new Resend(resendApiKey)
        const loginPath = role === 'client' ? '/portal/login' : '/login'
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Addis Events <noreply@addisevents.com>',
          to: [normalizedEmail],
          subject: 'Welcome to Addis Events - Your Account is Ready',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h1 style="color: #91091E; text-align: center;">Addis Events</h1>
              <p>Hello <strong>${escapeHtml(cleanFullName)}</strong>,</p>
              <p>An account has been created for you on the Addis Events Management platform with the role of <strong>${role}</strong>.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="${getSiteUrl()}${loginPath}">${getSiteUrl()}${loginPath}</a></p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${escapeHtml(normalizedEmail)}</p>
                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #eee; padding: 2px 5px; border-radius: 3px;">${escapeHtml(temporaryPassword)}</code></p>
              </div>
              <p style="color: #666; font-size: 0.9em;">For security reasons, you will be required to change this password upon your first login.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="text-align: center; color: #999; font-size: 0.8em;">&copy; ${new Date().getFullYear()} Addis Events. All rights reserved.</p>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('Failed to send welcome email:', emailErr)
        // We don't fail the whole request because the user is created, but we should inform the admin
        return NextResponse.json({ 
          success: true, 
          warning: 'User created but welcome email failed. Please provide the temporary password manually.',
          tempPassword: temporaryPassword 
        })
      }
    }

    return NextResponse.json({ success: true, tempPassword: !hasResend ? temporaryPassword : null })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create user.' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { onboardingType } = await request.json()

  if (onboardingType === 'password_change') {
    const admin = createAdminClient()
    
    // Update both metadata and database table
    await Promise.all([
      admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, must_change_password: false }
      }),
      admin.from('users').update({ must_change_password: false }).eq('id', user.id)
    ])

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid onboarding type' }, { status: 400 })
}

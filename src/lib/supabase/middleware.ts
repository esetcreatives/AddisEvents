import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip Supabase session management if env vars are not configured
  if (!supabaseUrl || !supabaseKey) {
    return withSecurityHeaders(supabaseResponse)
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const mustChangePassword = user?.user_metadata?.must_change_password === true

  const path = request.nextUrl.pathname

  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/reset-password',
    '/admin/setup',
    '/admin/login',
    '/portal/login',
    '/portal/accept-invite',
    '/staff/login',
  ]

  const isPublicRoute =
    publicRoutes.includes(path) ||
    path.startsWith('/rsvp') ||
    path.startsWith('/e/') ||
    path.startsWith('/api/admin/setup') ||
    path.startsWith('/api/portal/accept-invite')

  // Enforce password change if flag is set
  if (user && mustChangePassword && path !== '/change-password' && !path.startsWith('/api/auth/complete-onboarding')) {
    return NextResponse.redirect(new URL('/change-password', request.url))
  }

  // Public routes that don't need auth checks here
  if (isPublicRoute) {
    return withSecurityHeaders(supabaseResponse)
  }

  // Define adminClient once for all authorized route checks
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Server auth is not configured.' },
      { status: 500 }
    )
  }

  const adminClient = createAdminClient(
    supabaseUrl,
    serviceRoleKey
  )

  // Super Admin routes
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    if (!user) {
      return authFailure(request, 401, '/admin/login', 'Unauthorized')
    }
    
    const { data: dbUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const isSuperAdmin = dbUser?.role === 'super_admin' || user.app_metadata?.role === 'super_admin' || user.user_metadata?.role === 'super_admin'
    const isManager = dbUser?.role === 'manager' || user.app_metadata?.role === 'manager' || user.user_metadata?.role === 'manager'

    if (!isSuperAdmin && !isManager) {
      return authFailure(request, 403, '/unauthorized', 'Forbidden')
    }

    const isTwoFactorRoute = path.startsWith('/admin/verify-2fa') || path.startsWith('/api/admin/2fa')
    const verified2fa = request.cookies.get('ae_admin_2fa')?.value === 'verified'
    if (!isTwoFactorRoute && !verified2fa) {
      return authFailure(request, 401, '/admin/verify-2fa', 'Two-factor verification required')
    }
  }

  // Role-based route protection for Organizer
  if (path.startsWith('/dashboard')) {
    if (!user) {
      return authFailure(request, 401, '/login', 'Unauthorized')
    }
    
    const { data: dbUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (dbUser?.role !== 'organizer') {
      return authFailure(request, 403, '/unauthorized', 'Forbidden')
    }
  }

  // Client portal routes
  if (path.startsWith('/portal')) {
    if (!user) {
      return authFailure(request, 401, '/portal/login', 'Unauthorized')
    }
    
    const { data: dbUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (dbUser?.role !== 'client') {
      return authFailure(request, 403, '/unauthorized', 'Forbidden')
    }
  }

  // Staff portal routes
  if (path.startsWith('/staff')) {
    if (!user) {
      return authFailure(request, 401, '/login', 'Unauthorized')
    }
    
    const { data: dbUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (dbUser?.role !== 'staff' && dbUser?.role !== 'organizer') {
      return authFailure(request, 403, '/unauthorized', 'Forbidden')
    }
  }

  if (path.startsWith('/checkin')) {
    if (!user) {
      return authFailure(request, 401, '/login', 'Unauthorized')
    }
    
    const { data: dbUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (dbUser?.role !== 'staff' && dbUser?.role !== 'organizer') {
      return authFailure(request, 403, '/unauthorized', 'Forbidden')
    }
    
    // Additional check: staff can only access their assigned event
    if (dbUser?.role === 'staff') {
      const eventId = path.split('/')[2]
      if (eventId) {
        const { data: access } = await adminClient
          .from('event_access')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', eventId)
          .eq('role', 'staff')
          .single()
        
        if (!access) {
          return authFailure(request, 403, '/unauthorized', 'Forbidden')
        }
      }
    }
  }

  // Redirect logged-in users away from auth pages
  if (user && (path === '/login' || path === '/signup' || path === '/staff/login' || path === '/portal/login' || path === '/admin/login')) {
    const { data: dbUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (dbUser?.role === 'client') {
      return NextResponse.redirect(new URL('/portal', request.url))
    } else if (dbUser?.role === 'staff') {
      return NextResponse.redirect(new URL('/staff', request.url))
    } else if (dbUser?.role === 'super_admin' || dbUser?.role === 'manager') {
      return NextResponse.redirect(new URL('/admin', request.url))
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }



  return withSecurityHeaders(supabaseResponse)
}

function authFailure(request: NextRequest, status: 401 | 403, redirectPath: string, message: string) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: message }, { status })
  }

  return NextResponse.redirect(new URL(redirectPath, request.url))
}

function withSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  return response
}

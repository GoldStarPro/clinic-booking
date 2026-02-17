import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Add security headers
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Refresh session if expired
  await supabase.auth.getSession()

  // Get the current path
  const path = req.nextUrl.pathname

  // List of public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/']

  // If the current path is public, allow access
  if (publicPaths.includes(path)) {
    return res
  }

  // If user is not signed in and trying to access a protected route
  // redirect to login
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and trying to access login/register
  // redirect to appropriate dashboard based on role
  if (session && publicPaths.includes(path)) {
    const { data: userData } = await supabase
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const redirectUrl = req.nextUrl.clone()
    
    if (userData?.role === 'ADMIN') {
      redirectUrl.pathname = '/admin/dashboard'
    } else if (userData?.role === 'DOCTOR') {
      redirectUrl.pathname = '/doctor/dashboard'
    } else if (userData?.role === 'PATIENT') {
      redirectUrl.pathname = '/patient/dashboard'
    } else {
      redirectUrl.pathname = '/login'
    }
    
    return NextResponse.redirect(redirectUrl)
  }

  // Check user role for role-specific routes
  const { data: userData } = await supabase
    .from('User')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (path.startsWith('/admin') && userData?.role !== 'ADMIN') {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  if (path.startsWith('/doctor') && userData?.role !== 'DOCTOR') {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  if (path.startsWith('/patient') && userData?.role !== 'PATIENT') {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Only apply to API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    // Add restricted CORS headers (more secure than '*')
    const origin = req.headers.get('origin')
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.NEXT_PUBLIC_APP_URL
    ].filter(Boolean)
    
    if (origin && allowedOrigins.includes(origin)) {
      res.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.headers.set('Access-Control-Max-Age', '86400')
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: res.headers })
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 
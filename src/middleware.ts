import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Security headers on every matched request
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Refresh the Auth session cookie if it is expired
  await supabase.auth.getSession()

  const path = req.nextUrl.pathname
  // Landing page is public; login/register are public but redirect if already signed in
  const marketingPaths = ['/']
  const authPaths = ['/login', '/register']
  const publicPaths = [...marketingPaths, ...authPaths]

  const { data: { session } } = await supabase.auth.getSession()

  // Signed-in users hitting /login or /register go to their role dashboard
  if (session && authPaths.includes(path)) {
    const { data: userData } = await supabase
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const redirectUrl = req.nextUrl.clone()
    if (userData?.role === 'ADMIN') redirectUrl.pathname = '/admin/dashboard'
    else if (userData?.role === 'DOCTOR') redirectUrl.pathname = '/doctor/dashboard'
    else if (userData?.role === 'PATIENT') redirectUrl.pathname = '/patient/dashboard'
    else redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  if (publicPaths.includes(path)) {
    return res
  }

  // Protected routes require a session
  if (!session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Role gates: /admin, /doctor, /patient
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

  // Restrict CORS on API routes (no wildcard origin)
  if (req.nextUrl.pathname.startsWith('/api')) {
    const origin = req.headers.get('origin')
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean)

    if (origin && allowedOrigins.includes(origin)) {
      res.headers.set('Access-Control-Allow-Origin', origin)
    }

    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.headers.set('Access-Control-Max-Age', '86400')

    // Preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: res.headers })
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

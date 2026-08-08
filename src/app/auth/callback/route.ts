import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // Supabase Auth callback: exchange the PKCE/code for a session cookie
  if (code) {
    console.log('Auth callback: exchanging code for session')
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
    console.log('Auth callback: session established')
  } else {
    console.log('Auth callback: no code in query, skipping exchange')
  }

  // After sign-in, send the user to login so middleware can route by role
  return NextResponse.redirect(new URL('/login', request.url))
} 
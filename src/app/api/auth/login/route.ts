import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIP, isValidEmail, sanitizeString } from '@/lib/security'
import { createSupabaseRouteClient } from '@/lib/supabase-route'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Rate limiting — stricter for login attempts
    const clientIP = getClientIP(request.headers)
    if (checkRateLimit(`login-${clientIP}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    console.log('Login request received')
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      console.error('Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      console.error('Invalid email format:', email)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const sanitizedEmail = sanitizeString(email).toLowerCase().trim()
    const supabase = await createSupabaseRouteClient()

    console.log('Attempting to sign in with Supabase:', sanitizedEmail)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    })

    if (error) {
      console.error('Auth error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!data.user) {
      console.error('No user data returned from Supabase')
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    console.log('Auth successful, user id:', data.user.id)

    // Load the matching public.User profile (same id as auth.users)
    console.log('Getting user profile from database')
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError) {
      console.error('Error getting user profile:', userError)
      return NextResponse.json(
        { error: 'Failed to get user profile' },
        { status: 500 }
      )
    }

    // First login after Auth signup may not have a User row yet — create one
    if (!userData) {
      console.log('User not found, creating new profile')
      try {
        const { data: newUser, error: createError } = await supabase
          .from('User')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || '',
              phone: data.user.user_metadata?.phone || '',
              address: data.user.user_metadata?.address || '',
              role: data.user.user_metadata?.role || 'PATIENT',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ])
          .select()
          .single()

        if (createError) {
          console.error('Error creating user profile:', createError)
          return NextResponse.json(
            { error: 'Failed to create user profile' },
            { status: 500 }
          )
        }

        console.log('New user profile created:', newUser.id)
        return NextResponse.json({
          user: newUser,
          isNewUser: true
        })
      } catch (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }
    }

    console.log('User found in database:', userData.id, userData.role)

    console.log('Checking user appointments')
    const { data: appointments, error: appointmentsError } = await supabase
      .from('Appointment')
      .select('*')
      .eq('patientId', userData.id)

    if (appointmentsError) {
      console.error('Error getting appointments:', appointmentsError)
      return NextResponse.json(
        { error: 'Failed to get appointments' },
        { status: 500 }
      )
    }

    console.log('Login complete, appointment count:', appointments.length)
    return NextResponse.json({
      user: userData,
      hasAppointments: appointments.length > 0
    })
  } catch (error: unknown) {
    console.error('Login error:', error)
    const message = error instanceof Error ? error.message : 'Failed to login'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

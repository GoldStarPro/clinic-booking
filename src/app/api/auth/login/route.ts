import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    console.log('Login request received')
    const body = await request.json()
    console.log('Request body:', body)
    
    const { email, password } = body

    if (!email || !password) {
      console.error('Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Sign in with Supabase Auth
    console.log('Attempting to sign in with Supabase')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
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

    console.log('Auth successful, user data:', data.user)

    // Get user profile from database
    console.log('Getting user profile from database')
    const { data: userData, error: userError } = await supabase
      .from('users')
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

    if (!userData) {
      console.log('User not found, creating new profile')
      try {
        // Create new user profile
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || '',
              phone: data.user.user_metadata?.phone || '',
              address: data.user.user_metadata?.address || '',
              role: data.user.user_metadata?.role || 'PATIENT'
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

        console.log('New user created:', newUser)
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

    console.log('User found in database:', userData)

    // Check if user has appointments
    console.log('Checking user appointments')
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('patientId', userData.id)

    if (appointmentsError) {
      console.error('Error getting appointments:', appointmentsError)
      return NextResponse.json(
        { error: 'Failed to get appointments' },
        { status: 500 }
      )
    }

    console.log('User appointments:', appointments)
    return NextResponse.json({ 
      user: userData,
      hasAppointments: appointments.length > 0
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to login' },
      { status: 500 }
    )
  }
} 
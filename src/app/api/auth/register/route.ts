import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { checkRateLimit, getClientIP, validateRegistrationData } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Rate limiting - stricter for registration
    const clientIP = getClientIP(request.headers)
    if (checkRateLimit(`register-${clientIP}`, 5, 300000)) { // 5 requests per 5 minutes
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    console.log('Register request received')
    const body = await request.json()
    
    // Validate and sanitize input
    const validation = validateRegistrationData(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const { email, password, name, phone, address } = validation.sanitized!

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Sign up with Supabase Auth
    console.log('Attempting to sign up with Supabase')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          address,
          role: 'PATIENT'
        }
      }
    })

    if (error) {
      console.error('Auth error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      console.error('No user data returned from Supabase')
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 400 }
      )
    }

    console.log('Auth successful, user data:', data.user)

    // Create user profile in database using Supabase client
    console.log('Creating user profile in database')
    try {
      const { data: userData, error: insertError } = await supabase
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

      if (insertError) {
        console.error('Error creating user profile:', insertError)
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }

      console.log('User profile created:', userData)
      return NextResponse.json({ 
        user: userData,
        message: 'Registration successful'
      })
    } catch (createError) {
      console.error('Error creating user profile:', createError)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to register' },
      { status: 500 }
    )
  }
} 
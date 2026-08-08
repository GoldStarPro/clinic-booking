import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { checkRateLimit, getClientIP, validateAppointmentData } from '@/lib/security'

// List appointments for the signed-in patient or doctor
export async function GET(request: Request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request.headers)
    if (checkRateLimit(clientIP, 100, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch appointments for the current user
    const { data: appointments, error } = await supabase
      .from('Appointment')
      .select(`
        *,
        doctor:User!Appointment_doctorId_fkey (
          id,
          name,
          specialty,
          description,
          image
        )
      `)
      .or(`patientId.eq.${user.id},doctorId.eq.${user.id}`)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      )
    }

    console.log('Fetched appointments for user:', user.id, 'count:', appointments?.length ?? 0)
    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

// Create a new appointment for the signed-in patient

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request.headers)
    if (checkRateLimit(clientIP, 50, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate and sanitize input
    const validation = validateAppointmentData(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const { doctorId, date, time, symptoms, notes } = validation.sanitized!

    // Create new appointment
    const { data: appointment, error } = await supabase
      .from('Appointment')
      .insert([
        {
          patientId: user.id,
          doctorId,
          date: new Date(date).toISOString(),
          time,
          symptoms,
          notes,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ])
      .select(`
        *,
        doctor:User!Appointment_doctorId_fkey (
          id,
          name,
          specialty,
          description,
          image
        )
      `)
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      )
    }

    console.log('Appointment created:', appointment?.id, 'patient:', user.id, 'doctor:', doctorId)
    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
} 
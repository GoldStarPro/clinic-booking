import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIP, isValidUUID } from '@/lib/security'
import { createSupabaseRouteClient } from '@/lib/supabase-route'

// Patient updates their own appointment status (e.g. cancel)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Rate limiting
    const clientIP = getClientIP(request.headers)
    if (checkRateLimit(clientIP, 50, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate appointment ID
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseRouteClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body
    
    // Validate status value
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Verify the appointment belongs to the current user
    const { data: appointment, error: fetchError } = await supabase
      .from('Appointment')
      .select('*')
      .eq('id', id)
      .eq('patientId', user.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Update appointment status
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('Appointment')
      .update({
        status,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
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

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      )
    }

    console.log('Appointment status updated:', id, '->', status)
    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
} 
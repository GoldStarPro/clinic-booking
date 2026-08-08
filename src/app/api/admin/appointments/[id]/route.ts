import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabase-route'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('Starting delete process for appointment:', id)

    const supabase = await createSupabaseRouteClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('Auth error:', userError)
      return NextResponse.json({ error: 'Auth error' }, { status: 401 })
    }

    if (!user) {
      console.error('No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Only ADMIN may delete any appointment
    const { data: userData, error: roleError } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError) {
      console.error('Role check error:', roleError)
      return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 })
    }

    if (!userData || userData.role !== 'ADMIN') {
      console.error('User is not admin:', userData)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User is admin, proceeding with deletion')

    const { error: checkError } = await supabase
      .from('Appointment')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError) {
      console.error('Error checking appointment:', checkError)
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    console.log('Appointment exists, deleting:', id)

    const { data: deletedAppointment, error: deleteError } = await supabase
      .from('Appointment')
      .delete()
      .eq('id', id)
      .select()

    if (deleteError) {
      console.error('Error deleting appointment:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete appointment' },
        { status: 500 }
      )
    }

    console.log('Appointment deleted successfully:', id)
    return NextResponse.json({ success: true, deletedAppointment })
  } catch (error) {
    console.error('Error in delete process:', error)
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    )
  }
}

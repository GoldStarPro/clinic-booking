'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { formatDateDisplay } from '@/lib/date-utils'

interface Doctor {
  id: string
  name: string
  specialty: string
  description?: string
  image?: string
}

interface Appointment {
  id: string
  date: string
  time: string
  status: string
  symptoms: string
  notes?: string
  doctorId: string
  doctor: Doctor
  createdAt: string
  updatedAt: string
}

export default function MyAppointments() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Unauthorized')
      }

      const { data, error } = await supabase
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
        throw new Error('Failed to fetch appointments')
      }

      setAppointments(data || [])
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      setLoading(true)
      setError('')

      const { error } = await supabase
        .from('Appointment')
        .update({ 
          status: 'CANCELLED',
          updatedAt: new Date().toISOString()
        })
        .eq('id', appointmentId)

      if (error) {
        console.error('Error cancelling appointment:', error)
        throw new Error('Failed to cancel appointment')
      }

      // Refresh appointments list
      await fetchAppointments()
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to cancel appointment')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return formatDateDisplay(dateString)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">My Appointments</h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={() => router.push('/book-appointment')}
              className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Book Appointment
            </button>
            <button
              onClick={() => router.push('/patient/dashboard')}
              className="w-full sm:w-auto bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You have no appointments scheduled.</p>
            <button
              onClick={() => router.push('/book-appointment')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Book an Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">
                      Dr. {appointment.doctor.name}
                    </h2>
                    <p className="text-gray-600 mb-1">
                      {appointment.doctor.specialty}
                    </p>
                    <p className="text-gray-600 mb-1">
                      {formatDate(appointment.date)} at {appointment.time}
                    </p>
                    <p className="text-gray-600 mb-1">
                      Status: <span className="font-medium">{appointment.status}</span>
                    </p>
                    {appointment.symptoms && (
                      <p className="text-gray-600 mb-1">
                        Symptoms: {appointment.symptoms}
                      </p>
                    )}
                    {appointment.notes && (
                      <p className="text-gray-600">
                        Notes: {appointment.notes}
                      </p>
                    )}
                  </div>
                  {appointment.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
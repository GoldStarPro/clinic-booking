'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { HeroSection } from '@/components/HeroSection'
import { StatsCard } from '@/components/StatsCard'
import { AppointmentCard } from '@/components/AppointmentCard'
import { AppointmentDetailModal } from '@/components/AppointmentDetailModal'

interface Doctor {
  name: string
  specialty: string
}

interface Appointment {
  id: string
  doctorId: string
  date: string
  time: string
  status: string
  symptoms: string | null
  notes: string | null
  doctor: Doctor
}

export default function PatientDashboard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    checkUserRole()
  }, [])

  useEffect(() => {
    if (userRole === 'PATIENT') {
      fetchAppointments()
    }
  }, [userRole])

  const checkUserRole = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data: userData, error: roleError } = await supabase
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single()

      if (roleError || !userData) {
        throw new Error('Failed to get user role')
      }

      if (userData.role !== 'PATIENT') {
        router.push('/login')
        return
      }

      setUserRole(userData.role)
    } catch (error) {
      console.error('Error checking user role:', error)
      router.push('/login')
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('Appointment')
        .select(`
          id,
          doctorId,
          date,
          time,
          status,
          symptoms,
          notes,
          doctor:User!Appointment_doctorId_fkey (
            name,
            specialty
          )
        `)
        .eq('patientId', user?.id)
        .order('date', { ascending: true })

      if (error) {
        throw new Error('Failed to fetch appointments')
      }

      const transformedData: Appointment[] = data?.map(appointment => {
        // Get the first doctor from the array if it exists
        const doctorData = Array.isArray(appointment.doctor) ? appointment.doctor[0] : appointment.doctor
        
        return {
          ...appointment,
          doctor: {
            name: doctorData?.name || 'Unknown',
            specialty: doctorData?.specialty || 'Unknown'
          }
        }
      }) || []

      setAppointments(transformedData)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsModalOpen(true)
  }

  if (userRole !== 'PATIENT') {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header with Logout Button */}
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Hero Section */}
      <HeroSection
        title="Welcome to Our Clinic"
        subtitle="We provide high-quality healthcare services with our professional medical team"
        imageUrl="/images/clinic-hero.jpg"
        role="patient"
        actions={[
          {
            label: "Book Appointment",
            href: "/book-appointment",
            className: "bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          },
          {
            label: "View History",
            href: "/my-appointments",
            className: "bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          }
        ]}
      />

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatsCard
          title="Upcoming Appointments"
          value={appointments.filter(a => 
            (a.status === 'CONFIRMED' || a.status === 'PENDING') && 
            new Date(a.date) >= new Date()
          ).length.toString()}
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          trend={{ value: 10, isPositive: true }}
          onClick={() => router.push('/my-appointments')}
        />
        <StatsCard
          title="Appointment History"
          value={appointments.filter(a => a.status === 'COMPLETED').length.toString()}
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
          onClick={() => router.push('/my-appointments')}
        />
        <StatsCard
          title="Loyalty Points"
          value="150"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Appointments Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">All Appointments</h2>
        {loading ? (
          <div className="text-center py-8">Loading appointments...</div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have any appointments yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                patientName="You"
                doctorName={appointment.doctor.name}
                date={new Date(appointment.date).toLocaleDateString()}
                time={appointment.time}
                status={appointment.status.toLowerCase() as "pending" | "confirmed" | "completed" | "cancelled"}
                actionLabel="View Details"
                onAction={() => handleViewDetails(appointment)}
                showViewDetails={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          appointment={{
            patientName: "You",
            date: new Date(selectedAppointment.date).toLocaleDateString(),
            time: selectedAppointment.time,
            status: selectedAppointment.status.toLowerCase() as "pending" | "confirmed" | "completed" | "cancelled",
            symptoms: selectedAppointment.symptoms || 'No symptoms provided',
            notes: selectedAppointment.notes || 'No notes available'
          }}
        />
      )}
    </div>
  )
} 
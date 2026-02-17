'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { HeroSection } from '@/components/HeroSection'
import { StatsCard } from '@/components/StatsCard'
import { AppointmentCard } from '@/components/AppointmentCard'
import { AppointmentDetailModal } from '@/components/AppointmentDetailModal'
import { useTheme } from '@/components/ThemeProvider'
import { formatDateDisplay } from '@/lib/date-utils'

interface Patient {
  name: string
  email: string
}

interface Appointment {
  id: string
  patientId: string
  date: string
  time: string
  status: string
  symptoms: string | null
  notes: string | null
  patient: Patient
}

export default function DoctorDashboard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { colors } = useTheme()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterType, setFilterType] = useState('ALL') // ALL, TODAY, WEEK, MONTH
  const [filterStatus, setFilterStatus] = useState('ALL') // ALL, PENDING, CONFIRMED, CANCELLED, COMPLETED

  useEffect(() => {
    checkUserRole()
  }, [])

  useEffect(() => {
    if (userRole === 'DOCTOR') {
      fetchAppointments()
    }
  }, [userRole, filterType, filterStatus])

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

      if (userData.role !== 'DOCTOR') {
        router.push('/login')
        return
      }

      setUserRole(userData.role)
    } catch (error) {
      console.error('Error checking user role:', error)
      router.push('/login')
    }
  }

  const getDateRange = () => {
    const now = new Date()
    const start = new Date()
    const end = new Date()

    switch (filterType) {
      case 'TODAY':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'WEEK':
        start.setDate(now.getDate() - now.getDay())
        start.setHours(0, 0, 0, 0)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
        break
      case 'MONTH':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(end.getMonth() + 1)
        end.setDate(0)
        end.setHours(23, 59, 59, 999)
        break
      default:
        return null
    }

    return { start, end }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: { user } } = await supabase.auth.getUser()
      
      let query = supabase
        .from('Appointment')
        .select(`
          id,
          patientId,
          date,
          time,
          status,
          symptoms,
          notes,
          patient:User!Appointment_patientId_fkey (
            name,
            email
          )
        `)
        .eq('doctorId', user?.id)
        .order('date', { ascending: true })

      // Apply date filter
      const dateRange = getDateRange()
      if (dateRange) {
        query = query
          .gte('date', dateRange.start.toISOString())
          .lte('date', dateRange.end.toISOString())
      }

      // Apply status filter
      if (filterStatus !== 'ALL') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) {
        throw new Error('Failed to fetch appointments')
      }

      const transformedData: Appointment[] = data?.map(appointment => {
        const patientData = Array.isArray(appointment.patient) ? appointment.patient[0] : appointment.patient
        
        return {
          ...appointment,
          patient: {
            name: patientData?.name || 'Unknown',
            email: patientData?.email || 'Unknown'
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

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('Appointment')
        .update({ status: newStatus })
        .eq('id', appointmentId)

      if (error) {
        throw new Error('Failed to update appointment status')
      }

      // Refresh appointments after update
      fetchAppointments()
    } catch (error) {
      console.error('Error updating appointment status:', error)
      setError(error instanceof Error ? error.message : 'Failed to update appointment status')
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

  if (userRole !== 'DOCTOR') {
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
        title="Welcome to Doctor Dashboard"
        subtitle="Manage your appointments and provide quality healthcare services"
        imageUrl="/images/doctor-hero.jpg"
        role="doctor"
        actions={[
          {
            label: "View Schedule",
            href: "#",
            className: "bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          },
          {
            label: "Manage Patients",
            href: "#",
            className: "bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          }
        ]}
      />

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatsCard
          title="Today's Appointments"
          value={appointments.filter(a => 
            new Date(a.date).toDateString() === new Date().toDateString()
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
          onClick={() => {
            setFilterType('TODAY')
            setFilterStatus('ALL')
          }}
        />
        <StatsCard
          title="Total Patients"
          value={new Set(appointments.map(a => a.patientId)).size.toString()}
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
        <StatsCard
          title="Completed Appointments"
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          onClick={() => {
            setFilterType('ALL')
            setFilterStatus('COMPLETED')
          }}
        />
      </div>

      {/* Appointments Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">All Appointments</h2>
          <div className="grid grid-cols-2 gap-4">
            <select
              id="filterType"
              className="p-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: colors.background,
                borderColor: `${colors.primary}40`,
                color: colors.text,
              }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">This Week</option>
              <option value="MONTH">This Month</option>
            </select>

            <select
              id="filterStatus"
              className="p-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: colors.background,
                borderColor: `${colors.primary}40`,
                color: colors.text,
              }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

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
                patientName={appointment.patient.name}
                doctorName="You"
                date={formatDateDisplay(appointment.date)}
                time={appointment.time}
                status={appointment.status.toLowerCase() as "pending" | "confirmed" | "completed" | "cancelled"}
                actionLabel={
                  appointment.status === 'PENDING' ? 'Confirm' :
                  appointment.status === 'CONFIRMED' ? 'Mark as Completed' :
                  'View Details'
                }
                onAction={() => {
                  if (appointment.status === 'PENDING') {
                    handleStatusUpdate(appointment.id, 'CONFIRMED')
                  } else if (appointment.status === 'CONFIRMED') {
                    handleStatusUpdate(appointment.id, 'COMPLETED')
                  } else {
                    handleViewDetails(appointment)
                  }
                }}
                onViewDetails={() => handleViewDetails(appointment)}
                showViewDetails={appointment.status !== 'COMPLETED'}
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
            patientName: selectedAppointment.patient.name,
            date: formatDateDisplay(selectedAppointment.date),
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
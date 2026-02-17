'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { formatDateDisplay } from '@/lib/date-utils'

interface Patient {
  name: string
  email: string
}

interface Doctor {
  name: string
  specialty: string
}

interface Appointment {
  id: string
  patientId: string
  doctorId: string
  date: string
  time: string
  status: string
  notes: string | null
  symptoms: string | null
  createdAt: string
  updatedAt: string
  patient: Patient
  doctor: Doctor
}

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('ALL') // ALL, TODAY, WEEK, MONTH
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    checkUserRole()
  }, [])

  useEffect(() => {
    if (userRole === 'ADMIN') {
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

      if (userData.role !== 'ADMIN') {
        router.push('/dashboard')
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

      let query = supabase
        .from('Appointment')
        .select(`
          id,
          patientId,
          doctorId,
          date,
          time,
          status,
          notes,
          symptoms,
          createdAt,
          updatedAt,
          patient:User!Appointment_patientId_fkey (
            name,
            email
          ),
          doctor:User!Appointment_doctorId_fkey (
            name,
            specialty
          )
        `)
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
        console.error('Error fetching appointments:', error)
        throw new Error('Failed to fetch appointments')
      }

      // Transform the data to match our interface
      const transformedData: Appointment[] = data?.map(appointment => {
        // Handle patient data
        let patientName = 'Unknown'
        let patientEmail = 'Unknown'
        if (appointment.patient) {
          const patient = Array.isArray(appointment.patient) ? appointment.patient[0] : appointment.patient
          patientName = patient?.name || 'Unknown'
          patientEmail = patient?.email || 'Unknown'
        }

        // Handle doctor data
        let doctorName = 'Unknown'
        let doctorSpecialty = 'Unknown'
        if (appointment.doctor) {
          const doctor = Array.isArray(appointment.doctor) ? appointment.doctor[0] : appointment.doctor
          doctorName = doctor?.name || 'Unknown'
          doctorSpecialty = doctor?.specialty || 'Unknown'
        }

        return {
          ...appointment,
          patient: {
            name: patientName,
            email: patientEmail
          },
          doctor: {
            name: doctorName,
            specialty: doctorSpecialty
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

  if (userRole !== 'ADMIN') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-4">
          <Link
            href="/admin/users"
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Manage Users
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="filterType">
              Filter by Time Period
            </label>
            <select
              id="filterType"
              className="w-full p-2 border border-gray-300 rounded"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">This Week</option>
              <option value="MONTH">This Month</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2" htmlFor="filterStatus">
              Filter by Status
            </label>
            <select
              id="filterStatus"
              className="w-full p-2 border border-gray-300 rounded"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
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
          <p className="text-gray-600">No appointments found.</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symptoms</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{appointment.patient.name}</div>
                      <div className="text-sm text-gray-500">{appointment.patient.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{appointment.doctor.name}</div>
                      <div className="text-sm text-gray-500">{appointment.doctor.specialty}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDateDisplay(appointment.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="text-sm text-gray-900">{appointment.symptoms || 'N/A'}</div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="text-sm text-gray-900">{appointment.notes || 'N/A'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
} 
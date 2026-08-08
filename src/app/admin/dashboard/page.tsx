'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
  const supabase = createClientComponentClient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')

  useEffect(() => {
    fetchAppointments()
  }, [filterType, filterStatus])

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

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-indigo-100 p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2" htmlFor="filterType">
              Filter by time period
            </label>
            <select
              id="filterType"
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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
            <label className="block text-sm font-medium text-slate-600 mb-2" htmlFor="filterStatus">
              Filter by status
            </label>
            <select
              id="filterStatus"
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading appointments…</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-white/80 rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-600">No appointments found.</p>
        </div>
      ) : (
        <div className="bg-white/95 rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-indigo-50/80">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="hidden md:table-cell px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Symptoms</th>
                  <th className="hidden md:table-cell px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{appointment.patient.name}</div>
                      <div className="text-sm text-slate-500">{appointment.patient.email}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{appointment.doctor.name}</div>
                      <div className="text-sm text-slate-500">{appointment.doctor.specialty}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{formatDateDisplay(appointment.date)}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{appointment.time}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-5 py-4">
                      <div className="text-sm text-slate-700">{appointment.symptoms || 'N/A'}</div>
                    </td>
                    <td className="hidden md:table-cell px-5 py-4">
                      <div className="text-sm text-slate-700">{appointment.notes || 'N/A'}</div>
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
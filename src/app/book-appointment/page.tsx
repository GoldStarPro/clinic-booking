'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { v4 as uuidv4 } from 'uuid'

interface Doctor {
  id: string
  name: string
  specialty: string
  description?: string
  image?: string
}

export default function BookAppointment() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [minDate, setMinDate] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchDoctors()
    setMinDate(new Date().toISOString().split('T')[0])
  }, [])

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('role', 'DOCTOR')

      if (error) {
        console.error('Error fetching doctors:', error)
        throw new Error('Failed to fetch doctors')
      }

      setDoctors(data || [])
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch doctors')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting user:', userError)
        throw new Error('Unauthorized')
      }

      // Create appointment
      const { data, error } = await supabase
        .from('Appointment')
        .insert([
          {
            id: uuidv4(),
            patientId: user.id,
            doctorId: selectedDoctor,
            date: new Date(date).toISOString(),
            time,
            symptoms,
            notes,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error booking appointment:', error)
        throw new Error(error.message)
      }

      router.push('/my-appointments')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Book an Appointment</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="doctor">
              Select Doctor
            </label>
            <select
              id="doctor"
              className="w-full p-2 border border-gray-300 rounded"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              required
            >
              <option value="">Select a doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.specialty}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="date">
              Date
            </label>
            <input
              type="date"
              id="date"
              className="w-full p-2 border border-gray-300 rounded"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              min={minDate || undefined}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="time">
              Time
            </label>
            <input
              type="time"
              id="time"
              className="w-full p-2 border border-gray-300 rounded"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="symptoms">
              Symptoms
            </label>
            <textarea
              id="symptoms"
              className="w-full p-2 border border-gray-300 rounded"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="notes">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              className="w-full p-2 border border-gray-300 rounded"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional information you'd like to share with the doctor"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={loading}
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </form>
        
        <button
          onClick={() => router.push('/patient/dashboard')}
          className="w-full mt-4 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
} 
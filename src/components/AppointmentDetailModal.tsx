'use client'

import { useTheme } from './ThemeProvider'

interface AppointmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: {
    patientName: string
    date: string
    time: string
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    symptoms: string
    notes: string
  }
}

export function AppointmentDetailModal({ isOpen, onClose, appointment }: AppointmentDetailModalProps) {
  const { colors } = useTheme()

  if (!isOpen) return null

  const getStatusColor = () => {
    switch (appointment.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = () => {
    switch (appointment.status) {
      case 'pending':
        return 'Pending'
      case 'confirmed':
        return 'Confirmed'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return appointment.status
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-xl p-8 w-full max-w-2xl mx-4 shadow-2xl"
        style={{
          backgroundColor: colors.background,
          border: `1px solid ${colors.primary}20`,
        }}
      >
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
            Appointment Details
          </h2>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                {appointment.patientName}
              </h3>
              <p className="text-sm text-gray-500">Patient</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <span className="font-medium" style={{ color: colors.text }}>{appointment.date}</span>
              </div>
            </div>
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <span className="font-medium" style={{ color: colors.text }}>{appointment.time}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
              Symptoms
            </h4>
            <p className="text-gray-600 leading-relaxed">{appointment.symptoms}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
              Notes
            </h4>
            <p className="text-gray-600 leading-relaxed">{appointment.notes}</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-medium transition-colors bg-red-500 text-white hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
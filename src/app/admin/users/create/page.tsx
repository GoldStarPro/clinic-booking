'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DOCTOR_SPECIALTIES } from '@/lib/specialties'

export default function CreateUser() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'PATIENT',
    specialty: '',
    phone: '',
    address: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'role' && value !== 'DOCTOR' ? { specialty: '' } : {}),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Server Admin API — does not call signUp, so the admin session stays intact
      console.log('Submitting admin create-user', {
        email: formData.email,
        role: formData.role,
        specialty: formData.specialty || undefined,
      })

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create user')
      }

      console.log('User created:', payload.user?.id, payload.user?.role)
      router.push('/admin/users')
      router.refresh()
    } catch (err) {
      console.error('Error creating user:', err)
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create New User</h1>
        <Link
          href="/admin/users"
          className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
        >
          Back to Users
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="off"
                className="w-full p-2 border border-gray-300 rounded"
                value={formData.email}
                onChange={handleChange}
                suppressHydrationWarning
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full p-2 pr-16 border border-gray-300 rounded"
                  value={formData.password}
                  onChange={handleChange}
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-sm text-gray-600 hover:text-gray-900"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                minLength={2}
                className="w-full p-2 border border-gray-300 rounded"
                value={formData.name}
                onChange={handleChange}
                suppressHydrationWarning
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="role">
                Role
              </label>
              <select
                id="role"
                name="role"
                required
                className="w-full p-2 border border-gray-300 rounded"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {formData.role === 'DOCTOR' && (
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="specialty">
                  Specialty
                </label>
                <select
                  id="specialty"
                  name="specialty"
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                  value={formData.specialty}
                  onChange={handleChange}
                >
                  <option value="">Select specialty</option>
                  {DOCTOR_SPECIALTIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="phone">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="w-full p-2 border border-gray-300 rounded"
                value={formData.phone}
                onChange={handleChange}
                suppressHydrationWarning
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2" htmlFor="address">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                className="w-full p-2 border border-gray-300 rounded"
                value={formData.address}
                onChange={handleChange}
                suppressHydrationWarning
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN'
  specialty?: string
  phone?: string
  address?: string
}

export default function EditUser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<User>({
    id: '',
    email: '',
    name: '',
    role: 'PATIENT',
    specialty: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    fetchUser()
  }, [id])

  const fetchUser = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error('Failed to fetch user')
      }

      if (!data) {
        throw new Error('User not found')
      }

      setFormData(data)
    } catch (error) {
      console.error('Error fetching user:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch user')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw new Error(userError.message)

      const { error: roleError } = await supabase
        .from('User')
        .select('role')
        .eq('id', user?.id)
        .single()

      if (roleError) throw new Error(roleError.message)

      const { error: selectError } = await supabase
        .from('User')
        .select('*')
        .eq('id', id)
        .single()

      if (selectError) {
        throw new Error('Cannot access user information')
      }

      const { error } = await supabase
        .from('User')
        .update({
          name: formData.name,
          role: formData.role,
          specialty: formData.role === 'DOCTOR' ? formData.specialty : null,
          phone: formData.phone,
          address: formData.address,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      router.push('/admin/users')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading user...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit User</h1>
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                disabled
                className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                value={formData.email}
              />
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
                className="w-full p-2 border border-gray-300 rounded"
                value={formData.name}
                onChange={handleChange}
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
                <input
                  type="text"
                  id="specialty"
                  name="specialty"
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                  value={formData.specialty}
                  onChange={handleChange}
                />
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
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
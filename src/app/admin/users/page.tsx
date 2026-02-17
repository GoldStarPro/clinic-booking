'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { formatDateDisplay } from '@/lib/date-utils'

interface User {
  id: string
  email: string
  name: string
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN'
  specialty?: string
  phone?: string
  address?: string
  createdAt: string
  updatedAt: string
}

export default function AdminUsers() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    checkUserRole()
  }, [])

  useEffect(() => {
    if (userRole === 'ADMIN') {
      fetchUsers()
    }
  }, [userRole, filterRole, searchTerm])

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

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('User')
        .select('*')
        .order('createdAt', { ascending: false })

      // Apply role filter
      if (filterRole !== 'ALL') {
        query = query.eq('role', filterRole)
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) {
        throw new Error('Failed to fetch users')
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch users')
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
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/admin/dashboard"
            className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/admin/dashboard"
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Appointments
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Patients</h3>
          <p className="text-3xl font-bold text-green-600">
            {users.filter(u => u.role === 'PATIENT').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Doctors</h3>
          <p className="text-3xl font-bold text-blue-600">
            {users.filter(u => u.role === 'DOCTOR').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Admins</h3>
          <p className="text-3xl font-bold text-purple-600">
            {users.filter(u => u.role === 'ADMIN').length}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="searchTerm">
              Search Users
            </label>
            <input
              type="text"
              id="searchTerm"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2" htmlFor="filterRole">
              Filter by Role
            </label>
            <select
              id="filterRole"
              className="w-full p-2 border border-gray-300 rounded"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="PATIENT">Patients</option>
              <option value="DOCTOR">Doctors</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>

          <div className="flex items-end">
            <Link
              href="/admin/users/create"
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors text-center"
            >
              Create New User
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No users found.</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'DOCTOR' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="text-sm text-gray-900">{user.phone || 'No phone'}</div>
                      <div className="text-sm text-gray-500">{user.address || 'No address'}</div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDateDisplay(user.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </Link>
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
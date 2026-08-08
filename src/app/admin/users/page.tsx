'use client'

import { useState, useEffect } from 'react'
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
  const supabase = createClientComponentClient()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [filterRole, searchTerm])

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total users', value: users.length, color: 'text-indigo-600' },
          { label: 'Patients', value: users.filter((u) => u.role === 'PATIENT').length, color: 'text-emerald-600' },
          { label: 'Doctors', value: users.filter((u) => u.role === 'DOCTOR').length, color: 'text-sky-600' },
          { label: 'Admins', value: users.filter((u) => u.role === 'ADMIN').length, color: 'text-violet-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white/90 backdrop-blur rounded-2xl border border-indigo-100 p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
          >
            <h3 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</h3>
            <p className={`text-2xl sm:text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-indigo-100 p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2" htmlFor="searchTerm">
              Search users
            </label>
            <input
              type="text"
              id="searchTerm"
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2" htmlFor="filterRole">
              Filter by role
            </label>
            <select
              id="filterRole"
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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
              className="w-full text-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2.5 px-4 rounded-xl hover:from-indigo-700 hover:to-violet-700 transition shadow-md font-medium"
            >
              Create new user
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading users…</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-white/80 rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-600">No users found.</p>
        </div>
      ) : (
        <div className="bg-white/95 rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-indigo-50/80">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="hidden md:table-cell px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="hidden md:table-cell px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-indigo-50/50 transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'DOCTOR' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-5 py-4">
                      <div className="text-sm text-slate-900">{user.phone || 'No phone'}</div>
                      <div className="text-sm text-slate-500">{user.address || 'No address'}</div>
                    </td>
                    <td className="hidden md:table-cell px-5 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{formatDateDisplay(user.createdAt)}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 group-hover:underline transition"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit
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
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Register() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [role, setRole] = useState('PATIENT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClientComponentClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone, address, role },
        },
      })

      if (authError) throw new Error(authError.message)
      if (!data.user) throw new Error('Registration failed')

      const now = new Date().toISOString()
      const { error: insertError } = await supabase
        .from('User')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || '',
            phone: data.user.user_metadata?.phone || '',
            address: data.user.user_metadata?.address || '',
            role: data.user.user_metadata?.role || 'PATIENT',
            createdAt: now,
            updatedAt: now,
          },
        ])
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to create user profile: ${insertError.message}`)
      }

      router.push('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-400">
      <div className="min-h-screen grid lg:grid-cols-2">
        <aside className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" aria-hidden />
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 text-white no-underline">
              <span className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold">
                C
              </span>
              <span className="text-xl font-semibold tracking-tight">Clinic Booking</span>
            </Link>
          </div>
          <div className="relative z-10 max-w-md">
            <p className="uppercase tracking-[0.18em] text-sm text-white/80 mb-3">Join the clinic</p>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Create your account and start booking care.
            </h1>
            <p className="text-indigo-100 text-lg leading-relaxed">
              Register as a patient in seconds. Doctor accounts are provisioned by clinic admins when needed.
            </p>
          </div>
          <p className="relative z-10 text-sm text-white/70">© {new Date().getFullYear()} Clinic Booking</p>
        </aside>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-6 text-white">
              <Link href="/" className="inline-flex items-center gap-2 text-white font-semibold mb-3">
                ← Clinic Booking
              </Link>
              <h1 className="text-3xl font-bold mb-2">Create Account</h1>
              <p className="text-indigo-100">Join our medical community</p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
              <div className="hidden lg:block mb-5">
                <h2 className="text-2xl font-bold text-indigo-900">Sign up</h2>
                <p className="text-sm text-indigo-500 mt-1">It only takes a minute</p>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-indigo-700 mb-1.5 font-medium text-sm" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full p-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-indigo-700 mb-1.5 font-medium text-sm" htmlFor="email">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full p-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-indigo-700 mb-1.5 font-medium text-sm" htmlFor="password">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    className="w-full p-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-indigo-700 mb-1.5 font-medium text-sm" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="w-full p-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-indigo-700 mb-1.5 font-medium text-sm" htmlFor="address">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    className="w-full p-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Enter your address"
                  />
                </div>

                <div>
                  <label className="block text-indigo-700 mb-1.5 font-medium text-sm" htmlFor="role">
                    Role
                  </label>
                  <select
                    id="role"
                    className="w-full p-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="PATIENT">Patient</option>
                    <option value="DOCTOR">Doctor</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition duration-200 font-medium shadow-md"
                  disabled={loading}
                >
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className="text-center text-purple-600 mt-5 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw new Error(authError.message)
      if (!data.user) throw new Error('Authentication failed')

      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (userError) throw new Error('Failed to get user profile')

      if (!userData) {
        const { error: createError } = await supabase.from('User').insert([
          {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || '',
            phone: data.user.user_metadata?.phone || '',
            address: data.user.user_metadata?.address || '',
            role: data.user.user_metadata?.role || 'PATIENT',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ])
        if (createError) throw new Error('Failed to create user profile')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-400" suppressHydrationWarning>
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
            <p className="uppercase tracking-[0.18em] text-sm text-white/80 mb-3">Welcome back</p>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Your care schedule, one secure sign-in away.
            </h1>
            <p className="text-indigo-100 text-lg leading-relaxed">
              Patients book visits. Doctors manage the day. Admins keep the clinic running —
              all from the same trusted platform.
            </p>
          </div>
          <p className="relative z-10 text-sm text-white/70">© {new Date().getFullYear()} Clinic Booking</p>
        </aside>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8 text-white">
              <Link href="/" className="inline-flex items-center gap-2 text-white font-semibold mb-4">
                ← Clinic Booking
              </Link>
              <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
              <p className="text-indigo-100">Sign in to access your medical appointments</p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
              <div className="hidden lg:block mb-6">
                <h2 className="text-2xl font-bold text-indigo-900">Sign in</h2>
                <p className="text-sm text-indigo-500 mt-1">Use your clinic account credentials</p>
              </div>

              <div className="flex justify-center lg:hidden mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-indigo-700 mb-2 font-medium" htmlFor="email">
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
                  <label className="block text-indigo-700 mb-2 font-medium" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="w-full p-3 pr-16 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      suppressHydrationWarning
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 px-3 text-sm text-indigo-600 hover:text-indigo-800"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition duration-200 font-medium shadow-md"
                  disabled={loading}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <p className="text-center text-purple-600 mt-5 text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

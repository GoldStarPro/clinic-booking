'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useTheme } from '@/components/ThemeProvider'
import type { ThemeType } from '@/lib/theme'

export type ShellRole = 'ADMIN' | 'DOCTOR' | 'PATIENT'

type NavItem = { href: string; label: string; icon: string }

const NAV: Record<ShellRole, NavItem[]> = {
  ADMIN: [
    { href: '/admin/dashboard', label: 'Appointments', icon: '📅' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/users/create', label: 'Create user', icon: '＋' },
  ],
  DOCTOR: [
    { href: '/doctor/dashboard', label: 'My schedule', icon: '🩺' },
  ],
  PATIENT: [
    { href: '/patient/dashboard', label: 'Overview', icon: '🏠' },
    { href: '/book-appointment', label: 'Book visit', icon: '📝' },
    { href: '/my-appointments', label: 'My appointments', icon: '📋' },
  ],
}

const THEME_BY_ROLE: Record<ShellRole, ThemeType> = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardShell({
  role,
  title,
  children,
}: {
  role: ShellRole
  title?: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { colors, setTheme } = useTheme()
  const [open, setOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [userName, setUserName] = useState('User')
  const [userEmail, setUserEmail] = useState('')
  const profileRef = useRef<HTMLDivElement>(null)

  // Apply the role palette (admin / doctor / patient) once the shell mounts
  useEffect(() => {
    setTheme(THEME_BY_ROLE[role])
  }, [role, setTheme])

  // Header profile label — Auth email fallback, then public.User name
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email || '')
      const { data } = await supabase
        .from('User')
        .select('name, email')
        .eq('id', user.id)
        .single()
      if (data?.name) setUserName(data.name)
      if (data?.email) setUserEmail(data.email)
    }
    void load()
  }, [supabase])

  // Close mobile drawer + profile menu on navigation
  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
  }, [pathname])

  // Close profile dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!profileOpen) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const root = profileRef.current
      if (!root || root.contains(event.target as Node)) return
      setProfileOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [profileOpen])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const items = NAV[role]
  const brand =
    role === 'ADMIN' ? 'Clinic Admin' : role === 'DOCTOR' ? 'Doctor Console' : 'Patient Portal'

  return (
    <div className="min-h-screen flex" style={{ color: colors.text }}>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed z-40 inset-y-0 left-0 flex flex-col border-r border-white/40
          bg-white/85 backdrop-blur-md shadow-xl transition-all duration-300
          ${open ? 'w-64' : 'w-[4.5rem]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand + desktop collapse/expand control (icon at the top, not a bottom label) */}
        <div
          className={`border-b border-black/5 flex ${
            open
              ? 'items-center gap-3 px-4 h-16'
              : 'flex-col items-center gap-2 px-2 py-3'
          }`}
        >
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
          >
            C
          </div>
          {open && (
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate leading-tight">Clinic Booking</p>
              <p className="text-xs opacity-60 truncate">{brand}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 transition shrink-0"
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
            title={open ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 transition-transform duration-300 ${open ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`
                  flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition
                  ${active ? 'text-white shadow-md' : 'hover:bg-black/5'}
                `}
                style={
                  active
                    ? { background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }
                    : undefined
                }
              >
                <span className="text-base w-6 text-center">{item.icon}</span>
                {open && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div
        className={`flex-1 min-w-0 transition-[padding] duration-300 ${
          open ? 'lg:pl-64' : 'lg:pl-[4.5rem]'
        }`}
      >
        <header className="sticky top-0 z-20 h-16 px-4 sm:px-6 flex items-center justify-between gap-3 border-b border-white/50 bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden rounded-lg px-3 py-2 bg-white shadow-sm border border-black/5"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
            >
              ☰
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold truncate">
                {title || items.find((i) => isActive(pathname, i.href))?.label || brand}
              </h1>
            </div>
          </div>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 bg-white shadow-sm border border-black/5 hover:shadow transition"
            >
              <span
                className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ background: colors.primary }}
              >
                {userName.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden sm:block text-left leading-tight">
                <span className="block text-sm font-medium truncate max-w-[9rem]">{userName}</span>
                <span className="block text-[11px] opacity-60">Profile</span>
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-black/5 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-black/5">
                  <p className="text-sm font-medium truncate">{userName}</p>
                  <p className="text-xs opacity-60 truncate">{userEmail}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

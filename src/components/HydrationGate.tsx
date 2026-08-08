'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const PUBLIC_PATHS = ['/', '/login', '/register']

/**
 * Browser extensions inject attributes (bis_skin_checked, data-lt-*, etc.)
 * before React hydrates. Public pages still SSR for SEO; dashboard shells
 * wait until mount. ThemeProvider must not change background until mounted.
 */
export function HydrationGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const isPublic = !pathname || PUBLIC_PATHS.includes(pathname)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted && !isPublic) {
    return (
      <div className="min-h-screen" suppressHydrationWarning aria-hidden="true" />
    )
  }

  return <>{children}</>
}

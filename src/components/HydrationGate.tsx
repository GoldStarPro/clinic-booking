'use client'

import { useEffect, useState } from 'react'

/**
 * Renders children only after mount so browser extensions that inject
 * attributes (e.g. bis_skin_checked) cannot cause React hydration mismatches.
 * Server + first client paint share the same placeholder shell.
 */
export function HydrationGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500"
        suppressHydrationWarning
      >
        <span className="text-sm" suppressHydrationWarning>
          Loading…
        </span>
      </div>
    )
  }

  return <>{children}</>
}

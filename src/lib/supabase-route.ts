import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Next.js 15 `cookies()` is async. auth-helpers 0.10 still calls `.get()`
 * synchronously on the return value — do not wrap the store in a Promise.
 */
export async function createSupabaseRouteClient() {
  const cookieStore = await cookies()
  return createRouteHandlerClient({
    cookies: () => cookieStore,
  } as unknown as { cookies: () => ReturnType<typeof cookies> })
}

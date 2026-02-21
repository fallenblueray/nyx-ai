import { createServerClient } from '@supabase/ssr'
import { headers } from 'next/headers'

export async function createServerClientAsync() {
  const headersList = await headers()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookiesFromHeaders(headersList)
        },
        setAll() {
          // API routes cannot set cookies this way
        },
      },
    }
  )
}

function cookiesFromHeaders(headersList: Awaited<ReturnType<typeof headers>>) {
  const cookieHeader = headersList.get('cookie') || ''
  if (!cookieHeader) return []
  
  return cookieHeader.split(';').map(cookie => {
    const [name, ...valueParts] = cookie.trim().split('=')
    return { name, value: valueParts.join('=') }
  })
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client for Next.js Server Components
 * Uses service role key for admin access (bypasses RLS)
 */
function getSupabaseUrl(): string {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('Supabase URL not configured (SUPABASE_URL)')
  return url
}

function getServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Supabase service role key not configured (SUPABASE_SERVICE_ROLE_KEY)')
  return key
}

/** 
 * Create a server-side Supabase client
 * Uses service role key to bypass RLS for public data access
 */
export async function createClient() {
  return createSupabaseClient(getSupabaseUrl(), getServiceKey())
}

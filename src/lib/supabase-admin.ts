import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client.
 * NEXT_PUBLIC_ vars are guaranteed in client bundles only.
 * For server actions / API routes, prefer SUPABASE_URL / SUPABASE_ANON_KEY.
 */
function getSupabaseUrl(): string {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('Supabase URL not configured (SUPABASE_URL)')
  return url
}

function getAnonKey(): string {
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('Supabase anon key not configured (SUPABASE_ANON_KEY)')
  return key
}

function getServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Supabase service role key not configured (SUPABASE_SERVICE_ROLE_KEY)')
  return key
}

/** Anon client (respects RLS, for user-scoped queries with auth token) */
export const createAnonClient = () =>
  createClient(getSupabaseUrl(), getAnonKey())

/** Admin client (bypasses RLS, use in webhooks / admin routes only) */
export const createAdminClient = () =>
  createClient(getSupabaseUrl(), getServiceKey())

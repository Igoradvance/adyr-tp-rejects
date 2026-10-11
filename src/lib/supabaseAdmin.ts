import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization — only creates client when first called (runtime, not build time)
let _admin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vdnbavacjilmgxijarkv.supabase.co'
    // The secret key lives ONLY in the environment (Vercel) — never in source.
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')

    // New-style secret keys (sb_secret_...) are not JWTs. supabase-js still sends
    // them as "Authorization: Bearer <key>", which the Auth admin API rejects
    // ("This endpoint requires a valid Bearer token"). For those keys send the
    // apikey header only and drop the Bearer copy.
    const isJwt = key.startsWith('eyJ')
    const adminFetch: typeof fetch = (input, init) => {
      if (isJwt) return fetch(input, init)
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
      if (headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization')
      return fetch(input, { ...init, headers })
    }

    _admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: adminFetch },
    })
  }
  return _admin
}

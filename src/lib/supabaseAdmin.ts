import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization — only creates client when first called (runtime, not build time)
let _admin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vdnbavacjilmgxijarkv.supabase.co'
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkbmJhdmFjamlsbWd4aWphcmt2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA4MTU4NiwiZXhwIjoyMDk3NjU3NTg2fQ.yCiTna5SX4Dmi3DcEx4ypYKStVK5G0-DLLbfBA0UWh0'
    _admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  }
  return _admin
}

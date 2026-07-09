import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = getSupabaseAdmin()

  // Get all auth users (bypasses RLS completely)
  const { data: authData, error: authError } = await admin.auth.admin.listUsers()
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Get all profiles
  const { data: profilesData } = await admin.from('profiles').select('*')
  const profileMap = new Map((profilesData ?? []).map((p: Record<string, unknown>) => [p.id, p]))

  // Merge: auth users + profile data
  const users = authData.users
    .map((u: { id: string; email?: string; created_at: string }) => {
      const profile = profileMap.get(u.id)
      if (!profile) return null
      return profile
    })
    .filter(Boolean)

  return NextResponse.json({ users }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}

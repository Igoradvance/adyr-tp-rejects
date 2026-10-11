import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'חסר userId' }, { status: 400 })

  const admin = getSupabaseAdmin()

  // A profile row can block deleting the auth user (FK without ON DELETE CASCADE).
  // Remove it first, and put it back if the auth deletion still fails so an
  // account is never left half-deleted.
  const { data: profileRows } = await admin.from('profiles').select('*').eq('id', userId)
  const profile = profileRows?.[0]
  if (profile) await admin.from('profiles').delete().eq('id', userId)

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    if (profile) await admin.from('profiles').upsert(profile)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  const { userId, emailNotifications } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId חסר' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const patch: Record<string, unknown> = {}
  if (typeof emailNotifications === 'boolean') patch.email_notifications = emailNotifications

  const { error } = await admin.from('profiles').update(patch).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

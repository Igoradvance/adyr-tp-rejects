import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  const { userId, emailNotifications } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId חסר' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const patch: Record<string, unknown> = {}
  if (typeof emailNotifications === 'boolean') patch.email_notifications = emailNotifications

  const { data, error } = await admin.from('profiles').update(patch).eq('id', userId).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'לא נמצאה שורת פרופיל לעדכון (id לא תואם)' }, { status: 404 })
  }

  return NextResponse.json({ success: true, updated: data[0] })
}

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

// Called by Vercel Cron nightly, or manually by a super_admin ("backup now").
export async function GET(req: NextRequest) {
  const trigger = req.nextUrl.searchParams.get('trigger') === 'manual' ? 'manual' : 'auto'
  const admin = getSupabaseAdmin()

  // Snapshot all tickets
  const { data: tickets, error } = await admin.from('tickets').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { error: insErr } = await admin.from('backups').insert({
    ticket_count: tickets?.length ?? 0,
    trigger,
    data: tickets ?? [],
  })
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  // Retention: keep the 60 most recent backups, delete older ones
  const { data: old } = await admin
    .from('backups')
    .select('id')
    .order('created_at', { ascending: false })
    .range(60, 1000)
  if (old && old.length > 0) {
    await admin.from('backups').delete().in('id', old.map((r: { id: string }) => r.id))
  }

  return NextResponse.json({ success: true, ticketCount: tickets?.length ?? 0, trigger })
}

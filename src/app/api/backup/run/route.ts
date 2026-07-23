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

  // Retention: delete AUTOMATIC backups older than 14 days (manual backups are kept)
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  await admin.from('backups').delete().eq('trigger', 'auto').lt('created_at', cutoff)

  return NextResponse.json({ success: true, ticketCount: tickets?.length ?? 0, trigger })
}

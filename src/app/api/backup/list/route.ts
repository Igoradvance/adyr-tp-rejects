import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

// Backup history metadata (no full data payload — keeps the response light)
export async function GET() {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('backups')
    .select('id, created_at, ticket_count, trigger')
    .order('created_at', { ascending: false })
    .limit(60)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ backups: data ?? [] }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}

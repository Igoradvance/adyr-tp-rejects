import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireRole } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

// Full backup payload for download
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['super_admin'])
  if (!auth.ok) return auth.res
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id חסר' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.from('backups').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}

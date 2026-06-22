import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'חסר userId' }, { status: 400 })

  const { error } = await getSupabaseAdmin().auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

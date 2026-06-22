import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('users/list error:', error.message, error.code)
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  }
  return NextResponse.json({ users: data })
}

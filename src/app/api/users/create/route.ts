import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { name, email, password, role, contractor } = await req.json()

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'שדות חובה חסרים' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const { error: profileError } = await admin
    .from('profiles')
    .insert({ id: authData.user.id, name, email, role, contractor: contractor || null })

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId: authData.user.id })
}

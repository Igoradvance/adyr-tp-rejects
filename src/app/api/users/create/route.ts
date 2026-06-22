import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { name, email, password, role, contractor } = await req.json()

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'שדות חובה חסרים' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  let userId: string

  // Check if user already exists in auth
  const { data: existingList } = await admin.auth.admin.listUsers()
  const existing = existingList?.users?.find((u: { email?: string }) => u.email === email)

  if (existing) {
    userId = existing.id
    // Update password if user exists
    await admin.auth.admin.updateUserById(userId, { password })
  } else {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    userId = authData.user.id
  }

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: userId, name, email, role, contractor: contractor || null })

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  return NextResponse.json({ success: true, userId })
}

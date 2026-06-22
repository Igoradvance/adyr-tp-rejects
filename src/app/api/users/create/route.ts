import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  const { name, email, password, role, contractor } = await req.json()

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'שדות חובה חסרים' }, { status: 400 })
  }

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Insert profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({ id: authData.user.id, name, email, role, contractor: contractor || null })

  if (profileError) {
    // Rollback auth user
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId: authData.user.id })
}

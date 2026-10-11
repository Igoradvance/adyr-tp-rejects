import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export type AppRole = 'super_admin' | 'quality_control' | 'contractor_pm' | 'contractor_employee' | 'viewer'

export type AuthResult =
  | { ok: true; userId: string; role: AppRole }
  | { ok: false; res: NextResponse }

function deny(status: 401 | 403, error: string): AuthResult {
  return { ok: false, res: NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } }) }
}

/**
 * Server-side gate for the /api routes (which run with the service key and
 * therefore bypass RLS). The caller must send the Supabase access token of a
 * signed-in user as `Authorization: Bearer <token>`; the token is verified with
 * the Auth server and the role is read from `profiles`.
 */
export async function requireRole(req: NextRequest, allowed: AppRole[] | 'any'): Promise<AuthResult> {
  const header = req.headers.get('authorization') || ''
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
  if (!token) return deny(401, 'נדרשת התחברות')

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data?.user) return deny(401, 'ההתחברות אינה תקפה — התחבר מחדש')

  const { data: profile } = await admin.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
  const role = profile?.role as AppRole | undefined
  if (!role) return deny(403, 'אין הרשאה')
  if (allowed !== 'any' && !allowed.includes(role)) return deny(403, 'אין הרשאה לפעולה זו')

  return { ok: true, userId: data.user.id, role }
}

/**
 * Vercel Cron. When CRON_SECRET is set in the project, Vercel sends it as
 * `Authorization: Bearer <secret>` and only that is accepted. Without a secret
 * we fall back to the cron user-agent, which is spoofable — set CRON_SECRET.
 */
export function isCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (secret) return (req.headers.get('authorization') || '') === `Bearer ${secret}`
  return (req.headers.get('user-agent') || '').startsWith('vercel-cron/')
}

import { supabase } from './supabase'

/**
 * fetch() for the app's own /api routes: attaches the signed-in user's access
 * token. The routes verify it server-side (see apiAuth.ts).
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  try {
    const { data } = await supabase.auth.getSession()
    if (data.session?.access_token) headers.set('Authorization', `Bearer ${data.session.access_token}`)
  } catch { /* no session — the server will answer 401 */ }
  return fetch(input, { ...init, headers })
}

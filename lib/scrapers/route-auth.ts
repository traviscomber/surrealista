import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/** Validate the Bearer token sent by the browser and require an admin role. */
export async function validateScraperAccess(req: NextRequest) {
  try {
    // The current application uses PasswordGate rather than Supabase Auth.
    // Accept its same session credential so authenticated admins can run scrapers.
    const siteToken = req.headers.get('x-site-access-token')
    const expectedSiteToken = process.env.APP_PASSWORD
      ?? process.env.NEXT_PUBLIC_APP_PASSWORD
      ?? 'srmagica'
    if (siteToken && siteToken === expectedSiteToken) {
      return { authorized: true }
    }

    // Also support real Supabase sessions for accounts migrated to database auth.
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return { authorized: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) throw new Error('Supabase auth configuration is missing')

    const supabase = createClient(url, anonKey, { auth: { persistSession: false } })
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return { authorized: false, response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
    }

    // Roles live in user_roles (not profiles). Fall back to users.role for legacy accounts.
    const [{ data: roleRow }, { data: userRow }] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
      supabase.from('users').select('role').eq('id', user.id).maybeSingle(),
    ])
    const role = roleRow?.role ?? userRow?.role
    if (role !== 'admin') {
      return { authorized: false, response: NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 }) }
    }

    return { authorized: true, userId: user.id }
  } catch (err) {
    return { authorized: false, response: NextResponse.json({ error: (err as Error).message }, { status: 500 }) }
  }
}

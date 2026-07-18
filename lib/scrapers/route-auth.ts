import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Validates scraper route access: checks Authorization header and admin role in production */
export async function validateScraperAccess(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return { authorized: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { authorized: false, response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
    }

    // In production, verify admin role. In development, allow any authenticated user.
    if (process.env.NODE_ENV === 'production') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return { authorized: false, response: NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 }) }
      }
    }

    return { authorized: true }
  } catch (err) {
    return { authorized: false, response: NextResponse.json({ error: (err as Error).message }, { status: 500 }) }
  }
}

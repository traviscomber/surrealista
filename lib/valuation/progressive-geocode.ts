import { createClient } from '@supabase/supabase-js'
import { geocodeChileAddress } from '@/lib/geocoding/forward-geocode'

export async function progressivelyGeocodeMarket(input: { commune?: string | null; region?: string | null; limit?: number }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { attempted: 0, updated: 0 }
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  let query = db.from('properties_external').select('id,address,location,commune,region').eq('is_active',true).is('lat',null).limit(Math.min(input.limit ?? 3, 5))
  if (input.commune) query = query.ilike('commune', `%${input.commune}%`)
  else if (input.region) query = query.ilike('region', `%${input.region}%`)
  const { data } = await query
  let updated = 0
  for (const row of data ?? []) {
    const search = [row.address || row.location, row.commune, row.region].filter(Boolean).join(', ')
    if (search.length < 3) continue
    const match = (await geocodeChileAddress(search))[0]
    if (!match || match.confidence < 0.45) continue
    const { error } = await db.from('properties_external').update({ lat: match.lat, lng: match.lng, coordinates: { lat: match.lat, lng: match.lng }, updated_at: new Date().toISOString() }).eq('id', row.id)
    if (!error) updated += 1
  }
  return { attempted: data?.length ?? 0, updated }
}

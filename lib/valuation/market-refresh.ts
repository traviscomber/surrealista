import { createClient } from '@supabase/supabase-js'
import { scrapePortalInmobiliario } from '@/lib/scrapers/portal-inmobiliario-scraper'
import { scrapeICasas } from '@/lib/scrapers/icasas-scraper'

export async function refreshMarketForValuation(input: { region: string; commune?: string | null }) {
  const startedAt = Date.now()
  const results: any[] = []
  const regions = [input.region]

  const jobs = [
    scrapePortalInmobiliario({ regions, operation: 'venta', maxPerQuery: 36 }),
    scrapeICasas({ regions, operation: 'venta', pages: 1 }),
  ]

  const settled = await Promise.allSettled(jobs)
  for (const result of settled) {
    if (result.status === 'fulfilled') results.push(result.value)
    else results.push({ source: 'unknown', found: 0, inserted: 0, errors: [String(result.reason)] })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key) {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    try {
      await db.rpc('deduplicate_properties_external')
    } catch {
      // Refresh remains useful even if the optional dedupe RPC is unavailable.
    }
  }

  return {
    status: 'completed',
    region: input.region,
    commune: input.commune ?? null,
    sources: results.map((row) => ({
      source: row.source ?? 'unknown',
      found: row.found ?? 0,
      inserted: row.inserted ?? 0,
      updated: row.updated ?? 0,
      errors: row.errors ?? [],
    })),
    found: results.reduce((sum, row) => sum + Number(row.found ?? 0), 0),
    inserted: results.reduce((sum, row) => sum + Number(row.inserted ?? 0), 0),
    duration_ms: Date.now() - startedAt,
  }
}

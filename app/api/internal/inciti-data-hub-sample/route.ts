import { NextResponse } from 'next/server'

export const maxDuration = 60

const BASE = 'https://api.inciti.com/api/lab'

const TARGETS = {
  regions: [
    { code: 10, name: 'Los Lagos' },
    { code: 14, name: 'Los Ríos' },
    { code: 11, name: 'Aysén' },
  ],
  communes: [
    { code: 10301, name: 'Puerto Montt' },
    { code: 10303, name: 'Puerto Varas' },
    { code: 10201, name: 'Osorno' },
    { code: 10401, name: 'Castro' },
    { code: 10101, name: 'Valdivia' },
    { code: 11401, name: 'Coyhaique' },
  ],
} as const

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SurRealistaDataHubResearch/1.0 (+https://sur-realista.vercel.app)',
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}: ${text.slice(0, 300)}`)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`${url} did not return JSON: ${text.slice(0, 300)}`)
  }
}

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const regions = []
  for (const target of TARGETS.regions) {
    try {
      regions.push({ ...target, data: await fetchJson(`${BASE}/get_region_data?codregion=${target.code}`) })
    } catch (error) {
      regions.push({ ...target, error: (error as Error).message })
    }
  }

  const communes = []
  for (const target of TARGETS.communes) {
    try {
      communes.push({ ...target, data: await fetchJson(`${BASE}/get_comuna_data?codcomuna=${target.code}`) })
    } catch (error) {
      communes.push({ ...target, error: (error as Error).message })
    }
  }

  return NextResponse.json({
    success: true,
    source: 'inciti_data_hub_public',
    fetchedAt: new Date().toISOString(),
    regions,
    communes,
  })
}

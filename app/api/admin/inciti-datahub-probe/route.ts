import { NextResponse } from 'next/server'

export const maxDuration = 60

const DATA_HUB_URL = 'https://www.inciti.com/cl/lab/data-hub'
const ORIGIN = 'https://www.inciti.com'

function uniq(values: string[]) {
  return Array.from(new Set(values))
}

function absoluteUrl(value: string) {
  try {
    return new URL(value, ORIGIN).toString()
  } catch {
    return null
  }
}

function extractScriptSources(html: string) {
  return uniq(
    Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi))
      .map((match) => absoluteUrl(match[1]))
      .filter((value): value is string => Boolean(value)),
  )
}

function extractCandidates(source: string) {
  const candidates: string[] = []
  const patterns = [
    /https?:\/\/[^"'`\\\s)]+/gi,
    /["'`]([^"'`]{0,120}(?:\/api\/|data-hub|demograph|comuna|commune|sales|ventas|properties|propiedades)[^"'`]{0,180})["'`]/gi,
  ]

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const value = (match[1] || match[0] || '').trim()
      if (!value) continue
      if (/sourceMappingURL|webpack|react|next\/static\/media/i.test(value)) continue
      candidates.push(value.slice(0, 320))
    }
  }

  return uniq(candidates).slice(0, 200)
}

export async function GET() {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Preview only' }, { status: 404 })
  }

  const page = await fetch(DATA_HUB_URL, {
    headers: {
      'User-Agent': 'SurRealistaDataHubProbe/1.0',
      Accept: 'text/html,application/xhtml+xml',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })

  if (!page.ok) {
    return NextResponse.json({ error: `Data Hub returned ${page.status}` }, { status: 502 })
  }

  const html = await page.text()
  const scripts = extractScriptSources(html).slice(0, 40)
  const bundles: Array<{ url: string; status: number; candidates: string[] }> = []

  for (const url of scripts) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'SurRealistaDataHubProbe/1.0' },
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      })
      const text = response.ok ? await response.text() : ''
      const candidates = extractCandidates(text)
      if (candidates.length) bundles.push({ url, status: response.status, candidates })
    } catch {
      // Probe only: a failed asset should not abort the scan.
    }
  }

  return NextResponse.json({
    success: true,
    pageStatus: page.status,
    htmlBytes: html.length,
    scriptsFound: scripts.length,
    scripts,
    bundles,
  })
}

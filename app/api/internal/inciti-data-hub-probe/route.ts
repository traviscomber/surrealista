import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export const maxDuration = 60

const DATA_HUB_URL = 'https://www.inciti.com/cl/lab/data-hub'
const ORIGIN = 'https://www.inciti.com'
const MAX_SCRIPTS = 24
const MAX_SCRIPT_BYTES = 2_000_000

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function sameOriginUrl(input: string) {
  try {
    const url = new URL(input, ORIGIN)
    if (url.origin !== ORIGIN) return null
    return url.toString()
  } catch {
    return null
  }
}

function collectCandidateStrings(source: string) {
  const candidates = new Set<string>()
  const patterns = [
    /["'`]([^"'`]*(?:data-hub|datahub|comuna|commune|region|demograf|propiedad|ventas|sales)[^"'`]*)["'`]/gi,
    /["'`](\/(?:api|cl\/api|lab\/api|_next\/data)[^"'`]*)["'`]/gi,
    /fetch\(\s*["'`]([^"'`]+)["'`]/gi,
    /axios\.(?:get|post)\(\s*["'`]([^"'`]+)["'`]/gi,
  ]

  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source)) !== null) {
      const value = clean(match[1] || '')
      if (!value || value.length > 500) continue
      if (/api[_-]?key|authorization|bearer|token=/i.test(value)) continue
      candidates.add(value)
      if (candidates.size >= 200) break
    }
    if (candidates.size >= 200) break
  }

  return Array.from(candidates)
}

function collectSnippets(source: string) {
  const needles = ['data-hub', 'datahub', 'comuna', 'commune', 'demograf', 'propiedad', 'ventas', 'fetch(', 'axios.', '/api/']
  const snippets: string[] = []
  const lower = source.toLowerCase()

  for (const needle of needles) {
    let start = 0
    while (snippets.length < 80) {
      const index = lower.indexOf(needle, start)
      if (index === -1) break
      const from = Math.max(0, index - 220)
      const to = Math.min(source.length, index + 420)
      const snippet = clean(source.slice(from, to))
        .replace(/([A-Za-z0-9_-]{24,})/g, (value) => value.length > 80 ? '[redacted-long-token]' : value)
      if (snippet && !snippets.includes(snippet)) snippets.push(snippet)
      start = index + needle.length
    }
  }

  return snippets
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SurRealistaDataHubResearch/1.0 (+https://sur-realista.vercel.app)',
      Accept: 'text/html,application/javascript,text/javascript,*/*;q=0.5',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`)
  const length = Number(response.headers.get('content-length') || 0)
  if (length > MAX_SCRIPT_BYTES) throw new Error(`${url} exceeds probe size limit`)
  const text = await response.text()
  if (text.length > MAX_SCRIPT_BYTES) throw new Error(`${url} exceeds probe size limit`)
  return text
}

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const html = await fetchText(DATA_HUB_URL)
    const $ = cheerio.load(html)
    const scriptUrls = $('script[src]')
      .map((_, node) => sameOriginUrl($(node).attr('src') || ''))
      .get()
      .filter((value): value is string => Boolean(value))
      .slice(0, MAX_SCRIPTS)

    const inlineScripts = $('script:not([src])')
      .map((_, node) => $(node).html() || '')
      .get()
      .filter(Boolean)

    const sources: Array<{ url: string; bytes: number; candidates: string[]; snippets: string[]; error?: string }> = []

    for (const url of scriptUrls) {
      try {
        const source = await fetchText(url)
        const candidates = collectCandidateStrings(source)
        const snippets = collectSnippets(source)
        if (candidates.length || snippets.length) {
          sources.push({ url, bytes: source.length, candidates, snippets })
        }
      } catch (error) {
        sources.push({ url, bytes: 0, candidates: [], snippets: [], error: (error as Error).message })
      }
    }

    const inlineSource = inlineScripts.join('\n')

    return NextResponse.json({
      success: true,
      page: {
        url: DATA_HUB_URL,
        bytes: html.length,
        title: clean($('title').first().text()),
        scripts: scriptUrls.length,
        inlineScripts: inlineScripts.length,
        pageCandidates: collectCandidateStrings(html),
        inlineCandidates: collectCandidateStrings(inlineSource),
        inlineSnippets: collectSnippets(inlineSource),
      },
      sources,
      summary: {
        candidateStrings: sources.reduce((sum, item) => sum + item.candidates.length, 0),
        matchingScripts: sources.filter((item) => item.candidates.length || item.snippets.length).length,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

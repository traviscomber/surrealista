import type { NextRequest } from 'next/server'
import { scrapeRura } from '@/lib/scrapers/rura-scraper'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('X-Site-Access-Token')
  if (auth !== process.env.SCRAPE_ACCESS_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const result = await scrapeRura(body)
    return Response.json(result)
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

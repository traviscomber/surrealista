export type CurrentContextItem = {
  title: string
  url: string
  published_at: string | null
  source: string | null
  signal: 'positive' | 'neutral' | 'negative' | 'uncertain'
  reason: string
}

export type CurrentContextResult = {
  status: 'verified' | 'unverified'
  checked_at: string
  query: string
  items: CurrentContextItem[]
  summary: string
  confidence_adjustment: number
}

const POSITIVE = [
  'inversión', 'paviment', 'nuevo acceso', 'conectividad', 'agua potable', 'electrificación',
  'turismo', 'infraestructura', 'apertura', 'mejora vial', 'ruta',
]
const NEGATIVE = [
  'incendio', 'inundación', 'restricción', 'prohibición', 'escasez hídrica', 'sequía',
  'deslizamiento', 'remoción en masa', 'contaminación', 'cierre', 'sanción',
]

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))
  return match ? decodeXml(match[1]) : null
}

function classify(title: string): Pick<CurrentContextItem, 'signal' | 'reason'> {
  const text = title.toLocaleLowerCase('es-CL')
  if (NEGATIVE.some((term) => text.includes(term))) {
    return { signal: 'negative', reason: 'Señal actual potencialmente adversa para suelo, acceso, riesgo o regulación.' }
  }
  if (POSITIVE.some((term) => text.includes(term))) {
    return { signal: 'positive', reason: 'Señal actual potencialmente favorable para conectividad, inversión o demanda.' }
  }
  return { signal: 'uncertain', reason: 'Contexto reciente relevante; requiere interpretación antes de atribuir impacto en valor.' }
}

export async function getCurrentLandContext(input: {
  commune?: string | null
  region: string
}): Promise<CurrentContextResult> {
  const place = [input.commune, input.region].filter(Boolean).join(' ')
  const query = `(${place}) (terreno OR parcela OR campo OR vialidad OR inversión OR plan regulador OR incendio OR inundación OR agua OR turismo)`
  const checkedAt = new Date().toISOString()

  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=es-419&gl=CL&ceid=CL:es-419`
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'user-agent': 'SurRealista-Valuation/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error(`news_http_${response.status}`)

    const xml = await response.text()
    const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? []
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 120
    const items = blocks
      .map((block): CurrentContextItem | null => {
        const title = tag(block, 'title')
        const link = tag(block, 'link')
        const pubDate = tag(block, 'pubDate')
        if (!title || !link) return null
        const timestamp = pubDate ? Date.parse(pubDate) : NaN
        if (Number.isFinite(timestamp) && timestamp < cutoff) return null
        const source = tag(block, 'source')
        const classification = classify(title)
        return {
          title,
          url: link,
          published_at: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null,
          source,
          ...classification,
        }
      })
      .filter((item): item is CurrentContextItem => Boolean(item))
      .slice(0, 8)

    if (!items.length) {
      return {
        status: 'unverified', checked_at: checkedAt, query, items: [],
        summary: 'No se encontraron señales recientes suficientes para verificar el contexto actual.',
        confidence_adjustment: -8,
      }
    }

    const positive = items.filter((item) => item.signal === 'positive').length
    const negative = items.filter((item) => item.signal === 'negative').length
    const summary = negative > positive
      ? `Contexto actual verificado: predominan señales potencialmente adversas (${negative} de ${items.length}).`
      : positive > negative
        ? `Contexto actual verificado: predominan señales potencialmente favorables (${positive} de ${items.length}).`
        : `Contexto actual verificado con ${items.length} señales recientes, sin sesgo concluyente.`

    return { status: 'verified', checked_at: checkedAt, query, items, summary, confidence_adjustment: 0 }
  } catch (error) {
    console.error('[Cotizador] No fue posible verificar noticias actuales:', error)
    return {
      status: 'unverified', checked_at: checkedAt, query, items: [],
      summary: 'Contexto actual no verificado. La valoración no incorpora un ajuste de precio por noticias.',
      confidence_adjustment: -8,
    }
  }
}

import { createHash } from 'crypto'
import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'

const SOURCE = 'evilas-agro'
const SOURCE_URL = 'https://www.evilasagro.cl/'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  Referer: SOURCE_URL,
}

export type EvilasListing = {
  externalKey: string
  title: string
  commune: string | null
  region: string | null
  crop: string | null
  operation: string | null
  areaHa: number | null
  plantedHa: number | null
  waterLps: number | null
  waterRaw: string | null
  priceAmount: number | null
  priceCurrency: string | null
  priceUnit: string | null
  rawText: string
  fingerprint: string
}

export type EvilasDemandSignal = {
  minHa: number | null
  maxHa: number | null
  crop: string | null
  region: string | null
  commune: string | null
  transactionType: string | null
  productionStatus: string | null
  rawRequirement: string
  rawDetail: string
  fingerprint: string
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function numeric(value: string | undefined | null) {
  if (!value) return null
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function fingerprint(parts: Array<string | number | null | undefined>) {
  return createHash('sha256').update(parts.map((part) => String(part ?? '')).join('|')).digest('hex')
}

function slug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function inferCrop(text: string) {
  const value = text.toLocaleLowerCase('es-CL')
  const crops: Array<[RegExp, string]> = [
    [/cerez/, 'cerezos'],
    [/kiwi/, 'kiwis'],
    [/avell/, 'avellanos'],
    [/ar[aá]ndan/, 'arándanos'],
    [/ciruel/, 'ciruelos'],
    [/palt/, 'paltos'],
    [/c[ií]tric/, 'cítricos'],
    [/vi[nñ]a|uva|vid/, 'viña'],
    [/nogal|nuec/, 'nogales'],
  ]
  const matches = crops.filter(([pattern]) => pattern.test(value)).map(([, crop]) => crop)
  return matches.length ? matches.join(', ') : null
}

function inferOperation(text: string) {
  const value = text.toLocaleLowerCase('es-CL')
  const sale = /venta|compra/.test(value)
  const rent = /arriendo|arrend/.test(value)
  if (sale && rent) return 'venta_o_arriendo'
  if (rent) return 'arriendo'
  if (sale) return 'venta'
  return null
}

function inferRegion(text: string) {
  const value = text.toLocaleLowerCase('es-CL')
  if (value.includes("o'higgins") || value.includes('ohiggins')) return "Región de O'Higgins"
  if (value.includes('maule')) return 'Región del Maule'
  if (value.includes('ñuble') || value.includes('nuble')) return 'Región de Ñuble'
  if (value.includes('bío-bío') || value.includes('biobío') || value.includes('biobio')) return 'Región del Biobío'
  return null
}

function inferCommune(text: string) {
  const communes = ['Melozal', 'Curicó', 'Molina', 'Yerbas Buenas', 'Pencahue', 'San Clemente', 'Parral', 'Linares', 'Teno', 'San Fernando', 'Chépica']
  const lower = text.toLocaleLowerCase('es-CL')
  return communes.find((commune) => lower.includes(commune.toLocaleLowerCase('es-CL'))) ?? null
}

function parsePrice(raw: string) {
  const text = normalizeText(raw)
  if (!text || /consultar/i.test(text)) return { amount: null, currency: null, unit: null }

  const uf = text.match(/([\d.,]+)\s*UF/i)
  if (uf) return { amount: numeric(uf[1]), currency: 'UF', unit: 'total' }

  const clp = text.match(/\$\s*([\d.,]+)/)
  if (clp) return { amount: numeric(clp[1]), currency: 'CLP', unit: /\/\s*ha/i.test(text) ? 'ha' : 'total' }

  return { amount: null, currency: null, unit: null }
}

function textLines(html: string) {
  const $ = cheerio.load(html)
  $('script,style,noscript').remove()
  return $('body')
    .text()
    .split(/\n+/)
    .map(normalizeText)
    .filter(Boolean)
}

export function parseEvilasHome(html: string): { listings: EvilasListing[]; demandSignals: EvilasDemandSignal[] } {
  const lines = textLines(html)
  const listings: EvilasListing[] = []
  const demandSignals: EvilasDemandSignal[] = []

  const listingsStart = lines.findIndex((line) => /Propiedades destacadas/i.test(line))
  const demandHeading = lines.findIndex((line) => /Requerimientos activos de nuestros clientes/i.test(line))
  const listingsEnd = demandHeading > listingsStart ? demandHeading : lines.length
  const listingLines = listingsStart >= 0 ? lines.slice(listingsStart + 1, listingsEnd) : []

  const locationPattern = /^(.+?)\s*·\s*(Región.+)$/i
  for (let index = 0; index < listingLines.length; index += 1) {
    const location = listingLines[index].match(locationPattern)
    if (!location) continue

    const nextLocationOffset = listingLines.slice(index + 1).findIndex((line) => locationPattern.test(line))
    const end = nextLocationOffset >= 0 ? index + 1 + nextLocationOffset : listingLines.length
    const block = listingLines.slice(index, end)
    const title = block.slice(1).find((line) => !/^Precio$/i.test(line) && !/^▪/.test(line) && !/^(Consultar|\$|[\d.,]+\s*UF)/i.test(line)) || 'Campo agrícola'
    const detail = block.find((line) => /^▪/.test(line)) || ''
    const priceLabelIndex = block.findIndex((line) => /^Precio$/i.test(line))
    const priceRaw = priceLabelIndex >= 0 ? block[priceLabelIndex + 1] || '' : ''

    const areaMatch = detail.match(/([\d.,]+)\s*ha/i)
    const plantedMatch = detail.match(/([\d.,]+)\s*ha\s*plantadas/i)
    const waterMatch = detail.match(/([\d.,]+)\s*Lt\/seg/i)
    const waterRawMatch = detail.match(/💧\s*(.+)$/)
    const price = parsePrice(priceRaw)
    const commune = normalizeText(location[1])
    const region = normalizeText(location[2])
    const rawText = block.join(' | ')
    const externalKey = slug(`${commune}-${title}`)

    listings.push({
      externalKey,
      title,
      commune,
      region,
      crop: inferCrop(title),
      operation: inferOperation(title),
      areaHa: numeric(areaMatch?.[1]),
      plantedHa: numeric(plantedMatch?.[1]),
      waterLps: numeric(waterMatch?.[1]),
      waterRaw: waterRawMatch ? normalizeText(waterRawMatch[1]) : null,
      priceAmount: price.amount,
      priceCurrency: price.currency,
      priceUnit: price.unit,
      rawText,
      fingerprint: fingerprint([commune, region, title, detail, priceRaw]),
    })

    index = end - 1
  }

  const demandStart = demandHeading >= 0 ? demandHeading + 1 : -1
  const demandEnd = demandStart >= 0
    ? lines.findIndex((line, index) => index > demandStart && /^Hablemos$/i.test(line))
    : -1
  const demandLines = demandStart >= 0 ? lines.slice(demandStart, demandEnd > demandStart ? demandEnd : lines.length) : []
  const requirementPattern = /^(\+?\d+(?:\s*[–-]\s*\d+)?\s*ha|Con flujo)$/i

  for (let index = 0; index < demandLines.length - 1; index += 1) {
    const requirement = demandLines[index]
    if (!requirementPattern.test(requirement)) continue
    const detail = demandLines[index + 1]
    if (!detail || /Requerimientos actualizados/i.test(detail)) continue

    const range = requirement.match(/(\d+)\s*[–-]\s*(\d+)\s*ha/i)
    const plus = requirement.match(/\+\s*(\d+)\s*ha/i)
    const exact = !range && !plus ? requirement.match(/^(\d+)\s*ha/i) : null
    const minHa = range ? numeric(range[1]) : plus ? numeric(plus[1]) : exact ? numeric(exact[1]) : null
    const maxHa = range ? numeric(range[2]) : null
    const combined = `${requirement} ${detail}`

    demandSignals.push({
      minHa,
      maxHa,
      crop: inferCrop(combined),
      region: inferRegion(combined),
      commune: inferCommune(combined),
      transactionType: inferOperation(combined),
      productionStatus: /en producci[oó]n|con flujo/i.test(combined) ? 'produccion' : null,
      rawRequirement: requirement,
      rawDetail: detail,
      fingerprint: fingerprint([SOURCE, requirement, detail]),
    })

    index += 1
  }

  return { listings, demandSignals }
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase server credentials')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function scrapeEvilasAgro(options: { dryRun?: boolean } = {}) {
  const startedAt = Date.now()
  const response = await fetch(SOURCE_URL, {
    headers: HEADERS,
    cache: 'no-store',
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new Error(`EVilas Agro ${SOURCE_URL} → ${response.status}`)

  const html = await response.text()
  const parsed = parseEvilasHome(html)

  if (options.dryRun) {
    return {
      source: SOURCE,
      found: parsed.listings.length + parsed.demandSignals.length,
      listings: parsed.listings,
      demandSignals: parsed.demandSignals,
      inserted: 0,
      updated: 0,
      errors: [],
      durationMs: Date.now() - startedAt,
      dryRun: true,
    }
  }

  const supabase = db()
  const now = new Date().toISOString()
  let inserted = 0
  let updated = 0
  const errors: string[] = []

  const { data: existingListings, error: existingError } = await supabase
    .from('competitor_listings')
    .select('id,external_key,fingerprint')
    .eq('source', SOURCE)
  if (existingError) throw new Error(existingError.message)
  const existingByKey = new Map((existingListings || []).map((item) => [item.external_key, item]))

  for (const listing of parsed.listings) {
    const existing = existingByKey.get(listing.externalKey)
    const payload = {
      source: SOURCE,
      external_key: listing.externalKey,
      title: listing.title,
      commune: listing.commune,
      region: listing.region,
      crop: listing.crop,
      operation: listing.operation,
      area_ha: listing.areaHa,
      planted_ha: listing.plantedHa,
      water_lps: listing.waterLps,
      water_raw: listing.waterRaw,
      price_amount: listing.priceAmount,
      price_currency: listing.priceCurrency,
      price_unit: listing.priceUnit,
      source_url: SOURCE_URL,
      raw_text: listing.rawText,
      fingerprint: listing.fingerprint,
      is_active: true,
      last_seen_at: now,
      updated_at: now,
    }

    const { data, error } = await supabase
      .from('competitor_listings')
      .upsert(payload, { onConflict: 'source,external_key' })
      .select('id')
      .single()

    if (error || !data) {
      errors.push(`listing ${listing.externalKey}: ${error?.message || 'no id returned'}`)
      continue
    }

    if (existing) updated += 1
    else inserted += 1

    if (!existing || existing.fingerprint !== listing.fingerprint) {
      const { error: snapshotError } = await supabase
        .from('competitor_listing_snapshots')
        .upsert({
          competitor_listing_id: data.id,
          fingerprint: listing.fingerprint,
          snapshot: payload,
          observed_at: now,
        }, { onConflict: 'competitor_listing_id,fingerprint', ignoreDuplicates: true })
      if (snapshotError) errors.push(`snapshot ${listing.externalKey}: ${snapshotError.message}`)
    }
  }

  if (parsed.listings.length) {
    const currentKeys = parsed.listings.map((listing) => listing.externalKey)
    const { error } = await supabase
      .from('competitor_listings')
      .update({ is_active: false, updated_at: now })
      .eq('source', SOURCE)
      .not('external_key', 'in', `(${currentKeys.map((key) => `"${key}"`).join(',')})`)
    if (error) errors.push(`listing deactivation: ${error.message}`)
  }

  const currentDemandFingerprints = parsed.demandSignals.map((signal) => signal.fingerprint)
  for (const signal of parsed.demandSignals) {
    const { data: prior } = await supabase
      .from('competitor_demand_signals')
      .select('id')
      .eq('fingerprint', signal.fingerprint)
      .maybeSingle()

    const { error } = await supabase
      .from('competitor_demand_signals')
      .upsert({
        source: SOURCE,
        fingerprint: signal.fingerprint,
        min_ha: signal.minHa,
        max_ha: signal.maxHa,
        crop: signal.crop,
        region: signal.region,
        commune: signal.commune,
        transaction_type: signal.transactionType,
        production_status: signal.productionStatus,
        raw_requirement: signal.rawRequirement,
        raw_detail: signal.rawDetail,
        source_url: SOURCE_URL,
        is_active: true,
        last_seen_at: now,
        updated_at: now,
      }, { onConflict: 'fingerprint' })

    if (error) errors.push(`demand ${signal.rawRequirement}: ${error.message}`)
    else if (prior) updated += 1
    else inserted += 1
  }

  if (currentDemandFingerprints.length) {
    const { error } = await supabase
      .from('competitor_demand_signals')
      .update({ is_active: false, updated_at: now })
      .eq('source', SOURCE)
      .not('fingerprint', 'in', `(${currentDemandFingerprints.map((key) => `"${key}"`).join(',')})`)
    if (error) errors.push(`demand deactivation: ${error.message}`)
  }

  return {
    source: SOURCE,
    found: parsed.listings.length + parsed.demandSignals.length,
    listingCount: parsed.listings.length,
    demandCount: parsed.demandSignals.length,
    inserted,
    updated,
    errors,
    durationMs: Date.now() - startedAt,
  }
}

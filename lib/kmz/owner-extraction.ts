export type OwnerExtractionConfidence = "candidate" | "probable" | "strong"

export type OwnerExtractionSource = "document-description" | "placemark-description" | "placemark-property" | "metadata"

export interface OwnerExtractionTarget {
  name?: string | null
  description?: string | null
  properties?: Record<string, any> | null
  metadata?: Record<string, any> | null
  source?: OwnerExtractionSource
}

export interface OwnerExtractionHit {
  ownerName?: string | null
  companyName?: string | null
  ownerLabel: string
  source: "kmz-description"
  sourceField: string
  confidence: OwnerExtractionConfidence
  evidenceText: string
  targetName?: string | null
  extractedAt: string
}

const COMPANY_HINT_PATTERN =
  /\b(SPA|S\.A\.?|SA|LTDA\.?|LIMITADA|EIRL|SOCIEDAD|INVERSIONES|AGRICOLA|AGRO|FORESTAL|INMOBILIARIA|EXPORTADORA|GANADERA|COMERCIAL|HOLDING)\b/i

const LABEL_SCORES: Array<{ pattern: RegExp; label: string; confidence: OwnerExtractionConfidence; companyPreferred?: boolean }> = [
  { pattern: /\b(?:dueno|duena|propietario|propietaria|titular)\b/i, label: "propietario", confidence: "strong" },
  { pattern: /\b(?:sociedad|razon social|empresa)\b/i, label: "sociedad", confidence: "strong", companyPreferred: true },
  { pattern: /\b(?:comprador|compradora)\b/i, label: "comprador", confidence: "probable" },
  { pattern: /\bowner\b/i, label: "owner", confidence: "probable" },
]

const FIELD_LABEL_PATTERN =
  /(?:^|[\n;|])\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ ._-]{3,40})\s*(?::|-|=|\||\t)\s*([^\n;|]{3,180})/g

function normalizeText(value?: string | null) {
  return `${value || ""}`
    .replace(/<!\[CDATA\[|\]\]>/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, " | ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function cleanOwnerValue(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[#:\-=\s]+/, "")
    .replace(/[.,;|\s]+$/, "")
    .trim()
}

function looksLikeNoise(value: string) {
  const cleaned = cleanOwnerValue(value)
  if (cleaned.length < 3) return true
  if (/^https?:\/\//i.test(cleaned)) return true
  if (/^\d+(?:[.,]\d+)?\s*(ha|m2|mts|metros)$/i.test(cleaned)) return true
  if (/^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+/.test(cleaned)) return true
  return false
}

function classifyValue(value: string, label: string, companyPreferred?: boolean) {
  const isCompany = companyPreferred || COMPANY_HINT_PATTERN.test(value)
  return isCompany
    ? { companyName: value, ownerName: null, ownerLabel: label }
    : { ownerName: value, companyName: null, ownerLabel: label }
}

function scoreLabel(rawLabel: string) {
  const normalized = fold(rawLabel)
  return LABEL_SCORES.find((entry) => entry.pattern.test(normalized)) || null
}

function buildHit(
  rawLabel: string,
  rawValue: string,
  sourceField: string,
  targetName?: string | null,
): OwnerExtractionHit | null {
  const labelMatch = scoreLabel(rawLabel)
  if (!labelMatch) return null

  const value = cleanOwnerValue(rawValue)
  if (looksLikeNoise(value)) return null

  const classified = classifyValue(value, labelMatch.label, labelMatch.companyPreferred)
  return {
    ...classified,
    source: "kmz-description",
    sourceField,
    confidence: labelMatch.confidence,
    evidenceText: `${rawLabel.trim()}: ${value}`,
    targetName: targetName || null,
    extractedAt: new Date().toISOString(),
  }
}

function extractFromText(text: string, sourceField: string, targetName?: string | null) {
  const normalized = normalizeText(text)
  if (!normalized) return []

  const hits: OwnerExtractionHit[] = []
  for (const match of normalized.matchAll(FIELD_LABEL_PATTERN)) {
    const hit = buildHit(match[1] || "", match[2] || "", sourceField, targetName)
    if (hit) hits.push(hit)
  }

  return hits
}

function extractFromProperties(properties: Record<string, any> | null | undefined, sourceField: string, targetName?: string | null) {
  const hits: OwnerExtractionHit[] = []
  if (!properties) return hits

  for (const [field, value] of Object.entries(properties)) {
    const labelMatch = scoreLabel(field)
    if (!labelMatch) continue

    if (typeof value === "string") {
      const hit = buildHit(field, value, `${sourceField}.${field}`, targetName)
      if (hit) hits.push(hit)
    }
  }

  return hits
}

function confidenceWeight(confidence: OwnerExtractionConfidence) {
  if (confidence === "strong") return 3
  if (confidence === "probable") return 2
  return 1
}

export function chooseBestOwnerCandidate(hits: OwnerExtractionHit[]) {
  return [...hits].sort((a, b) => {
    const confidenceDiff = confidenceWeight(b.confidence) - confidenceWeight(a.confidence)
    if (confidenceDiff !== 0) return confidenceDiff

    const companyDiff = Number(Boolean(b.companyName)) - Number(Boolean(a.companyName))
    if (companyDiff !== 0) return companyDiff

    return b.evidenceText.length - a.evidenceText.length
  })[0] || null
}

export function extractOwnerHitsFromTargets(targets: OwnerExtractionTarget[]) {
  const hits: OwnerExtractionHit[] = []

  for (const target of targets) {
    const targetName = target.name || null
    if (target.description) {
      hits.push(...extractFromText(target.description, target.source || "placemark-description", targetName))
    }

    hits.push(...extractFromProperties(target.properties, target.source || "placemark-property", targetName))
    hits.push(...extractFromProperties(target.metadata, target.source || "metadata", targetName))
  }

  const seen = new Set<string>()
  return hits.filter((hit) => {
    const key = `${hit.ownerLabel}|${hit.ownerName || hit.companyName}|${hit.evidenceText}`.toUpperCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function extractOwnerCandidateFromTargets(targets: OwnerExtractionTarget[]) {
  return chooseBestOwnerCandidate(extractOwnerHitsFromTargets(targets))
}

export function toOwnerEvidenceRecord(hit: OwnerExtractionHit) {
  const ownerLabel = hit.companyName || hit.ownerName || null
  return {
    rol: null,
    ownerName: hit.ownerName || null,
    companyName: hit.companyName || null,
    ownerLabel,
    documentType: "kmz-description",
    documentUrl: null,
    notes: hit.evidenceText,
    sourceType: "kmz-description",
    confidence: hit.confidence,
    authoritative: false,
    savedAt: hit.extractedAt,
    source: "kmz-description",
    sourceField: hit.sourceField,
    targetName: hit.targetName || null,
  }
}

export function toPublicOwnerCandidate(hit: OwnerExtractionHit) {
  return {
    rol: null,
    owner: hit.companyName || hit.ownerName || null,
    ownerName: hit.ownerName || null,
    companyName: hit.companyName || null,
    sourceType: "kmz-description",
    confidence: hit.confidence,
    documentType: "kmz-description",
    documentUrl: null,
    notes: hit.evidenceText,
    evidenceText: hit.evidenceText,
    sourceField: hit.sourceField,
    targetName: hit.targetName || null,
    savedAt: hit.extractedAt,
  }
}

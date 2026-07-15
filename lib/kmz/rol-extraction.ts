export type RolExtractionSource = "name" | "description" | "property" | "metadata"

export interface RolExtractionHit {
  rol: string
  source: RolExtractionSource
  field?: string
  context: string
}

export interface RolExtractionTarget {
  name: string
  description?: string | null
  properties?: Record<string, any> | null
  metadata?: Record<string, any> | null
}

const GENERIC_ROL_PATTERN = /\b\d{1,5}-\d{1,4}(?:-[A-Z])?\b/g
const LABELLED_ROL_PATTERN =
  /\b(?:rol(?:\s+de\s+avaluo)?|rol\s+predial|rol\s+semestral|n(?:ro|o)?\.?\s*rol|n(?:ro|o)?\.?\s*de\s*rol)\s*[:#-]?\s*(\d{1,5}-\d{1,4}(?:-[A-Z])?)\b/gi
const MZA_PRD_PATTERN =
  /\b(?:manzana|mz)\s*[:#-]?\s*(\d{1,4})\s*(?:\/|,|-|\s)+\s*(?:predio|prd|pred|p)\s*[:#-]?\s*(\d{1,4})(?:\s*[A-Z])?\b/gi

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeRol(rol: string): string {
  return rol
    .trim()
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .toUpperCase()
}

function pushHit(
  hits: RolExtractionHit[],
  seen: Set<string>,
  rol: string,
  source: RolExtractionSource,
  field: string | undefined,
  context: string,
) {
  const normalized = normalizeRol(rol)
  if (!normalized || seen.has(normalized)) {
    return
  }

  seen.add(normalized)
  hits.push({
    rol: normalized,
    source,
    field,
    context: context.slice(0, 240),
  })
}

function extractFromText(
  text: string,
  source: RolExtractionSource,
  field: string | undefined,
  hits: RolExtractionHit[],
  seen: Set<string>,
) {
  const compact = normalizeText(text)
  if (!compact) return

  for (const match of compact.matchAll(LABELLED_ROL_PATTERN)) {
    const rol = match[1]
    if (rol) {
      pushHit(hits, seen, rol, source, field, compact)
    }
  }

  for (const match of compact.matchAll(MZA_PRD_PATTERN)) {
    const manzana = match[1]
    const predio = match[2]
    if (manzana && predio) {
      pushHit(hits, seen, `${manzana}-${predio}`, source, field, compact)
    }
  }

  for (const match of compact.matchAll(GENERIC_ROL_PATTERN)) {
    const rol = match[0]
    if (rol) {
      pushHit(hits, seen, rol, source, field, compact)
    }
  }
}

export function extractRolsFromTarget(target: RolExtractionTarget): RolExtractionHit[] {
  const hits: RolExtractionHit[] = []
  const seen = new Set<string>()

  extractFromText(target.name, "name", "name", hits, seen)

  if (target.description) {
    extractFromText(target.description, "description", "description", hits, seen)
  }

  if (target.properties) {
    for (const [field, value] of Object.entries(target.properties)) {
      if (typeof value === "string") {
        extractFromText(value, "property", field, hits, seen)
        continue
      }

      if (Array.isArray(value)) {
        for (const entry of value) {
          if (typeof entry === "string") {
            extractFromText(entry, "property", field, hits, seen)
          }
        }
      }
    }
  }

  if (target.metadata) {
    for (const [field, value] of Object.entries(target.metadata)) {
      if (typeof value === "string") {
        extractFromText(value, "metadata", field, hits, seen)
      }
    }
  }

  return hits
}

export function extractRolNumbersFromTargets(targets: RolExtractionTarget[]): string[] {
  const hits = new Map<string, RolExtractionHit>()

  for (const target of targets) {
    for (const hit of extractRolsFromTarget(target)) {
      if (!hits.has(hit.rol)) {
        hits.set(hit.rol, hit)
      }
    }
  }

  return Array.from(hits.keys())
}

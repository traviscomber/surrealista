import { CHILEAN_REGIONS } from "../chile-locations"

export function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function compactKey(value: unknown) {
  return normalizeSearchText(value).replace(/\s+/g, "")
}

function normalizeRegionKey(value: unknown) {
  return normalizeSearchText(value)
    .replace(/^region del /, "")
    .replace(/^region de la /, "")
    .replace(/^region de /, "")
    .replace(/^region /, "")
    .replace(/^del /, "")
    .replace(/^de la /, "")
    .replace(/^de /, "")
    .trim()
}

function regionMatches(candidate: unknown, wanted: unknown) {
  const candidateKey = normalizeRegionKey(candidate)
  const wantedKey = normalizeRegionKey(wanted)
  if (!candidateKey || !wantedKey) return false
  return candidateKey === wantedKey || compactKey(candidateKey) === compactKey(wantedKey)
}

export function canonicalRegionName(value: unknown) {
  const raw = String(value ?? "").trim()
  if (!raw) return ""
  const region = CHILEAN_REGIONS.find((item) => {
    const candidates = [item.name, item.shortName, item.code]
    return candidates.some((candidate) => regionMatches(candidate, raw))
  })
  return region?.shortName || raw
}

export function canonicalCommuneName(value: unknown, regionValue?: unknown) {
  const raw = String(value ?? "").trim()
  if (!raw) return ""
  const key = normalizeSearchText(raw)
  const regions = regionValue
    ? CHILEAN_REGIONS.filter((item) => [item.name, item.shortName, item.code].some((candidate) => regionMatches(candidate, regionValue)))
    : CHILEAN_REGIONS

  for (const region of regions) {
    for (const province of region.provincias) {
      const commune = province.comunas.find((item) => normalizeSearchText(item.name) === key)
      if (commune) return commune.name
    }
  }

  return raw
}

export function normalizeProspectingCriteria<T extends {
  region?: string | null
  commune?: string | null
  species?: string | null
  minHa?: number | null
  maxHa?: number | null
}>(criteria: T): T {
  const region = canonicalRegionName(criteria.region)
  const commune = canonicalCommuneName(criteria.commune, region || criteria.region)
  return {
    ...criteria,
    region: region || null,
    commune: commune || null,
    species: String(criteria.species ?? "").trim() || null,
  }
}

export function sameNormalizedLocation(a: unknown, b: unknown) {
  return normalizeSearchText(a) === normalizeSearchText(b)
}

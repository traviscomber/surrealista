import { formatRol, parseRolParts } from "@/lib/sii/types"

export type NeighborRoleRelation = "same-manzana-nearby-predio" | "adjacent-manzana-nearby-predio"

export interface NeighborRoleOptions {
  predioWindow?: number
  includeAdjacentManzanas?: boolean
  manzanaWindow?: number
  maxRoles?: number
}

export interface NeighborRoleCandidate {
  rol: string
  baseRol: string
  comuna: string
  manzana: string
  predio: string
  relation: NeighborRoleRelation
  predioDistance: number
  manzanaDistance: number
  distanceScore: number
}

const DEFAULT_PREDIO_WINDOW = 10
const DEFAULT_MANZANA_WINDOW = 1
const DEFAULT_MAX_ROLES = 80
const MAX_PREDIO_WINDOW = 50
const MAX_MANZANA_WINDOW = 3

function normalizeRolValue(role?: string | null) {
  return `${role || ""}`.trim().toUpperCase()
}

function parseNumberWithSuffix(value?: string | null) {
  const match = normalizeRolValue(value).match(/^(\d+)([A-Z]?)$/)
  if (!match) return null

  return {
    value: Number(match[1]),
    width: match[1].length,
    suffix: match[2] || "",
  }
}

function formatNumberWithSuffix(value: number, width: number, suffix = "") {
  return `${Math.max(value, 0)}`.padStart(width, "0") + suffix
}

function clampInteger(value: number | undefined, fallback: number, min: number, max: number) {
  if (!Number.isFinite(value)) return fallback
  return Math.min(Math.max(Math.trunc(value as number), min), max)
}

export function buildNeighborRoles(role?: string | null, options: NeighborRoleOptions = {}): NeighborRoleCandidate[] {
  const baseRol = normalizeRolValue(role)
  const parts = parseRolParts(baseRol)
  const basePredio = parseNumberWithSuffix(parts?.predio)
  const baseManzana = parseNumberWithSuffix(parts?.manzana)

  if (!parts?.comuna || !parts.manzana || !parts.predio || !basePredio) {
    return []
  }

  const predioWindow = clampInteger(options.predioWindow, DEFAULT_PREDIO_WINDOW, 1, MAX_PREDIO_WINDOW)
  const manzanaWindow = options.includeAdjacentManzanas
    ? clampInteger(options.manzanaWindow, DEFAULT_MANZANA_WINDOW, 1, MAX_MANZANA_WINDOW)
    : 0
  const maxRoles = clampInteger(options.maxRoles, DEFAULT_MAX_ROLES, 1, 300)
  const candidates: NeighborRoleCandidate[] = []
  const seen = new Set<string>([baseRol])

  function addCandidate(manzanaValue: string, predioValue: number, manzanaDistance: number, predioDistance: number) {
    if (predioValue <= 0 || predioDistance === 0) return

    const predio = formatNumberWithSuffix(predioValue, basePredio.width, basePredio.suffix)
    const rol = formatRol({ comuna: parts.comuna, manzana: manzanaValue, predio }).toUpperCase()
    if (seen.has(rol)) return

    seen.add(rol)
    candidates.push({
      rol,
      baseRol,
      comuna: parts.comuna,
      manzana: manzanaValue,
      predio,
      relation: manzanaDistance === 0 ? "same-manzana-nearby-predio" : "adjacent-manzana-nearby-predio",
      predioDistance,
      manzanaDistance,
      distanceScore: Math.abs(predioDistance) + Math.abs(manzanaDistance) * 20,
    })
  }

  for (let offset = 1; offset <= predioWindow; offset += 1) {
    addCandidate(parts.manzana, basePredio.value - offset, 0, -offset)
    addCandidate(parts.manzana, basePredio.value + offset, 0, offset)
  }

  if (baseManzana && manzanaWindow > 0) {
    for (let manzanaOffset = 1; manzanaOffset <= manzanaWindow; manzanaOffset += 1) {
      for (const direction of [-1, 1]) {
        const manzanaValue = baseManzana.value + manzanaOffset * direction
        if (manzanaValue <= 0) continue

        const manzana = formatNumberWithSuffix(manzanaValue, baseManzana.width, baseManzana.suffix)
        for (let predioOffset = -predioWindow; predioOffset <= predioWindow; predioOffset += 1) {
          addCandidate(manzana, basePredio.value + predioOffset, manzanaOffset * direction, predioOffset)
        }
      }
    }
  }

  return candidates.sort((a, b) => a.distanceScore - b.distanceScore || a.rol.localeCompare(b.rol, "es")).slice(0, maxRoles)
}

export function buildNeighborRolesForRoles(roles?: string[] | null, options: NeighborRoleOptions = {}) {
  const seen = new Set<string>()
  const candidates: NeighborRoleCandidate[] = []

  for (const role of roles || []) {
    for (const candidate of buildNeighborRoles(role, options)) {
      if (seen.has(candidate.rol)) continue
      seen.add(candidate.rol)
      candidates.push(candidate)
    }
  }

  return candidates.sort((a, b) => a.distanceScore - b.distanceScore || a.rol.localeCompare(b.rol, "es"))
}

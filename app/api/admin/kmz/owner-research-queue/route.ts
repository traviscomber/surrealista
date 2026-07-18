import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { parseRolParts } from "@/lib/sii/types"

export const runtime = "nodejs"
export const maxDuration = 180

type QueueStatus = "pending" | "evidence-found" | "confirmed" | "skipped"
type QueueTier = "critical" | "high" | "medium" | "low"

type QueueRequest = {
  limit?: number
  offset?: number
  persist?: boolean
  dryRun?: boolean
  onlyMissingOwner?: boolean
  onlyWithRole?: boolean
  forceRefresh?: boolean
}

type QueueQueryFilters = {
  limit: number
  offset: number
  tier: "all" | QueueTier
  status: "all" | QueueStatus
  groupBy: "kmz" | "role"
  onlyMissingOwner: boolean
  onlyWithRole: boolean
}

type KmzRecord = {
  id: string
  file_name: string
  region: string | null
  owner: string | null
  google_docs_link: string | null
  placemarks_count: number | null
  rol_numbers: string[] | null
  metadata: Record<string, any> | null
}

type QueueEntry = ReturnType<typeof computeQueueEntry>

type QueueRecord = {
  id: string
  file_name: string
  region: string | null
  owner?: string | null
  rol_numbers: string[]
  owner_research_queue: QueueEntry
}

type RoleQueueItem = {
  rol: string
  priorityScore: number
  priorityTier: QueueTier
  status: QueueStatus
  southFocus: boolean
  resolvedAt?: string | null
  resolvedRecently?: boolean
  affectedKmzCount: number
  evidenceCount: number
  confirmedCount: number
  regions: string[]
  sampleKmz: Array<{
    id: string
    file_name: string
    region: string | null
  }>
  reasons: string[]
  suggestedNextStep: string
  searchQueries: string[]
  webOwner?: string | null
  webOwnerConfidence?: number | null
}

const SOUTH_PRIORITY_REGION_KEYS = new Set([
  "araucania",
  "los rios",
  "los lagos",
  "aysen",
  "magallanes y de la antartica chilena",
  "biobio",
  "nuble",
])

const COMPANY_HINT_PATTERN =
  /\b(SPA|S\.A\.|LTDA|LIMITADA|EIRL|SOCIEDAD|INVERSIONES|AGRICOLA|AGRO|FORESTAL|INMOBILIARIA|EXPORTADORA|PESQUERA)\b/i

const RECENT_RESOLUTION_WINDOW_DAYS = 14

function normalizeRoleValue(role?: string | null) {
  const normalized = `${role || ""}`.trim().toUpperCase()
  return normalized || null
}

function isResearchableRol(role?: string | null) {
  const normalized = normalizeRoleValue(role)
  if (!normalized) return false

  const parts = parseRolParts(normalized)
  if (!parts?.comuna || !parts.manzana || !parts.predio) {
    return false
  }

  return /^\d{4,5}$/.test(parts.comuna) && /^\d{1,5}[A-Z]?$/.test(parts.manzana) && /^\d{1,5}[A-Z]?$/.test(parts.predio)
}

function getResearchableRoles(roles?: string[] | null) {
  return Array.from(
    new Set(
      (roles || [])
        .map((role) => normalizeRoleValue(role))
        .filter((role): role is string => Boolean(role) && isResearchableRol(role)),
    ),
  )
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(url, key)
}

function normalizeRegion(value?: string | null) {
  return (value || "").trim()
}

function toRegionKey(value?: string | null) {
  return normalizeRegion(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^region\s+de\s+/, "")
    .replace(/^region\s+del\s+/, "")
    .replace(/\s+/g, " ")
    .trim()
}

function toCanonicalSouthRegionKey(value?: string | null) {
  const key = toRegionKey(value)
  if (!key) return ""
  if (key.includes("araucan")) return "araucania"
  if (key.includes("los rios")) return "los rios"
  if (key.includes("los lagos")) return "los lagos"
  if (key.includes("aysen") || key.includes("ibanez")) return "aysen"
  if (key.includes("magallanes")) return "magallanes y de la antartica chilena"
  if (key.includes("bio bio") || key.includes("biobio")) return "biobio"
  if (key.includes("nuble")) return "nuble"
  return key
}

function getRecentResolutionInfo(metadata?: Record<string, any> | null) {
  const candidates = [metadata?.manual_role_assignment?.assigned_at, metadata?.sii_point_resolution?.resolved_at]
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))

  if (candidates.length === 0) {
    return {
      resolvedAt: null,
      resolvedRecently: false,
      resolutionSource: null,
    }
  }

  const resolvedAtRaw = candidates
    .map((value) => {
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : { value, date }
    })
    .filter((item): item is { value: string; date: Date } => Boolean(item))
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0]

  if (!resolvedAtRaw) {
    return {
      resolvedAt: null,
      resolvedRecently: false,
      resolutionSource: null,
    }
  }

  const resolvedAtDate = resolvedAtRaw.date
  if (Number.isNaN(resolvedAtDate.getTime())) {
    return {
      resolvedAt: null,
      resolvedRecently: false,
      resolutionSource: null,
    }
  }

  const ageMs = Date.now() - resolvedAtDate.getTime()
  const recentWindowMs = RECENT_RESOLUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000

  return {
    resolvedAt: resolvedAtDate.toISOString(),
    resolvedRecently: ageMs >= 0 && ageMs <= recentWindowMs,
    resolutionSource:
      metadata?.manual_role_assignment?.assigned_at === resolvedAtRaw.value ? "manual-role-assignment" : "sii-point-resolution",
  }
}

function buildSearchQueries(fileName: string, region?: string | null, roles?: string[] | null) {
  const cleanName = fileName.replace(/\.kmz$/i, "").replace(/[()]/g, " ").replace(/\s+/g, " ").trim()
  const role = roles?.[0]
  const regionLabel = normalizeRegion(region)

  const queries = [
    role ? `rol ${role}` : null,
    role ? `"${role}" "${cleanName}"` : null,
    role && regionLabel ? `"${role}" "${regionLabel}"` : null,
    role ? `"${role}" sociedad OR limitada OR spa OR sa` : null,
    role ? `"${role}" propietario OR dueno` : null,
  ]

  return Array.from(new Set(queries.filter(Boolean) as string[])).slice(0, 5)
}

function hasConfirmedOwner(record: KmzRecord) {
  const metadata = record.metadata || {}
  return (
    Boolean(record.owner?.trim()) ||
    Boolean(metadata.latest_cbr_owner_record) ||
    (Array.isArray(metadata.cbr_owner_records) && metadata.cbr_owner_records.length > 0)
  )
}

function getQueueStatus(record: KmzRecord): QueueStatus {
  if (hasConfirmedOwner(record)) return "confirmed"

  const metadata = record.metadata || {}
  if (metadata.public_owner_candidate || metadata.latest_owner_evidence) {
    return "evidence-found"
  }

  return "pending"
}

function getPriorityTier(score: number): QueueTier {
  if (score >= 90) return "critical"
  if (score >= 70) return "high"
  if (score >= 45) return "medium"
  return "low"
}

function computeQueueEntry(record: KmzRecord, roleFrequency: Map<string, number>) {
  const metadata = record.metadata || {}
  const roles = getResearchableRoles(record.rol_numbers)
  const primaryRol = roles[0] || null
  const region = normalizeRegion(record.region)
  const hasPublicCandidate = Boolean(metadata.public_owner_candidate)
  const hasEvidenceRecords = Array.isArray(metadata.owner_evidence_records) && metadata.owner_evidence_records.length > 0
  const hasGoogleDocsLink = Boolean(record.google_docs_link)
  const hasCbrRecord =
    Boolean(metadata.latest_cbr_owner_record) ||
    (Array.isArray(metadata.cbr_owner_records) && metadata.cbr_owner_records.length > 0)
  const { resolvedAt, resolvedRecently, resolutionSource } = getRecentResolutionInfo(metadata)
  const southFocus = SOUTH_PRIORITY_REGION_KEYS.has(toCanonicalSouthRegionKey(region))
  const duplicateRoleCount = primaryRol ? roleFrequency.get(primaryRol) || 1 : 1
  const companyHint =
    COMPANY_HINT_PATTERN.test(record.file_name || "") ||
    COMPANY_HINT_PATTERN.test(JSON.stringify(metadata.public_owner_candidate || {}))

  let priorityScore = 0
  const reasons: string[] = []

  if (roles.length > 0) {
    priorityScore += 35
    reasons.push("Tiene rol SII resuelto")
  }

  if (getQueueStatus(record) === "pending") {
    priorityScore += 12
    reasons.push("Aun no tiene investigacion de dueno o sociedad")
  } else if (getQueueStatus(record) === "evidence-found") {
    priorityScore += 8
    reasons.push("Ya existe pista publica; falta validacion")
  }

  if (roles.length === 1) {
    priorityScore += 10
    reasons.push("Tiene un rol principal claro")
  } else if (roles.length > 1) {
    priorityScore += 4
    reasons.push("Tiene multiples roles que pueden requerir desambiguacion")
  }

  if (southFocus) {
    priorityScore += 18
    reasons.push("Pertenece a una region prioritaria del sur")
  }

  if (duplicateRoleCount > 1) {
    priorityScore += Math.min(duplicateRoleCount * 4, 20)
    reasons.push(`Comparte rol con ${duplicateRoleCount - 1} KMZ mas`)
  }

  if (resolvedRecently) {
    priorityScore += 14
    reasons.push(
      resolutionSource === "manual-role-assignment"
        ? "Rol asignado recientemente; conviene investigar mientras la pista esta fresca"
        : "Rol resuelto recientemente; conviene aprovechar la trazabilidad fresca",
    )
  }

  if (hasPublicCandidate) {
    priorityScore += 16
    reasons.push("Ya existe candidato publico de dueno o sociedad")
  }

  if (hasEvidenceRecords) {
    priorityScore += 12
    reasons.push("Ya existe evidencia publica acumulada")
  }

  if (hasGoogleDocsLink) {
    priorityScore += 8
    reasons.push("Tiene link documental interno asociado")
  }

  if (companyHint) {
    priorityScore += 7
    reasons.push("Hay indicios de sociedad en nombre o evidencia")
  }

  if ((record.placemarks_count || 0) > 0 && (record.placemarks_count || 0) <= 3) {
    priorityScore += 6
    reasons.push("Predio acotado; investigacion mas rapida")
  }

  if (hasCbrRecord || record.owner?.trim()) {
    priorityScore = 0
    reasons.length = 0
    reasons.push("Ya tiene dueno confirmado o respaldo CBR")
  }

  return {
    status: getQueueStatus(record),
    priorityScore,
    priorityTier: getPriorityTier(priorityScore),
    primaryRol,
    roleCount: roles.length,
    duplicateRoleCount,
    southFocus,
    hasPublicCandidate,
    hasEvidenceRecords,
    hasGoogleDocsLink,
    hasConfirmedOwner: Boolean(record.owner?.trim()) || hasCbrRecord,
    resolvedAt,
    resolvedRecently,
    resolutionSource,
    companyHint,
    reasons,
    suggestedNextStep:
      hasPublicCandidate || hasEvidenceRecords
        ? "Validar candidato en Google/CBR y registrar confirmacion si corresponde"
        : "Hacer busqueda web por rol exacto y registrar candidato antes de abrir CBR",
    searchQueries: buildSearchQueries(record.file_name || "", region, roles),
    generatedAt: new Date().toISOString(),
    queueVersion: 2,
  }
}

function sortQueue(a: QueueRecord, b: QueueRecord) {
  const scoreDiff = (b.owner_research_queue?.priorityScore || 0) - (a.owner_research_queue?.priorityScore || 0)
  if (scoreDiff !== 0) return scoreDiff
  return a.file_name.localeCompare(b.file_name, "es")
}

function sortRoleQueue(a: RoleQueueItem, b: RoleQueueItem) {
  const scoreDiff = b.priorityScore - a.priorityScore
  if (scoreDiff !== 0) return scoreDiff

  const impactDiff = b.affectedKmzCount - a.affectedKmzCount
  if (impactDiff !== 0) return impactDiff

  return a.rol.localeCompare(b.rol, "es")
}

async function buildRoleQueue(records: QueueRecord[], supabase: any) {
  const grouped = new Map<string, RoleQueueItem>()

  for (const record of records) {
    const storedPrimaryRol = normalizeRoleValue(record.owner_research_queue.primaryRol)
    const primaryRol = storedPrimaryRol && isResearchableRol(storedPrimaryRol) ? storedPrimaryRol : record.rol_numbers[0]
    if (!primaryRol) continue

    const nextSample = {
      id: record.id,
      file_name: record.file_name,
      region: record.region,
    }

    const existing = grouped.get(primaryRol)
    if (!existing) {
      grouped.set(primaryRol, {
        rol: primaryRol,
        priorityScore: record.owner_research_queue.priorityScore || 0,
        priorityTier: record.owner_research_queue.priorityTier,
        status: record.owner_research_queue.status,
        southFocus: Boolean(record.owner_research_queue.southFocus),
        resolvedAt: record.owner_research_queue.resolvedAt || null,
        resolvedRecently: Boolean(record.owner_research_queue.resolvedRecently),
        affectedKmzCount: 1,
        evidenceCount: record.owner_research_queue.status === "evidence-found" ? 1 : 0,
        confirmedCount: record.owner_research_queue.status === "confirmed" ? 1 : 0,
        regions: record.region ? [record.region] : [],
        sampleKmz: [nextSample],
        reasons: [...(record.owner_research_queue.reasons || [])],
        suggestedNextStep: record.owner_research_queue.suggestedNextStep,
        searchQueries: [...(record.owner_research_queue.searchQueries || [])].slice(0, 5),
      })
      continue
    }

    existing.affectedKmzCount += 1
    if (record.owner_research_queue.status === "evidence-found") existing.evidenceCount += 1
    if (record.owner_research_queue.status === "confirmed") existing.confirmedCount += 1
    if (record.region && !existing.regions.includes(record.region)) existing.regions.push(record.region)
    if (existing.sampleKmz.length < 3) existing.sampleKmz.push(nextSample)
    existing.southFocus = existing.southFocus || Boolean(record.owner_research_queue.southFocus)
    existing.resolvedRecently = existing.resolvedRecently || Boolean(record.owner_research_queue.resolvedRecently)

    if (!existing.resolvedAt && record.owner_research_queue.resolvedAt) {
      existing.resolvedAt = record.owner_research_queue.resolvedAt
    }

    if ((record.owner_research_queue.priorityScore || 0) > existing.priorityScore) {
      existing.priorityScore = record.owner_research_queue.priorityScore || 0
      existing.priorityTier = record.owner_research_queue.priorityTier
      existing.suggestedNextStep = record.owner_research_queue.suggestedNextStep
      existing.searchQueries = [...(record.owner_research_queue.searchQueries || [])].slice(0, 5)
      existing.resolvedAt = record.owner_research_queue.resolvedAt || existing.resolvedAt || null
      existing.resolvedRecently = Boolean(record.owner_research_queue.resolvedRecently) || existing.resolvedRecently
    }

    for (const reason of record.owner_research_queue.reasons || []) {
      if (!existing.reasons.includes(reason)) existing.reasons.push(reason)
    }
  }

  const roleQueue = Array.from(grouped.values()).map((item) => {
    let status: QueueStatus = "pending"
    if (item.confirmedCount === item.affectedKmzCount) {
      status = "confirmed"
    } else if (item.evidenceCount > 0) {
      status = "evidence-found"
    }

    const impactBoost = Math.min((item.affectedKmzCount - 1) * 8, 32)
    const evidenceBoost = Math.min(item.evidenceCount * 6, 18)
    const recentBoost = item.resolvedRecently ? 6 : 0
    const southBoost = item.southFocus ? 4 : 0
    const groupedPriorityScore = Math.min(item.priorityScore + impactBoost + evidenceBoost + recentBoost + southBoost, 100)

    return {
      ...item,
      priorityScore: groupedPriorityScore,
      priorityTier: getPriorityTier(groupedPriorityScore),
      status,
      reasons: item.reasons.slice(0, 6),
      searchQueries: item.searchQueries.slice(0, 5),
      regions: item.regions.sort((a, b) => a.localeCompare(b, "es")),
      sampleKmz: item.sampleKmz.sort((a, b) => a.file_name.localeCompare(b.file_name, "es")),
    }
  })

  // Fetch owner information for each role's sample KMZ
  for (const item of roleQueue) {
    if (item.sampleKmz.length > 0) {
      try {
        const kmzIds = item.sampleKmz.map((k) => k.id)
        const { data: kmzOwners } = await supabase
          .from("kmz_collection")
          .select("metadata->>'web_owner' as web_owner, metadata->>'web_owner_confidence' as web_owner_confidence")
          .in("id", kmzIds)
          .limit(1)

        if (kmzOwners && kmzOwners.length > 0 && kmzOwners[0].web_owner) {
          item.webOwner = kmzOwners[0].web_owner
          item.webOwnerConfidence = kmzOwners[0].web_owner_confidence ? Number(kmzOwners[0].web_owner_confidence) : null
        }
      } catch (error) {
        console.log("[buildRoleQueue] Could not fetch owner info:", error)
      }
    }
  }

  roleQueue.sort(sortRoleQueue)
  return roleQueue
}

function buildQueueCounts<T extends { priorityTier: QueueTier; status: QueueStatus }>(items: T[]) {
  return {
    critical: items.filter((item) => item.priorityTier === "critical").length,
    high: items.filter((item) => item.priorityTier === "high").length,
    medium: items.filter((item) => item.priorityTier === "medium").length,
    low: items.filter((item) => item.priorityTier === "low").length,
    evidenceFound: items.filter((item) => item.status === "evidence-found").length,
    pending: items.filter((item) => item.status === "pending").length,
  }
}

function getQueryFilters(request: Request): QueueQueryFilters {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || "40"), 1), 2500)
  const offset = Math.max(Number(searchParams.get("offset") || "0"), 0)
  const tierRaw = `${searchParams.get("tier") || "all"}`.toLowerCase()
  const statusRaw = `${searchParams.get("status") || "all"}`.toLowerCase()
  const groupByRaw = `${searchParams.get("groupBy") || "role"}`.toLowerCase()
  const onlyMissingOwnerRaw = searchParams.get("onlyMissingOwner")
  const onlyWithRoleRaw = searchParams.get("onlyWithRole")

  const tier: "all" | QueueTier =
    tierRaw === "critical" || tierRaw === "high" || tierRaw === "medium" || tierRaw === "low" ? tierRaw : "all"
  const status: "all" | QueueStatus =
    statusRaw === "pending" || statusRaw === "evidence-found" || statusRaw === "confirmed" || statusRaw === "skipped"
      ? statusRaw
      : "all"
  const groupBy: "kmz" | "role" = groupByRaw === "kmz" ? "kmz" : "role"

  return {
    limit,
    offset,
    tier,
    status,
    groupBy,
    onlyMissingOwner: onlyMissingOwnerRaw === null ? true : onlyMissingOwnerRaw !== "false",
    onlyWithRole: onlyWithRoleRaw === null ? true : onlyWithRoleRaw !== "false",
  }
}

function shouldIncludeQueueItem(
  item: { priorityTier: QueueTier; status: QueueStatus },
  filters: Pick<QueueQueryFilters, "tier" | "status">,
) {
  if (filters.tier !== "all" && item.priorityTier !== filters.tier) return false
  if (filters.status !== "all" && item.status !== filters.status) return false
  return true
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

async function fetchKmzRecords(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const pageSize = 1000
  const results: KmzRecord[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from("kmz_collection")
      .select("id, file_name, region, owner, google_docs_link, placemarks_count, rol_numbers, metadata")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    const page = (data || []) as KmzRecord[]
    results.push(...page)

    if (page.length < pageSize) {
      break
    }

    offset += pageSize
  }

  return results
}

function filterCandidateRecords(records: KmzRecord[], filters: Pick<QueueQueryFilters, "onlyMissingOwner" | "onlyWithRole">) {
  return records.filter((record) => {
    const hasRole = getResearchableRoles(record.rol_numbers).length > 0
    const missingOwner = !hasConfirmedOwner(record)
    if (filters.onlyWithRole && !hasRole) return false
    if (filters.onlyMissingOwner && !missingOwner) return false
    return true
  })
}

function buildRoleFrequency(records: KmzRecord[]) {
  const roleFrequency = new Map<string, number>()
  for (const record of records) {
    for (const role of getResearchableRoles(record.rol_numbers)) {
      roleFrequency.set(role, (roleFrequency.get(role) || 0) + 1)
    }
  }
  return roleFrequency
}

function toQueueRecord(record: KmzRecord, roleFrequency: Map<string, number>, forceRefresh = false): QueueRecord {
  const computed = computeQueueEntry(record, roleFrequency)
  const stored = !forceRefresh && record.metadata?.owner_research_queue ? record.metadata.owner_research_queue : null
  const storedStatus: QueueStatus | null =
    stored?.status === "pending" ||
    stored?.status === "evidence-found" ||
    stored?.status === "confirmed" ||
    stored?.status === "skipped"
      ? stored.status
      : null
  const effectiveStatus: QueueStatus = storedStatus === "skipped" ? "skipped" : computed.status

  return {
    id: record.id,
    file_name: record.file_name,
    region: record.region,
    owner: record.owner,
    rol_numbers: getResearchableRoles(record.rol_numbers),
    owner_research_queue: {
      ...computed,
      status: effectiveStatus,
      previousGeneratedAt: stored?.generatedAt || null,
    },
  }
}

async function loadQueueRecords(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  filters: Pick<QueueQueryFilters, "onlyMissingOwner" | "onlyWithRole">,
  forceRefresh = false,
) {
  const allRecords = await fetchKmzRecords(supabase)
  const candidateRecords = filterCandidateRecords(allRecords, filters)
  const roleFrequency = buildRoleFrequency(candidateRecords)

  const queueRecords = candidateRecords.map((record) => toQueueRecord(record, roleFrequency, forceRefresh))
  queueRecords.sort(sortQueue)

  return {
    allRecords,
    candidateRecords,
    queueRecords,
  }
}

export async function GET(request: Request) {
  try {
    const filters = getQueryFilters(request)
    const supabase = getSupabaseAdmin()
    const { allRecords, candidateRecords, queueRecords } = await loadQueueRecords(supabase, filters)
    const roleQueue = await buildRoleQueue(queueRecords, supabase)

    if (filters.groupBy === "kmz") {
      const filtered = queueRecords
        .filter((item) => shouldIncludeQueueItem(item.owner_research_queue, filters))
        .slice(filters.offset, filters.offset + filters.limit)

      return NextResponse.json({
        success: true,
        groupBy: "kmz",
        totalActive: allRecords.length,
        totalCandidates: candidateRecords.length,
        total: queueRecords.filter((item) => shouldIncludeQueueItem(item.owner_research_queue, filters)).length,
        counts: buildQueueCounts(queueRecords.map((item) => item.owner_research_queue).filter((item) => shouldIncludeQueueItem(item, filters))),
        results: filtered,
      })
    }

    const filteredRoleQueue = roleQueue.filter((item) => shouldIncludeQueueItem(item, filters))

    return NextResponse.json({
      success: true,
      groupBy: "role",
      totalActive: allRecords.length,
      totalCandidates: candidateRecords.length,
      total: filteredRoleQueue.length,
      counts: buildQueueCounts(filteredRoleQueue),
      results: filteredRoleQueue.slice(filters.offset, filters.offset + filters.limit),
    })
  } catch (error: any) {
    console.error("[Owner research queue] GET error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to read owner research queue",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as QueueRequest
    const limit = Math.min(Math.max(body.limit || 2500, 1), 2500)
    const offset = Math.max(body.offset || 0, 0)
    const persist = body.persist === true || body.dryRun !== true
    const onlyMissingOwner = body.onlyMissingOwner !== false
    const onlyWithRole = body.onlyWithRole !== false
    const forceRefresh = body.forceRefresh === true

    const supabase = getSupabaseAdmin()
    const { allRecords, candidateRecords } = await loadQueueRecords(
      supabase,
      { onlyMissingOwner, onlyWithRole },
      true,
    )

    const targetRecords = candidateRecords.slice(offset, offset + limit)
    const roleFrequency = buildRoleFrequency(candidateRecords)
    const results: QueueRecord[] = []

    const writeChunkSize = persist ? 24 : Math.max(targetRecords.length, 1)

    for (const chunk of chunkItems(targetRecords, writeChunkSize)) {
      const chunkResults = await Promise.all(
        chunk.map(async (record) => {
          const queueEntry = computeQueueEntry(record, roleFrequency)
          const nextMetadata = {
            ...(record.metadata || {}),
            owner_research_queue: queueEntry,
          }

          if (persist) {
            const { error: updateError } = await supabase
              .from("kmz_collection")
              .update({
                metadata: nextMetadata,
              })
              .eq("id", record.id)

            if (updateError) throw updateError
          }

          return {
            id: record.id,
            file_name: record.file_name,
            region: record.region,
            owner: record.owner,
            rol_numbers: getResearchableRoles(record.rol_numbers),
            owner_research_queue: queueEntry,
          } satisfies QueueRecord
        }),
      )

      results.push(...chunkResults)
    }

    results.sort(sortQueue)
    const roleQueue = await buildRoleQueue(results, supabase)

    return NextResponse.json({
      success: true,
      persist,
      processed: results.length,
      totalActive: allRecords.length,
      totalCandidates: candidateRecords.length,
      queueCounts: buildQueueCounts(results.map((item) => item.owner_research_queue)),
      roleQueueCounts: buildQueueCounts(roleQueue),
      roleQueueTotal: roleQueue.length,
      roleQueueTop: roleQueue.slice(0, 25),
      top: results.slice(0, 25),
    })
  } catch (error: any) {
    console.error("[Owner research queue] POST error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to generate owner research queue",
      },
      { status: 500 },
    )
  }
}

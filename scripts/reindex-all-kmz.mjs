#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js"
import { createHash } from "node:crypto"

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, value = "true"] = arg.replace(/^--/, "").split("=")
  return [key, value]
}))
const mode = args.get("apply") === "true" ? "apply" : "dry_run"
const batchSize = Math.min(200, Math.max(1, Number(args.get("batch-size") || 50)))
const concurrency = Math.min(20, Math.max(1, Number(args.get("concurrency") || 5)))
const limit = args.has("limit") ? Math.max(1, Number(args.get("limit"))) : null
const resumeRunId = args.get("run-id") || null
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error("Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY")
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const asCoordinate = (value) => {
  if (!Array.isArray(value) || value.length < 2) return null
  const lng = Number(value[0]); const lat = Number(value[1]); const alt = Number(value[2])
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) return null
  return Number.isFinite(alt) ? [lng, lat, alt] : [lng, lat]
}
const normalizeCoordinates = (value) => {
  if (!Array.isArray(value)) return []
  const direct = value.map(asCoordinate).filter(Boolean)
  if (direct.length) return direct
  return value.length === 1 ? normalizeCoordinates(value[0]) : []
}
const inferType = (coords, declared) => {
  const type = String(declared || "").toLowerCase()
  if (type.includes("polygon") && coords.length >= 4) return "Polygon"
  if (type.includes("line") && coords.length >= 2) return "LineString"
  if (type.includes("point")) return "Point"
  if (coords.length === 1) return "Point"
  const first = coords[0], last = coords.at(-1)
  return coords.length >= 4 && first[0] === last[0] && first[1] === last[1] ? "Polygon" : "LineString"
}
const bounds = (coords) => ({
  north: Math.max(...coords.map((c) => c[1])), south: Math.min(...coords.map((c) => c[1])),
  east: Math.max(...coords.map((c) => c[0])), west: Math.min(...coords.map((c) => c[0])),
})
const mergeBounds = (items) => items.reduce((a, p) => ({
  north: Math.max(a.north, p.bounds.north), south: Math.min(a.south, p.bounds.south),
  east: Math.max(a.east, p.bounds.east), west: Math.min(a.west, p.bounds.west),
}), { north: -90, south: 90, east: -180, west: 180 })

function normalize(record, stored) {
  const errors = []
  const source = stored.length ? stored : (Array.isArray(record.coordinates) ? record.coordinates : [])
  const seen = new Set()
  const placemarks = source.flatMap((row, index) => {
    const sourcePlacemark = stored.length ? row : null
    const coords = normalizeCoordinates(sourcePlacemark ? sourcePlacemark.coordinates : row)
    if (!coords.length) { errors.push(`Invalid geometry ${index + 1}`); return [] }
    const type = inferType(coords, sourcePlacemark?.type)
    const fingerprint = `${type}:${JSON.stringify(coords)}`
    if (seen.has(fingerprint)) return []
    seen.add(fingerprint)
    const box = bounds(coords)
    return [{
      name: sourcePlacemark?.name || `${record.file_name} · ${type} ${index + 1}`,
      description: sourcePlacemark?.description || record.description || "", coordinates: coords, type,
      styleUrl: sourcePlacemark?.style_url || undefined,
      properties: { ...(sourcePlacemark?.properties || {}), rol: record.rol_numbers?.[index] || sourcePlacemark?.properties?.rol || "", category: record.category || "general", recoveredFrom: stored.length ? "kmz_placemarks" : "kmz_collection.coordinates" },
      center: { lat: (box.north + box.south) / 2, lng: (box.east + box.west) / 2 }, bounds: box,
      region: sourcePlacemark?.region || record.region || undefined,
    }]
  })
  if (!placemarks.length) errors.push("No recoverable database geometry")
  const counts = { total: placemarks.length, points: 0, lines: 0, polygons: 0 }
  for (const p of placemarks) counts[p.type === "Point" ? "points" : p.type === "LineString" ? "lines" : "polygons"]++
  const proposal = { coordinates: placemarks.map((p) => p.coordinates), placemarks, bounds: placemarks.length ? mergeBounds(placemarks) : null, region: record.region, counts, source: stored.length ? "kmz_placemarks" : "kmz_collection.coordinates" }
  return { proposal, errors, hash: createHash("sha256").update(JSON.stringify(proposal)).digest("hex") }
}

async function requireData(query, context) {
  const { data, error } = await query
  if (error) throw new Error(`${context}: ${error.message}`)
  return data
}

async function getOrCreateRun() {
  if (resumeRunId) {
    const data = await requireData(supabase.from("kmz_reindex_runs").select("*").eq("id", resumeRunId).single(), "load run")
    if (data.mode !== mode) throw new Error(`Run ${resumeRunId} uses mode ${data.mode}`)
    return data
  }
  const countQuery = supabase.from("kmz_collection").select("id", { count: "exact", head: true }).eq("is_active", true)
  const { count, error } = await countQuery
  if (error) throw error
  const totalItems = limit ? Math.min(limit, count || limit) : count || 0
  return requireData(supabase.from("kmz_reindex_runs").insert({ mode, status: "running", batch_size: batchSize, concurrency, total_items: totalItems, started_at: new Date().toISOString(), options: { limit, source: "database-only", safety: "audit-and-replace" } }).select().single(), "create run")
}

async function processRecord(run, record) {
  try {
    const stored = await requireData(supabase.from("kmz_placemarks").select("*").eq("kmz_id", record.id).limit(5000), `load placemarks ${record.id}`)
    const { proposal, errors, hash } = normalize(record, stored || [])
    const geometryBefore = Math.max(stored?.length || 0, Array.isArray(record.coordinates) ? record.coordinates.length : 0)
    const status = proposal.counts.total === 0 ? "rejected" : hash === record.metadata?.reindex?.hash ? "unchanged" : "replace"
    const item = await requireData(supabase.from("kmz_reindex_items").upsert({ run_id: run.id, kmz_id: record.id, status, proposal_hash: hash, proposal, geometry_before: geometryBefore, geometry_after: proposal.counts.total, points_after: proposal.counts.points, lines_after: proposal.counts.lines, polygons_after: proposal.counts.polygons, validation_errors: errors, attempts: 1, updated_at: new Date().toISOString() }, { onConflict: "run_id,kmz_id" }).select("id,status").single(), `audit ${record.id}`)
    if (mode === "apply" && status === "replace") await requireData(supabase.rpc("apply_kmz_reindex_item", { p_item_id: item.id }), `apply ${record.id}`)
    return { status, before: geometryBefore, ...proposal.counts }
  } catch (error) {
    await supabase.from("kmz_reindex_items").upsert({ run_id: run.id, kmz_id: record.id, status: "failed", error_message: error.message, attempts: 1, updated_at: new Date().toISOString() }, { onConflict: "run_id,kmz_id" })
    return { status: "failed", before: 0, total: 0, points: 0, lines: 0, polygons: 0, error: error.message }
  }
}

async function mapLimit(items, max, mapper) {
  const output = new Array(items.length); let cursor = 0
  await Promise.all(Array.from({ length: Math.min(max, items.length) }, async () => {
    while (cursor < items.length) { const index = cursor++; output[index] = await mapper(items[index]) }
  }))
  return output
}

async function main() {
  const run = await getOrCreateRun()
  let processed = run.processed_items || 0
  let cursorCreatedAt = run.cursor_created_at
  let cursorId = run.cursor_id
  const aggregate = { replaced: run.replaced_items || 0, unchanged: run.unchanged_items || 0, rejected: run.rejected_items || 0, failed: run.failed_items || 0, before: run.geometry_before || 0, total: run.geometry_after || 0, points: run.points_after || 0, lines: run.lines_after || 0, polygons: run.polygons_after || 0 }
  while (!limit || processed < limit) {
    const take = Math.min(batchSize, limit ? limit - processed : batchSize)
    let query = supabase.from("kmz_collection").select("id,file_name,description,coordinates,bounds,region,category,rol_numbers,metadata,placemarks_count,created_at").eq("is_active", true).order("created_at", { ascending: true }).order("id", { ascending: true }).limit(take)
    if (cursorCreatedAt) query = query.or(`created_at.gt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.gt.${cursorId})`)
    const records = await requireData(query, "load batch")
    if (!records.length) break
    const results = await mapLimit(records, concurrency, (record) => processRecord(run, record))
    for (const result of results) {
      aggregate[result.status === "replace" ? "replaced" : result.status]++
      aggregate.before += result.before; aggregate.total += result.total; aggregate.points += result.points; aggregate.lines += result.lines; aggregate.polygons += result.polygons
    }
    processed += records.length
    const last = records.at(-1); cursorCreatedAt = last.created_at; cursorId = last.id
    await requireData(supabase.from("kmz_reindex_runs").update({ processed_items: processed, replaced_items: aggregate.replaced, unchanged_items: aggregate.unchanged, rejected_items: aggregate.rejected, failed_items: aggregate.failed, geometry_before: aggregate.before, geometry_after: aggregate.total, points_after: aggregate.points, lines_after: aggregate.lines, polygons_after: aggregate.polygons, cursor_created_at: cursorCreatedAt, cursor_id: cursorId, updated_at: new Date().toISOString() }).eq("id", run.id), "update progress")
    console.log(JSON.stringify({ runId: run.id, mode, processed, total: run.total_items, batch: records.length, aggregate }))
  }
  await requireData(supabase.from("kmz_reindex_runs").update({ status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", run.id), "complete run")
  console.log(JSON.stringify({ runId: run.id, status: "completed", mode, processed, aggregate }, null, 2))
}
main().catch(async (error) => { console.error(error); process.exitCode = 1 })

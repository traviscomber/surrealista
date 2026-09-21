import assert from "node:assert/strict"
import test from "node:test"

import { deriveSentinelAttentionQueue, type SentinelAttentionRow } from "../lib/prospeccion/sentinel-attention"

function month(rol: string, monthValue: string, ndvi: number, fingerprint = "poly-a"): SentinelAttentionRow {
  const from = `${monthValue}-01T00:00:00.000Z`
  const parsed = new Date(from)
  const to = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 1)).toISOString()
  return {
    rol,
    rol_key: rol,
    commune: "Curicó",
    geometry_mode: "ciren_polygon",
    geometry_fingerprint: fingerprint,
    period_from: from,
    period_to: to,
    ndvi,
    ndre: null,
    ndmi: 0.1,
    sample_count: 1,
  }
}

test("returns only watch and strong ROLs ordered by severity", () => {
  const rows: SentinelAttentionRow[] = [
    month("100-1", "2025-08", 0.72), month("100-1", "2026-08", 0.50),
    month("100-2", "2025-08", 0.70), month("100-2", "2026-08", 0.60),
    month("100-3", "2025-08", 0.69), month("100-3", "2026-08", 0.66),
  ]

  const queue = deriveSentinelAttentionQueue(rows, new Date("2026-09-17T00:00:00.000Z"))
  assert.equal(queue.monitoredRols, 3)
  assert.equal(queue.actionableCount, 2)
  assert.equal(queue.strongCount, 1)
  assert.equal(queue.watchCount, 1)
  assert.equal(queue.items[0]?.rol, "100-1")
  assert.equal(queue.items[0]?.anomaly.level, "strong")
  assert.equal(queue.items[1]?.rol, "100-2")
  assert.equal(queue.items[1]?.anomaly.level, "watch")
  assert.equal(queue.items.some((item) => item.rol === "100-3"), false)
})

test("prefers CIREN polygon memory when the same ROL has multiple geometries", () => {
  const rows: SentinelAttentionRow[] = [
    { ...month("200-1", "2025-08", 0.8, "centroid"), geometry_mode: "centroid_fallback" },
    { ...month("200-1", "2026-08", 0.5, "centroid"), geometry_mode: "centroid_fallback" },
    month("200-1", "2025-08", 0.70, "polygon"),
    month("200-1", "2026-08", 0.66, "polygon"),
  ]

  const queue = deriveSentinelAttentionQueue(rows)
  assert.equal(queue.monitoredRols, 1)
  assert.equal(queue.actionableCount, 0)
})


test("exposes latest NDVI NDRE and NDMI values for the selected geometry", () => {
  const rows: SentinelAttentionRow[] = [
    { ...month("300-1", "2025-08", 0.70), ndre: 0.21, ndmi: 0.18 },
    { ...month("300-1", "2026-08", 0.50), ndre: 0.14, ndmi: 0.07 },
  ]

  const queue = deriveSentinelAttentionQueue(rows)
  assert.equal(queue.items[0]?.latest.ndvi, 0.50)
  assert.equal(queue.items[0]?.latest.ndre, 0.14)
  assert.equal(queue.items[0]?.latest.ndmi, 0.07)
})

import assert from "node:assert/strict"
import test from "node:test"

import {
  canonicalSentinelPeriod,
  derivePersistentSentinelAnomaly,
  sentinelGeometryFingerprint,
} from "../lib/prospeccion/sentinel-memory"
import {
  mapWithConcurrency,
  resolveRequestedRolFromSiiMetadata,
  resolveSentinelCentroidTarget,
  resolveSentinelCronBatchLimit,
} from "../lib/prospeccion/sentinel-backfill"

test("keeps the geometry fingerprint stable for the same CIREN polygon", () => {
  const polygon = {
    type: "Polygon" as const,
    coordinates: [[[-71.3, -35], [-71.2, -35], [-71.2, -34.9], [-71.3, -35]]],
  }
  const first = sentinelGeometryFingerprint({ polygon, centroid: { lat: -35, lng: -71.25 } })
  const second = sentinelGeometryFingerprint({ polygon, centroid: { lat: 0, lng: 0 } })
  assert.equal(first, second)
  assert.equal(first.length, 64)
})

test("canonicalizes any timestamp in the same month to one stable persistence period", () => {
  const first = canonicalSentinelPeriod("2026-08-08T19:00:20.275Z")
  const second = canonicalSentinelPeriod("2026-08-08T19:04:25.305Z")
  assert.deepEqual(first, {
    from: "2026-08-01T00:00:00.000Z",
    to: "2026-09-01T00:00:00.000Z",
  })
  assert.deepEqual(second, first)
})

test("flags a strong persisted seasonal NDVI decrease without calling it agronomic stress", () => {
  const anomaly = derivePersistentSentinelAnomaly([
    { period_from: "2024-09-01T00:00:00.000Z", period_to: "2024-10-01T00:00:00.000Z", ndvi: 0.7, ndre: 0.4, ndmi: 0.12, sample_count: 1 },
    { period_from: "2025-09-01T00:00:00.000Z", period_to: "2025-10-01T00:00:00.000Z", ndvi: 0.72, ndre: 0.42, ndmi: 0.14, sample_count: 1 },
    { period_from: "2026-09-01T00:00:00.000Z", period_to: "2026-10-01T00:00:00.000Z", ndvi: 0.5, ndre: 0.31, ndmi: 0.08, sample_count: 1 },
  ])

  assert.equal(anomaly.level, "strong")
  assert.equal(anomaly.direction, "below")
  assert.equal(anomaly.baselineCount, 2)
  assert.equal(anomaly.seasonalBaselineNdvi, 0.71)
  assert.equal(anomaly.ndviDelta, -0.21)
  assert.match(anomaly.interpretation, /cambio espectral fuerte/i)
  assert.match(anomaly.interpretation, /no constituyen un diagnóstico agronómico/i)
})

test("does not raise an anomaly when current NDVI remains close to seasonal history", () => {
  const anomaly = derivePersistentSentinelAnomaly([
    { period_from: "2025-08-15T00:00:00.000Z", period_to: "2025-09-15T00:00:00.000Z", ndvi: 0.69, ndre: 0.4, ndmi: 0.1, sample_count: 1 },
    { period_from: "2026-08-15T00:00:00.000Z", period_to: "2026-09-15T00:00:00.000Z", ndvi: 0.73, ndre: 0.43, ndmi: 0.12, sample_count: 1 },
  ])

  assert.equal(anomaly.level, "none")
  assert.equal(anomaly.direction, "similar")
  assert.equal(anomaly.baselineCount, 1)
  assert.equal(anomaly.ndviDelta, 0.04)
})

test("keeps Sentinel cron batches bounded while defaulting to the proven ceiling", () => {
  assert.equal(resolveSentinelCronBatchLimit(null), 24)
  assert.equal(resolveSentinelCronBatchLimit(""), 24)
  assert.equal(resolveSentinelCronBatchLimit("28"), 24)
  assert.equal(resolveSentinelCronBatchLimit("9.8"), 9)
  assert.equal(resolveSentinelCronBatchLimit("0"), 1)
  assert.equal(resolveSentinelCronBatchLimit("-4"), 1)
  assert.equal(resolveSentinelCronBatchLimit("invalid"), 24)
})

test("resolves a Sentinel centroid target only from complete SII evidence", () => {
  assert.deepEqual(resolveSentinelCentroidTarget({
    sii_point_resolution: {
      record: {
        rol: "234-189",
        comuna: "Rengo",
        coordinates: { lat: -34.4061, lng: -70.8584 },
      },
    },
  }), {
    rol: "234-189",
    commune: "Rengo",
    centroid: { lat: -34.4061, lng: -70.8584 },
    source: "sii_point_resolution",
  })

  assert.equal(resolveSentinelCentroidTarget({
    sii_point_resolution: {
      record: {
        rol: "234-189",
        comuna: "Rengo",
        coordinates: { lat: null, lng: -70.8584 },
      },
    },
  }), null)
})

test("runs Sentinel from SII metadata when CIREN is absent", () => {
  const target = resolveRequestedRolFromSiiMetadata("234-189", {
    sii_point_resolution: {
      record: {
        rol: "234/189",
        comuna: "Rengo",
        coordinates: { lat: -34.4061, lng: -70.8584 },
      },
    },
  })

  assert.deepEqual(target, {
    rol: "234/189",
    commune: "Rengo",
    centroid: { lat: -34.4061, lng: -70.8584 },
    source: "sii_point_resolution",
  })
})

test("does not attach Sentinel evidence to a different SII ROL", () => {
  assert.equal(resolveRequestedRolFromSiiMetadata("234-189", {
    sii_point_resolution: {
      record: {
        rol: "999-1",
        comuna: "Rengo",
        coordinates: { lat: -34.4061, lng: -70.8584 },
      },
    },
  }), null)
})

test("Sentinel backfill concurrency preserves result order and isolates failures", async () => {
  let active = 0
  let maxActive = 0
  const results = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
    active += 1
    maxActive = Math.max(maxActive, active)
    await new Promise((resolve) => setTimeout(resolve, 5))
    active -= 1
    if (value === 3) throw new Error("boom")
    return value * 10
  })

  assert.equal(maxActive <= 2, true)
  assert.deepEqual(results.map((result) => result.status), [
    "fulfilled",
    "fulfilled",
    "rejected",
    "fulfilled",
    "fulfilled",
  ])
  assert.equal(results[0].status === "fulfilled" ? results[0].value : null, 10)
  assert.equal(results[4].status === "fulfilled" ? results[4].value : null, 50)
})

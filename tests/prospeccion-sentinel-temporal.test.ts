import assert from "node:assert/strict"
import test from "node:test"

import { getSentinelParcelEvidence, type ParcelSentinelObservation } from "../lib/prospeccion/sentinel-parcel-analysis"
import { derivePersistentHistorySignal } from "../lib/prospeccion/sentinel-history"

test("uses the CIREN polygon and derives an interannual Sentinel comparison", async () => {
  const originalFetch = globalThis.fetch
  const originalClientId = process.env.COPERNICUS_CLIENT_ID
  const originalClientSecret = process.env.COPERNICUS_CLIENT_SECRET

  process.env.COPERNICUS_CLIENT_ID = "test-client"
  process.env.COPERNICUS_CLIENT_SECRET = "test-secret"

  let statisticalRequest: any = null
  let call = 0
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    call += 1
    if (call === 1) {
      return new Response(JSON.stringify({ access_token: "token", expires_in: 600 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    }

    statisticalRequest = JSON.parse(String(init?.body || "{}"))
    return new Response(JSON.stringify({
      data: [
        {
          interval: { from: "2025-03-01T00:00:00Z", to: "2025-04-01T00:00:00Z" },
          outputs: { indices: { bands: {
            NDVI: { stats: { mean: 0.42, sampleCount: 40 } },
            NDRE: { stats: { mean: 0.28, sampleCount: 40 } },
            NDMI: { stats: { mean: 0.09, sampleCount: 40 } },
          } } },
        },
        {
          interval: { from: "2026-02-01T00:00:00Z", to: "2026-03-01T00:00:00Z" },
          outputs: { indices: { bands: {
            NDVI: { stats: { mean: 0.55, sampleCount: 42 } },
            NDRE: { stats: { mean: 0.36, sampleCount: 42 } },
            NDMI: { stats: { mean: 0.11, sampleCount: 42 } },
          } } },
        },
        {
          interval: { from: "2026-03-01T00:00:00Z", to: "2026-04-01T00:00:00Z" },
          outputs: { indices: { bands: {
            NDVI: { stats: { mean: 0.60, sampleCount: 45 } },
            NDRE: { stats: { mean: 0.39, sampleCount: 45 } },
            NDMI: { stats: { mean: 0.14, sampleCount: 45 } },
          } } },
        },
      ],
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  }) as typeof fetch

  try {
    const evidence = await getSentinelParcelEvidence({
      centroid: { lat: -34.98, lng: -71.28 },
      polygon: {
        type: "Polygon",
        coordinates: [[
          [-71.285, -34.985],
          [-71.275, -34.985],
          [-71.275, -34.975],
          [-71.285, -34.975],
          [-71.285, -34.985],
        ]],
      },
    })

    assert.equal(evidence.status, "available")
    assert.equal(evidence.geometryMode, "ciren_polygon")
    assert.equal(statisticalRequest.input.bounds.geometry.type, "Polygon")
    assert.equal(statisticalRequest.input.bounds.bbox, undefined)
    assert.equal(evidence.summary.observationCount, 3)
    assert.equal(evidence.baseline.latestNdvi, 0.60)
    assert.equal(evidence.baseline.previousYearNdvi, 0.42)
    assert.equal(evidence.baseline.ndviDelta, 0.18)
    assert.equal(evidence.baseline.signal, "large_increase")
    assert.equal(evidence.baseline.latestNdmi, 0.14)
    assert.equal(evidence.baseline.previousYearNdmi, 0.09)
    assert.equal(evidence.baseline.ndmiDelta, 0.05)
    assert.equal(evidence.classification.predictedSpecies, null)
  } finally {
    globalThis.fetch = originalFetch
    if (originalClientId == null) delete process.env.COPERNICUS_CLIENT_ID
    else process.env.COPERNICUS_CLIENT_ID = originalClientId
    if (originalClientSecret == null) delete process.env.COPERNICUS_CLIENT_SECRET
    else process.env.COPERNICUS_CLIENT_SECRET = originalClientSecret
  }
})

function observation(from: string, ndvi: number): ParcelSentinelObservation {
  const start = new Date(from)
  const end = new Date(start.getTime() + 30 * 86_400_000)
  return { from: start.toISOString(), to: end.toISOString(), ndvi, ndre: null, ndmi: null, sampleCount: 1 }
}

test("keeps persistent Sentinel history as insufficient until a comparable season exists", () => {
  const signal = derivePersistentHistorySignal([
    observation("2026-08-10T00:00:00Z", 0.70),
  ])
  assert.equal(signal.state, "insufficient_history")
  assert.equal(signal.comparableCount, 0)
  assert.equal(signal.referenceNdvi, null)
})

test("marks a small same-season NDVI difference as normal", () => {
  const signal = derivePersistentHistorySignal([
    observation("2025-08-13T00:00:00Z", 0.735),
    observation("2026-08-08T00:00:00Z", 0.703),
  ])
  assert.equal(signal.state, "normal")
  assert.equal(signal.comparableCount, 1)
  assert.equal(signal.referenceNdvi, 0.735)
  assert.equal(signal.ndviDelta, -0.032)
})

test("flags a large same-season NDVI change without calling it an agronomic diagnosis", () => {
  const signal = derivePersistentHistorySignal([
    observation("2024-08-12T00:00:00Z", 0.72),
    observation("2025-08-13T00:00:00Z", 0.74),
    observation("2026-08-08T00:00:00Z", 0.51),
  ])
  assert.equal(signal.state, "large_change")
  assert.equal(signal.comparableCount, 2)
  assert.equal(signal.referenceNdvi, 0.73)
  assert.equal(signal.ndviDelta, -0.22)
  assert.match(signal.interpretation, /alerta espectral heurística/i)
  assert.match(signal.interpretation, /no un diagnóstico agronómico/i)
})

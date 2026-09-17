import assert from "node:assert/strict"
import test from "node:test"

import { getSentinelSatelliteEvidence } from "../lib/prospeccion/sentinel-satellite"

test("derives evidence-safe temporal Sentinel signals from monthly observations", async () => {
  const originalFetch = globalThis.fetch
  const originalClientId = process.env.COPERNICUS_CLIENT_ID
  const originalClientSecret = process.env.COPERNICUS_CLIENT_SECRET

  process.env.COPERNICUS_CLIENT_ID = "test-client"
  process.env.COPERNICUS_CLIENT_SECRET = "test-secret"

  let call = 0
  globalThis.fetch = (async () => {
    call += 1
    if (call === 1) {
      return new Response(JSON.stringify({ access_token: "token", expires_in: 600 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    }

    return new Response(JSON.stringify({
      data: [
        {
          interval: { from: "2026-01-01T00:00:00Z", to: "2026-02-01T00:00:00Z" },
          outputs: { indices: { bands: {
            NDVI: { stats: { mean: 0.30, sampleCount: 10 } },
            NDRE: { stats: { mean: 0.20, sampleCount: 10 } },
            NDMI: { stats: { mean: 0.05, sampleCount: 10 } },
          } } },
        },
        {
          interval: { from: "2026-02-01T00:00:00Z", to: "2026-03-01T00:00:00Z" },
          outputs: { indices: { bands: {
            NDVI: { stats: { mean: 0.65, sampleCount: 10 } },
            NDRE: { stats: { mean: 0.42, sampleCount: 10 } },
            NDMI: { stats: { mean: 0.12, sampleCount: 10 } },
          } } },
        },
        {
          interval: { from: "2026-04-01T00:00:00Z", to: "2026-05-01T00:00:00Z" },
          outputs: { indices: { bands: {
            NDVI: { stats: { mean: 0.58, sampleCount: 10 } },
            NDRE: { stats: { mean: 0.39, sampleCount: 10 } },
            NDMI: { stats: { mean: 0.06, sampleCount: 10 } },
          } } },
        },
      ],
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  }) as typeof fetch

  try {
    const evidence = await getSentinelSatelliteEvidence({ lat: -34.98, lng: -71.28 })
    assert.equal(evidence.status, "available")
    assert.equal(evidence.summary.observationCount, 3)
    assert.equal(evidence.temporal.peakNdvi?.value, 0.65)
    assert.equal(evidence.temporal.minimumNdvi?.value, 0.30)
    assert.equal(evidence.temporal.ndviAmplitude, 0.35)
    assert.equal(evidence.temporal.annualVariationSignal, "high")
    assert.equal(evidence.temporal.recentNdviTrend, "falling")
    assert.equal(evidence.temporal.recentNdviDelta, -0.07)
    assert.equal(evidence.temporal.recentNdmiTrend, "falling")
    assert.equal(evidence.temporal.recentNdmiDelta, -0.06)
    assert.match(evidence.temporal.interpretation, /NDMI disminuye/)
    assert.doesNotMatch(evidence.temporal.interpretation, /mejora|empeora|estacionalidad/i)
    assert.equal(evidence.classification.predictedSpecies, null)
  } finally {
    globalThis.fetch = originalFetch
    if (originalClientId == null) delete process.env.COPERNICUS_CLIENT_ID
    else process.env.COPERNICUS_CLIENT_ID = originalClientId
    if (originalClientSecret == null) delete process.env.COPERNICUS_CLIENT_SECRET
    else process.env.COPERNICUS_CLIENT_SECRET = originalClientSecret
  }
})

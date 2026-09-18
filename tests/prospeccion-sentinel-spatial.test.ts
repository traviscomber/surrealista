import assert from "node:assert/strict"
import test from "node:test"
import sharp from "sharp"

import { getSentinelSpatialChange, summarizeSpatialPixels } from "../lib/prospeccion/sentinel-spatial"

test("summarizes comparable raster pixels without counting transparent no-data", () => {
  const raw = new Uint8Array([
    140, 56, 173, 255,
    122, 133, 143, 255,
    43, 184, 173, 255,
    0, 0, 0, 0,
  ])

  const summary = summarizeSpatialPixels(raw)
  assert.equal(summary.validPixelCount, 3)
  assert.equal(summary.lowerPct, 33.3)
  assert.equal(summary.similarPct, 33.3)
  assert.equal(summary.higherPct, 33.3)
  assert.equal(summary.strongDecreasePct, 33.3)
  assert.equal(summary.strongIncreasePct, 0)
})

test("requests a polygon-clipped two-period Sentinel NDVI change raster", async () => {
  const originalFetch = globalThis.fetch
  const originalClientId = process.env.COPERNICUS_CLIENT_ID
  const originalClientSecret = process.env.COPERNICUS_CLIENT_SECRET

  process.env.COPERNICUS_CLIENT_ID = "test-client"
  process.env.COPERNICUS_CLIENT_SECRET = "test-secret"

  const mockPng = await sharp({
    create: {
      width: 1,
      height: 1,
      channels: 4,
      background: { r: 122, g: 133, b: 143, alpha: 1 },
    },
  }).png().toBuffer()

  let processRequest: any = null
  let call = 0
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    call += 1
    if (call === 1) {
      return new Response(JSON.stringify({ access_token: "token", expires_in: 600 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    }

    processRequest = JSON.parse(String(init?.body || "{}"))
    return new Response(mockPng, {
      status: 200,
      headers: { "content-type": "image/png" },
    })
  }) as typeof fetch

  try {
    const result = await getSentinelSpatialChange({
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
      currentDate: "2026-08-01T00:00:00.000Z",
      referenceDate: "2025-08-01T00:00:00.000Z",
    })

    assert.equal(result.status, "available")
    assert.equal(result.methodology, "pixel-ndvi-change-current-vs-prior-year")
    assert.equal(result.currentPeriod?.from, "2026-08-01T00:00:00.000Z")
    assert.equal(result.referencePeriod?.from, "2025-08-01T00:00:00.000Z")
    assert.ok(result.imageDataUrl?.startsWith("data:image/png;base64,"))
    assert.equal(result.summary?.validPixelCount, 1)
    assert.equal(result.summary?.similarPct, 100)
    assert.equal(result.summary?.lowerPct, 0)
    assert.equal(result.summary?.higherPct, 0)
    assert.deepEqual(processRequest.input.bounds.geometry.type, "Polygon")
    assert.equal(processRequest.input.data.length, 2)
    assert.equal(processRequest.input.data[0].id, "current")
    assert.equal(processRequest.input.data[1].id, "reference")
    assert.equal(processRequest.input.data[0].type, "sentinel-2-l2a")
    assert.equal(processRequest.input.data[1].type, "sentinel-2-l2a")
    assert.equal(processRequest.output.responses[0].format.type, "image/png")
    assert.ok(processRequest.output.width >= 160 && processRequest.output.width <= 640)
    assert.ok(processRequest.output.height >= 160 && processRequest.output.height <= 640)
  } finally {
    globalThis.fetch = originalFetch
    if (originalClientId == null) delete process.env.COPERNICUS_CLIENT_ID
    else process.env.COPERNICUS_CLIENT_ID = originalClientId
    if (originalClientSecret == null) delete process.env.COPERNICUS_CLIENT_SECRET
    else process.env.COPERNICUS_CLIENT_SECRET = originalClientSecret
  }
})

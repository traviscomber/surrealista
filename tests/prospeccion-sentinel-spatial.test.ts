import test from "node:test"
import assert from "node:assert/strict"

import { isAllowedCirenParcelSource } from "../lib/prospeccion/ciren-parcel-geometry"
import {
  buildSentinelSpatialRequest,
  sentinelPolygonBounds,
  sentinelSpatialPeriod,
} from "../lib/prospeccion/sentinel-spatial"

const polygon = {
  type: "Polygon" as const,
  coordinates: [[
    [-71.29, -34.99],
    [-71.28, -34.99],
    [-71.28, -34.98],
    [-71.29, -34.98],
    [-71.29, -34.99],
  ]],
}

test("canonicalizes Sentinel spatial period to a calendar month", () => {
  assert.deepEqual(sentinelSpatialPeriod("2026-08-18T14:22:00Z"), {
    from: "2026-08-01T00:00:00.000Z",
    to: "2026-09-01T00:00:00.000Z",
  })
})

test("builds a bounded PNG Process API request over the exact polygon", () => {
  const request = buildSentinelSpatialRequest({ polygon, period: "2026-08-18T14:22:00Z" })
  assert(request)
  assert.deepEqual(request.bounds, {
    west: -71.29,
    south: -34.99,
    east: -71.28,
    north: -34.98,
  })
  assert.deepEqual(request.body.input.bounds.geometry, polygon)
  assert.equal(request.body.input.bounds.properties.crs, "http://www.opengis.net/def/crs/OGC/1.3/CRS84")
  assert.deepEqual(request.body.input.data[0].dataFilter.timeRange, {
    from: "2026-08-01T00:00:00.000Z",
    to: "2026-09-01T00:00:00.000Z",
  })
  assert.equal(request.body.input.data[0].dataFilter.mosaickingOrder, "leastCC")
  assert.equal(request.body.output.responses[0].format.type, "image/png")
  assert(request.body.output.width <= 512)
  assert(request.body.output.height <= 512)
  assert.match(request.body.evalscript, /return \[0, 0, 0, 0\]/)
  assert.match(request.body.evalscript, /SCL/)
})

test("computes bounds from every valid polygon ring", () => {
  assert.deepEqual(sentinelPolygonBounds({
    type: "Polygon",
    coordinates: [
      [[-71.30, -35.00], [-71.20, -35.00], [-71.20, -34.90], [-71.30, -34.90], [-71.30, -35.00]],
      [[-71.28, -34.98], [-71.27, -34.98], [-71.27, -34.97], [-71.28, -34.97], [-71.28, -34.98]],
    ],
  }), {
    west: -71.30,
    south: -35.00,
    east: -71.20,
    north: -34.90,
  })
})

test("only accepts the fixed CIREN parcel layer host/path", () => {
  assert.equal(
    isAllowedCirenParcelSource("https://esri.ciren.cl/server/rest/services/IDEMINAGRI/CATASTRO_FRUTICOLA/MapServer/62"),
    true,
  )
  assert.equal(
    isAllowedCirenParcelSource("https://evil.example/server/rest/services/IDEMINAGRI/CATASTRO_FRUTICOLA/MapServer/62"),
    false,
  )
  assert.equal(
    isAllowedCirenParcelSource("https://esri.ciren.cl/other/service/MapServer/62"),
    false,
  )
})

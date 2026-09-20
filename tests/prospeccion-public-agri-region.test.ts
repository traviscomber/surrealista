import assert from "node:assert/strict"
import test from "node:test"

import { getPublicAgriEvidence, groupExactCirenFindResults, lookupCirenByBounds, lookupExactCirenRol } from "../lib/prospeccion/public-agri-intelligence"

test("maps canonical O'Higgins to CIREN producer layer 61", async () => {
  const originalFetch = globalThis.fetch
  const requestedUrls: string[] = []

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    requestedUrls.push(url)

    if (url.includes("CATASTRO_FRUTICOLA/MapServer/61/query")) {
      return new Response(JSON.stringify({ features: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    }

    if (url.includes("datos.odepa.gob.cl/api/action/datastore_search")) {
      return new Response(JSON.stringify({
        success: true,
        result: { records: [], total: 0 },
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ error: { message: "unexpected url" } }), {
      status: 404,
      headers: { "content-type": "application/json" },
    })
  }) as typeof fetch

  try {
    const evidence = await getPublicAgriEvidence({
      region: "O'Higgins",
      species: "Cerezo",
      minHa: 15,
      maxHa: 80,
    })

    assert.equal(evidence.ciren.status, "available")
    assert.equal(evidence.ciren.layerId, 61)
    assert.equal(evidence.ciren.surveyYear, 2024)
    assert.ok(requestedUrls.some((url) => url.includes("CATASTRO_FRUTICOLA/MapServer/61/query")))
  } finally {
    globalThis.fetch = originalFetch
  }
})


test("groups repeated CIREN features from the same ROL territory", () => {
  const grouped = groupExactCirenFindResults("507-45", [
    { layerId: 62, value: "507-45", attributes: { objectid: "4822", "Descripción comuna": "CURICO", "Descripción especie 01": "CEREZO" } },
    { layerId: 62, value: "507-45", attributes: { objectid: "4823", "Descripción comuna": "CURICO", "Descripción especie 01": "CEREZO" } },
    { layerId: 62, value: "507-45", attributes: { objectid: "5449", "Descripción comuna": "CURICO", "Descripción especie 01": "CEREZO" } },
    { layerId: 66, value: "507-45", attributes: { objectid: "341", "Descripción comuna": "RIO BUENO", "Descripción especie 01": "FRAMBUESA" } },
  ])

  assert.equal(grouped.length, 2)
  assert.deepEqual(grouped.find((item) => item.layerId === 62)?.objectIds, ["4822", "4823", "5449"])
  assert.deepEqual(grouped.find((item) => item.layerId === 66)?.objectIds, ["341"])
})

test("exact ROL resolver uses one national find plus one detail query per real territory", async () => {
  const originalFetch = globalThis.fetch
  const requestedUrls: string[] = []

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    requestedUrls.push(url)

    if (url.includes("CATASTRO_FRUTICOLA/MapServer/find")) {
      return new Response(JSON.stringify({
        results: [
          { layerId: 62, value: "507-45", attributes: { objectid: "4822", "Descripción comuna": "CURICO", "Descripción especie 01": "CEREZO" } },
          { layerId: 62, value: "507-45", attributes: { objectid: "4823", "Descripción comuna": "CURICO", "Descripción especie 01": "CEREZO" } },
          { layerId: 62, value: "507-45", attributes: { objectid: "5449", "Descripción comuna": "CURICO", "Descripción especie 01": "CEREZO" } },
          { layerId: 66, value: "507-45", attributes: { objectid: "341", "Descripción comuna": "RIO BUENO", "Descripción especie 01": "FRAMBUESA" } },
        ],
      }), { status: 200, headers: { "content-type": "application/json" } })
    }

    if (url.includes("MapServer/62/query")) {
      return new Response(JSON.stringify({
        features: [
          { attributes: { "Descripción especie 01": "CEREZO" }, geometry: { rings: [[[-71.5, -35.0], [-71.49, -35.0], [-71.49, -35.01], [-71.5, -35.01], [-71.5, -35.0]]] } },
          { attributes: { "Descripción especie 01": "CEREZO" }, geometry: { rings: [[[-71.48, -35.0], [-71.47, -35.0], [-71.47, -35.01], [-71.48, -35.01], [-71.48, -35.0]]] } },
        ],
      }), { status: 200, headers: { "content-type": "application/json" } })
    }

    if (url.includes("MapServer/66/query")) {
      return new Response(JSON.stringify({
        features: [
          { attributes: { "Descripción especie 01": "FRAMBUESA" }, geometry: { rings: [[[-73.1, -40.3], [-73.09, -40.3], [-73.09, -40.31], [-73.1, -40.31], [-73.1, -40.3]]] } },
        ],
      }), { status: 200, headers: { "content-type": "application/json" } })
    }

    return new Response(JSON.stringify({ error: { message: "unexpected url" } }), {
      status: 404,
      headers: { "content-type": "application/json" },
    })
  }) as typeof fetch

  try {
    const result = await lookupExactCirenRol("507-45")

    assert.equal(result.status, "found")
    assert.equal(result.candidates.length, 2)
    assert.equal(requestedUrls.filter((url) => url.includes("/find?")).length, 1)
    assert.equal(requestedUrls.filter((url) => url.includes("/query?")).length, 2)
    assert.equal(result.candidates.find((item) => item.region === "Maule")?.commune, "CURICO")
    assert.equal(result.candidates.find((item) => item.region === "Los Ríos")?.commune, "RIO BUENO")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("single-territory ROL resolves without artificial ambiguity", async () => {
  const originalFetch = globalThis.fetch
  const requestedUrls: string[] = []

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    requestedUrls.push(url)

    if (url.includes("CATASTRO_FRUTICOLA/MapServer/find")) {
      return new Response(JSON.stringify({
        results: [
          { layerId: 61, value: "234-189", attributes: { objectid: "8", "Descripción Comuna": "RENGO", "Descripción especie 01": "CEREZO" } },
        ],
      }), { status: 200, headers: { "content-type": "application/json" } })
    }

    if (url.includes("MapServer/61/query")) {
      return new Response(JSON.stringify({
        features: [
          { attributes: { "Descripción especie 01": "CEREZO" }, geometry: { rings: [[[-70.9, -34.4], [-70.89, -34.4], [-70.89, -34.41], [-70.9, -34.41], [-70.9, -34.4]]] } },
        ],
      }), { status: 200, headers: { "content-type": "application/json" } })
    }

    return new Response(JSON.stringify({ error: { message: "unexpected url" } }), {
      status: 404,
      headers: { "content-type": "application/json" },
    })
  }) as typeof fetch

  try {
    const result = await lookupExactCirenRol("234-189")

    assert.equal(result.status, "found")
    assert.equal(result.candidates.length, 1)
    assert.equal(result.candidates[0]?.region, "Libertador General Bernardo O'Higgins")
    assert.equal(result.candidates[0]?.commune, "RENGO")
    assert.equal(requestedUrls.length, 2)
  } finally {
    globalThis.fetch = originalFetch
  }
})


test("spatial CIREN fallback resolves one parcel whose centroid is inside KMZ bounds", async () => {
  const originalFetch = globalThis.fetch
  const requestedUrls: string[] = []

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    requestedUrls.push(url)

    if (url.includes("MapServer/62/query")) {
      return new Response(JSON.stringify({
        features: [
          {
            attributes: { desccomu: "LONGAVI", rolpredi: "194-84", especie_01: "CEREZO" },
            geometry: { rings: [[[-71.638, -35.965], [-71.63, -35.965], [-71.63, -35.971], [-71.638, -35.971], [-71.638, -35.965]]] },
          },
        ],
      }), { status: 200, headers: { "content-type": "application/json" } })
    }

    return new Response(JSON.stringify({ error: { message: "unexpected url" } }), {
      status: 404,
      headers: { "content-type": "application/json" },
    })
  }) as typeof fetch

  try {
    const result = await lookupCirenByBounds("Región del Maule", {
      west: -71.64121984270501,
      south: -35.97446200399056,
      east: -71.62485126095736,
      north: -35.96243806526419,
    })

    assert.equal(result.status, "found")
    assert.equal(result.layerId, 62)
    assert.equal(result.candidates.length, 1)
    assert.equal(result.candidates[0]?.rol, "194-84")
    assert.equal(result.candidates[0]?.centerInsideBounds, true)
    assert.ok(requestedUrls[0]?.includes("geometryType=esriGeometryEnvelope"))
    assert.ok(requestedUrls[0]?.includes("spatialRel=esriSpatialRelIntersects"))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("spatial CIREN fallback preserves ambiguity when multiple parcel centroids fall inside KMZ bounds", async () => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = (async () => new Response(JSON.stringify({
    features: [
      {
        attributes: { desccomu: "LOS ANGELES", rolpredi: "23-1", especie_01: "ARANDANO" },
        geometry: { rings: [[[-72.435, -37.445], [-72.43, -37.445], [-72.43, -37.45], [-72.435, -37.45], [-72.435, -37.445]]] },
      },
      {
        attributes: { desccomu: "LOS ANGELES", rolpredi: "1566-39", especie_01: "CEREZO" },
        geometry: { rings: [[[-72.429, -37.448], [-72.424, -37.448], [-72.424, -37.453], [-72.429, -37.453], [-72.429, -37.448]]] },
      },
    ],
  }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch

  try {
    const result = await lookupCirenByBounds("Bío Bío", {
      west: -72.44,
      south: -37.46,
      east: -72.42,
      north: -37.44,
    })

    assert.equal(result.status, "ambiguous")
    assert.equal(result.candidates.length, 2)
    assert.ok(result.candidates.every((candidate) => candidate.centerInsideBounds))
  } finally {
    globalThis.fetch = originalFetch
  }
})

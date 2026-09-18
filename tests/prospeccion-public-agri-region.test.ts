import assert from "node:assert/strict"
import test from "node:test"

import { getPublicAgriEvidence } from "../lib/prospeccion/public-agri-intelligence"

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

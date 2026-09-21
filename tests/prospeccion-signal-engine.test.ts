import assert from "node:assert/strict"
import test from "node:test"

import { deriveProspectingSignals } from "../lib/prospeccion/signal-engine"
import type { SentinelAttentionRow } from "../lib/prospeccion/sentinel-attention"

function month(rol: string, monthValue: string, ndvi: number): SentinelAttentionRow {
  const from = `${monthValue}-01T00:00:00.000Z`
  const parsed = new Date(from)
  const to = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 1)).toISOString()
  return {
    rol,
    rol_key: rol,
    commune: "Curicó",
    geometry_mode: "centroid_fallback",
    geometry_fingerprint: "geo-a",
    period_from: from,
    period_to: to,
    ndvi,
    ndre: 0.2,
    ndmi: 0.1,
    sample_count: 1,
  }
}

test("ranks a strong Sentinel change with cross-layer evidence without calling it sale intent", () => {
  const summary = deriveProspectingSignals({
    observations: [
      month("700-1", "2025-08", 0.76),
      month("700-1", "2026-08", 0.50),
    ],
    identities: [{
      kmzId: "kmz-1",
      rol: "700-1",
      rolKey: "700-1",
      commune: "CURICO",
      region: "Región del Maule",
      address: "Predio rural",
      destination: "AGRICOLA",
      hasCoordinates: true,
      cirenStatus: "not_found",
    }],
    markets: [{
      region: "Región del Maule",
      commune: "Curicó",
      periodDate: "2026-09-21",
      sampleCount: 24,
      sourceCount: 2,
    }],
    owners: [{
      rolKey: "700-1",
      commune: "CURICO",
      decision: "validar_propietario",
      ownerName: "Propietario candidato",
      ownerConfidence: 0.88,
      researchedAt: "2026-09-20T12:00:00.000Z",
    }],
    now: new Date("2026-09-21T15:00:00.000Z"),
  })

  assert.equal(summary.actionableCount, 1)
  assert.equal(summary.strongCount, 1)
  assert.equal(summary.items[0]?.owner.status, "candidate")
  assert.equal(summary.items[0]?.market.scope, "commune")
  assert.equal(summary.items[0]?.identity.cirenStatus, "not_found")
  assert.match(summary.methodology.purpose, /no probabilidad de venta/i)
  assert.match(summary.items[0]?.nextAction ?? "", /validar dominio vigente/i)
})

test("keeps market context out of opportunity claims when no temporal change exists", () => {
  const summary = deriveProspectingSignals({
    observations: [
      month("800-1", "2025-08", 0.70),
      month("800-1", "2026-08", 0.67),
    ],
    identities: [],
    markets: [{
      region: "Región del Maule",
      commune: "Curicó",
      periodDate: "2026-09-21",
      sampleCount: 100,
      sourceCount: 2,
    }],
    owners: [],
  })

  assert.equal(summary.actionableCount, 0)
  assert.equal(summary.items.length, 0)
})

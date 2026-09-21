import assert from "node:assert/strict"
import test from "node:test"

import { scoreProspectingSignal } from "../lib/prospeccion/prospecting-signal"

test("ranks convergent evidence without calling it sale intent", () => {
  const signal = scoreProspectingSignal({
    rol: "234-189",
    commune: "Rengo",
    region: "O'Higgins",
    ownerName: "Propietario ejemplo",
    contactAvailable: true,
    cirenStatus: "matched",
    marketSampleCount: 24,
    anomaly: {
      level: "strong",
      ndviDelta: -0.18,
      ndmiDelta: -0.11,
      interpretation: "Cambio espectral persistente.",
      observationCount: 22,
    },
  })

  assert.equal(signal.score, 100)
  assert.equal(signal.level, "alta")
  assert.match(signal.guardrail, /No estima intención de venta/)
  assert.match(signal.nextAction, /no asumir intención de venta/i)
})

test("keeps CIREN not_found neutral instead of treating missing coverage as negative evidence", () => {
  const signal = scoreProspectingSignal({
    rol: "10101-2447-26",
    commune: "Valdivia",
    region: "Los Ríos",
    ownerName: null,
    contactAvailable: false,
    cirenStatus: "not_found",
    marketSampleCount: 8,
    anomaly: {
      level: "watch",
      ndviDelta: -0.09,
      ndmiDelta: null,
      interpretation: "Cambio espectral a vigilar.",
      observationCount: 20,
    },
  })

  assert.equal(signal.dimensions.ciren, 0)
  assert.match(signal.reasons.join(" "), /SII\/Sentinel mantienen el ROL trazable/)
  assert.ok(signal.score > 0)
})


test("rejects fragile spectral signals from commercial prioritization", () => {
  const { isReliableSpectralProspectingSignal } = require("../lib/prospeccion/prospecting-signal")

  assert.equal(isReliableSpectralProspectingSignal({
    latestNdvi: -1,
    seasonalBaselineNdvi: 0.35,
    baselineCount: 4,
  }), false)
  assert.equal(isReliableSpectralProspectingSignal({
    latestNdvi: 0.52,
    seasonalBaselineNdvi: 0.70,
    baselineCount: 1,
  }), false)
  assert.equal(isReliableSpectralProspectingSignal({
    latestNdvi: 0.52,
    seasonalBaselineNdvi: 0.70,
    baselineCount: 2,
  }), true)
})

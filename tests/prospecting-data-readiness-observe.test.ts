import assert from "node:assert/strict"
import test from "node:test"

import { observeProspectingDataReadiness } from "../lib/prospeccion/data-readiness-observe"
import type { ProspectingCase } from "../lib/prospeccion/intelligence-core"

function offMarketCase(overrides: Partial<ProspectingCase> = {}): ProspectingCase {
  return {
    id: "offmarket:234-189",
    kind: "off_market",
    status: "verify_owner",
    score: 70,
    title: "ROL 234-189",
    location: "Rengo",
    rol: "234-189",
    areaHa: 42,
    speciesEvidence: { target: null, declared: [], satelliteVerified: false },
    owner: null,
    contact: null,
    market: {
      published: false,
      source: "CIREN IDE MINAGRI",
      sourceUrl: "https://example.invalid/source",
      opportunityScore: null,
      fitScore: null,
    },
    evidence: [
      {
        label: "ROL 234-189 en catastro CIREN 2025",
        authority: "official",
        source: "CIREN IDE MINAGRI",
      },
    ],
    nextAction: "Validar propietario",
    ...overrides,
  }
}

test("observes a grounded off-market case without mutating or blocking the flow", () => {
  const observation = observeProspectingDataReadiness([offMarketCase()], {
    authorizationChecked: true,
    canonicalSelectionChecked: true,
    decisionTime: "2026-10-05T14:00:00.000Z",
  })

  assert.equal(observation.mode, "observe")
  assert.equal(observation.summary.total, 1)
  assert.equal(observation.summary.blocked, 0)
  assert.equal(observation.cases[0].readiness.status, "ready")
})

test("surfaces missing ROL as blocked while staying in observe mode", () => {
  const observation = observeProspectingDataReadiness([
    offMarketCase({ rol: null }),
  ], {
    authorizationChecked: true,
    canonicalSelectionChecked: true,
    decisionTime: "2026-10-05T14:00:00.000Z",
  })

  assert.equal(observation.mode, "observe")
  assert.equal(observation.summary.blocked, 1)
  assert.equal(observation.summary.wouldBlockAiSynthesis, true)
  assert.ok(
    observation.cases[0].readiness.blockers.some((item) =>
      item.includes("required_field_missing:rol"),
    ),
  )
})

test("fails closed in the observation when route authorization is not proven", () => {
  const observation = observeProspectingDataReadiness([offMarketCase()], {
    authorizationChecked: false,
    canonicalSelectionChecked: true,
    decisionTime: "2026-10-05T14:00:00.000Z",
  })

  assert.equal(observation.summary.blocked, 1)
  assert.ok(
    observation.cases[0].readiness.blockers.some((item) =>
      item.includes("authorization_not_confirmed"),
    ),
  )
})

test("does not treat unverified owner evidence as canonical truth", () => {
  const observation = observeProspectingDataReadiness([
    offMarketCase({
      owner: {
        name: "Propietario candidato",
        confidence: 0.72,
        basis: "owner-research-cache:web-evidence",
      },
    }),
  ], {
    authorizationChecked: true,
    canonicalSelectionChecked: true,
    decisionTime: "2026-10-05T14:00:00.000Z",
  })

  const readiness = observation.cases[0].readiness
  assert.equal(readiness.status, "ready")
  assert.equal(readiness.blockers.length, 0)
})

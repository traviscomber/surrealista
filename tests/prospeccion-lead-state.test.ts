import test from "node:test"
import assert from "node:assert/strict"

import { classifyOwnerResearch, leadDecisionLabel } from "../lib/prospeccion/lead-state"

test("contactar only for confirmed internal owner", () => {
  const decision = classifyOwnerResearch({
    owner: {
      source: "internal_exact_rol",
      relation: "legal_owner",
      confidence: 0.99,
      documentType: "confirmed-owner",
    },
    producer: null,
    historicalOwner: null,
    attempts: [],
  })
  assert.equal(decision, "contactar")
  assert.equal(leadDecisionLabel(decision), "Contactar")
})

test("owner candidates stay in validation", () => {
  const decision = classifyOwnerResearch({
    owner: {
      source: "sii_tax_roll",
      relation: "legal_owner",
      confidence: 0.9,
      documentType: "sii-tax-roll-owner-candidate",
    },
    producer: null,
    historicalOwner: null,
    attempts: [{ status: "found" }],
  })
  assert.equal(decision, "validar_propietario")
})

test("producer and historical leads are never promoted to contact", () => {
  assert.equal(classifyOwnerResearch({ owner: null, producer: { name: "A" }, historicalOwner: null, attempts: [] }), "validar_propietario")
  assert.equal(classifyOwnerResearch({ owner: null, producer: null, historicalOwner: { name: "B" }, attempts: [] }), "validar_propietario")
})

test("only definitive negative evidence can recommend discard", () => {
  assert.equal(classifyOwnerResearch({
    owner: null,
    producer: null,
    historicalOwner: null,
    attempts: [{ status: "not_found" }, { status: "not_found" }],
  }), "descartar")

  assert.equal(classifyOwnerResearch({
    owner: null,
    producer: null,
    historicalOwner: null,
    attempts: [{ status: "not_found" }, { status: "unavailable" }],
  }), "validar_propietario")
})

import test from "node:test"
import assert from "node:assert/strict"

import { scoreOwnerOpportunity } from "../lib/prospeccion/owner-opportunity"

test("owner opportunity strongly rewards verified contact", () => {
  const score = scoreOwnerOpportunity({
    decision: "contactar",
    ownerConfidence: 0.99,
    contact: {
      name: "Contacto",
      phone: "+56912345678",
      email: null,
      source: "properties_enhanced",
      confidence: 0.98,
    },
  })
  assert.equal(score, 99)
})

test("owner without contact remains below actionable threshold", () => {
  const score = scoreOwnerOpportunity({
    decision: "validar_propietario",
    ownerConfidence: 0.9,
    contact: null,
  })
  assert.equal(score, 50)
})

test("discarded owner research cannot become an opportunity", () => {
  const score = scoreOwnerOpportunity({
    decision: "descartar",
    ownerConfidence: 1,
    contact: {
      name: "Contacto",
      phone: "+56912345678",
      email: "owner@example.com",
      source: "kmz_collection",
      confidence: 0.99,
    },
  })
  assert.equal(score, 0)
})

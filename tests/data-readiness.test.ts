import assert from "node:assert/strict"
import test from "node:test"

import {
  buildAgentGroundingEnvelope,
  evaluateDataReadiness,
  type DataEvidenceRef,
} from "../lib/intelligence/data-readiness"

const baseEvidence: DataEvidenceRef = {
  source: "kmz_collection",
  sourceRef: "kmz:234-189",
  subjectType: "field",
  subjectId: "field-1",
  field: "rol",
  authority: "canonical",
  observedAt: "2026-10-05T10:00:00.000Z",
  ingestedAt: "2026-10-05T10:01:00.000Z",
  sourceVersion: "row-version-1",
  verificationStatus: "verified",
  valuePresent: true,
  valueKey: "234-189",
}

test("returns ready when identity, provenance, authorization and canonical selection are present", () => {
  const result = evaluateDataReadiness({
    canonicalEntityId: "field-1",
    canonicalSelectionChecked: true,
    authorizationChecked: true,
    evidence: [baseEvidence],
    decisionTime: "2026-10-05T10:05:00.000Z",
    evaluatedAt: "2026-10-05T10:05:00.000Z",
  })

  assert.equal(result.status, "ready")
  assert.equal(result.score, 100)
  assert.deepEqual(result.blockers, [])
})

test("fails closed when authorization has not been confirmed", () => {
  const result = evaluateDataReadiness({
    canonicalEntityId: "field-1",
    canonicalSelectionChecked: true,
    authorizationChecked: false,
    evidence: [baseEvidence],
    decisionTime: "2026-10-05T10:05:00.000Z",
    evaluatedAt: "2026-10-05T10:05:00.000Z",
  })

  assert.equal(result.status, "blocked")
  assert.ok(result.blockers.some((item) => item.includes("authorization_not_confirmed")))
})

test("blocks temporal leakage from evidence ingested after decision time", () => {
  const result = evaluateDataReadiness({
    canonicalEntityId: "field-1",
    canonicalSelectionChecked: true,
    authorizationChecked: true,
    evidence: [{
      ...baseEvidence,
      ingestedAt: "2026-10-05T11:00:00.000Z",
    }],
    decisionTime: "2026-10-05T10:05:00.000Z",
    evaluatedAt: "2026-10-05T10:05:00.000Z",
  })

  assert.equal(result.status, "blocked")
  assert.ok(result.blockers.some((item) => item.includes("future_ingested_data_leakage")))
})

test("does not treat missing data as an ordinary empty value", () => {
  const result = evaluateDataReadiness({
    canonicalEntityId: "field-1",
    canonicalSelectionChecked: true,
    authorizationChecked: true,
    evidence: [{
      ...baseEvidence,
      field: "owner",
      valuePresent: false,
      missingReason: null,
      valueKey: null,
    }],
    decisionTime: "2026-10-05T10:05:00.000Z",
    evaluatedAt: "2026-10-05T10:05:00.000Z",
  })

  assert.equal(result.status, "blocked")
  assert.ok(result.blockers.some((item) => item.includes("missing_reason_required")))
})

test("blocks authoritative contradictions for the same field", () => {
  const result = evaluateDataReadiness({
    canonicalEntityId: "field-1",
    canonicalSelectionChecked: true,
    authorizationChecked: true,
    evidence: [
      baseEvidence,
      {
        ...baseEvidence,
        source: "SII",
        sourceRef: "sii:234-190",
        authority: "official",
        valueKey: "234-190",
      },
    ],
    decisionTime: "2026-10-05T10:05:00.000Z",
    evaluatedAt: "2026-10-05T10:05:00.000Z",
  })

  assert.equal(result.status, "blocked")
  assert.ok(result.blockers.some((item) => item.includes("authoritative_conflict:rol")))
})

test("keeps weak provenance visible as limited instead of silently promoting confidence", () => {
  const result = evaluateDataReadiness({
    canonicalEntityId: "field-1",
    canonicalSelectionChecked: true,
    authorizationChecked: true,
    evidence: [{
      ...baseEvidence,
      sourceRef: null,
      fingerprint: null,
      sourceVersion: null,
    }],
    decisionTime: "2026-10-05T10:05:00.000Z",
    evaluatedAt: "2026-10-05T10:05:00.000Z",
  })

  assert.equal(result.status, "limited")
  assert.ok(result.warnings.some((item) => item.includes("weak_source_reference")))
})

test("builds an agent grounding envelope that keeps canonical, evidence, derived and memory separate", () => {
  const envelope = buildAgentGroundingEnvelope({
    subject: { type: "field", id: "field-1" },
    canonical: [{ rol: "234-189" }],
    evidence: [baseEvidence],
    derived: [{ score: 87 }],
    memory: [{ preference: "prefer verified owner data" }],
    authorizationChecked: true,
    canonicalSelectionChecked: true,
    decisionTime: "2026-10-05T10:05:00.000Z",
  })

  assert.equal(envelope.readiness.status, "ready")
  assert.deepEqual(envelope.canonical, [{ rol: "234-189" }])
  assert.equal(envelope.evidence[0].authority, "canonical")
  assert.deepEqual(envelope.derived, [{ score: 87 }])
  assert.deepEqual(envelope.memory, [{ preference: "prefer verified owner data" }])
})

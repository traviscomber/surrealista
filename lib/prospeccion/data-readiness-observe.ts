import {
  evaluateDataReadiness,
  type DataAuthority,
  type DataEvidenceRef,
  type DataReadinessResult,
} from "../intelligence/data-readiness"
import type { ProspectingCase } from "./intelligence-core"

const POLICY_VERSION = "sur-realista-prospecting-observe-v1"
const TRANSFORMATION_VERSION = "prospecting-intelligence-core-v4-owner-opportunity"

type ObservedCase = ProspectingCase & {
  ownerResearch?: {
    decision: "contactar" | "validar_propietario" | "descartar"
    researchedAt: string
    nextRefreshAt: string
  }
}

export type ProspectingReadinessObservation = {
  mode: "observe"
  policyVersion: string
  summary: {
    total: number
    ready: number
    limited: number
    blocked: number
    wouldBlockAiSynthesis: boolean
  }
  cases: Array<{
    id: string
    kind: ProspectingCase["kind"]
    status: ProspectingCase["status"]
    readiness: DataReadinessResult
  }>
}

function authority(value: "canonical" | "official" | "derived"): DataAuthority {
  return value
}

function evidenceField(label: string) {
  const value = label.toLowerCase()
  if (value.includes("rol ")) return "rol"
  if (value.includes(" ha")) return "area_ha"
  if (value.includes("propiet")) return "owner"
  if (value.includes("contact")) return "contact"
  if (value.includes("kmz")) return "spatial_match"
  if (value.includes("ajuste") || value.includes("score")) return "fit_score"
  return "case_evidence"
}

function caseEvidenceRefs(item: ObservedCase): DataEvidenceRef[] {
  const refs: DataEvidenceRef[] = item.evidence.map((entry, index) => {
    const mappedAuthority = authority(entry.authority)
    return {
      id: `${item.id}:evidence:${index}`,
      source: entry.source,
      sourceType: mappedAuthority === "canonical" ? "internal_canonical" : "source_evidence",
      sourceRef: `${entry.source}:${item.id}`,
      subjectType: item.kind === "off_market" ? "prospecting_off_market_case" : "prospecting_market_case",
      subjectId: item.id,
      field: evidenceField(entry.label),
      authority: mappedAuthority,
      transformationVersion: mappedAuthority === "derived" ? TRANSFORMATION_VERSION : null,
      verificationStatus: mappedAuthority === "canonical" ? "verified" : "unverified",
      valuePresent: true,
      valueKey: entry.label,
    }
  })

  if (item.rol) {
    refs.push({
      id: `${item.id}:rol`,
      source: item.kind === "off_market" ? "CIREN_or_canonical_KMZ" : "kmz_linking",
      sourceType: item.kind === "off_market" ? "official_or_canonical_identity" : "derived_identity_link",
      sourceRef: `rol:${item.rol}`,
      subjectType: "prospecting_case",
      subjectId: item.id,
      field: "rol",
      authority: item.kind === "off_market" ? "official" : "derived",
      transformationVersion: item.kind === "off_market" ? null : TRANSFORMATION_VERSION,
      verificationStatus: "unverified",
      valuePresent: true,
      valueKey: item.rol,
    })
  } else if (item.kind === "off_market") {
    refs.push({
      id: `${item.id}:rol:missing`,
      source: "prospecting_core",
      sourceType: "missingness_observation",
      sourceRef: `prospecting-case:${item.id}`,
      subjectType: "prospecting_off_market_case",
      subjectId: item.id,
      field: "rol",
      authority: "derived",
      transformationVersion: TRANSFORMATION_VERSION,
      verificationStatus: "unverified",
      valuePresent: false,
      missingReason: "unknown",
      valueKey: null,
    })
  }

  if (item.market.source || item.market.sourceUrl) {
    refs.push({
      id: `${item.id}:market`,
      source: item.market.source || "market_source",
      sourceType: "external_listing",
      sourceRef: item.market.sourceUrl || `market:${item.id}`,
      subjectType: "prospecting_case",
      subjectId: item.id,
      field: "market_presence",
      authority: "external",
      verificationStatus: "unverified",
      valuePresent: true,
      valueKey: item.market.published ? "published" : "not_published",
    })
  }

  if (item.owner) {
    refs.push({
      id: `${item.id}:owner`,
      source: item.owner.basis || "owner_evidence",
      sourceType: "owner_research",
      sourceRef: `${item.owner.basis || "owner"}:${item.id}`,
      subjectType: "prospecting_case",
      subjectId: item.id,
      field: "owner",
      authority: "external",
      confidence: item.owner.confidence,
      verificationStatus: "unverified",
      valuePresent: true,
      valueKey: item.owner.name,
    })
  }

  if (item.contact?.phone || item.contact?.email) {
    refs.push({
      id: `${item.id}:contact`,
      source: item.ownerResearch ? "owner_research_cache" : "kmz_linking",
      sourceType: "contact_evidence",
      sourceRef: `contact:${item.id}`,
      subjectType: "prospecting_case",
      subjectId: item.id,
      field: "contact",
      authority: "external",
      observedAt: item.ownerResearch?.researchedAt ?? null,
      verificationStatus: "unverified",
      valuePresent: true,
      valueKey: [item.contact.phone, item.contact.email].filter(Boolean).join("|"),
    })
  }

  return refs
}

export function observeProspectingDataReadiness(
  cases: ObservedCase[],
  options: {
    authorizationChecked: boolean
    canonicalSelectionChecked: boolean
    decisionTime?: string
  },
): ProspectingReadinessObservation {
  const decisionTime = options.decisionTime ?? new Date().toISOString()

  const observations = cases.map((item) => ({
    id: item.id,
    kind: item.kind,
    status: item.status,
    readiness: evaluateDataReadiness(
      {
        canonicalEntityId: item.id,
        authorizationChecked: options.authorizationChecked,
        canonicalSelectionChecked: options.canonicalSelectionChecked,
        evidence: caseEvidenceRefs(item),
        decisionTime,
        evaluatedAt: decisionTime,
      },
      {
        version: POLICY_VERSION,
        minEvidence: 1,
        requiredFields: item.kind === "off_market" ? ["rol"] : [],
        requireCanonicalIdentity: true,
        requireAuthorization: true,
        requireCanonicalSelection: true,
        requireProvenance: true,
        requireVerifiedEvidence: false,
        blockOnMissingRequired: true,
        blockOnContradiction: true,
        blockOnStale: false,
      },
    ),
  }))

  const ready = observations.filter((item) => item.readiness.status === "ready").length
  const limited = observations.filter((item) => item.readiness.status === "limited").length
  const blocked = observations.filter((item) => item.readiness.status === "blocked").length

  return {
    mode: "observe",
    policyVersion: POLICY_VERSION,
    summary: {
      total: observations.length,
      ready,
      limited,
      blocked,
      wouldBlockAiSynthesis: blocked > 0,
    },
    cases: observations,
  }
}

import { OwnerDiscoveryMetadata, OwnerResearchLead, OwnerCandidate } from "./owner-discovery-service"

/**
 * KMZ Owner Enrichment Pipeline
 *
 * Builds and maintains the owner research metadata incrementally
 */
export class KMZOwnerEnrichmentPipeline {
  /**
   * Add or update owner research lead
   * Appends new lead to array, never overwrites
   */
  addResearchLead(
    metadata: OwnerDiscoveryMetadata | null,
    lead: OwnerResearchLead
  ): OwnerDiscoveryMetadata {
    const current = metadata || {}

    if (!current.owner_research_leads) {
      current.owner_research_leads = []
    }

    // Check for duplicates by name + source
    const isDuplicate = current.owner_research_leads.some(
      (l) => l.name === lead.name && l.source === lead.source
    )

    if (!isDuplicate) {
      current.owner_research_leads.push(lead)
      // Keep only latest 50 leads
      if (current.owner_research_leads.length > 50) {
        current.owner_research_leads = current.owner_research_leads.slice(-50)
      }
    }

    return current
  }

  /**
   * Update primary candidate based on highest confidence lead
   */
  updatePrimaryCandidate(
    metadata: OwnerDiscoveryMetadata
  ): OwnerDiscoveryMetadata {
    if (!metadata.owner_research_leads || metadata.owner_research_leads.length === 0) {
      return metadata
    }

    // Find highest confidence lead
    const sorted = [...metadata.owner_research_leads].sort((a, b) => b.confidence - a.confidence)
    const topLead = sorted[0]

    if (topLead && topLead.confidence >= 0.5) {
      metadata.public_owner_candidate = {
        name: topLead.name,
        type: topLead.type,
        confidence: topLead.confidence,
        reason: topLead.reason,
        source: topLead.source,
        url: topLead.url,
        dateFound: new Date().toISOString(),
      }
    }

    return metadata
  }

  /**
   * Increase confidence when multiple sources agree
   */
  increaseConfidenceFromMultipleSources(
    metadata: OwnerDiscoveryMetadata
  ): OwnerDiscoveryMetadata {
    if (!metadata.owner_research_leads || metadata.owner_research_leads.length < 2) {
      return metadata
    }

    if (!metadata.public_owner_candidate) {
      return metadata
    }

    // Count how many leads mention the same name
    const mentionCount = metadata.owner_research_leads.filter(
      (l) => l.name === metadata.public_owner_candidate!.name
    ).length

    if (mentionCount >= 2) {
      // Multiple sources mention same name - increase confidence
      const baseConfidence = metadata.public_owner_candidate.confidence
      const boost = Math.min(0.15 * (mentionCount - 1), 0.25) // Max +0.25 boost
      metadata.public_owner_candidate.confidence = Math.min(1, baseConfidence + boost)
    }

    return metadata
  }

  /**
   * Mark as CBR confirmed if found in official registry
   */
  confirmFromCBR(
    metadata: OwnerDiscoveryMetadata,
    cbrOwnerName: string,
    cbrUrl: string,
    registryDate?: string
  ): OwnerDiscoveryMetadata {
    // Add CBR finding as research lead
    const cbrLead: OwnerResearchLead = {
      name: cbrOwnerName,
      type: this.guessOwnerType(cbrOwnerName),
      confidence: 1.0, // Official registry
      reason: "Found in CBR official registry",
      source: "cbr",
      url: cbrUrl,
      documentType: "cbr-registry",
      dateFound: new Date().toISOString(),
    }

    const updated = this.addResearchLead(metadata, cbrLead)

    // Mark as confirmed
    updated.confirmed_owner = cbrOwnerName
    if (this.isCompany(cbrOwnerName)) {
      updated.confirmed_company = cbrOwnerName
    }
    updated.owner_confidence = 1.0
    updated.cbr_document_url = cbrUrl
    if (registryDate) {
      updated.cbr_registry_date = registryDate
    }

    return updated
  }

  /**
   * Build final queue status after research
   */
  buildQueueStatus(metadata: OwnerDiscoveryMetadata): string {
    if (metadata.owner_confidence === 1.0 && metadata.confirmed_owner) {
      return "confirmed"
    }

    if (metadata.owner_research_leads && metadata.owner_research_leads.length > 0) {
      return "evidence-found"
    }

    return "pending"
  }

  /**
   * Calculate updated owner confidence from all evidence
   */
  calculateOwnerConfidence(metadata: OwnerDiscoveryMetadata): number {
    // If CBR confirmed, return 1.0
    if (metadata.owner_confidence === 1.0) {
      return 1.0
    }

    if (!metadata.owner_research_leads || metadata.owner_research_leads.length === 0) {
      return 0
    }

    // Use highest confidence lead
    const highest = Math.max(...metadata.owner_research_leads.map((l) => l.confidence))

    // Boost if multiple sources agree
    if (metadata.public_owner_candidate && metadata.owner_research_leads.length >= 2) {
      const mentions = metadata.owner_research_leads.filter(
        (l) => l.name === metadata.public_owner_candidate!.name
      ).length

      if (mentions >= 2) {
        return Math.min(1, highest + 0.15)
      }
    }

    return highest
  }

  /**
   * Prepare metadata for storage
   * Cleans up, validates, and normalizes data
   */
  prepareForStorage(metadata: OwnerDiscoveryMetadata): OwnerDiscoveryMetadata {
    // Ensure all dates are ISO strings
    if (metadata.public_owner_candidate?.dateFound) {
      metadata.public_owner_candidate.dateFound = new Date(
        metadata.public_owner_candidate.dateFound
      ).toISOString()
    }

    if (metadata.owner_research_leads) {
      metadata.owner_research_leads = metadata.owner_research_leads.map((lead) => ({
        ...lead,
        dateFound: new Date(lead.dateFound).toISOString(),
      }))
    }

    if (metadata.owner_research_queue?.generatedAt) {
      metadata.owner_research_queue.generatedAt = new Date(
        metadata.owner_research_queue.generatedAt
      ).toISOString()
    }

    // Calculate and store owner confidence
    metadata.owner_confidence = this.calculateOwnerConfidence(metadata)

    // Trim leads to latest 25 for storage efficiency
    if (metadata.owner_research_leads && metadata.owner_research_leads.length > 25) {
      metadata.owner_research_leads = metadata.owner_research_leads.slice(-25)
    }

    return metadata
  }

  /**
   * Merge two metadata objects (new findings into existing)
   */
  merge(existing: OwnerDiscoveryMetadata | null, newFindings: OwnerDiscoveryMetadata): OwnerDiscoveryMetadata {
    if (!existing) {
      return this.prepareForStorage(newFindings)
    }

    // Add new leads
    let merged = { ...existing }
    if (newFindings.owner_research_leads) {
      for (const lead of newFindings.owner_research_leads) {
        merged = this.addResearchLead(merged, lead)
      }
    }

    // Update candidate if new one is better
    if (
      newFindings.public_owner_candidate &&
      (!existing.public_owner_candidate ||
        newFindings.public_owner_candidate.confidence > existing.public_owner_candidate.confidence)
    ) {
      merged.public_owner_candidate = newFindings.public_owner_candidate
    }

    // Update queue if provided
    if (newFindings.owner_research_queue) {
      merged.owner_research_queue = newFindings.owner_research_queue
    }

    // Update confirmation if found
    if (newFindings.confirmed_owner) {
      merged.confirmed_owner = newFindings.confirmed_owner
      merged.confirmed_company = newFindings.confirmed_company
      merged.owner_confidence = 1.0
      merged.cbr_document_url = newFindings.cbr_document_url
      merged.cbr_registry_date = newFindings.cbr_registry_date
    }

    return this.prepareForStorage(merged)
  }

  /**
   * Helper: guess if name is company or person
   */
  private guessOwnerType(name: string): "company" | "person" {
    const companySuffixes = [
      "SPA",
      "S.A.",
      "SA",
      "LTDA",
      "LIMITADA",
      "EIRL",
      "SpA",
      "LTD",
      "LTda",
      "SOCIEDAD",
      "INVERSIONES",
      "AGRICOLA",
      "AGRO",
      "FORESTAL",
      "INMOBILIARIA",
      "EXPORTADORA",
      "PESQUERA",
      "CONSULTORA",
      "SERVICIOS",
    ]

    return companySuffixes.some((suffix) => name.toUpperCase().includes(suffix)) ? "company" : "person"
  }

  /**
   * Helper: check if name is a company
   */
  private isCompany(name: string): boolean {
    return this.guessOwnerType(name) === "company"
  }
}

export const kmzOwnerEnrichmentPipeline = new KMZOwnerEnrichmentPipeline()

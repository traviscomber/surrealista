import { KMZPlacemark } from "./kmz-reader"
import { parseRolParts } from "@/lib/sii/types"

export interface OwnerCandidate {
  name: string
  type: "person" | "company"
  confidence: number
  reason: string
  source: string
  url?: string
  dateFound: string
}

export interface OwnerResearchLead {
  name: string
  type: "person" | "company"
  confidence: number
  reason: string
  source: string
  url?: string
  documentType?: string
  dateFound: string
}

export interface OwnerResearchQueue {
  status: "pending" | "evidence-found" | "confirmed" | "skipped"
  priorityScore: number
  priorityTier: "critical" | "high" | "medium" | "low"
  primaryRol: string | null
  searchQueries: string[]
  suggestedNextStep: string
  generatedAt: string
}

export interface OwnerDiscoveryMetadata {
  public_owner_candidate?: OwnerCandidate | null
  owner_research_leads?: OwnerResearchLead[]
  owner_research_queue?: OwnerResearchQueue
  confirmed_owner?: string | null
  confirmed_company?: string | null
  cbr_registry_date?: string | null
  cbr_document_url?: string | null
  owner_confidence?: number
}

const OWNER_KEYWORDS = [
  "dueño",
  "propietario",
  "sociedad",
  "comprador",
  "razon social",
  "empresa",
  "titular",
  "representante",
  "acreedor",
  "fundo",
  "hacienda",
  "estancia",
]

const COMPANY_SUFFIX_PATTERN =
  /\b(SPA|S\.A\.|SA|LTDA|LIMITADA|EIRL|SpA|SA|LTD|LTda|SOCIEDAD|INVERSIONES|AGRICOLA|AGRO|FORESTAL|INMOBILIARIA|EXPORTADORA|PESQUERA|CONSULTORA|SERVICIOS)\b/i

export class OwnerDiscoveryService {
  /**
   * Extract potential owner information from KMZ description
   */
  extractOwnerFromDescription(description?: string): Partial<OwnerResearchLead> | null {
    if (!description || description.length === 0) {
      return null
    }

    const lowerDesc = description.toLowerCase()

    // Check if description contains owner-related keywords
    const hasOwnerKeyword = OWNER_KEYWORDS.some((keyword) => lowerDesc.includes(keyword))

    if (!hasOwnerKeyword) {
      return null
    }

    // Try to extract owner name (usually after "dueño" or "propietario")
    const ownerMatch = description.match(
      /(?:dueño|propietario|titular|representante)[\s:]*([A-Z][A-Za-z\s\-\.]+)/i
    )

    if (ownerMatch && ownerMatch[1]) {
      const name = ownerMatch[1].trim()
      const isCompany = COMPANY_SUFFIX_PATTERN.test(name)

      return {
        name,
        type: isCompany ? "company" : "person",
        confidence: 0.65,
        reason: "Extracted from KMZ description",
        source: "kmz_description",
        dateFound: new Date().toISOString(),
      }
    }

    // If no explicit match, return null - don't invent data
    return null
  }

  /**
   * Extract ROL from description or metadata
   */
  extractRolFromDescription(description?: string, kmzName?: string): string | null {
    const searchText = `${description || ""} ${kmzName || ""}`.toLowerCase()

    // Look for ROL pattern: numbers-numbers or numbers.numbers or just numbers
    const rolMatch = searchText.match(/\b(\d{1,2}[-\.]\d{1,3}[-\.]\d{1,6})\b/)

    if (rolMatch && rolMatch[1]) {
      return rolMatch[1].replace(/\./g, "-")
    }

    return null
  }

  /**
   * Generate search queries based on available data
   */
  generateSearchQueries(
    rol: string | null,
    commune: string | null,
    kmzName?: string,
    ownerCandidate?: string | null
  ): string[] {
    const queries: string[] = []

    // Priority 1: ROL + Commune
    if (rol && commune) {
      queries.push(`${rol} ${commune} propietario`)
      queries.push(`${rol} ${commune} sociedad`)
      queries.push(`${rol} dueño`)
    }

    // Priority 2: ROL alone with keywords
    if (rol) {
      queries.push(`${rol} propietario`)
      queries.push(`${rol} empresa`)
      queries.push(`${rol} sociedad`)
    }

    // Priority 3: KMZ name + keywords
    if (kmzName) {
      queries.push(`${kmzName} sociedad`)
      queries.push(`${kmzName} propietario`)
      queries.push(`${kmzName} empresa`)
    }

    // Priority 4: Known candidate
    if (ownerCandidate) {
      queries.push(`${ownerCandidate} ${commune || "Chile"}`)
      queries.push(`${ownerCandidate}`)
    }

    return [...new Set(queries)] // Remove duplicates
  }

  /**
   * Extract primary ROL from ROL array
   */
  getPrimaryRol(rolNumbers: string[] | null | undefined): string | null {
    if (!rolNumbers || rolNumbers.length === 0) {
      return null
    }

    // Return first ROL, or first valid one
    for (const rol of rolNumbers) {
      if (rol && typeof rol === "string") {
        const parts = parseRolParts(rol)
        if (parts?.manzana && parts?.predio) {
          return rol
        }
      }
    }

    return rolNumbers[0] || null
  }

  /**
   * Calculate priority score for research queue
   */
  calculatePriorityScore(
    hasRol: boolean,
    hasConfirmedOwner: boolean,
    hasOwnerCandidate: boolean,
    evidenceCount: number,
    region?: string | null,
    daysOld?: number
  ): { score: number; tier: "critical" | "high" | "medium" | "low" } {
    let score = 0

    // Base scoring
    if (hasConfirmedOwner) {
      return { score: 0, tier: "low" } // Skip if already confirmed
    }

    if (!hasRol) {
      return { score: 2, tier: "low" } // Very low priority - no ROL to research
    }

    // ROL exists - base score
    score += 20

    // Missing owner bonus
    if (!hasOwnerCandidate) {
      score += 35
    }

    // Evidence found adds to score but lowers tier
    score += Math.min(evidenceCount * 8, 20)

    // South region priority (high agricultural/forestry value)
    if (region) {
      const southRegions = [
        "araucania",
        "los rios",
        "los lagos",
        "aysen",
        "magallanes",
        "biobio",
        "nuble",
      ]
      if (southRegions.some((r) => region.toLowerCase().includes(r))) {
        score += 18
      }
    }

    // Age factor - older records get slight boost
    if (daysOld && daysOld > 30) {
      score += Math.min(daysOld / 10, 15)
    }

    // Determine tier
    let tier: "critical" | "high" | "medium" | "low" = "low"
    if (score >= 70) tier = "critical"
    else if (score >= 50) tier = "high"
    else if (score >= 30) tier = "medium"

    return { score, tier }
  }

  /**
   * Build queue entry with all metadata
   */
  buildQueueEntry(
    status: "pending" | "evidence-found" | "confirmed" | "skipped",
    rol: string | null,
    commune: string | null,
    kmzName: string | null,
    ownerCandidate: string | null,
    evidenceCount: number,
    region: string | null
  ): OwnerResearchQueue {
    const searchQueries = this.generateSearchQueries(rol, commune, kmzName || undefined, ownerCandidate)

    const { score, tier } = this.calculatePriorityScore(
      Boolean(rol),
      status === "confirmed",
      Boolean(ownerCandidate),
      evidenceCount,
      region
    )

    const suggestedNextSteps: Record<typeof status, string> = {
      pending: rol ? "Search public records (CBR, SEA, Municipal)" : "Need ROL to proceed",
      "evidence-found": "Analyze findings and validate candidate",
      confirmed: "Owner confirmed - process complete",
      skipped: "Skipped by user",
    }

    return {
      status,
      priorityScore: score,
      priorityTier: tier,
      primaryRol: rol,
      searchQueries,
      suggestedNextStep: suggestedNextSteps[status],
      generatedAt: new Date().toISOString(),
    }
  }

  /**
   * Determine if record should be researched
   */
  shouldResearchKmz(metadata: OwnerDiscoveryMetadata | null, forceRefresh: boolean = false): boolean {
    if (!metadata) return true
    if (forceRefresh) return true

    // Don't re-search if already confirmed with high confidence
    if (metadata.confirmed_owner && metadata.owner_confidence === 1.0) {
      return false
    }

    // Don't research if explicitly skipped
    if (metadata.owner_research_queue?.status === "skipped") {
      return false
    }

    // Otherwise, always research to improve candidates
    return true
  }
}

export const ownerDiscoveryService = new OwnerDiscoveryService()

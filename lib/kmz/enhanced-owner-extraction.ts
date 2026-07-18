/**
 * Enhanced Owner Extraction Service
 * 
 * More aggressive extraction from KMZ filenames and descriptions
 * Focuses on extracting ANY potential owner names, not just explicit matches
 */

export interface ExtractedOwner {
  name: string
  type: "person" | "company" | "property_name"
  confidence: number
  source: "filename" | "description" | "metadata"
  pattern: string
}

const COMPANY_PATTERNS = [
  /\b([A-Z][A-Za-z\s&\.]+(?:SPA|S\.A\.|LTDA|LIMITADA|EIRL|SpA|SAC|LTDA|S\.L\.|CORP|INC|LLC))\b/gi,
  /\b([A-Z][A-Za-z\s&\.]+(?:AGRÍCOLA|FORESTAL|INMOBILIARIA|EXPORTADORA|PESQUERA|GANADERA|LECHERA))\b/gi,
]

const PERSON_PATTERNS = [
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g, // Name patterns: FirstName LastName or FirstName MiddleName LastName
]

const PROPERTY_PATTERNS = [
  /(?:Fundo|Hacienda|Estancia|Campo|Parcela|Lote|Terreno|Propiedad|Sitio)\s+([A-Z][A-Za-z\s&0-9\-\.]+)/gi,
]

export class EnhancedOwnerExtraction {
  /**
   * Extract potential owners from filename
   * Much more aggressive - extracts ANY capitalized words as potential owners
   */
  extractFromFilename(filename: string): ExtractedOwner[] {
    const candidates: ExtractedOwner[] = []
    const cleanName = filename
      .replace(/\.(kmz|KMZ|zip|ZIP)$/, "") // Remove extension
      .replace(/\(\d+\)/g, "") // Remove (1), (2), etc.
      .replace(/\-\s*\d+\s*ha/gi, "") // Remove ha numbers
      .trim()

    // 1. Try company patterns
    for (const pattern of COMPANY_PATTERNS) {
      let match
      while ((match = pattern.exec(cleanName)) !== null) {
        const name = match[1].trim()
        if (name.length > 2 && name.length < 100) {
          candidates.push({
            name,
            type: "company",
            confidence: 0.72,
            source: "filename",
            pattern: "company_suffix",
          })
        }
      }
    }

    // 2. Try property-type patterns (Fundo X, Hacienda Y)
    for (const pattern of PROPERTY_PATTERNS) {
      let match
      while ((match = pattern.exec(cleanName)) !== null) {
        const name = match[1].trim()
        if (name.length > 2 && name.length < 100) {
          candidates.push({
            name,
            type: "property_name",
            confidence: 0.65,
            source: "filename",
            pattern: "property_name",
          })
        }
      }
    }

    // 3. Try person patterns (FirstName LastName)
    const words = cleanName.split(/[\s\-\,\.]/g).filter((w) => w.length > 2 && /^[A-Z]/.test(w))

    if (words.length >= 2) {
      // Two or more capitalized words = potential person name
      const potential = words.slice(0, 3).join(" ")
      if (!candidates.some((c) => c.name === potential)) {
        candidates.push({
          name: potential,
          type: "person",
          confidence: 0.58,
          source: "filename",
          pattern: "capitalized_words",
        })
      }
    }

    // Remove duplicates and return
    const seen = new Set<string>()
    return candidates.filter((c) => {
      if (seen.has(c.name)) return false
      seen.add(c.name)
      return true
    })
  }

  /**
   * Extract from description/metadata
   */
  extractFromDescription(description: string): ExtractedOwner[] {
    const candidates: ExtractedOwner[] = []

    if (!description || description.length === 0) {
      return candidates
    }

    // Look for explicit owner mentions
    const ownerMatch = description.match(
      /(?:dueño|propietario|owner|company|empresa|razón\s+social|representante)[\s:]+([^,\n\.]+)/gi
    )

    if (ownerMatch) {
      for (const match of ownerMatch) {
        const clean = match.replace(/(?:dueño|propietario|owner|company|empresa|razón\s+social|representante)[\s:]+/i, "").trim()
        if (clean.length > 2 && clean.length < 100) {
          candidates.push({
            name: clean,
            type: clean.toUpperCase() === clean ? "company" : "person",
            confidence: 0.78,
            source: "description",
            pattern: "explicit_mention",
          })
        }
      }
    }

    return candidates
  }

  /**
   * Score and rank candidates
   */
  rankCandidates(candidates: ExtractedOwner[]): ExtractedOwner[] {
    return candidates
      .sort((a, b) => {
        // Prefer companies > property names > person names
        const typeScore = { company: 3, property_name: 2, person: 1 }
        const typeA = typeScore[a.type] || 0
        const typeB = typeScore[b.type] || 0
        if (typeB !== typeA) return typeB - typeA

        // Then by confidence
        return b.confidence - a.confidence
      })
      .slice(0, 5) // Top 5
  }

  /**
   * Full extraction pipeline
   */
  extract(filename: string, description?: string): ExtractedOwner[] {
    const allCandidates: ExtractedOwner[] = []

    // Extract from filename
    allCandidates.push(...this.extractFromFilename(filename))

    // Extract from description
    if (description) {
      allCandidates.push(...this.extractFromDescription(description))
    }

    // If no candidates found, try fallback: extract ANY capitalized phrase
    if (allCandidates.length === 0) {
      const cleanName = filename
        .replace(/\.(kmz|KMZ|zip|ZIP)$/, "")
        .replace(/\(\d+\)/g, "")
        .replace(/\-\s*\d+\s*ha/gi, "")
        .trim()
      
      // Extract capitalized words/phrases (2+ words or specific patterns)
      const capitalizedMatch = cleanName.match(/([A-Z][a-záéíóú]+(?:\s+[A-Z][a-záéíóú]+)*)/)
      if (capitalizedMatch && capitalizedMatch[1].length > 2) {
        allCandidates.push({
          name: capitalizedMatch[1],
          type: "property_name",
          confidence: 0.50,
          source: "filename_fallback",
          pattern: "capitalized_phrase",
        })
      }
      
      // Also try extracting the whole cleaned name if it looks like a place
      if (cleanName.length > 3 && cleanName.length < 80 && /[A-Z]/.test(cleanName)) {
        allCandidates.push({
          name: cleanName,
          type: "property_name",
          confidence: 0.48,
          source: "filename_full",
          pattern: "full_name",
        })
      }
    }

    // Rank and return
    return this.rankCandidates(allCandidates)
  }
}

export const enhancedExtractor = new EnhancedOwnerExtraction()

import { createClient } from "@supabase/supabase-js"

export interface RolExtractionResult {
  rolNumber: string | null
  confidence: number
  method: "ocr" | "ai" | "pattern" | "hybrid"
  extractedText?: string
  needsReview: boolean
  metadata: {
    documentType: string
    pageNumber?: number
    coordinates?: { x: number; y: number; width: number; height: number }
  }
}

export class RolExtractorService {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Chilean rol number patterns
  private rolPatterns = [
    /\b(\d{3,4})-(\d{4})-([A-Z])\b/g, // Standard: 140-0001-K
    /ROL\s*:?\s*(\d{3,4}-\d{4}-[A-Z])/gi, // With ROL prefix
    /N°\s*ROL\s*:?\s*(\d{3,4}-\d{4}-[A-Z])/gi, // With N° ROL prefix
    /NÚMERO\s*DE\s*ROL\s*:?\s*(\d{3,4}-\d{4}-[A-Z])/gi, // Full text
    /FOLIO\s*REAL\s*:?\s*(\d{3,4}-\d{4}-[A-Z])/gi, // Alternative term
  ]

  async extractRolFromDocument(
    fileUrl: string,
    documentType: "inscripcion" | "mandato" | "tasacion" | "comercial" | "other",
  ): Promise<RolExtractionResult> {
    try {
      // Step 1: Extract text using OCR
      const ocrResult = await this.extractTextWithOCR(fileUrl)

      // Step 2: Try pattern matching first (fastest)
      const patternResult = this.extractWithPatterns(ocrResult.text, documentType)
      if (patternResult.confidence > 0.8) {
        return patternResult
      }

      // Step 3: Use AI for complex cases
      const aiResult = await this.extractWithAI(ocrResult.text, documentType)

      // Step 4: Combine results for hybrid approach
      return this.combineResults(patternResult, aiResult, ocrResult)
    } catch (error) {
      console.error("[v0] Rol extraction error:", error)
      return {
        rolNumber: null,
        confidence: 0,
        method: "hybrid",
        needsReview: true,
        metadata: { documentType },
      }
    }
  }

  private async extractTextWithOCR(fileUrl: string): Promise<{ text: string; confidence: number }> {
    try {
      const response = await fetch("/api/ocr-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      })

      const result = await response.json()
      return {
        text: result.text || "",
        confidence: result.confidence || 0,
      }
    } catch (error) {
      console.error("[v0] OCR extraction failed:", error)
      return { text: "", confidence: 0 }
    }
  }

  private extractWithPatterns(text: string, documentType: string): RolExtractionResult {
    const matches: string[] = []
    let bestMatch = ""
    let confidence = 0

    for (const pattern of this.rolPatterns) {
      const found = text.match(pattern)
      if (found) {
        matches.push(...found)
      }
    }

    if (matches.length > 0) {
      // Validate and score matches
      bestMatch = this.validateRolNumber(matches[0])
      confidence = this.calculatePatternConfidence(matches, text, documentType)
    }

    return {
      rolNumber: bestMatch || null,
      confidence,
      method: "pattern",
      needsReview: confidence < 0.9,
      metadata: { documentType },
    }
  }

  private async extractWithAI(text: string, documentType: string): Promise<RolExtractionResult> {
    try {
      const prompt = `
        Extract the Chilean property rol number from this ${documentType} document.
        
        Look for patterns like:
        - 140-0001-K
        - ROL: 140-0001-K  
        - N° ROL: 140-0001-K
        - FOLIO REAL: 140-0001-K
        
        Document text:
        ${text.substring(0, 2000)}
        
        Return only the rol number in format XXX-XXXX-X or "NOT_FOUND" if none exists.
      `

      const response = await fetch("/api/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, documentType }),
      })

      const result = await response.json()
      const rolNumber = result.rolNumber !== "NOT_FOUND" ? result.rolNumber : null

      return {
        rolNumber,
        confidence: result.confidence || 0.7,
        method: "ai",
        needsReview: (result.confidence || 0.7) < 0.8,
        metadata: { documentType },
      }
    } catch (error) {
      console.error("[v0] AI extraction failed:", error)
      return {
        rolNumber: null,
        confidence: 0,
        method: "ai",
        needsReview: true,
        metadata: { documentType },
      }
    }
  }

  private combineResults(
    patternResult: RolExtractionResult,
    aiResult: RolExtractionResult,
    ocrResult: { text: string; confidence: number },
  ): RolExtractionResult {
    let finalResult: RolExtractionResult

    // If both methods agree, high confidence
    if (patternResult.rolNumber === aiResult.rolNumber && patternResult.rolNumber) {
      finalResult = {
        ...patternResult,
        confidence: Math.min(0.95, (patternResult.confidence + aiResult.confidence) / 2 + 0.1),
        method: "hybrid",
        needsReview: false,
      }
    }
    // If they disagree, use the higher confidence one
    else if (patternResult.confidence > aiResult.confidence) {
      finalResult = { ...patternResult, method: "hybrid" }
    } else {
      finalResult = { ...aiResult, method: "hybrid" }
    }

    // Flag for review if OCR confidence is low
    if (ocrResult.confidence < 0.7) {
      finalResult.needsReview = true
      finalResult.confidence = Math.min(finalResult.confidence, 0.7)
    }

    return finalResult
  }

  private validateRolNumber(rolNumber: string): string {
    const cleaned = rolNumber.replace(/[^\d-A-Z]/g, "")
    const parts = cleaned.split("-")

    if (
      parts.length === 3 &&
      parts[0].length >= 3 &&
      parts[0].length <= 4 &&
      parts[1].length === 4 &&
      parts[2].length === 1 &&
      /[A-Z]/.test(parts[2])
    ) {
      return cleaned
    }

    return ""
  }

  private calculatePatternConfidence(matches: string[], text: string, documentType: string): number {
    let confidence = 0.6

    // Multiple matches increase confidence
    if (matches.length > 1) confidence += 0.1

    // Document type context
    const contextKeywords = {
      inscripcion: ["inscripción", "conservador", "registro", "propiedad"],
      mandato: ["mandato", "venta", "vendedor", "comprador"],
      tasacion: ["tasación", "avalúo", "valor", "comercial"],
      comercial: ["comercial", "precio", "venta"],
    }

    const keywords = contextKeywords[documentType as keyof typeof contextKeywords] || []
    const foundKeywords = keywords.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase())).length

    confidence += (foundKeywords / keywords.length) * 0.2

    // Surrounding text context
    if (text.toLowerCase().includes("rol") || text.toLowerCase().includes("folio")) {
      confidence += 0.1
    }

    return Math.min(confidence, 0.95)
  }

  async batchExtractRols(
    documents: Array<{
      url: string
      type: string
      folderName: string
    }>,
  ): Promise<Array<RolExtractionResult & { folderName: string; documentUrl: string }>> {
    const results = await Promise.all(
      documents.map(async (doc) => {
        const result = await this.extractRolFromDocument(doc.url, doc.type as any)
        return {
          ...result,
          folderName: doc.folderName,
          documentUrl: doc.url,
        }
      }),
    )

    // Store results in database
    await this.storeExtractionResults(results)

    return results
  }

  private async storeExtractionResults(
    results: Array<RolExtractionResult & { folderName: string; documentUrl: string }>,
  ) {
    try {
      for (const result of results) {
        const { data: existing } = await this.supabase
          .from("rol_extractions")
          .select("*")
          .eq("folder_name", result.folderName)
          .eq("document_url", result.documentUrl)
          .single()

        const recordData = {
          folder_name: result.folderName,
          document_url: result.documentUrl,
          rol_number: result.rolNumber,
          confidence: result.confidence,
          extraction_method: result.method,
          needs_review: result.needsReview,
          document_type: result.metadata.documentType,
          extracted_at: new Date().toISOString(),
        }

        if (existing) {
          // Update existing record
          await this.supabase.from("rol_extractions").update(recordData).eq("id", existing.id)
        } else {
          // Insert new record
          await this.supabase.from("rol_extractions").insert(recordData)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to store extraction results:", error)
    }
  }
}

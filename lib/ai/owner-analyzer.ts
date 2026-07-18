import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { OwnerResearchLead } from "@/lib/kmz/owner-discovery-service"

export interface AnalysisResult {
  possibleOwner: string | null
  possibleCompany: string | null
  confidence: number
  reason: string
  evidence: string
  sourceUrl?: string
}

/**
 * Owner Analyzer Service
 *
 * Uses GPT-4o mini to analyze search results and extract owner information
 * Strict rules prevent hallucination or invention of data
 */
export class OwnerAnalyzer {
  private model = openai("gpt-4o-mini")

  /**
   * Analyze search results to identify owner information
   *
   * Takes raw search results and uses GPT-4 to determine:
   * - Possible owner name (person or company)
   * - Confidence level (0-1)
   * - Reasoning
   * - Evidence from search results
   */
  async analyzeSearchResults(searchResults: string, context?: string): Promise<AnalysisResult> {
    if (!searchResults || searchResults.trim().length === 0) {
      return {
        possibleOwner: null,
        possibleCompany: null,
        confidence: 0,
        reason: "No search results provided",
        evidence: "",
      }
    }

    const systemPrompt = `You are an expert property owner researcher for Chilean agricultural land.
Your task is to analyze search results and extract owner information.

CRITICAL RULES (MUST FOLLOW):
1. ONLY extract owner information explicitly mentioned in the search results
2. NEVER invent, hallucinate, or assume owner names
3. NEVER fill in missing data
4. NEVER make up companies or people
5. If no clear owner is found, return null and low confidence

ANALYSIS RULES:
- If text explicitly mentions "Dueño: [name]" or "Propietario: [name]", extract it
- If text mentions company registration with "Razón Social: [company]", extract it
- Company names often end with: SPA, S.A., LTDA, LIMITADA, EIRL, etc.
- Person names typically have 2-3 parts (First Middle Last)

CONFIDENCE SCORING:
- 0.95+: Official registry (CBR, government database)
- 0.85+: Multiple authoritative sources mention same name
- 0.75+: Single authoritative source (SEA, municipal)
- 0.60+: Referenced in PDF or document
- 0.40-0.60: Weak signals, requires verification
- Below 0.40: Too uncertain, mark as null

RESPOND WITH ONLY VALID JSON (NO MARKDOWN):
{
  "possibleOwner": "string or null",
  "possibleCompany": "string or null",
  "confidence": number,
  "reason": "string",
  "evidence": "string"
}

Rules for response:
- possibleOwner: Full name if person found (First Last format), null if company or not found
- possibleCompany: Company name with suffix (SpA, LTDA, etc), null if person or not found
- confidence: 0-1 decimal
- reason: 1-2 sentences explaining why
- evidence: Quote from search results supporting the finding`

    const userMessage = `Analyze these search results for property owner information:

${searchResults}

${context ? `Context: ${context}` : ""}

Extract ONLY explicitly stated owner information. Do not invent names.
Respond with ONLY the JSON object, no markdown, no explanation.`

    try {
      const result = await generateText({
        model: this.model,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.3, // Low temperature for factual extraction
        maxTokens: 500,
      })

      // Parse response
      const text = result.text.trim()

      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?|\n?```/g, "").trim()

      const parsed = JSON.parse(jsonText) as Partial<AnalysisResult>

      return {
        possibleOwner: parsed.possibleOwner || null,
        possibleCompany: parsed.possibleCompany || null,
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
        reason: parsed.reason || "Unable to determine",
        evidence: parsed.evidence || "",
      }
    } catch (error) {
      console.error("[v0] Owner analysis error:", error)
      return {
        possibleOwner: null,
        possibleCompany: null,
        confidence: 0,
        reason: "Analysis failed",
        evidence: "",
      }
    }
  }

  /**
   * Compare and merge multiple analysis results
   * Increases confidence when multiple sources agree
   */
  mergeAnalyses(analyses: AnalysisResult[]): AnalysisResult {
    if (analyses.length === 0) {
      return {
        possibleOwner: null,
        possibleCompany: null,
        confidence: 0,
        reason: "No analyses to merge",
        evidence: "",
      }
    }

    if (analyses.length === 1) {
      return analyses[0]
    }

    // Find most common owner/company mentions
    const ownerCounts = new Map<string, number>()
    const companyCounts = new Map<string, number>()

    for (const analysis of analyses) {
      if (analysis.possibleOwner) {
        ownerCounts.set(
          analysis.possibleOwner,
          (ownerCounts.get(analysis.possibleOwner) || 0) + 1
        )
      }
      if (analysis.possibleCompany) {
        companyCounts.set(
          analysis.possibleCompany,
          (companyCounts.get(analysis.possibleCompany) || 0) + 1
        )
      }
    }

    // Get most mentioned
    const topOwner = ownerCounts.size > 0
      ? Array.from(ownerCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : null

    const topCompany = companyCounts.size > 0
      ? Array.from(companyCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : null

    // Calculate merged confidence
    let confidence = 0
    let evidenceCount = 0

    if (topOwner) {
      const ownerConfidences = analyses
        .filter((a) => a.possibleOwner === topOwner)
        .map((a) => a.confidence)

      confidence = ownerConfidences.reduce((a, b) => a + b, 0) / ownerConfidences.length
      evidenceCount = ownerConfidences.length

      // Boost confidence if multiple sources agree
      if (evidenceCount >= 2) {
        confidence = Math.min(1, confidence + 0.15)
      }
    } else if (topCompany) {
      const companyConfidences = analyses
        .filter((a) => a.possibleCompany === topCompany)
        .map((a) => a.confidence)

      confidence = companyConfidences.reduce((a, b) => a + b, 0) / companyConfidences.length
      evidenceCount = companyConfidences.length

      // Boost confidence if multiple sources agree
      if (evidenceCount >= 2) {
        confidence = Math.min(1, confidence + 0.15)
      }
    }

    const reason =
      evidenceCount >= 2
        ? `Found in ${evidenceCount} sources: ${[topOwner, topCompany].filter(Boolean).join(", ")}`
        : `Identified from search results`

    return {
      possibleOwner: topOwner || null,
      possibleCompany: topCompany || null,
      confidence,
      reason,
      evidence: `Merged from ${analyses.length} analyses with ${evidenceCount} mentions`,
    }
  }

  /**
   * Convert analysis result to research lead
   */
  toResearchLead(
    analysis: AnalysisResult,
    source: string,
    documentType?: string
  ): OwnerResearchLead | null {
    if (!analysis.possibleOwner && !analysis.possibleCompany) {
      return null
    }

    const name = analysis.possibleCompany || analysis.possibleOwner
    if (!name) return null

    return {
      name,
      type: analysis.possibleCompany ? "company" : "person",
      confidence: analysis.confidence,
      reason: analysis.reason,
      source,
      documentType,
      dateFound: new Date().toISOString(),
    }
  }

  /**
   * Validate if result should be stored (not too uncertain)
   */
  shouldStore(analysis: AnalysisResult, minConfidence: number = 0.5): boolean {
    return analysis.confidence >= minConfidence && (analysis.possibleOwner !== null || analysis.possibleCompany !== null)
  }
}

export const ownerAnalyzer = new OwnerAnalyzer()

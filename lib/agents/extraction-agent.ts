import type { AgentResult } from "./orchestrator"

export interface ExtractionResult {
  rolNumbers: {
    value: string
    confidence: number
    source: string
    location: string
  }[]
  dates: {
    value: string
    type: "creation" | "modification" | "document"
    confidence: number
    source: string
  }[]
  amounts: {
    value: number
    currency: string
    type: "price" | "tax" | "fee"
    confidence: number
    source: string
  }[]
  metadata: {
    totalDocuments: number
    processedDocuments: number
    errors: string[]
  }
}

export class ExtractionAgent {
  async extractData(data: { folderId: string; extractTypes: string[] }): Promise<AgentResult> {
    console.log(`[v0] ExtractionAgent: Extracting data from folder ${data.folderId}`)

    try {
      const result: ExtractionResult = {
        rolNumbers: [],
        dates: [],
        amounts: [],
        metadata: {
          totalDocuments: 0,
          processedDocuments: 0,
          errors: [],
        },
      }

      // Simulate extraction from different document types
      if (data.extractTypes.includes("rol")) {
        result.rolNumbers = await this.extractRolNumbers(data.folderId)
      }

      if (data.extractTypes.includes("dates")) {
        result.dates = await this.extractDates(data.folderId)
      }

      if (data.extractTypes.includes("amounts")) {
        result.amounts = await this.extractAmounts(data.folderId)
      }

      const avgConfidence = this.calculateAverageConfidence(result)

      return {
        success: true,
        data: result,
        confidence: avgConfidence,
        processingTime: 0,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Extraction failed",
        confidence: 0,
        processingTime: 0,
      }
    }
  }

  private async extractRolNumbers(folderId: string): Promise<ExtractionResult["rolNumbers"]> {
    // Simulate OCR + AI extraction
    return [
      {
        value: "140-0001-K",
        confidence: 0.95,
        source: "inscripcion_dominio.pdf",
        location: "/2_DOCUMENTOS/a_antecedentes_titulo/",
      },
      {
        value: "140-0001-K",
        confidence: 0.88,
        source: "tasacion_comercial.pdf",
        location: "/2_DOCUMENTOS/b_tasacion_info/",
      },
    ]
  }

  private async extractDates(folderId: string): Promise<ExtractionResult["dates"]> {
    return [
      {
        value: "2024-06-20",
        type: "creation",
        confidence: 0.92,
        source: "folder_structure",
      },
      {
        value: "2024-07-10",
        type: "modification",
        confidence: 0.89,
        source: "document_metadata",
      },
    ]
  }

  private async extractAmounts(folderId: string): Promise<ExtractionResult["amounts"]> {
    return [
      {
        value: 85000000,
        currency: "CLP",
        type: "price",
        confidence: 0.91,
        source: "tasacion_comercial.pdf",
      },
    ]
  }

  private calculateAverageConfidence(result: ExtractionResult): number {
    const allConfidences = [
      ...result.rolNumbers.map((r) => r.confidence),
      ...result.dates.map((d) => d.confidence),
      ...result.amounts.map((a) => a.confidence),
    ]

    return allConfidences.length > 0 ? allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length : 0
  }
}

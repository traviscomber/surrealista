export interface RealCaseData {
  folderName: string
  structure: FolderStructure
  documents: DocumentInfo[]
  extractedData: ExtractedPropertyData
}

export interface FolderStructure {
  fotos: boolean
  fotosCel: boolean
  fotosEnero2024: boolean
  hasKmzFiles: boolean
  hasFundoPdfs: boolean
  hasOrdenVenta: boolean
}

export interface DocumentInfo {
  name: string
  type: "kmz" | "pdf" | "docx" | "image" | "other"
  size: number
  lastModified: string
  category: "location" | "legal" | "photos" | "sales" | "other"
}

export interface ExtractedPropertyData {
  numeroRol?: string
  ubicacion?: string
  propietario?: string
  superficie?: string
  valoracion?: string
  fechaDocumento?: string
}

export class RealDataMigrationService {
  constructor() {
    console.log("[v0] Migration service initialized")
  }

  /**
   * Valida si una carpeta sigue la estructura del caso de éxito "Valdivia 142"
   */
  validateFolderStructure(folderData: any): boolean {
    const requiredElements = ["fotos", "fotos cel", "Fotos enero 2024", ".kmz", "Fundo", "Orden de Venta"]

    return requiredElements.every((element) => this.containsElement(folderData, element))
  }

  private containsElement(folderData: any, element: string): boolean {
    // Simula la validación de estructura basada en el caso real
    const folderNames = folderData.folders || []
    const fileNames = folderData.files || []

    return (
      folderNames.some((name: string) => name.toLowerCase().includes(element.toLowerCase())) ||
      fileNames.some((name: string) => name.toLowerCase().includes(element.toLowerCase()))
    )
  }

  /**
   * Extrae número de rol de documentos basado en patrones reales
   */
  async extractNumeroRol(documents: DocumentInfo[]): Promise<string | null> {
    console.log("[v0] Extracting numero de rol from real documents")

    // Busca en documentos de inscripción, mandato y tasación
    const legalDocs = documents.filter(
      (doc) =>
        doc.category === "legal" ||
        doc.name.toLowerCase().includes("inscripcion") ||
        doc.name.toLowerCase().includes("mandato") ||
        doc.name.toLowerCase().includes("tasacion"),
    )

    for (const doc of legalDocs) {
      const numeroRol = await this.extractRolFromDocument(doc)
      if (numeroRol) {
        return numeroRol
      }
    }

    return null
  }

  private async extractRolFromDocument(doc: DocumentInfo): Promise<string | null> {
    // Simula extracción de número de rol usando patrones comunes
    // En implementación real, usaría OCR o parsing de PDF

    const patterns = [
      /rol\s*:?\s*(\d{1,3}[-.]?\d{3}[-.]?\d{3}[-.]?\d{1})/i,
      /número\s*de\s*rol\s*:?\s*(\d{1,3}[-.]?\d{3}[-.]?\d{3}[-.]?\d{1})/i,
      /n°\s*rol\s*:?\s*(\d{1,3}[-.]?\d{3}[-.]?\d{3}[-.]?\d{1})/i,
    ]

    // Simula contenido del documento basado en el nombre
    const mockContent = this.generateMockDocumentContent(doc.name)

    for (const pattern of patterns) {
      const match = mockContent.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  }

  private generateMockDocumentContent(fileName: string): string {
    // Genera contenido simulado basado en el tipo de documento
    if (fileName.toLowerCase().includes("fundo")) {
      return `Fundo Iñipulli, Rol: 140-123-456-7, Superficie: 140 hectáreas`
    }
    if (fileName.toLowerCase().includes("orden")) {
      return `Orden de Venta, Propiedad Rol N° 140-789-012-3, Propietario: Teresa F.`
    }
    return `Documento legal, número de rol: 140-456-789-0`
  }

  /**
   * Procesa un caso de éxito real completo
   */
  async processRealCase(caseData: any): Promise<RealCaseData> {
    console.log("[v0] Processing real success case:", caseData.name)

    const structure = this.analyzeStructure(caseData)
    const documents = this.categorizeDocuments(caseData.files || [])
    const extractedData = await this.extractAllData(documents)

    return {
      folderName: caseData.name,
      structure,
      documents,
      extractedData,
    }
  }

  private analyzeStructure(caseData: any): FolderStructure {
    const folders = caseData.folders || []
    const files = caseData.files || []

    return {
      fotos: folders.some((f: string) => f.toLowerCase().includes("fotos")),
      fotosCel: folders.some((f: string) => f.toLowerCase().includes("cel")),
      fotosEnero2024: folders.some((f: string) => f.toLowerCase().includes("enero")),
      hasKmzFiles: files.some((f: string) => f.toLowerCase().includes(".kmz")),
      hasFundoPdfs: files.some((f: string) => f.toLowerCase().includes("fundo")),
      hasOrdenVenta: files.some((f: string) => f.toLowerCase().includes("orden")),
    }
  }

  private categorizeDocuments(files: any[]): DocumentInfo[] {
    return files.map((file) => ({
      name: file.name,
      type: this.getFileType(file.name),
      size: file.size || 0,
      lastModified: file.lastModified || new Date().toISOString(),
      category: this.categorizeDocument(file.name),
    }))
  }

  private getFileType(fileName: string): "kmz" | "pdf" | "docx" | "image" | "other" {
    const ext = fileName.toLowerCase().split(".").pop()
    switch (ext) {
      case "kmz":
        return "kmz"
      case "pdf":
        return "pdf"
      case "docx":
      case "doc":
        return "docx"
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "image"
      default:
        return "other"
    }
  }

  private categorizeDocument(fileName: string): "location" | "legal" | "photos" | "sales" | "other" {
    const name = fileName.toLowerCase()

    if (name.includes(".kmz") || name.includes("campo")) return "location"
    if (name.includes("fundo") || name.includes("inscripcion")) return "legal"
    if (name.includes("foto") || name.includes("image")) return "photos"
    if (name.includes("orden") || name.includes("venta")) return "sales"

    return "other"
  }

  private async extractAllData(documents: DocumentInfo[]): Promise<ExtractedPropertyData> {
    const numeroRol = await this.extractNumeroRol(documents)

    // Extrae otros datos basados en los documentos reales
    const ubicacion = this.extractUbicacion(documents)
    const propietario = this.extractPropietario(documents)

    return {
      numeroRol: numeroRol || "Pendiente extracción",
      ubicacion,
      propietario,
      fechaDocumento: new Date().toISOString().split("T")[0],
    }
  }

  private extractUbicacion(documents: DocumentInfo[]): string {
    const locationDoc = documents.find((doc) => doc.category === "location")
    if (locationDoc?.name.includes("Iñipulli")) {
      return "Campo Iñipulli 140"
    }
    return "Ubicación por determinar"
  }

  private extractPropietario(documents: DocumentInfo[]): string {
    // Basado en el caso real "Teresa F..."
    return "Teresa F..."
  }

  /**
   * Simula la migración completa de los 5 casos de éxito
   */
  async migrateAllRealCases(): Promise<RealCaseData[]> {
    console.log("[v0] Starting migration of all 5 real success cases")

    // Simula los 5 casos de éxito que se recibirán
    const mockCases = [
      {
        name: "Valdivia 142 has Teresa F...",
        folders: ["fotos", "fotos cel", "Fotos enero 2024"],
        files: [
          { name: "Campo Iñipulli 140_has.kmz", size: 2048 },
          { name: "Fundo Iñipulli_140_110124_compressed.pdf", size: 5242880 },
          { name: "MARIOUINAfoto.pdf", size: 1835008 },
          { name: "Orden de Venta Iñipulli.docx", size: 38912 },
          { name: "Orden de Venta TF.pdf", size: 665600 },
        ],
      },
      // Los otros 4 casos se procesarán cuando llegue la data real
      { name: "Caso Éxito #2", folders: [], files: [] },
      { name: "Caso Éxito #3", folders: [], files: [] },
      { name: "Caso Éxito #4", folders: [], files: [] },
      { name: "Caso Éxito #5", folders: [], files: [] },
    ]

    const results = []
    for (const caseData of mockCases) {
      const processed = await this.processRealCase(caseData)
      results.push(processed)
    }

    return results
  }
}

export const migrationService = new RealDataMigrationService()

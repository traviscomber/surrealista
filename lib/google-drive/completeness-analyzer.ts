export interface CompletenessStandard {
  name: string
  description: string
  criteria: CompletnessCriteria[]
  weight: number
}

export interface CompletnessCriteria {
  id: string
  name: string
  description: string
  weight: number
  validator: (files: DriveFile[], folders: DriveFile[]) => boolean
}

export interface CompletenessResult {
  overallScore: number
  criteriaResults: CriteriaResult[]
  recommendations: string[]
  missingElements: string[]
  status: "excellent" | "good" | "fair" | "poor"
}

export interface CriteriaResult {
  criteriaId: string
  name: string
  passed: boolean
  score: number
  weight: number
  details: string
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime: string
  parents?: string[]
  webViewLink: string
}

export class CompletenessAnalyzer {
  private standards: CompletenessStandard[] = [
    {
      name: "Estructura de Carpetas Estándar",
      description: "Verificación de la estructura de carpetas requerida según el estándar Sur-Realista",
      weight: 30,
      criteria: [
        {
          id: "required_folders",
          name: "Carpetas Requeridas",
          description:
            "Debe tener las 6 carpetas principales: FOTOS, DOCUMENTOS, COMUNICACIONES, MARKETING, PDF_SUELTO, KMZ_SUELTO",
          weight: 40,
          validator: (files, folders) => {
            const requiredFolders = ["FOTOS", "DOCUMENTOS", "COMUNICACIONES", "MARKETING", "PDF_SUELTO", "KMZ_SUELTO"]
            const folderNames = folders.map((f) => f.name.toUpperCase())
            return requiredFolders.every((required) => folderNames.some((name) => name.includes(required)))
          },
        },
        {
          id: "folder_naming",
          name: "Nomenclatura de Carpetas",
          description: "Las carpetas deben seguir el formato numérico: 1_FOTOS, 2_DOCUMENTOS, etc.",
          weight: 20,
          validator: (files, folders) => {
            const expectedNames = [
              "1_FOTOS",
              "2_DOCUMENTOS",
              "3_COMUNICACIONES",
              "4_MARKETING",
              "5_PDF_SUELTO",
              "6_KMZ_SUELTO",
            ]
            const folderNames = folders.map((f) => f.name.toUpperCase())
            return expectedNames.filter((expected) => folderNames.some((name) => name.includes(expected))).length >= 4 // Al menos 4 de 6 carpetas con nomenclatura correcta
          },
        },
      ],
    },
    {
      name: "Contenido de Archivos",
      description: "Verificación de la presencia y calidad de archivos esenciales",
      weight: 40,
      criteria: [
        {
          id: "kmz_files",
          name: "Archivos KMZ/KML",
          description: "Debe contener al menos un archivo KMZ o KML con información geoespacial",
          weight: 30,
          validator: (files, folders) => {
            return files.some(
              (file) =>
                file.name.toLowerCase().endsWith(".kmz") ||
                file.name.toLowerCase().endsWith(".kml") ||
                file.mimeType === "application/vnd.google-earth.kmz" ||
                file.mimeType === "application/vnd.google-earth.kml+xml",
            )
          },
        },
        {
          id: "pdf_documents",
          name: "Documentos PDF",
          description: "Debe contener documentos PDF relevantes (escrituras, planos, etc.)",
          weight: 25,
          validator: (files, folders) => {
            return files.filter((file) => file.mimeType === "application/pdf").length >= 1
          },
        },
        {
          id: "photos",
          name: "Fotografías",
          description: "Debe contener imágenes de la propiedad",
          weight: 20,
          validator: (files, folders) => {
            return files.some(
              (file) => file.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name),
            )
          },
        },
        {
          id: "minimum_files",
          name: "Cantidad Mínima de Archivos",
          description: "Debe tener al menos 5 archivos para considerarse completo",
          weight: 15,
          validator: (files, folders) => {
            return files.length >= 5
          },
        },
      ],
    },
    {
      name: "Información de Propiedad",
      description: "Verificación de información específica de la propiedad",
      weight: 20,
      criteria: [
        {
          id: "rol_numbers",
          name: "Números de Rol",
          description: "Los archivos deben contener referencias a números de rol",
          weight: 40,
          validator: (files, folders) => {
            const rolPattern = /\b\d{1,3}[-_]\d{1,4}\b|\brol\s*:?\s*\d+/i
            return files.some((file) => rolPattern.test(file.name))
          },
        },
        {
          id: "location_info",
          name: "Información de Ubicación",
          description: "Los nombres de archivos deben incluir información de ubicación",
          weight: 30,
          validator: (files, folders) => {
            const locationKeywords = [
              "valdivia",
              "temuco",
              "osorno",
              "puerto",
              "lago",
              "campo",
              "fundo",
              "parcela",
              "terreno",
            ]
            return files.some((file) => locationKeywords.some((keyword) => file.name.toLowerCase().includes(keyword)))
          },
        },
        {
          id: "area_info",
          name: "Información de Superficie",
          description: "Los archivos deben incluir información de hectáreas o superficie",
          weight: 20,
          validator: (files, folders) => {
            const areaPattern = /\b\d+[._]?\d*\s*(has?|hectáreas?|m2|metros?)\b/i
            return files.some((file) => areaPattern.test(file.name))
          },
        },
      ],
    },
    {
      name: "Organización y Calidad",
      description: "Verificación de la organización y calidad general",
      weight: 10,
      criteria: [
        {
          id: "file_sizes",
          name: "Tamaños de Archivo Apropiados",
          description: "Los archivos deben tener tamaños razonables (no vacíos, no excesivamente grandes)",
          weight: 30,
          validator: (files, folders) => {
            const validSizes = files.filter((file) => {
              const size = Number.parseInt(file.size || "0")
              return size > 1000 && size < 100000000 // Entre 1KB y 100MB
            })
            return validSizes.length >= Math.floor(files.length * 0.8) // 80% de archivos con tamaños válidos
          },
        },
        {
          id: "recent_activity",
          name: "Actividad Reciente",
          description: "Debe haber archivos modificados en los últimos 2 años",
          weight: 20,
          validator: (files, folders) => {
            const twoYearsAgo = new Date()
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
            return files.some((file) => new Date(file.modifiedTime) > twoYearsAgo)
          },
        },
      ],
    },
  ]

  analyzeCompleteness(files: DriveFile[], folders: DriveFile[]): CompletenessResult {
    const criteriaResults: CriteriaResult[] = []
    let totalWeightedScore = 0
    let totalWeight = 0

    // Evaluar cada estándar y sus criterios
    for (const standard of this.standards) {
      for (const criteria of standard.criteria) {
        const passed = criteria.validator(files, folders)
        const score = passed ? 100 : 0
        const weightedScore = (score * criteria.weight * standard.weight) / 10000 // Normalizar

        criteriaResults.push({
          criteriaId: criteria.id,
          name: criteria.name,
          passed,
          score,
          weight: (criteria.weight * standard.weight) / 100,
          details: criteria.description,
        })

        totalWeightedScore += weightedScore
        totalWeight += (criteria.weight * standard.weight) / 10000
      }
    }

    const overallScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0

    // Determinar estado
    let status: "excellent" | "good" | "fair" | "poor"
    if (overallScore >= 90) status = "excellent"
    else if (overallScore >= 75) status = "good"
    else if (overallScore >= 60) status = "fair"
    else status = "poor"

    // Generar recomendaciones
    const recommendations = this.generateRecommendations(criteriaResults)
    const missingElements = this.identifyMissingElements(criteriaResults)

    return {
      overallScore: Math.round(overallScore),
      criteriaResults,
      recommendations,
      missingElements,
      status,
    }
  }

  private generateRecommendations(results: CriteriaResult[]): string[] {
    const recommendations: string[] = []
    const failedCriteria = results.filter((r) => !r.passed)

    if (failedCriteria.some((r) => r.criteriaId === "required_folders")) {
      recommendations.push("Crear la estructura de carpetas estándar (1_FOTOS, 2_DOCUMENTOS, etc.)")
    }

    if (failedCriteria.some((r) => r.criteriaId === "kmz_files")) {
      recommendations.push("Agregar archivos KMZ/KML con información geoespacial de la propiedad")
    }

    if (failedCriteria.some((r) => r.criteriaId === "pdf_documents")) {
      recommendations.push("Incluir documentos PDF relevantes (escrituras, planos, certificados)")
    }

    if (failedCriteria.some((r) => r.criteriaId === "photos")) {
      recommendations.push("Agregar fotografías de la propiedad en formato JPG/PNG")
    }

    if (failedCriteria.some((r) => r.criteriaId === "rol_numbers")) {
      recommendations.push("Incluir números de rol en los nombres de archivos o documentos")
    }

    if (failedCriteria.some((r) => r.criteriaId === "location_info")) {
      recommendations.push("Agregar información de ubicación en los nombres de archivos")
    }

    return recommendations
  }

  private identifyMissingElements(results: CriteriaResult[]): string[] {
    const missing: string[] = []
    const failedCriteria = results.filter((r) => !r.passed)

    failedCriteria.forEach((criteria) => {
      missing.push(criteria.name)
    })

    return missing
  }

  getCompletenessColor(score: number): string {
    if (score >= 90) return "text-green-600"
    if (score >= 75) return "text-blue-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  getCompletenessIcon(score: number): string {
    if (score >= 90) return "✅"
    if (score >= 75) return "🟢"
    if (score >= 60) return "🟡"
    return "🔴"
  }
}

export const completenessAnalyzer = new CompletenessAnalyzer()

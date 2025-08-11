export interface GoogleSheetsProperty {
  "Nombre Campo": string
  "Nombre Contacto": string
  "Telefono contacto": string
  "correo contacto": string
  Rol: string
  "derechos de agua": string
  dueño: string
  Region: string
}

export interface ParsedProperty {
  title: string
  contact_name: string
  contact_phone: string
  contact_email: string
  property_rol: string
  water_rights: boolean
  owner_name: string
  region: string
  data_quality_score: number
  validation_errors: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  score: number
}

export interface ValidationSummary {
  total: number
  withErrors: number
  qualityDistribution: {
    high: number
    medium: number
    low: number
  }
}

export class GoogleSheetsParser {
  // Chilean regions for validation
  private static readonly CHILEAN_REGIONS = [
    "Arica y Parinacota",
    "Tarapacá",
    "Antofagasta",
    "Atacama",
    "Coquimbo",
    "Valparaíso",
    "Metropolitana",
    "O'Higgins",
    "Maule",
    "Ñuble",
    "Biobío",
    "La Araucanía",
    "Los Ríos",
    "Los Lagos",
    "Aysén",
    "Magallanes",
  ]

  // Expected CSV headers (exact match with Google Sheets)
  private static readonly EXPECTED_HEADERS = [
    "Nombre Campo",
    "Nombre Contacto",
    "Telefono contacto",
    "correo contacto",
    "Rol",
    "derechos de agua",
    "dueño",
    "Region",
  ]

  // Header mapping for flexible parsing
  private static readonly HEADER_MAPPING: Record<string, string[]> = {
    "Nombre Campo": ["Nombre Campo", "nombre campo", "titulo", "título", "title", "campo"],
    "Nombre Contacto": ["Nombre Contacto", "nombre contacto", "contacto", "contact", "nombre_contacto"],
    "Telefono contacto": [
      "Telefono contacto",
      "telefono contacto",
      "teléfono contacto",
      "telefono",
      "teléfono",
      "phone",
    ],
    "correo contacto": ["correo contacto", "email contacto", "correo", "email", "mail"],
    Rol: ["Rol", "rol", "numero rol", "número rol", "role"],
    "derechos de agua": ["derechos de agua", "agua", "water rights", "water", "derechos_agua"],
    dueño: ["dueño", "dueno", "propietario", "owner", "dueño_nombre"],
    Region: ["Region", "región", "region", "area", "zona"],
  }

  static generateTemplate(): string {
    const headers = this.EXPECTED_HEADERS.join(",")
    const sampleRows = [
      [
        "Fundo La Esperanza",
        "Juan Pérez",
        "+56912345678",
        "juan.perez@email.com",
        "123-45",
        "si",
        "Juan Pérez González",
        "Metropolitana",
      ].join(","),
      [
        "Casa Lago Villarrica",
        "María González",
        "+56987654321",
        "maria.gonzalez@email.com",
        "456-78",
        "no",
        "María González Silva",
        "La Araucanía",
      ].join(","),
    ]

    return `${headers}\n${sampleRows.join("\n")}`
  }

  static parseCSV(csvContent: string): ParsedProperty[] {
    const lines = csvContent.trim().split("\n")
    if (lines.length < 2) {
      throw new Error("El archivo CSV debe contener al menos una fila de encabezados y una fila de datos")
    }

    // Parse headers and clean them
    const rawHeaders = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const headers = this.normalizeHeaders(rawHeaders)

    console.log("Raw headers:", rawHeaders)
    console.log("Normalized headers:", headers)

    // Validate that we can map all required headers
    const missingHeaders = this.EXPECTED_HEADERS.filter((expected) => !this.findHeaderMatch(expected, headers))

    if (missingHeaders.length > 0) {
      throw new Error(
        `No se pudieron mapear las siguientes columnas requeridas: ${missingHeaders.join(", ")}. Headers encontrados: ${rawHeaders.join(", ")}`,
      )
    }

    const properties: ParsedProperty[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue // Skip empty lines

      const values = this.parseCSVLine(line)

      if (values.length === 0) continue // Skip empty rows

      try {
        const property = this.parseRow(headers, values, i + 1)
        properties.push(property)
      } catch (error) {
        console.error(`Error parsing row ${i + 1}:`, error)
        // Create a property with errors instead of skipping
        const errorProperty: ParsedProperty = {
          title: `Propiedad ${i}`,
          contact_name: "",
          contact_phone: "",
          contact_email: "",
          property_rol: "",
          water_rights: false,
          owner_name: "",
          region: "",
          data_quality_score: 0,
          validation_errors: [`Error parsing row: ${error}`],
        }
        properties.push(errorProperty)
      }
    }

    return properties
  }

  private static parseCSVLine(line: string): string[] {
    const values: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }

    values.push(current.trim())
    return values
  }

  private static normalizeHeaders(headers: string[]): string[] {
    return headers.map((header) => {
      const normalized = header.toLowerCase().trim()

      // Find matching expected header
      for (const [expectedHeader, variations] of Object.entries(this.HEADER_MAPPING)) {
        if (variations.some((variation) => variation.toLowerCase() === normalized)) {
          return expectedHeader
        }
      }

      return header // Return original if no match found
    })
  }

  private static findHeaderMatch(expectedHeader: string, headers: string[]): boolean {
    return headers.includes(expectedHeader)
  }

  private static parseRow(headers: string[], values: string[], rowNumber: number): ParsedProperty {
    const getValueByHeader = (headerName: string): string => {
      const index = headers.findIndex((h) => h === headerName)
      const value = index >= 0 && index < values.length ? values[index] : ""
      return value?.trim() || ""
    }

    const property: ParsedProperty = {
      title: getValueByHeader("Nombre Campo"),
      contact_name: getValueByHeader("Nombre Contacto"),
      contact_phone: getValueByHeader("Telefono contacto"),
      contact_email: getValueByHeader("correo contacto"),
      property_rol: getValueByHeader("Rol"),
      water_rights: this.parseWaterRights(getValueByHeader("derechos de agua")),
      owner_name: getValueByHeader("dueño"),
      region: getValueByHeader("Region"),
      data_quality_score: 0,
      validation_errors: [],
    }

    console.log(`Row ${rowNumber} parsed:`, {
      title: property.title,
      contact_name: property.contact_name,
      rawValues: values,
      headers: headers,
    })

    // Validate and calculate quality score
    this.validateProperty(property, rowNumber)
    property.data_quality_score = this.calculateQualityScore(property)

    return property
  }

  private static parseWaterRights(value: string): boolean {
    const normalized = value.toLowerCase().trim()
    return (
      normalized === "si" ||
      normalized === "sí" ||
      normalized === "yes" ||
      normalized === "true" ||
      normalized === "1" ||
      normalized === "x"
    )
  }

  private static validateProperty(property: ParsedProperty, rowNumber: number): void {
    const errors: string[] = []

    // Required fields validation with more specific messages
    if (!property.title || property.title.trim().length === 0) {
      errors.push("Nombre Campo es requerido y no puede estar vacío")
    }

    if (!property.contact_name || property.contact_name.trim().length === 0) {
      errors.push("Nombre Contacto es requerido y no puede estar vacío")
    }

    // Phone validation (Chilean format) - only if provided
    if (property.contact_phone && property.contact_phone.trim()) {
      if (!this.isValidChileanPhone(property.contact_phone)) {
        errors.push("Formato de teléfono inválido (use +56XXXXXXXXX o 9XXXXXXXX)")
      }
    }

    // Email validation - only if provided
    if (property.contact_email && property.contact_email.trim()) {
      if (!this.isValidEmail(property.contact_email)) {
        errors.push("Formato de email inválido")
      }
    }

    // Region validation - only if provided
    if (property.region && property.region.trim()) {
      if (!this.CHILEAN_REGIONS.some((region) => region.toLowerCase() === property.region.toLowerCase())) {
        errors.push(`Región inválida: ${property.region}. Regiones válidas: ${this.CHILEAN_REGIONS.join(", ")}`)
      }
    }

    property.validation_errors = errors
  }

  private static isValidChileanPhone(phone: string): boolean {
    // Chilean phone formats: +56XXXXXXXXX, 56XXXXXXXXX, 9XXXXXXXX
    const cleanPhone = phone.replace(/[\s\-$$$$]/g, "")
    const patterns = [
      /^\+56[0-9]{8,9}$/, // +56XXXXXXXXX
      /^56[0-9]{8,9}$/, // 56XXXXXXXXX
      /^9[0-9]{8}$/, // 9XXXXXXXX (mobile)
      /^[0-9]{8}$/, // XXXXXXXX (landline)
    ]

    return patterns.some((pattern) => pattern.test(cleanPhone))
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  private static calculateQualityScore(property: ParsedProperty): number {
    let score = 0
    const maxScore = 100

    // Required fields (50 points total)
    if (property.title && property.title.trim()) score += 25
    if (property.contact_name && property.contact_name.trim()) score += 25

    // Contact information (30 points total)
    if (property.contact_phone && this.isValidChileanPhone(property.contact_phone)) score += 15
    if (property.contact_email && this.isValidEmail(property.contact_email)) score += 15

    // Location information (15 points)
    if (property.region && this.CHILEAN_REGIONS.some((r) => r.toLowerCase() === property.region.toLowerCase()))
      score += 15

    // Additional information (5 points)
    if (property.property_rol && property.property_rol.trim()) score += 2.5
    if (property.owner_name && property.owner_name.trim()) score += 2.5

    // Penalty for validation errors (10 points per error)
    score -= property.validation_errors.length * 10

    return Math.max(0, Math.min(maxScore, Math.round(score)))
  }

  static getQualityLevel(score: number): { level: string; color: string } {
    if (score >= 80) return { level: "Alta", color: "green" }
    if (score >= 60) return { level: "Media", color: "yellow" }
    return { level: "Baja", color: "red" }
  }

  static getValidationSummary(properties: ParsedProperty[]): ValidationSummary {
    const total = properties.length
    const withErrors = properties.filter((p) => p.validation_errors.length > 0).length

    const qualityDistribution = {
      high: properties.filter((p) => p.data_quality_score >= 80).length,
      medium: properties.filter((p) => p.data_quality_score >= 60 && p.data_quality_score < 80).length,
      low: properties.filter((p) => p.data_quality_score < 60).length,
    }

    return {
      total,
      withErrors,
      qualityDistribution,
    }
  }

  // Helper method to debug parsing issues
  static debugParseCSV(csvContent: string): any {
    const lines = csvContent.trim().split("\n")
    const rawHeaders = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const normalizedHeaders = this.normalizeHeaders(rawHeaders)

    return {
      rawHeaders,
      normalizedHeaders,
      expectedHeaders: this.EXPECTED_HEADERS,
      headerMapping: this.HEADER_MAPPING,
      sampleRow: lines[1] ? lines[1].split(",") : null,
    }
  }
}

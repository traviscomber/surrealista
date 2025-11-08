import * as XLSX from "xlsx"

export interface ExcelClientData {
  first_name?: string
  last_name?: string
  second_last_name?: string
  rut?: string
  nationality?: string
  email?: string
  phone?: string
  mobile?: string
  company_name?: string
  position?: string
  company_rut?: string
  industry?: string
  address?: string
  city?: string
  region?: string
  country?: string
  client_type?: string
  main_interest?: string
  locations_of_interest?: string[]
  budget_min?: number
  budget_max?: number
  desired_surface_area_min?: number
  desired_surface_area_max?: number
  notes?: string
  status?: string
  contact_frequency?: string
  birth_date?: string
  second_name?: string
}

export interface ParseResult {
  success: boolean
  data: ExcelClientData[]
  errors: string[]
  warnings: string[]
  totalRows: number
  validRows: number
}

export interface ColumnMapping {
  excelColumn: string
  detectedType: string | null
  confidence: "high" | "medium" | "low"
  sampleValues: string[]
}

export interface SmartParseResult extends ParseResult {
  columnMappings: ColumnMapping[]
  needsReview: boolean
}

export interface ColumnPreviewData {
  columnName: string
  sampleValues: string[]
  suggestedType: string | null
  confidence: "high" | "medium" | "low"
}

// Column mapping - maps Excel column names to database fields
const COLUMN_MAPPINGS: Record<string, string> = {
  // Company/Client name columns - HIGHEST PRIORITY
  "compañía minera": "first_name",
  "compania minera": "first_name",
  "razon social": "first_name",
  "razón social": "first_name",
  "nombre cliente": "first_name",
  "nombre completo": "first_name",
  cliente: "first_name",
  "nombre empresa": "first_name",

  // Chilean standard format
  "primer nombre": "first_name",
  "segundo nombre": "second_name",
  "primer apellido": "last_name",
  "segundo apellido": "second_last_name",
  "apellido paterno": "last_name",
  "apellido materno": "second_last_name",

  // Spanish column names
  nombre: "first_name",
  apellido: "last_name",
  rut: "rut",
  uid: "rut",
  nacionalidad: "nationality",
  email: "email",
  correo: "email",
  "correo electronico": "email",
  "correo electrónico": "email",
  "e-mail": "email",
  mail: "email",
  telefono: "phone",
  teléfono: "phone",
  fono: "phone",
  "telefono fijo": "phone",
  "teléfono fijo": "phone",
  numero: "phone",
  número: "phone",
  "numero de telefono": "phone",
  "número de teléfono": "phone",
  "teléfono móvil": "mobile",
  "telefono movil": "mobile",
  celular: "mobile",
  móvil: "mobile",
  movil: "mobile",

  vendedor: "notes",
  gp: "notes",
  "lim.créd.": "notes",
  "lim cred": "notes",
  "prov.ver.": "notes",
  "fecha de renovaci": "notes",
  infoseguro: "notes",
  "ventas 2010": "notes",
  "ventas 2011": "notes",
  observacion: "notes",
  observación: "notes",
  clust: "notes",
  om: "notes",
  sap: "company_rut",

  ubicacion: "notes",
  ubicación: "notes",
  empresa: "company_name",
  compañía: "company_name",
  cargo: "position",
  "rut empresa": "company_rut",
  industria: "industry",
  rubro: "industry",
  direccion: "address",
  dirección: "address",
  ciudad: "city",
  region: "region",
  región: "region",
  pais: "country",
  país: "country",
  "tipo cliente": "client_type",
  "interes principal": "main_interest",
  "interés principal": "main_interest",
  "ubicaciones interes": "locations_of_interest",
  "presupuesto min": "budget_min",
  "presupuesto minimo": "budget_min",
  "presupuesto max": "budget_max",
  "presupuesto maximo": "budget_max",
  "presupuesto máximo": "budget_max",
  "superficie min": "desired_surface_area_min",
  "superficie minima": "desired_surface_area_min",
  "superficie mínima": "desired_surface_area_min",
  "superficie max": "desired_surface_area_max",
  "superficie maxima": "desired_surface_area_max",
  "superficie máxima": "desired_surface_area_max",
  notas: "notes",
  observaciones: "notes",
  estado: "status",
  "frecuencia contacto": "contact_frequency",
  "fecha nacimiento": "birth_date",

  // English column names
  "first name": "first_name",
  "second name": "second_name",
  "last name": "last_name",
  "second last name": "second_last_name",
  phone: "phone",
  mobile: "mobile",
  company: "company_name",
  position: "position",
  "company rut": "company_rut",
  industry: "industry",
  address: "address",
  city: "city",
  region: "region",
  country: "country",
  "client type": "client_type",
  "main interest": "main_interest",
  "locations of interest": "locations_of_interest",
  "budget min": "budget_min",
  "budget max": "budget_max",
  "surface area min": "desired_surface_area_min",
  "surface area max": "desired_surface_area_max",
  notes: "notes",
  status: "status",
  "contact frequency": "contact_frequency",
  "birth date": "birth_date",

  // Product columns should NOT be mapped to first_name
  productos: "notes",
  "productos ": "notes", // Note the trailing space
  producto: "notes",
}

function normalizeColumnName(columnName: string): string {
  return columnName.toLowerCase().trim()
}

function mapColumnToField(columnName: string): string | null {
  const normalized = normalizeColumnName(columnName)
  return COLUMN_MAPPINGS[normalized] || null
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateRUT(rut: string): boolean {
  // Basic RUT validation for Chilean RUT format
  const rutRegex = /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9Kk]$/
  // Also accept format without dots: 12345678-9
  const rutRegexNoDots = /^[0-9]{7,8}-[0-9Kk]$/
  return rutRegex.test(rut) || rutRegexNoDots.test(rut)
}

function isValidChileanPhone(value: string): boolean {
  // If it has a dash, it's NOT a phone number
  if (value.includes("-")) {
    return false
  }

  // Also reject dates (have dots or slashes in date format)
  if (/\d{2}\.\d{2}\.\d{4}/.test(value) || /\d{2}\/\d{2}\/\d{4}/.test(value)) {
    return false
  }

  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "")

  // Chilean phones are:
  // - 9 digits for mobile (starts with 9)
  // - 8 digits for landline (starts with 2, 3, 4, 5, etc.)
  // - Can have +56 country code prefix

  if (digits.length === 11 && digits.startsWith("56")) {
    // +56 9 XXXX XXXX (mobile) or +56 2 XXXX XXXX (landline)
    return true
  }

  if (digits.length === 9 && digits.startsWith("9")) {
    // Mobile: 9 XXXX XXXX
    return true
  }

  if (digits.length === 8 && !digits.startsWith("9")) {
    // Landline: 2 XXXX XXXX, 3 XXXX XXXX, etc.
    return true
  }

  // 7-digit numbers are too short for phones, probably RUT or other IDs
  if (digits.length === 7) {
    return false
  }

  return false
}

function looksLikeRUT(value: string): boolean {
  // If it doesn't have a dash, it's likely not RUT
  if (!value.includes("-")) {
    return false
  }

  const digits = value.replace(/\D/g, "")

  // RUT typically has 7-8 digits + verification digit
  // If we see 7-9 digits with a dash, it's probably RUT
  if (digits.length >= 7 && digits.length <= 9) {
    // Check if it has RUT formatting (dots and dash, or just dash)
    if (value.includes("-")) {
      return true
    }
  }

  return false
}

function parseLocations(value: string): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((loc) => loc.trim())
    .filter((loc) => loc.length > 0)
}

function parseNumber(value: any): number | undefined {
  if (value === null || value === undefined || value === "") return undefined
  const num = typeof value === "number" ? value : Number.parseFloat(String(value).replace(/[^0-9.-]/g, ""))
  return isNaN(num) ? undefined : num
}

function parseDate(value: any): string | undefined {
  if (!value) return undefined

  // If it's already a Date object
  if (value instanceof Date) {
    return value.toISOString().split("T")[0]
  }

  // If it's a string, try to parse it
  if (typeof value === "string") {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0]
    }
  }

  return undefined
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()

  // Handle empty names
  if (!trimmed) {
    return { firstName: "", lastName: "Sin Apellido" }
  }

  // Remove common prefixes like numbers (e.g., "1. Juan Perez" → "Juan Perez")
  const withoutPrefix = trimmed.replace(/^\d+\.\s*/, "")

  // Remove business entity suffixes like "LTDA.", "S.A.", etc.
  const withoutSuffix = withoutPrefix.replace(/\s+(LTDA\.?|S\.A\.?|SPA|EIRL|S\.C\.)$/i, "")

  const parts = withoutSuffix.trim().split(/\s+/)

  if (parts.length === 0) {
    return { firstName: "", lastName: "Sin Apellido" }
  }

  if (parts.length === 1) {
    // Could be a company name or single word name
    return { firstName: parts[0], lastName: "Sin Apellido" }
  }

  if (parts.length === 2) {
    // Simple case: First Last
    return { firstName: parts[0], lastName: parts[1] }
  }

  // For 3+ parts: First word is first name, rest is last name
  // This handles: "Juan Perez Garcia" → firstName: "Juan", lastName: "Perez Garcia"
  // And also: "MUNICIPALIDAD DE SAN VICENTE" → firstName: "MUNICIPALIDAD", lastName: "DE SAN VICENTE"
  const firstName = parts[0]
  const lastName = parts.slice(1).join(" ")

  return { firstName, lastName }
}

function extractEmailFromValue(value: string): string | null {
  // Look for anything with @ that looks like an email
  const emailPattern = /([^\s@]+@[^\s@]+\.[^\s@]+)/
  const match = value.match(emailPattern)
  return match ? match[1] : null
}

function detectColumnType(values: string[], columnName?: string): string | null {
  if (columnName) {
    const normalized = normalizeColumnName(columnName)

    // HIGHEST PRIORITY: Check if this is explicitly a company name column
    const companyNamePatterns = [
      "compañía minera",
      "compania minera",
      "razon social",
      "razón social",
      "nombre cliente",
      "nombre empresa",
      "cliente",
    ]

    if (companyNamePatterns.some((pattern) => normalized.includes(pattern))) {
      console.log(`[v0] 🎯 Detected company name column by header: "${columnName}"`)
      return "first_name"
    }

    // EXCLUDE product columns explicitly
    if (normalized.includes("producto")) {
      console.log(`[v0] ⛔ Excluding product column: "${columnName}"`)
      return "notes"
    }
  }

  const samples = values
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
    .slice(0, 10)
    .map((v) => String(v))

  if (samples.length === 0) return null

  let emailCount = 0
  let rutCount = 0
  let phoneCount = 0
  let nameCount = 0

  for (const value of samples) {
    const str = value.trim()

    if (str.includes("@") && validateEmail(str)) {
      emailCount++
      continue // Skip other checks if it's an email
    }

    if (str.includes("-") && (validateRUT(str) || looksLikeRUT(str))) {
      rutCount++
      continue // Skip other checks if it's RUT
    }

    if (!str.includes("-") && isValidChileanPhone(str)) {
      phoneCount++
      continue // Skip other checks if it's phone
    }

    // Check for text names
    if (/^[a-zA-ZáéíóúñÑ\s]{2,}$/i.test(str)) {
      nameCount++
    }
  }

  const threshold = samples.length * 0.5

  if (emailCount >= threshold) return "email"
  if (rutCount >= threshold) return "rut"
  if (phoneCount >= threshold) return "phone"
  if (nameCount >= threshold) return "first_name"

  return null
}

function splitChileanFullName(
  fullName: string,
  isCompanyColumn = false,
): {
  firstName: string
  lastName: string
  secondLastName?: string
} {
  const trimmed = fullName.trim()

  // Handle empty names
  if (!trimmed) {
    return { firstName: "", lastName: "Sin Apellido" }
  }

  // Remove common prefixes like numbers (e.g., "1. Juan Perez" → "Juan Perez")
  const withoutPrefix = trimmed.replace(/^\d+\.\s*/, "")

  if (isCompanyColumn) {
    return { firstName: withoutPrefix, lastName: "Empresa" }
  }

  // Check if it's a company (has business suffixes)
  const companyPattern = /\b(LTDA\.?|S\.A\.?|SPA|EIRL|S\.C\.|LIMITADA|SOCIEDAD|INVERSIONES|AGRICOLA|AGR\.)\b/i
  const isCompany = companyPattern.test(withoutPrefix)

  if (isCompany) {
    // For companies, treat the whole name as first_name
    return { firstName: withoutPrefix, lastName: "Empresa" }
  }

  const parts = withoutPrefix.trim().split(/\s+/)
  const isAllCaps = withoutPrefix === withoutPrefix.toUpperCase() && parts.length >= 2
  if (isAllCaps) {
    return { firstName: withoutPrefix, lastName: "Empresa" }
  }

  if (parts.length === 0) {
    return { firstName: "", lastName: "Sin Apellido" }
  }

  if (parts.length === 1) {
    // Single word - could be company or single name
    return { firstName: parts[0], lastName: "Sin Apellido" }
  }

  if (parts.length === 2) {
    // Two words: [Nombre] [Apellido]
    return { firstName: parts[0], lastName: parts[1] }
  }

  if (parts.length === 3) {
    // Three words: [Nombre] [Apellido Paterno] [Apellido Materno]
    // Store both apellidos in last_name
    return {
      firstName: parts[0],
      lastName: parts[1],
      secondLastName: parts[2],
    }
  }

  // 4+ words: Could be [Nombre1] [Nombre2] [Apellido1] [Apellido2]
  // Or could be a company name
  // Take first word(s) as first name, last two as apellidos
  const firstName = parts.slice(0, parts.length - 2).join(" ")
  const lastName = parts[parts.length - 2]
  const secondLastName = parts[parts.length - 1]

  return { firstName, lastName, secondLastName }
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
  const result: ParseResult = {
    success: false,
    data: [],
    errors: [],
    warnings: [],
    totalRows: 0,
    validRows: 0,
  }

  try {
    console.log("[v0] Starting Excel file parsing...")

    // Read the file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })

    // Get the first sheet
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      result.errors.push("El archivo Excel no contiene hojas")
      return result
    }

    const worksheet = workbook.Sheets[sheetName]
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    console.log("[v0] Raw data rows:", rawData.length)

    if (rawData.length < 2) {
      result.errors.push("El archivo debe contener al menos una fila de encabezados y una fila de datos")
      return result
    }

    // Get headers from first row
    const headers: string[] = rawData[0]
    const mappedHeaders = headers.map((h) => mapColumnToField(String(h)))

    console.log("[v0] ==== COLUMN ANALYSIS ====")
    console.log("[v0] Headers found:", headers)
    console.log("[v0] Total columns:", headers.length)

    const unmappedColumns: string[] = []
    const mappedColumns: Array<{ original: string; mapped: string }> = []

    headers.forEach((h, i) => {
      const normalized = normalizeColumnName(String(h))
      const mapped = mappedHeaders[i]
      if (!mapped) {
        unmappedColumns.push(h)
        console.log(`[v0] ❌ UNMAPPED: "${h}" (normalized: "${normalized}")`)
      } else {
        mappedColumns.push({ original: h, mapped: mapped })
        console.log(`[v0] ✅ MAPPED: "${h}" → "${mapped}"`)
      }
    })

    console.log("[v0] ==== SUMMARY ====")
    console.log(`[v0] Mapped columns: ${mappedColumns.length}/${headers.length}`)
    console.log(`[v0] Unmapped columns: ${unmappedColumns.length}/${headers.length}`)
    if (unmappedColumns.length > 0) {
      console.log(`[v0] Unmapped column names: ${unmappedColumns.join(", ")}`)
      result.warnings.push(`Columnas ignoradas (${unmappedColumns.length}): ${unmappedColumns.join(", ")}`)
    }

    // Check if we have at least some recognizable columns
    const validHeaders = mappedHeaders.filter((h) => h !== null)
    if (validHeaders.length === 0) {
      result.errors.push("No se reconocieron columnas válidas en el archivo")
      result.warnings.push(`Columnas encontradas: ${headers.join(", ")}`)
      return result
    }

    result.totalRows = rawData.length - 1 // Exclude header row

    // Process data rows
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i]
      const clientData: ExcelClientData = {}
      const rowErrors: string[] = []
      const rowWarnings: string[] = []

      let secondName: string | undefined

      // Map each cell to the corresponding field
      for (let j = 0; j < headers.length; j++) {
        const fieldName = mappedHeaders[j]
        const cellValue = row[j]
        if (cellValue === null || cellValue === undefined || cellValue === "") continue

        const cellString = String(cellValue).trim()

        if (!clientData.email && cellString.includes("@")) {
          const detectedEmail = extractEmailFromValue(cellString)
          if (detectedEmail) {
            clientData.email = detectedEmail
            if (i <= 3) {
              console.log(`[v0] Row ${i + 1} - Auto-detected email: "${detectedEmail}" from column "${headers[j]}"`)
            }
          }
        }

        if (!fieldName) continue

        if (fieldName === "second_name") {
          secondName = cellString
          continue
        }

        if (fieldName === "phone" || fieldName === "mobile") {
          // Check if this looks more like a RUT than a phone
          if (looksLikeRUT(cellString)) {
            if (!clientData.rut) {
              clientData.rut = cellString
              if (i <= 3) {
                console.log(`[v0] Row ${i + 1} - Detected RUT in phone column: "${cellString}"`)
              }
              continue // Skip adding as phone
            }
          }

          // Validate phone format
          if (isValidChileanPhone(cellString)) {
            clientData[fieldName as keyof ExcelClientData] = cellString as any
            if (i <= 3) {
              console.log(`[v0] Row ${i + 1} - Valid Chilean phone: "${cellString}"`)
            }
          } else {
            if (i <= 3) {
              rowWarnings.push(`Fila ${i + 1}: Número de teléfono con formato sospechoso: ${cellString}`)
            }
            // Still add it, but warn
            clientData[fieldName as keyof ExcelClientData] = cellString as any
          }
          continue
        }

        // Type-specific parsing
        if (fieldName === "locations_of_interest") {
          clientData[fieldName] = parseLocations(cellString)
        } else if (
          ["budget_min", "budget_max", "desired_surface_area_min", "desired_surface_area_max"].includes(fieldName)
        ) {
          const num = parseNumber(cellValue)
          if (num !== undefined) {
            clientData[fieldName as keyof ExcelClientData] = num as any
          }
        } else if (fieldName === "birth_date") {
          const date = parseDate(cellValue)
          if (date) {
            clientData[fieldName] = date
          }
        } else {
          clientData[fieldName as keyof ExcelClientData] = cellString as any
        }
      }

      if (secondName && clientData.first_name) {
        clientData.first_name = `${clientData.first_name} ${secondName}`
        if (i <= 3) {
          console.log(`[v0] Row ${i + 1} - Combined names: "${clientData.first_name}"`)
        }
      }

      if (clientData.first_name && !clientData.last_name) {
        const { firstName, lastName, secondLastName } = splitChileanFullName(clientData.first_name)
        clientData.first_name = firstName
        clientData.last_name = lastName
        if (secondLastName) {
          clientData.second_last_name = secondLastName
        }
        if (i <= 3) {
          console.log(
            `[v0] Row ${i + 1} - Split Chilean name: first="${firstName}" paterno="${lastName}" materno="${secondLastName || "N/A"}"`,
          )
        }
      }

      if (!clientData.first_name && clientData.last_name) {
        clientData.first_name = clientData.last_name
        clientData.last_name = "Sin Apellido"
      }

      const hasIdentifier = clientData.rut || clientData.first_name || clientData.last_name || clientData.email

      if (!hasIdentifier) {
        rowErrors.push(`Fila ${i + 1}: Debe tener al menos un campo identificador (RUT, nombre, apellido o email)`)
      }

      if (clientData.email && !validateEmail(clientData.email)) {
        if (i <= 3) {
          rowWarnings.push(
            `Fila ${i + 1}: Email con formato inválido: ${clientData.email} (se importará de todas formas)`,
          )
        }
      }

      if (clientData.rut && !validateRUT(clientData.rut)) {
        if (i <= 3) {
          rowWarnings.push(`Fila ${i + 1}: Formato de RUT inválido: ${clientData.rut} (se importará de todas formas)`)
        }
      }

      if (rowErrors.length > 0) {
        result.errors.push(...rowErrors)
      } else {
        if (rowWarnings.length > 0) {
          result.warnings.push(...rowWarnings)
        }
        result.data.push(clientData)
        result.validRows++

        if (i <= 3) {
          console.log(`[v0] Row ${i + 1} parsed successfully:`, JSON.stringify(clientData))
        }
      }
    }

    result.success = result.validRows > 0

    console.log("[v0] ==== PARSE COMPLETE ====")
    console.log("[v0] Total rows:", result.totalRows)
    console.log("[v0] Valid rows:", result.validRows)
    console.log("[v0] Errors:", result.errors.length)
    console.log("[v0] Warnings:", result.warnings.length)

    if (result.data.length > 0) {
      console.log("[v0] First parsed client:", JSON.stringify(result.data[0]))
      if (result.data.length > 1) {
        console.log("[v0] Second parsed client:", JSON.stringify(result.data[1]))
      }
    }

    if (result.validRows === 0) {
      result.errors.push("No se encontraron filas válidas para importar")
    }
  } catch (error) {
    console.error("[v0] Error parsing Excel:", error)
    result.errors.push(`Error al procesar el archivo: ${error instanceof Error ? error.message : "Error desconocido"}`)
  }

  console.log(
    "[v0] Parse result:",
    JSON.stringify(
      {
        success: result.success,
        totalRows: result.totalRows,
        validRows: result.validRows,
        errorsCount: result.errors.length,
        warningsCount: result.warnings.length,
        sampleData: result.data.slice(0, 2),
      },
      null,
      2,
    ),
  )

  return result
}

export async function smartParseExcelFile(
  file: File,
  userMappings?: Record<string, string>,
): Promise<SmartParseResult> {
  const result: ParseResult = {
    success: false,
    data: [],
    errors: [],
    warnings: [],
    totalRows: 0,
    validRows: 0,
  }

  const columnMappings: ColumnMapping[] = []
  let needsReview = false

  try {
    if (userMappings) {
      console.log("[v0] Smart parsing file with confirmed mappings:", userMappings)
    }

    console.log("[v0] Starting smart Excel file parsing...")

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })

    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      result.errors.push("El archivo Excel no contiene hojas")
      return { ...result, columnMappings, needsReview }
    }

    const worksheet = workbook.Sheets[sheetName]
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    console.log("[v0] Raw data rows:", rawData.length)

    if (rawData.length < 2) {
      result.errors.push("El archivo debe contener al menos una fila de encabezados y una fila de datos")
      return { ...result, columnMappings, needsReview }
    }

    const headers: string[] = rawData[0]
    const companyColumns = new Set<number>()

    headers.forEach((header, colIndex) => {
      const columnValues = rawData.slice(1, 11).map((row) => row[colIndex])

      // Use user mapping first, then fall back to auto-detection
      let finalType: string | null = null
      let confidence: "high" | "medium" | "low" = "low"

      if (userMappings && userMappings[header]) {
        // User explicitly mapped this column
        finalType = userMappings[header]
        confidence = "high"
        console.log(`[v0] Using user mapping: "${header}" → "${finalType}"`)

        if (finalType === "first_name") {
          const normalized = normalizeColumnName(header)
          const companyNamePatterns = [
            "compañía minera",
            "compania minera",
            "razon social",
            "razón social",
            "nombre cliente",
            "nombre empresa",
            "cliente",
          ]
          if (companyNamePatterns.some((pattern) => normalized.includes(pattern))) {
            companyColumns.add(colIndex)
            console.log(`[v0] 🏢 Marked column ${colIndex} ("${header}") as company column`)
          }
        }
      } else {
        const detectedType = detectColumnType(columnValues, header)
        const mappedType = mapColumnToField(header)
        finalType = detectedType || mappedType

        if (finalType === "first_name") {
          const normalized = normalizeColumnName(header)
          const companyNamePatterns = [
            "compañía minera",
            "compania minera",
            "razon social",
            "razón social",
            "nombre cliente",
            "nombre empresa",
            "cliente",
          ]
          if (companyNamePatterns.some((pattern) => normalized.includes(pattern))) {
            companyColumns.add(colIndex)
            console.log(`[v0] 🏢 Marked column ${colIndex} ("${header}") as company column`)
          }
        }

        if (detectedType && mappedType && detectedType === mappedType) {
          confidence = "high"
        } else if (detectedType && mappedType) {
          confidence = "medium"
          needsReview = true
        } else if (detectedType || mappedType) {
          confidence = "medium"
        } else {
          needsReview = true
        }
      }

      columnMappings.push({
        excelColumn: header,
        detectedType: finalType,
        confidence,
        sampleValues: columnValues
          .slice(0, 3)
          .filter((v) => v)
          .map((v) => String(v)),
      })
    })

    console.log("[v0] Smart column detection:", columnMappings)

    result.totalRows = rawData.length - 1

    // Process data rows
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i]
      const clientData: ExcelClientData = {}
      const rowErrors: string[] = []
      const rowWarnings: string[] = []

      let secondName: string | undefined
      let isFirstNameFromCompanyColumn = false

      for (let j = 0; j < headers.length; j++) {
        const mapping = columnMappings[j]
        if (!mapping) continue

        const fieldName = mapping.detectedType
        const cellValue = row[j]
        if (cellValue === null || cellValue === undefined || cellValue === "") continue

        const cellString = String(cellValue).trim()

        // Auto-detect email anywhere
        if (!clientData.email && cellString.includes("@")) {
          const detectedEmail = extractEmailFromValue(cellString)
          if (detectedEmail) {
            clientData.email = detectedEmail
            if (i <= 3) {
              console.log(`[v0] Row ${i + 1} - Auto-detected email: "${detectedEmail}" from column "${headers[j]}"`)
            }
          }
        }

        if (!fieldName) continue

        if (fieldName === "second_name") {
          secondName = cellString
          continue
        }

        if (fieldName === "first_name" && companyColumns.has(j)) {
          isFirstNameFromCompanyColumn = true
          console.log(`[v0] Row ${i + 1} - Name from company column: "${cellString}"`)
        }

        if (fieldName === "phone" || fieldName === "mobile") {
          if (looksLikeRUT(cellString)) {
            if (!clientData.rut) {
              clientData.rut = cellString
              if (i <= 3) {
                console.log(`[v0] Row ${i + 1} - Detected RUT in phone column: "${cellString}"`)
              }
              continue // Skip adding as phone
            }
          }

          if (isValidChileanPhone(cellString)) {
            clientData[fieldName as keyof ExcelClientData] = cellString as any
            if (i <= 3) {
              console.log(`[v0] Row ${i + 1} - Valid Chilean phone: "${cellString}"`)
            }
          } else {
            if (i <= 3) {
              rowWarnings.push(`Fila ${i + 1}: Número de teléfono con formato sospechoso: ${cellString}`)
            }
            clientData[fieldName as keyof ExcelClientData] = cellString as any
          }
          continue
        }

        // Type-specific parsing
        if (fieldName === "locations_of_interest") {
          clientData[fieldName] = parseLocations(cellString)
        } else if (
          ["budget_min", "budget_max", "desired_surface_area_min", "desired_surface_area_max"].includes(fieldName)
        ) {
          const num = parseNumber(cellValue)
          if (num !== undefined) {
            clientData[fieldName as keyof ExcelClientData] = num as any
          }
        } else if (fieldName === "birth_date") {
          const date = parseDate(cellValue)
          if (date) {
            clientData[fieldName] = date
          }
        } else {
          clientData[fieldName as keyof ExcelClientData] = cellString as any
        }
      }

      // Combine second name if exists
      if (secondName && clientData.first_name) {
        clientData.first_name = `${clientData.first_name} ${secondName}`
        if (i <= 3) {
          console.log(`[v0] Row ${i + 1} - Combined names: "${clientData.first_name}"`)
        }
      }

      if (clientData.first_name && !clientData.last_name) {
        const { firstName, lastName, secondLastName } = splitChileanFullName(
          clientData.first_name,
          isFirstNameFromCompanyColumn,
        )
        clientData.first_name = firstName
        clientData.last_name = lastName
        if (secondLastName) {
          clientData.second_last_name = secondLastName
        }
        if (i <= 3) {
          console.log(
            `[v0] Row ${i + 1} - Split name (isCompany=${isFirstNameFromCompanyColumn}): first="${firstName}" last="${lastName}"`,
          )
        }
      }

      if (!clientData.first_name && clientData.last_name) {
        clientData.first_name = clientData.last_name
        clientData.last_name = "Sin Apellido"
      }

      const hasIdentifier = clientData.rut || clientData.first_name || clientData.last_name || clientData.email

      if (!hasIdentifier) {
        rowErrors.push(`Fila ${i + 1}: Debe tener al menos un campo identificador (RUT, nombre, apellido o email)`)
      }

      if (clientData.email && !validateEmail(clientData.email)) {
        if (i <= 3) {
          rowWarnings.push(
            `Fila ${i + 1}: Email con formato inválido: ${clientData.email} (se importará de todas formas)`,
          )
        }
      }

      if (clientData.rut && !validateRUT(clientData.rut)) {
        if (i <= 3) {
          rowWarnings.push(`Fila ${i + 1}: Formato de RUT inválido: ${clientData.rut} (se importará de todas formas)`)
        }
      }

      if (rowErrors.length > 0) {
        result.errors.push(...rowErrors)
      } else {
        if (rowWarnings.length > 0) {
          result.warnings.push(...rowWarnings)
        }
        result.data.push(clientData)
        result.validRows++

        if (i <= 3) {
          console.log(`[v0] Row ${i + 1} parsed successfully:`, JSON.stringify(clientData))
        }
      }
    }

    result.success = result.validRows > 0

    console.log("[v0] ==== SMART PARSE COMPLETE ====")
    console.log("[v0] Total rows:", result.totalRows)
    console.log("[v0] Valid rows:", result.validRows)
    console.log("[v0] Errors:", result.errors.length)
    console.log("[v0] Warnings:", result.warnings.length)

    if (result.data.length > 0) {
      console.log("[v0] First parsed client:", JSON.stringify(result.data[0]))
      if (result.data.length > 1) {
        console.log("[v0] Second parsed client:", JSON.stringify(result.data[1]))
      }
    }

    if (result.validRows === 0) {
      result.errors.push("No se encontraron filas válidas para importar")
    }
  } catch (error) {
    console.error("[v0] Error parsing Excel:", error)
    result.errors.push(`Error al procesar el archivo: ${error instanceof Error ? error.message : "Error desconocido"}`)
  }

  for (const client of result.data) {
    if (client.first_name) client.first_name = truncateToLimit(client.first_name, 100)
    if (client.last_name) client.last_name = truncateToLimit(client.last_name, 100)
    if (client.second_last_name) client.second_last_name = truncateToLimit(client.second_last_name, 100)
    if (client.phone) client.phone = truncateToLimit(client.phone, 20)
    if (client.mobile) client.mobile = truncateToLimit(client.mobile, 20)
    if (client.email) client.email = truncateToLimit(client.email, 100)
    if (client.rut) client.rut = truncateToLimit(client.rut, 20)
    if (client.company_name) client.company_name = truncateToLimit(client.company_name, 200)
    if (client.position) client.position = truncateToLimit(client.position, 100)
    if (client.city) client.city = truncateToLimit(client.city, 100)
    if (client.region) client.region = truncateToLimit(client.region, 100)
    if (client.country) client.country = truncateToLimit(client.country, 100)
  }

  console.log(
    "[v0] Smart parse result:",
    JSON.stringify(
      {
        success: result.success,
        totalRows: result.totalRows,
        validRows: result.validRows,
        errorsCount: result.errors.length,
        warningsCount: result.warnings.length,
        sampleData: result.data.slice(0, 2),
        columnMappings,
        needsReview,
      },
      null,
      2,
    ),
  )

  return { ...result, columnMappings, needsReview }
}

export async function extractColumnPreview(file: File): Promise<ColumnPreviewData[]> {
  try {
    console.log("[v0] Extracting column preview from Excel...")

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) {
      console.error("[v0] No sheets found in Excel")
      return []
    }

    const worksheet = workbook.Sheets[sheetName]
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (rawData.length < 2) {
      console.error("[v0] Not enough rows for preview")
      return []
    }

    const headers: string[] = rawData[0]
    const previewData: ColumnPreviewData[] = []

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const columnName = String(headers[colIndex])
      const normalizedColumnName = normalizeColumnName(columnName)
      const columnValues = rawData
        .slice(1, 6) // Get first 5 data rows
        .map((row) => row[colIndex])
        .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
        .map((v) => String(v).trim())

      let suggestedType: string | null = null
      let confidence: "high" | "medium" | "low" = "low"

      // HIGHEST PRIORITY: Check for company/client name columns by header name
      const companyNamePatterns = [
        "compañía minera",
        "compania minera",
        "razon social",
        "razón social",
        "nombre cliente",
        "nombre empresa",
        "cliente",
      ]

      const isCompanyColumn = companyNamePatterns.some((pattern) =>
        normalizedColumnName.includes(pattern.toLowerCase()),
      )

      if (isCompanyColumn) {
        suggestedType = "first_name"
        confidence = "high"
        console.log(`[v0] 🎯 Detected company/client name column by header: "${columnName}"`)
      }

      // EXCLUDE product columns explicitly
      if (normalizedColumnName.includes("producto")) {
        suggestedType = "notes"
        confidence = "high"
        console.log(`[v0] ⛔ Detected product column (mapping to notes): "${columnName}"`)
      }

      // Check for emails (anything with @)
      if (!suggestedType) {
        const emailCount = columnValues.filter((v) => v.includes("@") && validateEmail(v)).length
        if (emailCount > 0) {
          suggestedType = "email"
          confidence = emailCount >= columnValues.length * 0.7 ? "high" : "medium"
        }
      }

      // Check for RUT
      if (!suggestedType) {
        const rutCount = columnValues.filter((v) => validateRUT(v) || looksLikeRUT(v)).length
        if (rutCount > 0) {
          suggestedType = "rut"
          confidence = rutCount >= columnValues.length * 0.7 ? "high" : "medium"
        }
      }

      // Check for phone numbers
      if (!suggestedType) {
        const phoneCount = columnValues.filter((v) => isValidChileanPhone(v)).length
        if (phoneCount > 0) {
          suggestedType = "phone"
          confidence = phoneCount >= columnValues.length * 0.7 ? "high" : "medium"
        }
      }

      // Check column name mapping as fallback
      if (!suggestedType) {
        const mappedType = mapColumnToField(columnName)
        if (mappedType) {
          suggestedType = mappedType
          confidence = "medium"
        }
      }

      // Check for names (text only) - but only if not already mapped
      if (!suggestedType) {
        const nameCount = columnValues.filter((v) => /^[a-zA-ZáéíóúñÑ\s]{2,}$/i.test(v)).length
        if (nameCount >= columnValues.length * 0.5) {
          suggestedType = "first_name"
          confidence = "low"
        }
      }

      previewData.push({
        columnName,
        sampleValues: columnValues.slice(0, 3),
        suggestedType,
        confidence,
      })

      console.log(
        `[v0] Column "${columnName}": type=${suggestedType}, confidence=${confidence}, samples=[${columnValues.slice(0, 2).join(", ")}]`,
      )
    }

    return previewData
  } catch (error) {
    console.error("[v0] Error extracting column preview:", error)
    return []
  }
}

export function generateExcelTemplate(): Blob {
  const headers = [
    "Nombre",
    "Apellido Paterno",
    "Apellido Materno",
    "RUT",
    "Nacionalidad",
    "Email",
    "Teléfono",
    "Celular",
    "Empresa",
    "Cargo",
    "RUT Empresa",
    "Industria",
    "Dirección",
    "Ciudad",
    "Región",
    "País",
    "Tipo Cliente",
    "Interés Principal",
    "Ubicaciones Interés",
    "Presupuesto Min",
    "Presupuesto Max",
    "Superficie Min",
    "Superficie Max",
    "Notas",
    "Estado",
    "Frecuencia Contacto",
    "Fecha Nacimiento",
    "Segundo Nombre",
    "Segundo Apellido",
  ]

  const exampleData = [
    [
      "Juan",
      "Pérez",
      "González",
      "12.345.678-9",
      "Chilena",
      "juan.perez@example.com",
      "+56 2 2345 6789",
      "+56 9 8765 4321",
      "Inversiones del Sur",
      "Gerente General",
      "76.123.456-7",
      "Inmobiliaria",
      "Av. Libertador 123",
      "Puerto Varas",
      "Los Lagos",
      "Chile",
      "Comprador",
      "Propiedades con vista al lago",
      "Puerto Varas, Frutillar, Puerto Montt",
      "500000000",
      "1000000000",
      "200",
      "500",
      "Cliente VIP interesado en propiedades de lujo",
      "hot",
      "Semanal",
      "1980-05-15",
      "Carlos",
      "Rodríguez",
    ],
  ]

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...exampleData])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes")

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
}

function truncateToLimit(value: string, limit: number): string {
  if (value.length <= limit) return value
  return value.substring(0, limit - 3) + "..."
}

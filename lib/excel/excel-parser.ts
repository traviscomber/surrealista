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
}

export interface ParseResult {
  success: boolean
  data: ExcelClientData[]
  errors: string[]
  warnings: string[]
  totalRows: number
  validRows: number
}

// Column mapping - maps Excel column names to database fields
const COLUMN_MAPPINGS: Record<string, string> = {
  // Spanish column names
  nombre: "first_name",
  "apellido paterno": "last_name",
  "apellido materno": "second_last_name",
  rut: "rut",
  nacionalidad: "nationality",
  email: "email",
  correo: "email",
  telefono: "phone",
  teléfono: "phone",
  celular: "mobile",
  móvil: "mobile",
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
  "last name": "last_name",
  "second last name": "second_last_name",
  email: "email",
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
  return rutRegex.test(rut)
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

    console.log("[v0] Headers found:", headers)
    console.log("[v0] Mapped headers:", mappedHeaders)

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

      // Map each cell to the corresponding field
      for (let j = 0; j < headers.length; j++) {
        const fieldName = mappedHeaders[j]
        if (!fieldName) continue

        const cellValue = row[j]
        if (cellValue === null || cellValue === undefined || cellValue === "") continue

        // Type-specific parsing
        if (fieldName === "locations_of_interest") {
          clientData[fieldName] = parseLocations(String(cellValue))
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
          clientData[fieldName as keyof ExcelClientData] = String(cellValue).trim() as any
        }
      }

      const hasIdentifier = clientData.first_name || clientData.last_name || clientData.email || clientData.rut

      if (!hasIdentifier) {
        rowErrors.push(`Fila ${i + 1}: Debe tener al menos un campo identificador (nombre, apellido, email o RUT)`)
      }

      if (clientData.email && !validateEmail(clientData.email)) {
        rowWarnings.push(
          `Fila ${i + 1}: Email con formato inválido: ${clientData.email} (se importará de todas formas)`,
        )
      }

      if (clientData.rut && !validateRUT(clientData.rut)) {
        rowWarnings.push(`Fila ${i + 1}: Formato de RUT inválido: ${clientData.rut} (se importará de todas formas)`)
      }

      if (rowErrors.length > 0) {
        result.errors.push(...rowErrors)
      } else {
        if (rowWarnings.length > 0) {
          result.warnings.push(...rowWarnings)
        }
        result.data.push(clientData)
        result.validRows++
        console.log(`[v0] Row ${i + 1} parsed successfully:`, clientData)
      }
    }

    result.success = result.validRows > 0

    console.log("[v0] Parse complete:", {
      totalRows: result.totalRows,
      validRows: result.validRows,
      errors: result.errors.length,
      warnings: result.warnings.length,
    })

    if (result.validRows === 0) {
      result.errors.push("No se encontraron filas válidas para importar")
    }
  } catch (error) {
    console.error("[v0] Error parsing Excel:", error)
    result.errors.push(`Error al procesar el archivo: ${error instanceof Error ? error.message : "Error desconocido"}`)
  }

  return result
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
    ],
  ]

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...exampleData])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes")

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
}

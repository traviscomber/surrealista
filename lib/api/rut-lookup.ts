/**
 * RUT Lookup Service for Chilean Companies
 * Uses Boostr.cl API to fetch company information from SII
 */

interface RutLookupResult {
  success: boolean
  data?: {
    rut: string
    name: string
    businessName?: string
    activities?: string[]
    address?: string
  }
  error?: string
}

/**
 * Clean and format Chilean RUT
 * Accepts: 12345678-9, 12.345.678-9, or 123456789
 * Returns: 12345678-9
 */
export function formatRut(rut: string): string {
  // Remove dots and spaces
  const cleaned = rut.replace(/\./g, "").replace(/\s/g, "").toUpperCase()

  // Check if already has dash
  if (cleaned.includes("-")) {
    return cleaned
  }

  // Add dash before verification digit
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, -1)}-${cleaned.slice(-1)}`
  }

  return cleaned
}

/**
 * Validate Chilean RUT format and check digit
 */
export function validateRut(rut: string): boolean {
  const formatted = formatRut(rut)
  const [body, dv] = formatted.split("-")

  if (!body || !dv) return false

  // Calculate verification digit
  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number.parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const calculatedDv = 11 - (sum % 11)
  const expectedDv = calculatedDv === 11 ? "0" : calculatedDv === 10 ? "K" : calculatedDv.toString()

  return dv === expectedDv
}

/**
 * Lookup company information from Chilean SII using Boostr API
 * Free tier available
 */
export async function lookupRutFromSII(rut: string): Promise<RutLookupResult> {
  try {
    // Validate RUT format first
    if (!validateRut(rut)) {
      return {
        success: false,
        error: "RUT inválido",
      }
    }

    const formattedRut = formatRut(rut)

    // Call Boostr.cl Rutificador API
    const response = await fetch(`https://api.boostr.cl/rut/${formattedRut}.json`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: "RUT no encontrado en el SII",
        }
      }
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      data: {
        rut: formattedRut,
        name: data.razon_social || data.nombre || "",
        businessName: data.razon_social,
        activities: data.actividades || [],
        address: data.direccion,
      },
    }
  } catch (error) {
    console.error("[v0] RUT lookup error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al consultar RUT",
    }
  }
}

/**
 * Alternative: Lookup using API Gateway Chile (requires API key)
 */
export async function lookupRutFromAPIGateway(rut: string, apiKey?: string): Promise<RutLookupResult> {
  try {
    if (!apiKey) {
      return {
        success: false,
        error: "API key requerida para API Gateway",
      }
    }

    const formattedRut = formatRut(rut)

    const response = await fetch(`https://api.apigateway.cl/sii/contribuyente/${formattedRut}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      data: {
        rut: formattedRut,
        name: data.razon_social || data.nombre,
        businessName: data.razon_social,
        activities: data.actividades_economicas,
        address: data.direccion,
      },
    }
  } catch (error) {
    console.error("[v0] RUT lookup error (API Gateway):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al consultar RUT",
    }
  }
}

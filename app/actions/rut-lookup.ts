"use server"

import { lookupRutFromSII, validateRut, formatRut } from "@/lib/api/rut-lookup"

export async function lookupCompanyByRut(rut: string) {
  try {
    console.log("[v0] Looking up RUT:", rut)

    // Validate RUT format first
    if (!validateRut(rut)) {
      return {
        success: false,
        error: "RUT inválido. Verifica el formato y dígito verificador.",
      }
    }

    // Call the SII API
    const result = await lookupRutFromSII(rut)

    if (!result.success) {
      console.log("[v0] RUT lookup failed:", result.error)
      return result
    }

    console.log("[v0] RUT lookup successful:", result.data?.name)
    return result
  } catch (error) {
    console.error("[v0] Error in lookupCompanyByRut:", error)
    return {
      success: false,
      error: "Error al consultar RUT en el SII",
    }
  }
}

export async function lookupRUT(rut: string) {
  return lookupCompanyByRut(rut)
}

export async function validateRutFormat(rut: string) {
  try {
    const isValid = validateRut(rut)
    const formatted = formatRut(rut)

    return {
      success: true,
      isValid,
      formatted,
    }
  } catch (error) {
    return {
      success: false,
      isValid: false,
      formatted: rut,
    }
  }
}

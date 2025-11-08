"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { lookupRUT } from "./rut-lookup"

export interface RUTValidationResult {
  clientId: string
  rut: string
  currentName: string
  officialName: string
  match: boolean
  confidence: "high" | "medium" | "low"
  needsUpdate: boolean
}

/**
 * Validates a single client's RUT and compares with official SII data
 */
export async function validateClientRUT(clientId: string) {
  try {
    const supabase = await createSupabaseClient()

    // Get client from database
    const { data: client, error } = await supabase.from("clients").select("*").eq("id", clientId).single()

    if (error || !client) {
      return { success: false, error: "Cliente no encontrado" }
    }

    if (!client.rut) {
      return { success: false, error: "Cliente no tiene RUT registrado" }
    }

    console.log("[v0] Validating RUT:", client.rut, "for client:", client.first_name, client.last_name)

    // Look up official data from SII
    const lookupResult = await lookupRUT(client.rut)

    if (!lookupResult.success || !lookupResult.data) {
      return {
        success: false,
        error: "No se pudo consultar el RUT en el SII",
        details: lookupResult.error,
      }
    }

    const officialName = lookupResult.data.razon_social || lookupResult.data.nombre_completo
    const currentName = `${client.first_name || ""} ${client.last_name || ""}`.trim()

    // Compare names (simple similarity check)
    const match =
      officialName.toLowerCase().includes(currentName.toLowerCase()) ||
      currentName.toLowerCase().includes(officialName.toLowerCase())

    const result: RUTValidationResult = {
      clientId: client.id,
      rut: client.rut,
      currentName: currentName,
      officialName: officialName,
      match: match,
      confidence: match ? "high" : "low",
      needsUpdate: !match,
    }

    console.log("[v0] Validation result:", result)

    return { success: true, data: result, officialData: lookupResult.data }
  } catch (error) {
    console.error("[v0] Error validating client RUT:", error)
    return { success: false, error: "Error al validar RUT" }
  }
}

/**
 * Updates a client's name with official SII data
 */
export async function updateClientFromRUT(clientId: string, officialData: any) {
  try {
    const supabase = await createSupabaseClient()

    // Determine if it's a company or person
    const isCompany = !!officialData.razon_social

    const updateData: any = {}

    if (isCompany) {
      updateData.first_name = officialData.razon_social
      updateData.last_name = "Empresa"
      updateData.company_name = officialData.razon_social
    } else {
      const nameParts = (officialData.nombre_completo || "").split(" ")
      if (nameParts.length >= 2) {
        updateData.first_name = nameParts.slice(0, -1).join(" ") // All but last as first name
        updateData.last_name = nameParts[nameParts.length - 1] // Last word as last name
      } else {
        updateData.first_name = officialData.nombre_completo
        updateData.last_name = "Sin Apellido"
      }
    }

    // Add additional official data if available
    if (officialData.direccion) {
      updateData.address = officialData.direccion
    }
    if (officialData.comuna) {
      updateData.city = officialData.comuna
    }
    if (officialData.actividades && officialData.actividades.length > 0) {
      updateData.notes = `Actividades: ${officialData.actividades.join(", ")}`
    }

    console.log("[v0] Updating client", clientId, "with official data:", updateData)

    const { data, error } = await supabase.from("clients").update(updateData).eq("id", clientId).select().single()

    if (error) {
      console.error("[v0] Error updating client:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/clientes")
    revalidatePath("/gestion-clientes")
    revalidatePath("/busqueda")

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error updating client from RUT:", error)
    return { success: false, error: "Error al actualizar cliente" }
  }
}

/**
 * Validates and corrects ALL clients with RUT in the database
 */
export async function validateAndCorrectAllClients() {
  try {
    const supabase = await createSupabaseClient()

    // Get all clients with RUT
    const { data: clients, error } = await supabase.from("clients").select("*").not("rut", "is", null).limit(100) // Process in batches to avoid timeout

    if (error) {
      console.error("[v0] Error fetching clients:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Validating", clients?.length || 0, "clients with RUT")

    const results = {
      total: clients?.length || 0,
      validated: 0,
      corrected: 0,
      failed: 0,
      matches: 0,
      mismatches: 0,
      details: [] as any[],
    }

    for (const client of clients || []) {
      try {
        const validationResult = await validateClientRUT(client.id)

        if (validationResult.success && validationResult.data) {
          results.validated++

          if (validationResult.data.match) {
            results.matches++
          } else {
            results.mismatches++

            if (validationResult.data.needsUpdate && validationResult.officialData) {
              const updateResult = await updateClientFromRUT(client.id, validationResult.officialData)

              if (updateResult.success) {
                results.corrected++
                results.details.push({
                  rut: client.rut,
                  before: validationResult.data.currentName,
                  after: validationResult.data.officialName,
                  status: "corrected",
                })
              } else {
                results.failed++
                results.details.push({
                  rut: client.rut,
                  error: updateResult.error,
                  status: "failed",
                })
              }
            }
          }
        } else {
          results.failed++
          results.details.push({
            rut: client.rut,
            error: validationResult.error,
            status: "failed",
          })
        }

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error("[v0] Error processing client:", client.id, error)
        results.failed++
      }
    }

    console.log("[v0] Validation complete:", results)

    revalidatePath("/admin/clientes")
    revalidatePath("/gestion-clientes")
    revalidatePath("/busqueda")

    return { success: true, results }
  } catch (error) {
    console.error("[v0] Error in validateAndCorrectAllClients:", error)
    return { success: false, error: "Error al validar clientes" }
  }
}

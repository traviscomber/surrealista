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

type RutReferenceData = {
  rut: string
  name: string
  businessName?: string
  activities?: string[]
  address?: string
}

type ClientRutRow = {
  id: string
  rut: string
  firstName: string
  lastName: string
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("es-CL").replace(/\s+/g, " ")
}

function parseClientRutRow(value: unknown): ClientRutRow | null {
  if (!value || typeof value !== "object") return null

  const row = value as Record<string, unknown>
  if (typeof row.id !== "string" || typeof row.rut !== "string" || !row.rut.trim()) return null

  return {
    id: row.id,
    rut: row.rut,
    firstName: typeof row.first_name === "string" ? row.first_name : "",
    lastName: typeof row.last_name === "string" ? row.last_name : "",
  }
}

/**
 * Validate a client's RUT format and compare its current name with the
 * third-party RUT reference returned by the configured lookup service.
 * This result is referential and must not be treated as a legal ownership record.
 */
export async function validateClientRUT(clientId: string) {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("clients")
      .select("id, rut, first_name, last_name")
      .eq("id", clientId)
      .single()

    if (error || !data) return { success: false, error: "Cliente no encontrado" }

    const client = parseClientRutRow(data)
    if (!client) return { success: false, error: "Cliente no tiene RUT registrado" }

    const lookupResult = await lookupRUT(client.rut)
    if (!lookupResult.success || !lookupResult.data) {
      return {
        success: false,
        error: "No se pudo obtener una referencia para el RUT",
        details: lookupResult.error,
      }
    }

    const reference = lookupResult.data as RutReferenceData
    const referenceName = reference.businessName || reference.name || ""
    if (!referenceName.trim()) {
      return { success: false, error: "La referencia del RUT no contiene nombre" }
    }

    const currentName = `${client.firstName} ${client.lastName}`.trim()
    const normalizedReference = normalizeName(referenceName)
    const normalizedCurrent = normalizeName(currentName)
    const match =
      normalizedCurrent.length > 0 &&
      (normalizedReference.includes(normalizedCurrent) || normalizedCurrent.includes(normalizedReference))

    const result: RUTValidationResult = {
      clientId: client.id,
      rut: client.rut,
      currentName,
      officialName: referenceName,
      match,
      confidence: match ? "high" : "low",
      needsUpdate: !match,
    }

    return { success: true, data: result, officialData: reference, source: "rut_reference_service" }
  } catch (error) {
    console.error("[rut-validation] validation failed", error)
    return { success: false, error: "Error al validar RUT" }
  }
}

/**
 * Apply reference data only when an operator explicitly invokes this action.
 * Automatic bulk correction is intentionally disabled below.
 */
export async function updateClientFromRUT(clientId: string, officialData: RutReferenceData) {
  try {
    const supabase = await createSupabaseClient()
    const referenceName = officialData.businessName || officialData.name || ""
    if (!referenceName.trim()) return { success: false, error: "La referencia no contiene nombre" }

    const updateData: Record<string, unknown> = {}
    if (officialData.businessName) {
      updateData.first_name = officialData.businessName
      updateData.last_name = "Empresa"
      updateData.company_name = officialData.businessName
    } else {
      const nameParts = referenceName.split(/\s+/).filter(Boolean)
      if (nameParts.length >= 2) {
        updateData.first_name = nameParts.slice(0, -1).join(" ")
        updateData.last_name = nameParts[nameParts.length - 1]
      } else {
        updateData.first_name = referenceName
      }
    }

    if (officialData.address) updateData.address = officialData.address
    if (officialData.activities?.length) updateData.notes = `Actividades (referencia externa): ${officialData.activities.join(", ")}`

    const { data, error } = await supabase.from("clients").update(updateData).eq("id", clientId).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/clientes")
    revalidatePath("/gestion-clientes")
    revalidatePath("/busqueda")
    return { success: true, data }
  } catch (error) {
    console.error("[rut-validation] explicit update failed", error)
    return { success: false, error: "Error al actualizar cliente" }
  }
}

/**
 * Bulk validation is read-only. It reports discrepancies for human review and
 * never mutates client records from a third-party reference automatically.
 */
export async function validateAndCorrectAllClients() {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("clients")
      .select("id, rut, first_name, last_name")
      .not("rut", "is", null)
      .limit(100)
    if (error) return { success: false, error: error.message }

    const clients = (Array.isArray(data) ? data : [])
      .map(parseClientRutRow)
      .filter((client): client is ClientRutRow => client !== null)

    const results = {
      total: clients.length,
      validated: 0,
      corrected: 0,
      failed: 0,
      matches: 0,
      mismatches: 0,
      details: [] as Array<Record<string, unknown>>,
    }

    for (const client of clients) {
      try {
        const validationResult = await validateClientRUT(client.id)
        if (!validationResult.success || !validationResult.data) {
          results.failed += 1
          results.details.push({ rut: client.rut, error: validationResult.error, status: "failed" })
          continue
        }

        results.validated += 1
        if (validationResult.data.match) {
          results.matches += 1
        } else {
          results.mismatches += 1
          results.details.push({
            rut: client.rut,
            current: validationResult.data.currentName,
            reference: validationResult.data.officialName,
            status: "review_required",
          })
        }
      } catch (error) {
        console.error("[rut-validation] client validation failed", client.id, error)
        results.failed += 1
      }
    }

    return { success: true, results, autoCorrection: false }
  } catch (error) {
    console.error("[rut-validation] bulk validation failed", error)
    return { success: false, error: "Error al validar clientes" }
  }
}

"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ClientData {
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
  created_by?: string
}

export async function getClients() {
  try {
    const supabase = await createSupabaseClient()

    const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching clients:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("[v0] Error in getClients:", error)
    return { success: false, error: "Error al obtener clientes", data: [] }
  }
}

export async function getClientById(id: string) {
  try {
    const supabase = await createSupabaseClient()

    const { data, error } = await supabase.from("clients").select("*").eq("id", id).single()

    if (error) {
      console.error("[v0] Error fetching client:", error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error in getClientById:", error)
    return { success: false, error: "Error al obtener cliente", data: null }
  }
}

export async function createClient(clientData: ClientData) {
  try {
    const supabase = await createSupabaseClient()

    const { data, error } = await supabase.from("clients").insert([clientData]).select().single()

    if (error) {
      console.error("[v0] Error creating client:", error)
      return { success: false, error: error.message, data: null }
    }

    revalidatePath("/admin/clientes")
    revalidatePath("/gestion-clientes")

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error in createClient:", error)
    return { success: false, error: "Error al crear cliente", data: null }
  }
}

export async function updateClient(id: string, clientData: Partial<ClientData>) {
  try {
    const supabase = await createSupabaseClient()

    const { data, error } = await supabase.from("clients").update(clientData).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating client:", error)
      return { success: false, error: error.message, data: null }
    }

    revalidatePath("/admin/clientes")
    revalidatePath("/gestion-clientes")

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error in updateClient:", error)
    return { success: false, error: "Error al actualizar cliente", data: null }
  }
}

export async function deleteClient(id: string) {
  try {
    const supabase = await createSupabaseClient()

    const { error } = await supabase.from("clients").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting client:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/clientes")
    revalidatePath("/gestion-clientes")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in deleteClient:", error)
    return { success: false, error: "Error al eliminar cliente" }
  }
}

export async function bulkImportClients(clients: ClientData[]) {
  try {
    console.log("[v0] Starting bulk import of", clients.length, "clients")
    const supabase = await createSupabaseClient()

    const CHUNK_SIZE = 50
    let totalImported = 0
    let totalFailed = 0
    const allData = []

    for (let i = 0; i < clients.length; i += CHUNK_SIZE) {
      const chunk = clients.slice(i, i + CHUNK_SIZE)
      console.log(`[v0] Importing chunk ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} clients)`)

      const { data, error } = await supabase.from("clients").insert(chunk).select()

      if (error) {
        console.error("[v0] Error importing chunk:", error)
        totalFailed += chunk.length
      } else {
        totalImported += data?.length || 0
        allData.push(...(data || []))
      }
    }

    console.log(`[v0] Import complete: ${totalImported} imported, ${totalFailed} failed`)

    revalidatePath("/admin/clientes")
    revalidatePath("/gestion-clientes")
    revalidatePath("/busqueda")

    return {
      success: totalImported > 0,
      imported: totalImported,
      failed: totalFailed,
      data: allData,
    }
  } catch (error) {
    console.error("[v0] Error in bulkImportClients:", error)
    return { success: false, error: "Error al importar clientes", imported: 0, failed: clients.length }
  }
}

export async function searchClients(query: string) {
  try {
    const supabase = await createSupabaseClient()

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] Error searching clients:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("[v0] Error in searchClients:", error)
    return { success: false, error: "Error al buscar clientes", data: [] }
  }
}

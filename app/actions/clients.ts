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

type DuplicateMatch = {
  newClient: ClientData
  existingClient: any
  matchType: "rut" | "phone" | "email" | "name"
  index: number
}

function revalidateClients() {
  revalidatePath("/admin/clientes")
  revalidatePath("/gestion-clientes")
  revalidatePath("/busqueda")
}

function normalizeBatchSize(batchSize: number) {
  if (!Number.isFinite(batchSize)) return 10
  return Math.min(Math.max(Math.trunc(batchSize), 1), 100)
}

export async function getClients() {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false })
    if (error) return { success: false, error: error.message, data: [] }
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("[clients] getClients failed", error)
    return { success: false, error: "Error al obtener clientes", data: [] }
  }
}

export async function getClientById(id: string) {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.from("clients").select("*").eq("id", id).single()
    if (error) return { success: false, error: error.message, data: null }
    return { success: true, data }
  } catch (error) {
    console.error("[clients] getClientById failed", error)
    return { success: false, error: "Error al obtener cliente", data: null }
  }
}

export async function createClient(clientData: ClientData) {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.from("clients").insert([clientData]).select().single()
    if (error) return { success: false, error: error.message, data: null }
    revalidateClients()
    return { success: true, data }
  } catch (error) {
    console.error("[clients] createClient failed", error)
    return { success: false, error: "Error al crear cliente", data: null }
  }
}

export async function updateClient(id: string, clientData: Partial<ClientData>) {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.from("clients").update(clientData).eq("id", id).select().single()
    if (error) return { success: false, error: error.message, data: null }
    revalidateClients()
    return { success: true, data }
  } catch (error) {
    console.error("[clients] updateClient failed", error)
    return { success: false, error: "Error al actualizar cliente", data: null }
  }
}

export async function deleteClient(id: string) {
  try {
    const supabase = await createSupabaseClient()
    const { error } = await supabase.from("clients").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidateClients()
    return { success: true }
  } catch (error) {
    console.error("[clients] deleteClient failed", error)
    return { success: false, error: "Error al eliminar cliente" }
  }
}

export async function detectDuplicates(clients: ClientData[]) {
  try {
    const supabase = await createSupabaseClient()
    const duplicates: DuplicateMatch[] = []
    const nonDuplicates: Array<{ client: ClientData; index: number }> = []

    for (let index = 0; index < clients.length; index += 1) {
      const client = clients[index]
      let existingClient: any = null
      let matchType: DuplicateMatch["matchType"] | null = null

      if (client.rut) {
        const { data } = await supabase.from("clients").select("*").eq("rut", client.rut).limit(1)
        if (data?.[0]) {
          existingClient = data[0]
          matchType = "rut"
        }
      }

      if (!existingClient && client.phone) {
        const { data } = await supabase.from("clients").select("*").eq("phone", client.phone).limit(1)
        if (data?.[0]) {
          existingClient = data[0]
          matchType = "phone"
        }
      }

      if (!existingClient && client.email) {
        const { data } = await supabase.from("clients").select("*").eq("email", client.email).limit(1)
        if (data?.[0]) {
          existingClient = data[0]
          matchType = "email"
        }
      }

      if (
        !existingClient &&
        client.first_name &&
        client.last_name &&
        Number.isNaN(Number(client.first_name)) &&
        Number.isNaN(Number(client.last_name))
      ) {
        const { data } = await supabase
          .from("clients")
          .select("*")
          .eq("first_name", client.first_name)
          .eq("last_name", client.last_name)
          .limit(1)
        if (data?.[0]) {
          existingClient = data[0]
          matchType = "name"
        }
      }

      if (existingClient && matchType) duplicates.push({ newClient: client, existingClient, matchType, index })
      else nonDuplicates.push({ client, index })
    }

    return {
      success: true,
      duplicates,
      nonDuplicates,
      totalDuplicates: duplicates.length,
      totalNew: nonDuplicates.length,
    }
  } catch (error) {
    console.error("[clients] detectDuplicates failed", error)
    return {
      success: false,
      error: "Error al detectar duplicados",
      duplicates: [],
      nonDuplicates: [],
      totalDuplicates: 0,
      totalNew: 0,
    }
  }
}

export async function bulkImportClients(clients: ClientData[]) {
  const batchSize = 50
  try {
    const supabase = await createSupabaseClient()
    let imported = 0
    let failed = 0
    const allData: any[] = []

    for (let index = 0; index < clients.length; index += batchSize) {
      const batch = clients.slice(index, index + batchSize)
      const { data, error } = await supabase.from("clients").insert(batch).select()
      if (error) failed += batch.length
      else {
        imported += data?.length || 0
        allData.push(...(data || []))
      }
    }

    revalidateClients()
    return { success: imported > 0, imported, failed, data: allData }
  } catch (error) {
    console.error("[clients] bulkImportClients failed", error)
    return { success: false, error: "Error al importar clientes", imported: 0, failed: clients.length }
  }
}

export async function bulkImportWithDuplicateHandling(
  newClients: ClientData[],
  updates: Array<{ id: string; data: ClientData }>,
) {
  try {
    const supabase = await createSupabaseClient()
    let imported = 0
    let updated = 0
    let failed = 0

    for (let index = 0; index < newClients.length; index += 50) {
      const batch = newClients.slice(index, index + 50)
      const { data, error } = await supabase.from("clients").insert(batch).select()
      if (error) failed += batch.length
      else imported += data?.length || 0
    }

    for (const update of updates) {
      const { error } = await supabase.from("clients").update(update.data).eq("id", update.id)
      if (error) failed += 1
      else updated += 1
    }

    revalidateClients()
    return { success: failed === 0 || imported + updated > 0, imported, updated, failed }
  } catch (error) {
    console.error("[clients] bulkImportWithDuplicateHandling failed", error)
    return {
      success: false,
      error: "Error al importar clientes",
      imported: 0,
      updated: 0,
      failed: newClients.length + updates.length,
    }
  }
}

export async function searchClients(query: string) {
  try {
    const supabase = await createSupabaseClient()
    const safeQuery = query.trim().replace(/[(),]/g, " ")
    if (!safeQuery) return { success: true, data: [] }

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .or(`first_name.ilike.%${safeQuery}%,last_name.ilike.%${safeQuery}%,email.ilike.%${safeQuery}%,company_name.ilike.%${safeQuery}%`)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) return { success: false, error: error.message, data: [] }
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("[clients] searchClients failed", error)
    return { success: false, error: "Error al buscar clientes", data: [] }
  }
}

export async function bulkImportInBatches(clients: ClientData[], batchSize = 10) {
  try {
    const supabase = await createSupabaseClient()
    const size = normalizeBatchSize(batchSize)
    const batches: Array<{
      batchNumber: number
      totalBatches: number
      success: boolean
      imported: number
      failed: number
      data: any[]
      error?: string
    }> = []

    for (let index = 0; index < clients.length; index += size) {
      const batch = clients.slice(index, index + size)
      const batchNumber = Math.floor(index / size) + 1
      const totalBatches = Math.ceil(clients.length / size)
      const { data, error } = await supabase.from("clients").insert(batch).select()
      batches.push({
        batchNumber,
        totalBatches,
        success: !error,
        imported: data?.length || 0,
        failed: error ? batch.length : 0,
        data: data || [],
        ...(error ? { error: error.message } : {}),
      })
    }

    const imported = batches.reduce((sum, batch) => sum + batch.imported, 0)
    const failed = batches.reduce((sum, batch) => sum + batch.failed, 0)
    revalidateClients()
    return { success: imported > 0 || clients.length === 0, imported, failed, batches }
  } catch (error) {
    console.error("[clients] bulkImportInBatches failed", error)
    return { success: false, error: "Error al importar clientes", imported: 0, failed: clients.length, batches: [] }
  }
}

export async function bulkImportWithDuplicateHandlingInBatches(
  newClients: ClientData[],
  updates: Array<{ id: string; data: ClientData }>,
  batchSize = 10,
) {
  try {
    const supabase = await createSupabaseClient()
    const size = normalizeBatchSize(batchSize)
    const failedRUTs = new Set<string>()
    const batches: Array<{
      type: "import" | "update"
      batchNumber: number
      totalBatches: number
      success: boolean
      count: number
      failed: number
    }> = []
    let imported = 0
    let updated = 0
    let failed = 0

    for (let index = 0; index < newClients.length; index += size) {
      const batch = newClients.slice(index, index + size)
      const batchNumber = Math.floor(index / size) + 1
      const totalBatches = Math.ceil(newClients.length / size)
      const filteredBatch = batch.filter((client) => !client.rut || !failedRUTs.has(client.rut))

      if (filteredBatch.length === 0) {
        batches.push({ type: "import", batchNumber, totalBatches, success: false, count: 0, failed: batch.length })
        failed += batch.length
        continue
      }

      const { data, error } = await supabase.from("clients").insert(filteredBatch).select()
      if (!error) {
        const count = data?.length || 0
        imported += count
        batches.push({ type: "import", batchNumber, totalBatches, success: true, count, failed: 0 })
        continue
      }

      let batchSuccess = 0
      let batchFailed = 0
      for (const client of filteredBatch) {
        if (client.rut && failedRUTs.has(client.rut)) {
          batchFailed += 1
          continue
        }

        const { error: singleError } = await supabase.from("clients").insert([client])
        if (singleError) {
          if (client.rut) failedRUTs.add(client.rut)
          batchFailed += 1
        } else {
          batchSuccess += 1
          imported += 1
        }
      }

      failed += batchFailed
      batches.push({
        type: "import",
        batchNumber,
        totalBatches,
        success: batchSuccess > 0,
        count: batchSuccess,
        failed: batchFailed,
      })
    }

    for (let index = 0; index < updates.length; index += size) {
      const batch = updates.slice(index, index + size)
      const batchNumber = Math.floor(index / size) + 1
      const totalBatches = Math.ceil(updates.length / size)
      let batchSuccess = 0
      let batchFailed = 0

      for (const update of batch) {
        const { error } = await supabase.from("clients").update(update.data).eq("id", update.id)
        if (error) batchFailed += 1
        else batchSuccess += 1
      }

      updated += batchSuccess
      failed += batchFailed
      batches.push({
        type: "update",
        batchNumber,
        totalBatches,
        success: batchSuccess > 0,
        count: batchSuccess,
        failed: batchFailed,
      })
    }

    revalidateClients()
    return {
      success: failed === 0 || imported + updated > 0,
      imported,
      updated,
      failed,
      batches,
      duplicateRUTs: Array.from(failedRUTs),
    }
  } catch (error) {
    console.error("[clients] bulkImportWithDuplicateHandlingInBatches failed", error)
    return {
      success: false,
      error: "Error al importar clientes",
      imported: 0,
      updated: 0,
      failed: newClients.length + updates.length,
      batches: [],
      duplicateRUTs: [],
    }
  }
}

export async function getClientsPaginated(
  page = 1,
  pageSize = 50,
  filters?: {
    search?: string
    status?: string
    industry?: string
    clientType?: string
    sortBy?: "completeness" | "created_at"
  },
) {
  const safePage = Number.isFinite(page) ? Math.max(Math.trunc(page), 1) : 1
  const safePageSize = Number.isFinite(pageSize) ? Math.min(Math.max(Math.trunc(pageSize), 1), 200) : 50

  try {
    const supabase = await createSupabaseClient()
    const offset = (safePage - 1) * safePageSize
    let query = supabase.from("clients").select("*", { count: "exact" })

    if (filters?.search) {
      const search = filters.search.trim().replace(/[(),]/g, " ")
      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%,rut.ilike.%${search}%`,
        )
      }
    }
    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.industry) query = query.eq("industry", filters.industry)
    if (filters?.clientType) query = query.eq("client_type", filters.clientType)

    if (filters?.sortBy === "completeness") {
      const { data, error, count } = await query
      if (error) {
        return { success: false, error: error.message, data: [], total: 0, page: safePage, pageSize: safePageSize }
      }

      const fields = [
        "first_name",
        "last_name",
        "second_last_name",
        "rut",
        "nationality",
        "email",
        "phone",
        "mobile",
        "company_name",
        "position",
        "company_rut",
        "industry",
        "address",
        "city",
        "region",
        "country",
        "client_type",
        "main_interest",
        "budget_min",
        "budget_max",
        "desired_surface_area_min",
        "desired_surface_area_max",
        "notes",
        "status",
        "contact_frequency",
        "birth_date",
      ] as const

      const dataWithScores = (data || []).map((client) => {
        const record = client as Record<string, unknown>
        const completeness_score = fields.reduce((score, field) => {
          const value = record[field]
          return value !== null && value !== undefined && value !== "" ? score + 1 : score
        }, 0)
        return { ...client, completeness_score }
      })
      dataWithScores.sort((left, right) => right.completeness_score - left.completeness_score)
      const paginatedData = dataWithScores.slice(offset, offset + safePageSize)
      const total = count || dataWithScores.length
      return {
        success: true,
        data: paginatedData,
        total,
        page: safePage,
        pageSize: safePageSize,
        totalPages: Math.ceil(total / safePageSize),
      }
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + safePageSize - 1)

    if (error) {
      return { success: false, error: error.message, data: [], total: 0, page: safePage, pageSize: safePageSize }
    }

    const total = count || 0
    return {
      success: true,
      data: data || [],
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    }
  } catch (error) {
    console.error("[clients] getClientsPaginated failed", error)
    return {
      success: false,
      error: "Error al obtener clientes",
      data: [],
      total: 0,
      page: safePage,
      pageSize: safePageSize,
      totalPages: 0,
    }
  }
}

export async function detectDuplicatesBatch(clients: ClientData[]) {
  try {
    const supabase = await createSupabaseClient()
    const ruts = clients.flatMap((client) => (client.rut ? [client.rut] : []))
    const phones = clients.flatMap((client) => (client.phone ? [client.phone] : []))
    const emails = clients.flatMap((client) => (client.email ? [client.email] : []))

    const [rutMatches, phoneMatches, emailMatches] = await Promise.all([
      ruts.length ? supabase.from("clients").select("*").in("rut", ruts) : Promise.resolve({ data: [] as any[] }),
      phones.length ? supabase.from("clients").select("*").in("phone", phones) : Promise.resolve({ data: [] as any[] }),
      emails.length ? supabase.from("clients").select("*").in("email", emails) : Promise.resolve({ data: [] as any[] }),
    ])

    const rutMap = new Map((rutMatches.data || []).flatMap((client: any) => (client.rut ? [[client.rut, client] as const] : [])))
    const phoneMap = new Map((phoneMatches.data || []).flatMap((client: any) => (client.phone ? [[client.phone, client] as const] : [])))
    const emailMap = new Map((emailMatches.data || []).flatMap((client: any) => (client.email ? [[client.email, client] as const] : [])))

    const duplicates: DuplicateMatch[] = []
    const nonDuplicates: Array<{ client: ClientData; index: number }> = []

    clients.forEach((client, index) => {
      if (client.rut && rutMap.has(client.rut)) {
        duplicates.push({ newClient: client, existingClient: rutMap.get(client.rut), matchType: "rut", index })
      } else if (client.phone && phoneMap.has(client.phone)) {
        duplicates.push({ newClient: client, existingClient: phoneMap.get(client.phone), matchType: "phone", index })
      } else if (client.email && emailMap.has(client.email)) {
        duplicates.push({ newClient: client, existingClient: emailMap.get(client.email), matchType: "email", index })
      } else {
        nonDuplicates.push({ client, index })
      }
    })

    return {
      success: true,
      duplicates,
      nonDuplicates,
      totalDuplicates: duplicates.length,
      totalNew: nonDuplicates.length,
    }
  } catch (error) {
    console.error("[clients] detectDuplicatesBatch failed", error)
    return {
      success: false,
      error: "Error al detectar duplicados",
      duplicates: [],
      nonDuplicates: [],
      totalDuplicates: 0,
      totalNew: 0,
    }
  }
}

export async function getClientStatistics() {
  try {
    const supabase = await createSupabaseClient()
    const [totalResult, statusResult, industryResult] = await Promise.all([
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("clients").select("status"),
      supabase.from("clients").select("industry"),
    ])

    const byStatus: Record<string, number> = {}
    for (const client of statusResult.data || []) {
      const status = client.status || "Sin estado"
      byStatus[status] = (byStatus[status] || 0) + 1
    }

    const byIndustry: Record<string, number> = {}
    for (const client of industryResult.data || []) {
      const industry = client.industry || "Sin industria"
      byIndustry[industry] = (byIndustry[industry] || 0) + 1
    }

    return { success: true, total: totalResult.count || 0, byStatus, byIndustry }
  } catch (error) {
    console.error("[clients] getClientStatistics failed", error)
    return { success: false, error: "Error al obtener estadísticas", total: 0, byStatus: {}, byIndustry: {} }
  }
}

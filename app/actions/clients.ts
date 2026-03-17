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

export async function detectDuplicates(clients: ClientData[]) {
  try {
    console.log("[v0] Detecting duplicates for", clients.length, "clients")
    const supabase = await createSupabaseClient()

    const duplicates: Array<{
      newClient: ClientData
      existingClient: any
      matchType: string
      index: number
    }> = []

    const nonDuplicates: Array<{ client: ClientData; index: number }> = []

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i]
      let matchFound = false

      if (client.rut) {
        const { data, error } = await supabase.from("clients").select("*").eq("rut", client.rut).limit(1)

        if (!error && data && data.length > 0) {
          duplicates.push({
            newClient: client,
            existingClient: data[0],
            matchType: "rut",
            index: i,
          })
          matchFound = true
          continue
        }
      }

      // Check for duplicates by phone (secondary identifier)
      if (!matchFound && client.phone) {
        const { data, error } = await supabase.from("clients").select("*").eq("phone", client.phone).limit(1)

        if (!error && data && data.length > 0) {
          duplicates.push({
            newClient: client,
            existingClient: data[0],
            matchType: "phone",
            index: i,
          })
          matchFound = true
          continue
        }
      }

      // Check by email if phone didn't match
      if (!matchFound && client.email) {
        const { data, error } = await supabase.from("clients").select("*").eq("email", client.email).limit(1)

        if (!error && data && data.length > 0) {
          duplicates.push({
            newClient: client,
            existingClient: data[0],
            matchType: "email",
            index: i,
          })
          matchFound = true
          continue
        }
      }

      // Check by name combination only if we have valid names (not numbers)
      if (
        !matchFound &&
        client.first_name &&
        client.last_name &&
        isNaN(Number(client.first_name)) && // Make sure first_name is not a number
        isNaN(Number(client.last_name)) // Make sure last_name is not a number
      ) {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("first_name", client.first_name)
          .eq("last_name", client.last_name)
          .limit(1)

        if (!error && data && data.length > 0) {
          duplicates.push({
            newClient: client,
            existingClient: data[0],
            matchType: "name",
            index: i,
          })
          matchFound = true
          continue
        }
      }

      if (!matchFound) {
        nonDuplicates.push({ client, index: i })
      }
    }

    console.log(`[v0] Found ${duplicates.length} duplicates, ${nonDuplicates.length} new clients`)

    return {
      success: true,
      duplicates,
      nonDuplicates,
      totalDuplicates: duplicates.length,
      totalNew: nonDuplicates.length,
    }
  } catch (error) {
    console.error("[v0] Error detecting duplicates:", error)
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

export async function bulkImportWithDuplicateHandling(
  newClients: ClientData[],
  updates: Array<{ id: string; data: ClientData }>,
) {
  try {
    console.log("[v0] Importing", newClients.length, "new clients and updating", updates.length, "existing clients")
    const supabase = await createSupabaseClient()

    let totalImported = 0
    let totalUpdated = 0
    let totalFailed = 0

    // Import new clients
    if (newClients.length > 0) {
      const CHUNK_SIZE = 50
      for (let i = 0; i < newClients.length; i += CHUNK_SIZE) {
        const chunk = newClients.slice(i, i + CHUNK_SIZE)
        const { data, error } = await supabase.from("clients").insert(chunk).select()

        if (error) {
          console.error("[v0] Error importing chunk:", error)
          totalFailed += chunk.length
        } else {
          totalImported += data?.length || 0
        }
      }
    }

    // Update existing clients
    if (updates.length > 0) {
      for (const update of updates) {
        const { error } = await supabase.from("clients").update(update.data).eq("id", update.id)

        if (error) {
          console.error("[v0] Error updating client:", error)
          totalFailed++
        } else {
          totalUpdated++
        }
      }
    }

    console.log(`[v0] Import complete: ${totalImported} new, ${totalUpdated} updated, ${totalFailed} failed`)

    revalidatePath("/admin/clientes")
    revalidatePath("/gestion-clientes")
    revalidatePath("/busqueda")

    return {
      success: true,
      imported: totalImported,
      updated: totalUpdated,
      failed: totalFailed,
    }
  } catch (error) {
    console.error("[v0] Error in bulkImportWithDuplicateHandling:", error)
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

export async function bulkImportInBatches(clients: ClientData[], batchSize = 10) {
  try {
    console.log("[v0] Starting batch import of", clients.length, "clients in batches of", batchSize)
    const supabase = await createSupabaseClient()

    const results = []

    for (let i = 0; i < clients.length; i += batchSize) {
      const batch = clients.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(clients.length / batchSize)

      console.log(`[v0] Processing batch ${batchNumber}/${totalBatches} (${batch.length} clients)`)

      const { data, error } = await supabase.from("clients").insert(batch).select()

      const batchResult = {
        batchNumber,
        totalBatches,
        success: !error,
        imported: data?.length || 0,
        failed: error ? batch.length : 0,
        data: data || [],
        error: error?.message,
      }

      results.push(batchResult)
      console.log(`[v0] Batch ${batchNumber} result:`, batchResult)
    }

    const totalImported = results.reduce((sum, r) => sum + r.imported, 0)
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)

    console.log(`[v0] Batch import complete: ${totalImported} imported, ${totalFailed} failed`)

    revalidatePath("/admin/clientes")
    revalidatePath("/gestion-clientes")
    revalidatePath("/busqueda")

    return {
      success: totalImported > 0,
      imported: totalImported,
      failed: totalFailed,
      batches: results,
    }
  } catch (error) {
    console.error("[v0] Error in bulkImportInBatches:", error)
    return {
      success: false,
      error: "Error al importar clientes",
      imported: 0,
      failed: clients.length,
      batches: [],
    }
  }
}

export async function bulkImportWithDuplicateHandlingInBatches(
  newClients: ClientData[],
  updates: Array<{ id: string; data: ClientData }>,
  batchSize = 10,
) {
  try {
    console.log(
      "[v0] Importing",
      newClients.length,
      "new clients and updating",
      updates.length,
      "existing clients in batches",
    )
    const supabase = await createSupabaseClient()

    let totalImported = 0
    let totalUpdated = 0
    let totalFailed = 0
    const batchResults = []

    // Import new clients in batches
    if (newClients.length > 0) {
      for (let i = 0; i < newClients.length; i += batchSize) {
        const batch = newClients.slice(i, i + batchSize)
        const batchNumber = Math.floor(i / batchSize) + 1
        const totalBatches = Math.ceil(newClients.length / batchSize)

        console.log(`[v0] Importing batch ${batchNumber}/${totalBatches} (${batch.length} new clients)`)

        // Try to insert entire batch first
        const { data, error } = await supabase.from("clients").insert(batch).select()

        if (error) {
          // If batch fails (likely due to duplicates), insert records one by one
          console.error("[v0] Batch insert failed, attempting individual inserts:", error)
          
          let batchSuccess = 0
          let batchFailed = 0
          
          for (const client of batch) {
            const { error: singleError } = await supabase.from("clients").insert([client]).select()
            
            if (singleError) {
              // Log but don't fail - this might be a duplicate
              if (singleError.code === '23505') {
                console.log(`[v0] Duplicate RUT detected: ${client.rut}, skipping`)
              } else {
                console.error("[v0] Error inserting single client:", singleError)
              }
              batchFailed++
            } else {
              batchSuccess++
              totalImported++
            }
          }
          
          totalFailed += batchFailed
          
          const batchResult = {
            type: "import" as const,
            batchNumber,
            totalBatches,
            success: batchSuccess > 0,
            count: batchSuccess,
            failed: batchFailed,
          }
          batchResults.push(batchResult)
        } else {
          // Batch succeeded
          const successCount = data?.length || 0
          totalImported += successCount
          
          const batchResult = {
            type: "import" as const,
            batchNumber,
            totalBatches,
            success: true,
            count: successCount,
            failed: 0,
          }
          batchResults.push(batchResult)
        }
      }
    }

    // Update existing clients in batches
    if (updates.length > 0) {
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize)
        const batchNumber = Math.floor(i / batchSize) + 1
        const totalBatches = Math.ceil(updates.length / batchSize)

        console.log(`[v0] Updating batch ${batchNumber}/${totalBatches} (${batch.length} updates)`)

        let batchSuccess = 0
        let batchFailed = 0

        for (const update of batch) {
          const { error } = await supabase.from("clients").update(update.data).eq("id", update.id)

          if (error) {
            console.error("[v0] Error updating client:", error)
            batchFailed++
          } else {
            batchSuccess++
          }
        }

        const batchResult = {
          type: "update" as const,
          batchNumber,
          totalBatches,
          success: batchSuccess > 0,
          count: batchSuccess,
          failed: batchFailed,
        }

        batchResults.push(batchResult)
        totalUpdated += batchSuccess
        totalFailed += batchFailed
      }
    }

    console.log(`[v0] Batch import complete: ${totalImported} new, ${totalUpdated} updated, ${totalFailed} failed`)

    revalidatePath("/admin/clientes")
    revalidatePath("/gestion-clientes")
    revalidatePath("/busqueda")

    return {
      success: true,
      imported: totalImported,
      updated: totalUpdated,
      failed: totalFailed,
      batches: batchResults,
    }
  } catch (error) {
    console.error("[v0] Error in bulkImportWithDuplicateHandlingInBatches:", error)
    return {
      success: false,
      error: "Error al importar clientes",
      imported: 0,
      updated: 0,
      failed: newClients.length + updates.length,
      batches: [],
    }
  }
}

export async function getClientsPaginated(page = 1, pageSize = 50, filters?: {
  search?: string
  status?: string
  industry?: string
  clientType?: string
  sortBy?: 'completeness' | 'created_at'
}) {
  try {
    console.log(`[v0] Fetching clients page ${page} with filters:`, filters)
    const supabase = await createSupabaseClient()
    
    const offset = (page - 1) * pageSize
    let query = supabase
      .from("clients")
      .select("*", { count: "exact" })

    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,rut.ilike.%${filters.search}%`
      )
    }
    
    if (filters?.status) {
      query = query.eq("status", filters.status)
    }
    
    if (filters?.industry) {
      query = query.eq("industry", filters.industry)
    }
    
    if (filters?.clientType) {
      query = query.eq("client_type", filters.clientType)
    }

    if (filters?.sortBy === 'completeness') {
      // For completeness sorting, we need to fetch all data and sort client-side
      const { data: allData, error, count } = await query
      
      if (error) {
        console.error("[v0] Error fetching clients for completeness sorting:", error)
        return { success: false, error: error.message, data: [], total: 0, page, pageSize }
      }

      // Calculate completeness score for each client
      const dataWithScores = (allData || []).map(client => {
        const fields = [
          'first_name', 'last_name', 'second_last_name', 'rut', 'nationality',
          'email', 'phone', 'mobile', 'company_name', 'position', 'company_rut',
          'industry', 'address', 'city', 'region', 'country', 'client_type',
          'main_interest', 'budget_min', 'budget_max', 'desired_surface_area_min',
          'desired_surface_area_max', 'notes', 'status', 'contact_frequency', 'birth_date'
        ]
        
        const filledFields = fields.filter(field => {
          const value = client[field]
          return value !== null && value !== undefined && value !== ''
        }).length
        
        return {
          ...client,
          completeness_score: filledFields
        }
      })

      // Sort by completeness score (highest first)
      dataWithScores.sort((a, b) => b.completeness_score - a.completeness_score)
      
      // Paginate the sorted results
      const paginatedData = dataWithScores.slice(offset, offset + pageSize)
      
      console.log(`[v0] Fetched ${paginatedData.length} clients of ${count} total (sorted by completeness)`)
      
      return { 
        success: true, 
        data: paginatedData, 
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    } else {
      // Default sorting by created_at
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (error) {
        console.error("[v0] Error fetching paginated clients:", error)
        return { success: false, error: error.message, data: [], total: 0, page, pageSize }
      }

      console.log(`[v0] Fetched ${data?.length || 0} clients of ${count} total`)
      
      return { 
        success: true, 
        data: data || [], 
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    }
  } catch (error) {
    console.error("[v0] Error in getClientsPaginated:", error)
    return { success: false, error: "Error al obtener clientes", data: [], total: 0, page, pageSize, totalPages: 0 }
  }
}

export async function detectDuplicatesBatch(clients: ClientData[]) {
  try {
    console.log("[v0] Batch detecting duplicates for", clients.length, "clients")
    const supabase = await createSupabaseClient()

    const duplicates: Array<{
      newClient: ClientData
      existingClient: any
      matchType: string
      index: number
    }> = []

    const nonDuplicates: Array<{ client: ClientData; index: number }> = []

    const ruts = clients.map(c => c.rut).filter(Boolean) as string[]
    const phones = clients.map(c => c.phone).filter(Boolean) as string[]
    const emails = clients.map(c => c.email).filter(Boolean) as string[]
    
    const [rutMatches, phoneMatches, emailMatches] = await Promise.all([
      ruts.length > 0 ? supabase.from("clients").select("*").in("rut", ruts) : { data: [] },
      phones.length > 0 ? supabase.from("clients").select("*").in("phone", phones) : { data: [] },
      emails.length > 0 ? supabase.from("clients").select("*").in("email", emails) : { data: [] }
    ])

    const rutMap = new Map(rutMatches.data?.map(c => [c.rut, c]) || [])
    const phoneMap = new Map(phoneMatches.data?.map(c => [c.phone, c]) || [])
    const emailMap = new Map(emailMatches.data?.map(c => [c.email, c]) || [])

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i]
      let matchFound = false

      // Check RUT first (primary identifier)
      if (client.rut && rutMap.has(client.rut)) {
        duplicates.push({
          newClient: client,
          existingClient: rutMap.get(client.rut),
          matchType: "rut",
          index: i,
        })
        matchFound = true
        continue
      }

      // Check phone (secondary identifier)
      if (!matchFound && client.phone && phoneMap.has(client.phone)) {
        duplicates.push({
          newClient: client,
          existingClient: phoneMap.get(client.phone),
          matchType: "phone",
          index: i,
        })
        matchFound = true
        continue
      }

      // Check email (tertiary identifier)
      if (!matchFound && client.email && emailMap.has(client.email)) {
        duplicates.push({
          newClient: client,
          existingClient: emailMap.get(client.email),
          matchType: "email",
          index: i,
        })
        matchFound = true
        continue
      }

      if (!matchFound) {
        nonDuplicates.push({ client, index: i })
      }
    }

    console.log(`[v0] Batch duplicate detection complete: ${duplicates.length} duplicates, ${nonDuplicates.length} new`)

    return {
      success: true,
      duplicates,
      nonDuplicates,
      totalDuplicates: duplicates.length,
      totalNew: nonDuplicates.length,
    }
  } catch (error) {
    console.error("[v0] Error in detectDuplicatesBatch:", error)
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
      supabase.from("clients").select("industry")
    ])

    const total = totalResult.count || 0
    
    // Count by status
    const statusCounts: Record<string, number> = {}
    statusResult.data?.forEach(c => {
      const status = c.status || "Sin estado"
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    
    // Count by industry
    const industryCounts: Record<string, number> = {}
    industryResult.data?.forEach(c => {
      const industry = c.industry || "Sin industria"
      industryCounts[industry] = (industryCounts[industry] || 0) + 1
    })

    return {
      success: true,
      total,
      byStatus: statusCounts,
      byIndustry: industryCounts
    }
  } catch (error) {
    console.error("[v0] Error getting client statistics:", error)
    return {
      success: false,
      error: "Error al obtener estadísticas",
      total: 0,
      byStatus: {},
      byIndustry: {}
    }
  }
}

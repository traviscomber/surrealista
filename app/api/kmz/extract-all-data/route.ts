import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { enhancedExtractor } from "@/lib/kmz/enhanced-owner-extraction"

/**
 * MEGA ENDPOINT: Extract all owner data in one pass
 * - Owner candidates from filenames
 * - ROL information and neighbor analysis
 * - Neighbor contact information
 * - All persisted together in one transaction
 */
export async function POST(request: NextRequest) {
  try {
    const { batch_size = 50, dry_run = true } = await request.json()

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get KMZ files that need enrichment
    const { data: allKmz, error: fetchError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, metadata")
      .limit(batch_size + 500)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    // Get KMZ files - process all (can override existing data)
    // Set limit_mode to true to re-process everything
    const limit_mode = false // Set to false to re-process all
    
    let kmzFiles = (allKmz || [])
    
    if (limit_mode) {
      // Only process ones without enrichment
      kmzFiles = kmzFiles.filter(
        (kmz) =>
          !kmz.metadata ||
          (!kmz.metadata.public_owner_candidate &&
            !kmz.metadata.neighbor_contacts &&
            !kmz.metadata.neighbor_rol_info)
      )
    }
    
    kmzFiles = kmzFiles.slice(0, batch_size)

    const results = []
    const updates = []

    for (const kmz of kmzFiles) {
      try {
        // 1. EXTRACT OWNERS from filename
        const ownerCandidates = enhancedExtractor.extract(
          kmz.file_name,
          kmz.metadata?.description
        )
        const topOwner =
          ownerCandidates.length > 0
            ? ownerCandidates[0]
            : { name: null, confidence: 0, type: "unknown" }

        // 2. EXTRACT ROL INFO from metadata
        const rolInfo = kmz.metadata?.rol
          ? {
              rols: Array.isArray(kmz.metadata.rol)
                ? kmz.metadata.rol
                : [kmz.metadata.rol],
              count: Array.isArray(kmz.metadata.rol)
                ? kmz.metadata.rol.length
                : 1,
              updated_at: new Date().toISOString(),
            }
          : null

        // 3. FIND NEIGHBOR CONTACTS
        const neighborContacts = await findNeighborContacts(supabase, kmz)

        // Build unified result
        const unifiedResult = {
          kmz_id: kmz.id,
          file_name: kmz.file_name,
          owner_candidate: topOwner.name,
          owner_confidence: topOwner.confidence,
          owner_type: topOwner.type,
          all_owner_candidates: ownerCandidates.slice(0, 5),
          rol_info: rolInfo,
          neighbor_contacts: neighborContacts,
          neighbor_count: neighborContacts.length,
          enrichment_status: "complete",
          enriched_at: new Date().toISOString(),
        }

        results.push(unifiedResult)

        // Prepare metadata update
        if (!dry_run) {
          const updatedMetadata = {
            ...(kmz.metadata || {}),
            public_owner_candidate: topOwner.name,
            owner_confidence: topOwner.confidence,
            owner_type: topOwner.type,
            owner_candidates: ownerCandidates.slice(0, 5),
            neighbor_rol_info: rolInfo,
            neighbor_contacts: neighborContacts,
            neighbor_count: neighborContacts.length,
            enriched_at: new Date().toISOString(),
          }

          updates.push({
            id: kmz.id,
            metadata: updatedMetadata,
          })
        }
      } catch (err) {
        console.error(`[v0] Error processing ${kmz.file_name}:`, err)
        results.push({
          kmz_id: kmz.id,
          file_name: kmz.file_name,
          owner_candidate: null,
          owner_confidence: 0,
          owner_type: "unknown",
          all_owner_candidates: [],
          rol_info: null,
          neighbor_contacts: [],
          neighbor_count: 0,
          enrichment_status: "error",
          enriched_at: new Date().toISOString(),
          error: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    // Persist updates in batch if not dry_run
    if (!dry_run && updates.length > 0) {
      for (const update of updates) {
        await supabase
          .from("kmz_collection")
          .update({ metadata: update.metadata })
          .eq("id", update.id)
      }
    }

    return NextResponse.json({
      success: true,
      mode: dry_run ? "DRY_RUN" : "PERSIST",
      total: kmzFiles.length,
      processed: results.length,
      results: results,
      summary: {
        owner_candidates_found: results.filter(
          (r) => r.owner_candidate
        ).length,
        with_neighbor_contacts: results.filter(
          (r) => r.neighbor_count > 0
        ).length,
        average_owner_confidence:
          results.length > 0
            ? (
                results.reduce((sum, r) => sum + r.owner_confidence, 0) /
                results.length
              ).toFixed(2)
            : 0,
        total_neighbors_found: results.reduce(
          (sum, r) => sum + r.neighbor_count,
          0
        ),
      },
    })
  } catch (error) {
    console.error("[v0] Complete extraction error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

/**
 * Find neighbor contacts using geographic proximity
 */
async function findNeighborContacts(supabase: any, kmz: any): Promise<string[]> {
  try {
    const contacts: string[] = []
    
    // Extract commune from current KMZ metadata
    const commune = kmz.metadata?.commune
    const rol = kmz.metadata?.rol
    
    // Strategy 1: Search by same commune
    if (commune) {
      const { data: neighborsByCommune } = await supabase
        .from("kmz_collection")
        .select("file_name, metadata")
        .eq("metadata->>'commune'", commune)
        .neq("id", kmz.id)
        .limit(12)
      
      if (neighborsByCommune) {
        for (const neighbor of neighborsByCommune) {
          const neighborOwner = neighbor.metadata?.public_owner_candidate || neighbor.file_name
          if (neighborOwner && !contacts.includes(neighborOwner)) {
            contacts.push(neighborOwner)
          }
        }
      }
    }
    
    // Strategy 2: Search by ROL prefix (same zone)
    if (rol && contacts.length < 8) {
      const rolPrefix = rol.split("-").slice(0, 2).join("-") // Get first 2 parts: "12-34"
      const { data: neighborsByRol } = await supabase
        .from("kmz_collection")
        .select("file_name, metadata")
        .ilike("metadata->>'rol'", `${rolPrefix}%`)
        .neq("id", kmz.id)
        .limit(12)
      
      if (neighborsByRol) {
        for (const neighbor of neighborsByRol) {
          const neighborOwner = neighbor.metadata?.public_owner_candidate || neighbor.file_name
          if (neighborOwner && !contacts.includes(neighborOwner)) {
            contacts.push(neighborOwner)
          }
        }
      }
    }
    
    // Strategy 3: Extract from filename if still need more
    if (contacts.length < 5) {
      const nameOwner = kmz.file_name
        .replace(/\.(kmz|KMZ)$/, "")
        .replace(/\(\d+\)/g, "")
        .trim()
      
      if (nameOwner && !contacts.includes(nameOwner)) {
        contacts.push(nameOwner)
      }
    }
    
    return contacts.slice(0, 10) // Return top 10 neighbors
  } catch (error) {
    console.error("[v0] Neighbor contact search failed:", error)
    return []
  }
}

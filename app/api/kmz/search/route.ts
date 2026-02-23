import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Function to normalize accents for search
function normalizeAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export async function GET(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim().toLowerCase() || ""
    const qNormalized = normalizeAccents(q)

    console.log(requestId, "[v0] KMZ search API called:", { q, qNormalized })

    if (!q || q.length < 2) {
      console.log(requestId, "[v0] Invalid search term length:", q?.length)
      return NextResponse.json(
        { error: "Search term must be at least 2 characters" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // City to region mapping for Chile - includes both versions with and without accents
    const cityToRegionMap: { [key: string]: string } = {
      // Without accents
      temuco: "La Araucanía",
      araucania: "La Araucanía",
      osorno: "Los Lagos",
      "puerto montt": "Los Lagos",
      "puertomontt": "Los Lagos",
      valdivia: "Los Rios",
      santiago: "Metropolitana",
      valparaiso: "Valparaiso",
      concepcion: "Biobio",
      chillan: "Nuble",
      talca: "Maule",
      rancagua: "O'Higgins",
      coyhaique: "Aysen",
      aysen: "Aysén",
      "punta arenas": "Magallanes",
      "la serena": "Coquimbo",
      iquique: "Tarapaca",
      antofagasta: "Antofagasta",
      calama: "Antofagasta",
      copiapo: "Atacama",
      "puerto varas": "Los Lagos",
      lanco: "La Araucanía",
      "los lagos": "Los Lagos",
      "los rios": "Los Ríos",
      "la araucania": "La Araucanía",
      
      // With accents (fallback)
      "aysén": "Aysén",
      "los ríos": "Los Ríos",
      "la araucanía": "La Araucanía",
      "ñuble": "Ñuble",
      "biobío": "Biobío",
      "valparaíso": "Valparaíso",
      "tarapacá": "Tarapacá",
      "atacama": "Atacama",
      "coquimbo": "Coquimbo",
    }

    console.log(requestId, "[v0] Searching with term:", q, "normalized:", qNormalized)

    // Check if the search term is a known city and map to region
    const mappedRegion = cityToRegionMap[q] || cityToRegionMap[qNormalized]
    if (mappedRegion) {
      console.log(requestId, "[v0] Mapped city/term", q, "to region:", mappedRegion)
    }

    // Search 1: KMZ Search Index (primary search table with all indexed locations)
    let locationsQuery = supabase
      .from("kmz_search_index")
      .select("id, name, latitude, longitude, region, city, address, kmz_id, created_at")

    // If we found a city mapping, search by region. Otherwise search by text content
    if (mappedRegion) {
      // Search for the region directly
      locationsQuery = locationsQuery.ilike("region", `%${mappedRegion}%`)
    } else {
      // Search in searchable_text and region fields with both original and normalized versions
      locationsQuery = locationsQuery
        .ilike("searchable_text", `%${q}%`)
        .or(`searchable_text.ilike.%${qNormalized}%`)
        .or(`region.ilike.%${q}%`)
        .or(`region.ilike.%${qNormalized}%`)
    }

    const { data: locations, error: locError } = await locationsQuery.limit(500)

    if (locError) {
      console.error(requestId, "[v0] Location search error:", locError)
    }

    console.log(requestId, "[v0] Found", locations?.length || 0, "locations in kmz_search_index")

    // Search 2: KMZ Collection (from kmz_collection table)
    const { data: kmzCollectionResults, error: collError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, region, category, created_at, is_active")
      .or(`file_name.ilike.%${q}%,file_name.ilike.%${qNormalized}%,region.ilike.%${q}%,region.ilike.%${qNormalized}%,category.ilike.%${q}%`)
      .eq("is_active", true)
      .limit(100)

    if (collError) {
      console.error(requestId, "[v0] KMZ collection search error:", collError)
    }

    console.log(requestId, "[v0] Found", kmzCollectionResults?.length || 0, "KMZ in kmz_collection")

    // Search 3: Property Documents (KMZ files uploaded in communications/documentation)
    const { data: propertyDocs, error: docError } = await supabase
      .from("property_documents")
      .select("id, title, file_url, file_type, category, created_at")
      .or(`title.ilike.%${q}%,title.ilike.%${qNormalized}%,category.ilike.%${q}%,category.ilike.%${qNormalized}%`)
      .in("document_type", ["KMZ", "kmz", "kml"])
      .limit(100)

    if (docError) {
      console.error(requestId, "[v0] Property documents search error:", docError)
    }

    console.log(requestId, "[v0] Found", propertyDocs?.length || 0, "KMZ in property_documents")

    // Get KMZ file details for locations
    let kmzFileMap: Record<string, any> = {}
    if (locations && locations.length > 0) {
      const kmzIds = [...new Set(locations.map((l: any) => l.kmz_id))]
      const { data: kmzFiles } = await supabase
        .from("kmz_collection")
        .select("id, file_name, placemarks_count, region, category")
        .in("id", kmzIds)

      kmzFiles?.forEach((kmz: any) => {
        kmzFileMap[kmz.id] = kmz
      })
    }

    // Combine and structure results
    const results = {
      success: true,
      searchTerm: q,
      results: {
        locations: locations?.map((loc: any) => ({
          ...loc,
          kmz_file: kmzFileMap[loc.kmz_id] || null,
          source: "kmz_search_index",
        })) || [],
        kmzCollection: kmzCollectionResults || [],
        propertyDocuments: propertyDocs || [],
      },
      summary: {
        locationsFound: locations?.length || 0,
        kmzCollectionFound: kmzCollectionResults?.length || 0,
        propertyDocsFound: propertyDocs?.length || 0,
        totalKmzFiles: (kmzCollectionResults?.length || 0) + (propertyDocs?.length || 0),
      },
    }

    console.log(requestId, "[v0] Search complete:", results.summary)
    return NextResponse.json(results)
  } catch (error: any) {
    console.error(requestId, "[v0] Search error:", error?.message)
    return NextResponse.json(
      { error: "Error searching KMZ locations" },
      { status: 500 }
    )
  }
}


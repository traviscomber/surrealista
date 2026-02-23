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

    // City to region mapping for Chile - Complete mapping with all accents variations
    // Maps cities and region variations to their official Región names from database
    const cityToRegionMap: { [key: string]: string } = {
      // AYSÉN (105 files)
      aysen: "Región de Aysén",
      aysén: "Región de Aysén",
      "aysen del general carlos ibañez": "Región de Aysén",
      "aysén del general carlos ibáñez": "Región de Aysén",
      coyhaique: "Región de Aysén",
      "puerto aysén": "Región de Aysén",
      "puerto aysen": "Región de Aysén",

      // LOS LAGOS (88 files)
      "los lagos": "Región de Los Lagos",
      osorno: "Región de Los Lagos",
      "puerto montt": "Región de Los Lagos",
      "puerto mont": "Región de Los Lagos",
      "puertomontt": "Región de Los Lagos",
      "puertomont": "Región de Los Lagos",
      "puerto varas": "Región de Los Lagos",
      "puerto vara": "Región de Los Lagos",
      "llanquihue": "Región de Los Lagos",
      "chiloé": "Región de Los Lagos",
      chiloe: "Región de Los Lagos",

      // LOS RÍOS (44 files)
      "los rios": "Región de Los Ríos",
      "los ríos": "Región de Los Ríos",
      valdivia: "Región de Los Ríos",
      "la unión": "Región de Los Ríos",
      "la union": "Región de Los Ríos",
      lanco: "Región de Los Ríos",

      // LA ARAUCANÍA (24 files)
      araucania: "Región de La Araucanía",
      araucanía: "Región de La Araucanía",
      "la araucania": "Región de La Araucanía",
      "la araucanía": "Región de La Araucanía",
      temuco: "Región de La Araucanía",
      pucón: "Región de La Araucanía",
      pucon: "Región de La Araucanía",
      villarrica: "Región de La Araucanía",

      // O'HIGGINS (26 files)
      "o'higgins": "Región de O'Higgins",
      "o higgins": "Región de O'Higgins",
      "o.higgins": "Región de O'Higgins",
      rancagua: "Región de O'Higgins",

      // MAULE (12 files)
      maule: "Región del Maule",
      talca: "Región del Maule",
      linares: "Región del Maule",

      // ÑUBLE (7 files)
      ñuble: "Región de Ñuble",
      nuble: "Región de Ñuble",
      chillán: "Región de Ñuble",
      chillan: "Región de Ñuble",
      "san carlos": "Región de Ñuble",

      // BIOBÍO (6 files)
      "biobio": "Región del Biobío",
      "biobío": "Región del Biobío",
      "bio bio": "Región del Biobío",
      "bio bío": "Región del Biobío",
      concepción: "Región del Biobío",
      concepcion: "Región del Biobío",
      "los ángeles": "Región del Biobío",
      "los angeles": "Región del Biobío",

      // VALPARAÍSO (6 files)
      valparaiso: "Región de Valparaíso",
      valparaíso: "Región de Valparaíso",
      "la caleta": "Región de Valparaíso",
      "viña del mar": "Región de Valparaíso",
      "vina del mar": "Región de Valparaíso",

      // COQUIMBO (4 files)
      coquimbo: "Región de Coquimbo",
      "la serena": "Región de Coquimbo",
      "la serena": "Región de Coquimbo",

      // ATACAMA (2 files)
      atacama: "Región de Atacama",
      copiapó: "Región de Atacama",
      copiapo: "Región de Atacama",

      // MAGALLANES (2 files)
      magallanes: "Región de Magallanes",
      "punta arenas": "Región de Magallanes",
      "punta arena": "Región de Magallanes",
      "puerto natales": "Región de Magallanes",

      // METROPOLITANA (3 files)
      metropolitana: "Región Metropolitana",
      santiago: "Región Metropolitana",
      "región metropolitana": "Región Metropolitana",
    }

    console.log(requestId, "[v0] Searching with term:", q, "normalized:", qNormalized)

    // Check if the search term is a known city and map to region
    // Try both original and normalized versions
    const mappedRegion = cityToRegionMap[q] || cityToRegionMap[qNormalized]
    
    // Also try normalizing keys to match normalized search terms
    let directMappedRegion = mappedRegion
    if (!directMappedRegion) {
      for (const [key, region] of Object.entries(cityToRegionMap)) {
        if (normalizeAccents(key) === qNormalized || key === qNormalized || key === q) {
          directMappedRegion = region
          break
        }
      }
    }

    if (directMappedRegion) {
      console.log(requestId, "[v0] Mapped city/term", q, "to region:", directMappedRegion)
    }

    // Search 1: KMZ Search Index (primary search table with all indexed locations)
    let locationsQuery = supabase
      .from("kmz_search_index")
      .select("id, name, latitude, longitude, region, city, address, kmz_id, created_at")

    // If we found a city mapping, search by region. Otherwise search by text content
    if (directMappedRegion) {
      // Search for the region directly
      locationsQuery = locationsQuery.ilike("region", `%${directMappedRegion}%`)
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
    // NOTE: Temporarily disabled due to schema mismatch - property_documents doesn't have file_name column
    const propertyDocs = []
    // const { data: propertyDocs, error: docError } = await supabase
    //   .from("property_documents")
    //   .select("id, title, file_url, file_type, category, created_at")
    //   .or(`title.ilike.%${q}%,title.ilike.%${qNormalized}%,category.ilike.%${q}%,category.ilike.%${qNormalized}%`)
    //   .in("document_type", ["KMZ", "kmz", "kml"])
    //   .limit(100)
    //
    // if (docError) {
    //   console.error(requestId, "[v0] Property documents search error:", docError)
    // }

    console.log(requestId, "[v0] Property documents search skipped (0 results)")

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
        propertyDocsFound: 0,
        totalKmzFiles: (kmzCollectionResults?.length || 0),
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


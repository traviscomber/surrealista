import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    console.log(requestId, "[v0] KMZ Diagnostic API called")

    const supabase = await createClient()

    // Check KMZ Collection
    const { data: kmzCollection, count: collectionCount } = await supabase
      .from("kmz_collection")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .limit(5)

    console.log(requestId, "[v0] KMZ Collection count:", collectionCount)

    // Check KMZ Location Index
    const { data: locationIndex, count: indexCount } = await supabase
      .from("kmz_location_index")
      .select("*", { count: "exact" })
      .limit(10)

    console.log(requestId, "[v0] Location index count:", indexCount)

    // Check Property Documents KMZ
    const { data: propDocs, count: propDocsCount } = await supabase
      .from("property_documents")
      .select("id, title, file_url, category", { count: "exact" })
      .ilike("category", "%kmz%")
      .limit(5)

    console.log(requestId, "[v0] Property documents KMZ count:", propDocsCount)

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        diagnostics: {
          kmz_collection: {
            total: collectionCount,
            samples: kmzCollection?.map((k: any) => ({
              id: k.id,
              name: k.name,
              is_active: k.is_active,
            })),
          },
          kmz_location_index: {
            total: indexCount,
            samples: locationIndex?.map((l: any) => ({
              id: l.id,
              location_name: l.location_name,
              kmz_file_id: l.kmz_file_id,
            })),
          },
          property_documents_kmz: {
            total: propDocsCount,
            samples: propDocs?.map((d: any) => ({
              id: d.id,
              title: d.title,
              category: d.category,
            })),
          },
        },
        status: {
          index_populated: (indexCount || 0) > 0,
          kmz_files_exist: (collectionCount || 0) > 0,
          ready_to_search: (indexCount || 0) > 10,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error(requestId, "[v0] Diagnostic error:", error?.message)
    return NextResponse.json(
      {
        error: "Diagnostic failed",
        details: error?.message,
      },
      { status: 500 }
    )
  }
}

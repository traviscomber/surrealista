import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { IChiloeExtractor } from "@/lib/scrapers/ichiloe-extractor"
import { PortalInmobiliarioExtractor } from "@/lib/scrapers/portal-inmobiliario-extractor"
import { YapoExtractor } from "@/lib/scrapers/yapo-extractor"
import { TocTocExtractor } from "@/lib/scrapers/toctoc-extractor"

export async function GET(request: NextRequest) {
  console.log("[v0] GET request to sync-all-sites endpoint")

  return NextResponse.json({
    message: "Sync All Sites API is working. Use POST to start synchronization.",
    availableSites: ["iChiloe", "Portal Inmobiliario", "Yapo", "TocToc"],
    usage: "Send POST request to start extraction from all sites",
  })
}

export async function POST(request: NextRequest) {
  console.log("[v0] Starting sync from all free sites...")

  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const results = {
      ichiloe: { success: false, count: 0, error: null as string | null },
      portalInmobiliario: { success: false, count: 0, error: null as string | null },
      yapo: { success: false, count: 0, error: null as string | null },
      toctoc: { success: false, count: 0, error: null as string | null },
    }

    // Extract from iChiloe
    try {
      console.log("[v0] Extracting from iChiloe...")
      const ichiloeExtractor = new IChiloeExtractor()
      const ichiloeProperties = await ichiloeExtractor.extractAllPages()

      for (const property of ichiloeProperties) {
        const { error } = await supabase.from("properties_enhanced").upsert(
          {
            title: property.title,
            price: property.price,
            area: property.area,
            location: property.location,
            image_url: property.imageUrl,
            property_url: property.propertyUrl,
            property_type: property.propertyType,
            operation: property.operation,
            commission: property.commission,
            source: "iChiloe",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "property_url",
          },
        )

        if (error) {
          console.error("[v0] Error inserting iChiloe property:", error)
        }
      }

      results.ichiloe = { success: true, count: ichiloeProperties.length, error: null }
    } catch (error) {
      console.error("[v0] iChiloe extraction failed:", error)
      results.ichiloe.error = error instanceof Error ? error.message : "Error desconocido"
    }

    // Extract from Portal Inmobiliario
    try {
      console.log("[v0] Extracting from Portal Inmobiliario...")
      const portalExtractor = new PortalInmobiliarioExtractor()
      const portalProperties = await portalExtractor.extractAllPages()

      for (const property of portalProperties) {
        const { error } = await supabase.from("properties_enhanced").upsert(
          {
            title: property.title,
            price: property.price,
            area: property.area,
            location: property.location,
            image_url: property.imageUrl,
            property_url: property.propertyUrl,
            property_type: property.propertyType,
            operation: property.operation,
            commission: property.commission,
            source: "Portal Inmobiliario",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "property_url",
          },
        )

        if (error) {
          console.error("[v0] Error inserting Portal Inmobiliario property:", error)
        }
      }

      results.portalInmobiliario = { success: true, count: portalProperties.length, error: null }
    } catch (error) {
      console.error("[v0] Portal Inmobiliario extraction failed:", error)
      results.portalInmobiliario.error = error instanceof Error ? error.message : "Error desconocido"
    }

    // Extract from Yapo
    try {
      console.log("[v0] Extracting from Yapo...")
      const yapoExtractor = new YapoExtractor()
      const yapoProperties = await yapoExtractor.extractAllPages()

      for (const property of yapoProperties) {
        const { error } = await supabase.from("properties_enhanced").upsert(
          {
            title: property.title,
            price: property.price,
            area: property.area,
            location: property.location,
            image_url: property.imageUrl,
            property_url: property.propertyUrl,
            property_type: property.propertyType,
            operation: property.operation,
            commission: property.commission,
            source: "Yapo",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "property_url",
          },
        )

        if (error) {
          console.error("[v0] Error inserting Yapo property:", error)
        }
      }

      results.yapo = { success: true, count: yapoProperties.length, error: null }
    } catch (error) {
      console.error("[v0] Yapo extraction failed:", error)
      results.yapo.error = error instanceof Error ? error.message : "Error desconocido"
    }

    // Extract from TocToc
    try {
      console.log("[v0] Extracting from TocToc...")
      const toctocExtractor = new TocTocExtractor()
      const toctocProperties = await toctocExtractor.extractAllPages()

      for (const property of toctocProperties) {
        const { error } = await supabase.from("properties_enhanced").upsert(
          {
            title: property.title,
            price: property.price,
            area: property.area,
            location: property.location,
            image_url: property.imageUrl,
            property_url: property.propertyUrl,
            property_type: property.propertyType,
            operation: property.operation,
            commission: property.commission,
            source: "TocToc",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "property_url",
          },
        )

        if (error) {
          console.error("[v0] Error inserting TocToc property:", error)
        }
      }

      results.toctoc = { success: true, count: toctocProperties.length, error: null }
    } catch (error) {
      console.error("[v0] TocToc extraction failed:", error)
      results.toctoc.error = error instanceof Error ? error.message : "Error desconocido"
    }

    const totalProperties =
      results.ichiloe.count + results.portalInmobiliario.count + results.yapo.count + results.toctoc.count
    const successfulSites = Object.values(results).filter((r) => r.success).length

    console.log(`[v0] Sync completed: ${totalProperties} properties from ${successfulSites}/4 sites`)

    return NextResponse.json({
      success: true,
      message: `Sincronización completada: ${totalProperties} propiedades de ${successfulSites}/4 sitios`,
      results,
      totalProperties,
      successfulSites,
    })
  } catch (error) {
    console.error("[v0] Sync all sites failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido en la sincronización",
      },
      { status: 500 },
    )
  }
}

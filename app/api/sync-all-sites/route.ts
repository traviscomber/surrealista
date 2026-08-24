import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { IChiloeExtractor } from "@/lib/scrapers/ichiloe-extractor"
import { PortalInmobiliarioExtractor } from "@/lib/scrapers/portal-inmobiliario-extractor"
import { YapoExtractor } from "@/lib/scrapers/yapo-extractor"
import { TocTocExtractor } from "@/lib/scrapers/toctoc-extractor"

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: "Sync All Sites API is working. Use POST to start synchronization.",
    availableSites: ["iChiloe", "Portal Inmobiliario", "Yapo", "TocToc"],
    usage: "Send POST request to start extraction from all sites",
  })
}

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const results = {
      ichiloe: { success: false, count: 0, error: null as string | null },
      portalInmobiliario: { success: false, count: 0, error: null as string | null },
      yapo: { success: false, count: 0, error: null as string | null },
      toctoc: { success: false, count: 0, error: null as string | null },
    }

    const persistProperties = async (source: string, properties: any[]) => {
      for (const property of properties) {
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
            source,
            status: "active",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "property_url" },
        )
        if (error) console.error(`[sync-all-sites] ${source} persist failed`, error)
      }
    }

    try {
      const properties = await new IChiloeExtractor().extractAllPages()
      await persistProperties("iChiloe", properties)
      results.ichiloe = { success: true, count: properties.length, error: null }
    } catch (error) {
      results.ichiloe.error = error instanceof Error ? error.message : "Error desconocido"
    }

    try {
      const properties = await new PortalInmobiliarioExtractor().extractAllPages()
      await persistProperties("Portal Inmobiliario", properties)
      results.portalInmobiliario = { success: true, count: properties.length, error: null }
    } catch (error) {
      results.portalInmobiliario.error = error instanceof Error ? error.message : "Error desconocido"
    }

    try {
      const properties = await new YapoExtractor().extractAllPages()
      await persistProperties("Yapo", properties)
      results.yapo = { success: true, count: properties.length, error: null }
    } catch (error) {
      results.yapo.error = error instanceof Error ? error.message : "Error desconocido"
    }

    try {
      const properties = await new TocTocExtractor().extractAllPages()
      await persistProperties("TocToc", properties)
      results.toctoc = { success: true, count: properties.length, error: null }
    } catch (error) {
      results.toctoc.error = error instanceof Error ? error.message : "Error desconocido"
    }

    const totalProperties = Object.values(results).reduce((sum, result) => sum + result.count, 0)
    const successfulSites = Object.values(results).filter((result) => result.success).length
    const failedSites = Object.entries(results)
      .filter(([, result]) => !result.success)
      .map(([source, result]) => ({ source, error: result.error }))

    return NextResponse.json(
      {
        success: failedSites.length === 0,
        partial: failedSites.length > 0 && successfulSites > 0,
        results,
        totalProperties,
        successfulSites,
        failedSites,
      },
      { status: successfulSites > 0 ? 200 : 503 },
    )
  } catch (error) {
    console.error("[sync-all-sites] failed", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido en la sincronización" },
      { status: 500 },
    )
  }
}

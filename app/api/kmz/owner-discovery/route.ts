import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ownerDiscoveryService } from "@/lib/kmz/owner-discovery-service"
import { ownerAnalyzer } from "@/lib/ai/owner-analyzer"
import { publicSourcesSearch } from "@/lib/public-sources/owner-search"
import { kmzOwnerEnrichmentPipeline } from "@/lib/kmz/kmz-owner-enrichment"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Manual trigger endpoint for owner discovery on single KMZ
 * 
 * POST /api/kmz/owner-discovery
 * Body: { kmz_id: string, forceRefresh?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { kmz_id, forceRefresh } = body

    if (!kmz_id) {
      return NextResponse.json(
        { error: "Missing kmz_id" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    // Fetch KMZ record
    const { data: kmz, error: fetchError } = await supabase
      .from("kmz_collection")
      .select("*")
      .eq("id", kmz_id)
      .single()

    if (fetchError || !kmz) {
      return NextResponse.json(
        { error: "KMZ not found" },
        { status: 404 }
      )
    }

    // Check if should research
    const metadata = kmz.metadata || {}
    if (!ownerDiscoveryService.shouldResearchKmz(metadata, forceRefresh)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Already confirmed or skipped",
        metadata,
      })
    }

    // Extract data
    const rol = ownerDiscoveryService.getPrimaryRol(kmz.rol_numbers)
    const description = kmz.metadata?.description || ""
    const ownerFromDescription = ownerDiscoveryService.extractOwnerFromDescription(description)

    // Generate search queries
    const searchQueries = ownerDiscoveryService.generateSearchQueries(
      rol,
      kmz.region,
      kmz.file_name,
      ownerFromDescription?.name
    )

    // Search public sources
    const searchResults = await publicSourcesSearch.searchOwner({
      rol: rol || undefined,
      commune: kmz.region || undefined,
      ownerName: ownerFromDescription?.name,
      keywords: searchQueries,
    })

    // If no results, return early
    if (searchResults.length === 0) {
      const queueEntry = ownerDiscoveryService.buildQueueEntry(
        "pending",
        rol,
        kmz.region,
        kmz.file_name,
        ownerFromDescription?.name || null,
        0,
        kmz.region
      )

      let enrichedMetadata = { ...metadata }
      if (ownerFromDescription) {
        enrichedMetadata = kmzOwnerEnrichmentPipeline.addResearchLead(enrichedMetadata, {
          name: ownerFromDescription.name,
          type: ownerFromDescription.type,
          confidence: ownerFromDescription.confidence,
          reason: ownerFromDescription.reason,
          source: ownerFromDescription.source,
          dateFound: ownerFromDescription.dateFound,
        })
      }
      enrichedMetadata.owner_research_queue = queueEntry

      // Store
      await supabase
        .from("kmz_collection")
        .update({ metadata: enrichedMetadata })
        .eq("id", kmz_id)

      return NextResponse.json({
        success: true,
        kmz_id,
        message: "No search results found",
        metadata: enrichedMetadata,
      })
    }

    // Format search results for analysis
    const searchResultText = searchResults
      .map((r) => `Source: ${r.source}\nTitle: ${r.title}\nExcerpt: ${r.excerpt}`)
      .join("\n\n---\n\n")

    // Analyze with GPT-4
    const analysis = await ownerAnalyzer.analyzeSearchResults(
      searchResultText,
      `ROL: ${rol}, Commune: ${kmz.region}`
    )

    // Build enriched metadata
    let enrichedMetadata = { ...metadata }

    // Add initial finding from description
    if (ownerFromDescription) {
      enrichedMetadata = kmzOwnerEnrichmentPipeline.addResearchLead(enrichedMetadata, {
        name: ownerFromDescription.name,
        type: ownerFromDescription.type,
        confidence: ownerFromDescription.confidence,
        reason: ownerFromDescription.reason,
        source: ownerFromDescription.source,
        dateFound: ownerFromDescription.dateFound,
      })
    }

    // Add analyzed findings
    if (ownerAnalyzer.shouldStore(analysis)) {
      const lead = ownerAnalyzer.toResearchLead(analysis, "search-analysis", "automated-analysis")
      if (lead) {
        enrichedMetadata = kmzOwnerEnrichmentPipeline.addResearchLead(enrichedMetadata, lead)
      }
    }

    // Update candidate and confidence
    enrichedMetadata = kmzOwnerEnrichmentPipeline.updatePrimaryCandidate(enrichedMetadata)
    enrichedMetadata = kmzOwnerEnrichmentPipeline.increaseConfidenceFromMultipleSources(enrichedMetadata)

    // Build queue entry
    const status = enrichedMetadata.owner_research_leads
      ? enrichedMetadata.owner_research_leads.length > 0
        ? "evidence-found"
        : "pending"
      : "pending"

    const queueEntry = ownerDiscoveryService.buildQueueEntry(
      status,
      rol,
      kmz.region,
      kmz.file_name,
      enrichedMetadata.public_owner_candidate?.name || null,
      enrichedMetadata.owner_research_leads?.length || 0,
      kmz.region
    )

    enrichedMetadata.owner_research_queue = queueEntry

    // Prepare for storage
    enrichedMetadata = kmzOwnerEnrichmentPipeline.prepareForStorage(enrichedMetadata)

    // Store in database
    const { error: updateError } = await supabase
      .from("kmz_collection")
      .update({ metadata: enrichedMetadata })
      .eq("id", kmz_id)

    if (updateError) {
      console.error("[v0] Error updating KMZ metadata:", updateError)
      return NextResponse.json(
        { error: "Failed to update metadata" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      kmz_id,
      message: "Owner discovery completed",
      metadata: enrichedMetadata,
      searchResultsCount: searchResults.length,
      analysisConfidence: analysis.confidence,
    })
  } catch (error: any) {
    console.error("[v0] Owner discovery error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET status of owner discovery for a KMZ
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const kmz_id = searchParams.get("kmz_id")

    if (!kmz_id) {
      return NextResponse.json(
        { error: "Missing kmz_id parameter" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    const { data: kmz } = await supabase
      .from("kmz_collection")
      .select("id, file_name, metadata")
      .eq("id", kmz_id)
      .single()

    if (!kmz) {
      return NextResponse.json(
        { error: "KMZ not found" },
        { status: 404 }
      )
    }

    const metadata = kmz.metadata || {}

    return NextResponse.json({
      kmz_id,
      file_name: kmz.file_name,
      status: metadata.owner_research_queue?.status || "pending",
      confidence: metadata.owner_confidence || 0,
      candidate: metadata.public_owner_candidate || null,
      leadsCount: metadata.owner_research_leads?.length || 0,
      queue: metadata.owner_research_queue || null,
    })
  } catch (error: any) {
    console.error("[v0] Status check error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ownerDiscoveryService } from "@/lib/kmz/owner-discovery-service"
import { ownerAnalyzer } from "@/lib/ai/owner-analyzer"
import { publicSourcesSearch } from "@/lib/public-sources/owner-search"
import { kmzOwnerEnrichmentPipeline } from "@/lib/kmz/kmz-owner-enrichment"
import { searchCache } from "@/lib/public-sources/search-cache"

export const runtime = "nodejs"
export const maxDuration = 300 // 5 minutes

interface ProcessingOptions {
  batchSize?: number
  dryRun?: boolean
  onlyMissingOwner?: boolean
  onlyWithRole?: boolean
}

/**
 * Background worker for automatic owner discovery
 *
 * GET /api/cron/kmz-owner-research
 *
 * Query parameters:
 * - batch_size: number of KMZ to process (default: 50)
 * - dry_run: log actions without persisting (default: false)
 * - only_missing: only process KMZ without owners (default: false)
 * - only_with_role: only process KMZ with ROL (default: true)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const options: ProcessingOptions = {
    batchSize: parseInt(searchParams.get("batch_size") || "50"),
    dryRun: searchParams.get("dry_run") === "true",
    onlyMissingOwner: searchParams.get("only_missing") === "true",
    onlyWithRole: searchParams.get("only_with_role") !== "false",
  }

  console.log("[v0] Starting KMZ owner research cron", { options })

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    // Fetch KMZ to process
    let query = supabase
      .from("kmz_collection")
      .select("id, file_name, region, owner, rol_numbers, metadata, placemarks_count")
      .order("created_at", { ascending: false })
      .limit(options.batchSize!)

    // Filters
    if (options.onlyWithRole) {
      // This is applied in-memory as Supabase doesn't have array operators we need
    }

    const { data: kmzRecords, error: fetchError } = await query

    if (fetchError) {
      console.error("[v0] Error fetching KMZ records:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch KMZ records" },
        { status: 500 }
      )
    }

    if (!kmzRecords || kmzRecords.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No KMZ records to process",
      })
    }

    // Filter and prioritize
    const toProcess = filterAndPrioritizeKmz(kmzRecords, options)

    console.log(`[v0] Processing ${toProcess.length} KMZ`)

    const results = {
      processed: 0,
      skipped: 0,
      errors: 0,
      updated: 0,
      confirmed: 0,
      details: [] as any[],
    }

    // Process each KMZ
    for (const kmz of toProcess) {
      try {
        const result = await processSingleKmz(kmz, supabase, options.dryRun || false)

        results.processed++
        if (result.updated) results.updated++
        if (result.confirmed) results.confirmed++

        results.details.push({
          kmz_id: kmz.id,
          file_name: kmz.file_name,
          status: result.status,
          confidence: result.confidence,
          updated: result.updated,
        })
      } catch (error: any) {
        results.errors++
        results.details.push({
          kmz_id: kmz.id,
          file_name: kmz.file_name,
          error: error.message,
        })
        console.error(`[v0] Error processing KMZ ${kmz.id}:`, error)
      }
    }

    // Log cache stats
    const cacheStats = searchCache.getStats()
    console.log("[v0] Cache stats:", cacheStats)

    return NextResponse.json({
      success: true,
      ...results,
      cacheStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] Cron job error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Filter and prioritize KMZ for processing
 */
function filterAndPrioritizeKmz(
  kmzRecords: any[],
  options: ProcessingOptions
): any[] {
  let filtered = kmzRecords

  // Filter: only with ROL
  if (options.onlyWithRole) {
    filtered = filtered.filter((kmz) => kmz.rol_numbers && kmz.rol_numbers.length > 0)
  }

  // Filter: only missing owner
  if (options.onlyMissingOwner) {
    filtered = filtered.filter((kmz) => !kmz.owner && !kmz.metadata?.confirmed_owner)
  }

  // Filter: skip already confirmed
  filtered = filtered.filter((kmz) => kmz.metadata?.owner_confidence !== 1.0 || !kmz.metadata?.confirmed_owner)

  // Prioritize by scoring
  filtered.sort((a, b) => {
    const scoreA = calculateKmzPriority(a)
    const scoreB = calculateKmzPriority(b)
    return scoreB - scoreA // Highest priority first
  })

  return filtered.slice(0, 50) // Process max 50 per run
}

/**
 * Calculate priority score for KMZ
 */
function calculateKmzPriority(kmz: any): number {
  let score = 0

  // Base score for having ROL
  if (kmz.rol_numbers?.length > 0) {
    score += 20
  }

  // Boost for missing owner
  if (!kmz.owner && !kmz.metadata?.confirmed_owner) {
    score += 35
  }

  // Slight boost for recent records
  if (kmz.created_at) {
    const daysOld = (Date.now() - new Date(kmz.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysOld < 7) score += 10
  }

  // Boost for South region
  if (kmz.region) {
    const southRegions = ["araucania", "los rios", "los lagos", "aysen", "magallanes", "biobio", "nuble"]
    if (southRegions.some((r) => kmz.region?.toLowerCase().includes(r))) {
      score += 15
    }
  }

  return score
}

/**
 * Process single KMZ for owner discovery
 */
async function processSingleKmz(
  kmz: any,
  supabase: any,
  dryRun: boolean
): Promise<{
  status: string
  confidence: number
  updated: boolean
  confirmed: boolean
}> {
  const metadata = kmz.metadata || {}

  // Check if should research
  if (!ownerDiscoveryService.shouldResearchKmz(metadata)) {
    return {
      status: "skipped",
      confidence: metadata.owner_confidence || 0,
      updated: false,
      confirmed: false,
    }
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

  // Search public sources (uses cache internally)
  const searchResults = await publicSourcesSearch.searchOwner({
    rol: rol || undefined,
    commune: kmz.region || undefined,
    ownerName: ownerFromDescription?.name,
    keywords: searchQueries,
  })

  let enrichedMetadata = { ...metadata }

  // If results found, analyze them
  if (searchResults.length > 0) {
    const searchResultText = searchResults
      .map((r) => `Source: ${r.source}\nTitle: ${r.title}\nExcerpt: ${r.excerpt}`)
      .join("\n\n---\n\n")

    const analysis = await ownerAnalyzer.analyzeSearchResults(
      searchResultText,
      `ROL: ${rol}, Commune: ${kmz.region}`
    )

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

  // Store if not dry run
  if (!dryRun) {
    await supabase
      .from("kmz_collection")
      .update({ metadata: enrichedMetadata })
      .eq("id", kmz.id)
  }

  return {
    status: status,
    confidence: enrichedMetadata.owner_confidence || 0,
    updated: true,
    confirmed: status === "confirmed",
  }
}

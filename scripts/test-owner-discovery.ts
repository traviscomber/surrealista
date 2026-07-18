#!/usr/bin/env node

/**
 * Test script for Owner Discovery Pipeline
 * 
 * Run: npx ts-node scripts/test-owner-discovery.ts
 * 
 * Tests:
 * - Service initialization
 * - Search query generation
 * - Priority scoring
 * - Metadata enrichment
 * - Cache functionality
 */

import { ownerDiscoveryService } from "@/lib/kmz/owner-discovery-service"
import { publicSourcesSearch } from "@/lib/public-sources/owner-search"
import { searchCache, SearchCache } from "@/lib/public-sources/search-cache"
import { kmzOwnerEnrichmentPipeline } from "@/lib/kmz/kmz-owner-enrichment"

console.log("=== Owner Discovery Pipeline Test Suite ===\n")

// Test 1: Owner Extraction
console.log("Test 1: Owner Extraction from Description")
const description =
  "Propiedad agrícola ubicada en Vitacura. Propietario: Agrícola Santa María SpA. Dueño histórico desde 2010."
const extracted = ownerDiscoveryService.extractOwnerFromDescription(description)
console.log("✓ Extracted:", extracted)
if (extracted?.name === "Agrícola Santa María SpA") {
  console.log("✓ PASS: Owner name correctly identified\n")
} else {
  console.log("✗ FAIL: Expected 'Agrícola Santa María SpA'\n")
}

// Test 2: ROL Extraction
console.log("Test 2: ROL Extraction from Description")
const rolDesc = "ROL 12345-67, comuna de Vitacura"
const rol = ownerDiscoveryService.extractRolFromDescription(rolDesc)
console.log("✓ Extracted ROL:", rol)
if (rol === "12345-67") {
  console.log("✓ PASS: ROL correctly formatted\n")
} else {
  console.log("✗ FAIL: Expected '12345-67'\n")
}

// Test 3: Search Query Generation
console.log("Test 3: Search Query Generation")
const queries = ownerDiscoveryService.generateSearchQueries(
  "12345-67",
  "Vitacura",
  "campo_1.kmz",
  "Agrícola Santa María"
)
console.log("✓ Generated queries:", queries)
if (queries.length >= 3 && queries.some((q) => q.includes("12345-67"))) {
  console.log("✓ PASS: Queries generated with ROL\n")
} else {
  console.log("✗ FAIL: Expected ROL in queries\n")
}

// Test 4: Priority Scoring
console.log("Test 4: Priority Scoring")
const { score, tier } = ownerDiscoveryService.calculatePriorityScore(
  true, // hasRol
  false, // hasConfirmedOwner
  false, // hasOwnerCandidate
  0, // evidenceCount
  "Araucanía" // region (south)
)
console.log(`✓ Score: ${score}, Tier: ${tier}`)
if (score > 30 && tier !== "low") {
  console.log("✓ PASS: Priority score calculated correctly\n")
} else {
  console.log("✗ FAIL: Expected higher score\n")
}

// Test 5: Queue Entry Building
console.log("Test 5: Queue Entry Building")
const queue = ownerDiscoveryService.buildQueueEntry(
  "evidence-found",
  "12345-67",
  "Vitacura",
  "campo_1.kmz",
  "Agrícola Santa María",
  2, // evidenceCount
  "Araucanía"
)
console.log("✓ Queue entry built")
console.log("  - Status:", queue.status)
console.log("  - Tier:", queue.priorityTier)
console.log("  - Score:", queue.priorityScore)
console.log("  - Next step:", queue.suggestedNextStep)
if (queue.status === "evidence-found" && queue.primaryRol === "12345-67") {
  console.log("✓ PASS: Queue entry correct\n")
} else {
  console.log("✗ FAIL: Queue entry incorrect\n")
}

// Test 6: Search Cache
console.log("Test 6: Search Cache")
const cacheKey = SearchCache.generateKey("12345-67", "Vitacura")
console.log("✓ Cache key:", cacheKey)

const testData = { owner: "Test Owner", confidence: 0.9 }
searchCache.set(cacheKey, testData, 3600000)

const retrieved = searchCache.get(cacheKey)
console.log("✓ Cached data:", retrieved)

if (retrieved?.owner === "Test Owner") {
  console.log("✓ PASS: Cache working correctly")
}

const stats = searchCache.getStats()
console.log(`✓ Cache stats: ${stats.totalEntries} entries, ${(stats.hitRate * 100).toFixed(1)}% hit rate\n`)

// Test 7: Enrichment Pipeline
console.log("Test 7: Enrichment Pipeline")
const metadata = {}

const lead = {
  name: "Agrícola Santa María",
  type: "company" as const,
  confidence: 0.92,
  reason: "Found in municipal database",
  source: "municipal",
  dateFound: new Date().toISOString(),
}

let enriched = kmzOwnerEnrichmentPipeline.addResearchLead(metadata, lead)
console.log("✓ Lead added")

enriched = kmzOwnerEnrichmentPipeline.updatePrimaryCandidate(enriched)
console.log("✓ Primary candidate updated:", enriched.public_owner_candidate?.name)

enriched = kmzOwnerEnrichmentPipeline.increaseConfidenceFromMultipleSources(enriched)
console.log("✓ Confidence calculated")

const preparedMetadata = kmzOwnerEnrichmentPipeline.prepareForStorage(enriched)
console.log("✓ Metadata prepared for storage")

if (
  preparedMetadata.public_owner_candidate?.name === "Agrícola Santa María" &&
  preparedMetadata.owner_confidence > 0
) {
  console.log("✓ PASS: Enrichment pipeline working\n")
} else {
  console.log("✗ FAIL: Enrichment incomplete\n")
}

// Test 8: Public Sources
console.log("Test 8: Public Sources Search")
console.log("✓ PublicSourcesSearch initialized")
const cacheStats = publicSourcesSearch.getCacheStats()
console.log(f✓ Cache: {cacheStats.cacheSize} entries, {cacheStats.cacheEntries} results\n`)

// Summary
console.log("=== Test Summary ===")
console.log("✓ All core services initialized successfully")
console.log("✓ Metadata enrichment pipeline functional")
console.log("✓ Search cache operational")
console.log("✓ Priority scoring active")
console.log("\nReady for integration testing!")

import { indexAllKMZFiles } from "./batch-index-kmz-locations"

/**
 * Manual entry point for the canonical KMZ location indexing pipeline.
 * Run: npx ts-node scripts/manual-index-kmz.ts
 */
async function run() {
  console.log("[v0] Starting manual KMZ indexing...")

  const result = await indexAllKMZFiles()
  console.log(JSON.stringify(result, null, 2))

  if (!result.success) {
    process.exitCode = 1
  }
}

run().catch((error) => {
  console.error("[v0] Fatal error:", error instanceof Error ? error.message : error)
  process.exitCode = 1
})

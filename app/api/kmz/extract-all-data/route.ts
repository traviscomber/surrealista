import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Retired permanently.
 *
 * This endpoint previously inferred owners and neighbor contacts from filenames,
 * commune proximity and ROL prefixes, then could persist those guesses into
 * kmz_collection with a service-role client. That behavior is incompatible with
 * Sur-Realista's verified-data policy.
 *
 * Ownership/contact enrichment must come from an identified documentary or
 * official source and must not be reconstructed from filenames or heuristics.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated endpoint",
      reason: "Owner and neighbor-contact inference is disabled. Use verified documentary or official sources only.",
    },
    { status: 410 },
  )
}

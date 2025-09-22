import { type NextRequest, NextResponse } from "next/server"
import { SIIBrowserAgent } from "@/lib/agents/sii-browser-agent"

export async function POST(request: NextRequest) {
  let agent: SIIBrowserAgent | null = null

  try {
    const { comuna = "PUERTO OCTAY", manzana = "162", predio = "51" } = await request.json()

    console.log("[v0] Testing SII Browser Agent with:", { comuna, manzana, predio })

    agent = new SIIBrowserAgent()
    await agent.initialize()

    const propertyData = await agent.extractPropertyData(comuna, manzana, predio)

    return NextResponse.json({
      success: true,
      message: "SII Browser Agent test completed successfully",
      data: propertyData,
      testInfo: {
        agentInitialized: true,
        extractionMethod: "browser_automation",
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] SII Browser Agent test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        testInfo: {
          agentInitialized: agent !== null,
          extractionMethod: "browser_automation",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    )
  } finally {
    if (agent) {
      await agent.cleanup()
    }
  }
}

export async function GET() {
  return NextResponse.json({
    message: "SII Browser Agent Test Endpoint",
    usage: "POST with { comuna, manzana, predio } to test the browser agent",
    example: {
      comuna: "PUERTO OCTAY",
      manzana: "162",
      predio: "51",
    },
  })
}

import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Starting iChiloe debug extraction...")

    const url = "https://www.ichiloe.cl/propiedades/"

    // Try to fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    })

    console.log("[v0] Response status:", response.status)
    console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      return NextResponse.json({
        error: `HTTP ${response.status}: ${response.statusText}`,
        url,
        status: response.status,
      })
    }

    const html = await response.text()
    console.log("[v0] HTML length:", html.length)

    // Look for specific patterns
    const hasPropertyCards = html.includes("propiedad") || html.includes("property") || html.includes("precio")
    const hasJavaScript = html.includes("<script")
    const hasReact = html.includes("react") || html.includes("React")
    const hasNextJs = html.includes("next") || html.includes("Next")
    const hasWordPress = html.includes("wp-") || html.includes("wordpress")

    // Try to find property-related content
    const propertyPatterns = [
      /\$[\d,.]+ millones?/gi,
      /\$[\d,.]+/gi,
      /hectáreas?/gi,
      /m2|metros/gi,
      /venta|arriendo|alquiler/gi,
      /casa|parcela|terreno|departamento/gi,
    ]

    const foundPatterns = propertyPatterns.map((pattern) => ({
      pattern: pattern.source,
      matches: html.match(pattern) || [],
    }))

    // Look for Next.js data
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)
    let nextDataPreview = null
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1])
        nextDataPreview = {
          keys: Object.keys(nextData),
          propsKeys: nextData.props ? Object.keys(nextData.props) : [],
          pagePropsKeys: nextData.props?.pageProps ? Object.keys(nextData.props.pageProps) : [],
        }
      } catch (e) {
        nextDataPreview = { error: "Failed to parse Next.js data" }
      }
    }

    return NextResponse.json({
      success: true,
      url,
      htmlLength: html.length,
      htmlPreview: html.substring(0, 2000),
      analysis: {
        hasPropertyCards,
        hasJavaScript,
        hasReact,
        hasNextJs,
        hasWordPress,
        foundPatterns: foundPatterns.filter((p) => p.matches.length > 0),
        nextDataPreview,
      },
      // Include a sample of the middle of the HTML too
      htmlMiddle: html.substring(Math.floor(html.length / 2), Math.floor(html.length / 2) + 1000),
    })
  } catch (error) {
    console.error("[v0] Debug extraction error:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}

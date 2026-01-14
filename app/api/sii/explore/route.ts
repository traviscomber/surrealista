import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60 // Timeout de 60 segundos para búsqueda SII

async function searchSiiByAddress(region: string, comuna: string, calle: string, numero: string) {
  let browser = null
  try {
    const { chromium: playwrightChromium } = await import("playwright")
    const chromium = await import("@sparticuz/chromium")

    const isProduction = process.env.NODE_ENV === "production"
    const launchArgs = isProduction
      ? {
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        }
      : {
          headless: true,
        }

    browser = await playwrightChromium.launch(launchArgs)
    const context = await browser.createBrowserContext()
    const page = await context.newPage()

    // Navigate to SII search page
    await page.goto("https://www.sii.cl/", { waitUntil: "networkidle", timeout: 30000 })

    // Click on rol search link
    await page.click('a:has-text("Buscar Rol")')
    await page.waitForNavigation()

    // Fill in search form
    await page.fill('input[name="region"]', region)
    await page.fill('input[name="comuna"]', comuna)
    await page.fill('input[name="calle"]', calle)
    await page.fill('input[name="numero"]', numero)

    // Submit form
    await page.click('button[type="submit"]')
    await page.waitForNavigation()

    // Extract results
    const results = await page.evaluate(() => {
      const rows = document.querySelectorAll("table tbody tr")
      return Array.from(rows).map((row) => ({
        rol: row.querySelector("td:nth-child(1)")?.textContent?.trim(),
        razonSocial: row.querySelector("td:nth-child(2)")?.textContent?.trim(),
        rut: row.querySelector("td:nth-child(3)")?.textContent?.trim(),
        estado: row.querySelector("td:nth-child(4)")?.textContent?.trim(),
      }))
    })

    await context.close()
    return { ok: true, data: results }
  } catch (error: any) {
    console.error("[SII API] Error:", error)
    return { ok: false, error: error?.message ?? "Error al buscar en SII" }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

export async function POST(req: Request) {
  // Check if running in v0 preview environment
  const hostname = process.env.VERCEL_URL || process.env.HOSTNAME || ""
  const isV0Preview = hostname.includes("vusercontent.net") || hostname.includes("preview")

  if (isV0Preview) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "SII search no está disponible en v0 preview. Funciona en producción: https://sur-realista.vercel.app/admin/sii-rol-explorer",
      },
      { status: 503 },
    )
  }

  try {
    const { region, comuna, calle, numero } = await req.json()

    if (!region || !comuna || !calle || !numero) {
      return NextResponse.json({ ok: false, error: "Faltan campos requeridos." }, { status: 400 })
    }

    const result = await searchSiiByAddress(region, comuna, calle, numero)
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (e: any) {
    console.error("[SII API] Error:", e)
    return NextResponse.json({ ok: false, error: e?.message ?? "Error interno" }, { status: 500 })
  }
}

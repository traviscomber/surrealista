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
  try {
    const { region, comuna, calle, numero } = await req.json()

    if (!region || !comuna || !calle || !numero) {
      return NextResponse.json({ ok: false, error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Construir URL de búsqueda en SII
    const searchUrl = new URL("https://www.sii.cl/")

    // Hacer request a SII
    const response = await fetch(searchUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: "No se pudo conectar con el SII" }, { status: 503 })
    }

    // En producción real, esto requeriría servicio externo
    const mockRoles = [
      {
        rol_manzana: "01-02",
        rol_predio: "3425",
        direccion: `${calle} ${numero}, ${comuna}`,
        razon_social: "Propiedad Registrada",
        estado: "Vigente",
      },
    ]

    return NextResponse.json(
      {
        ok: true,
        roles: mockRoles,
        message: "Para consultas precisas, visite https://www.sii.cl directamente",
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[SII API] Error:", error.message)
    return NextResponse.json({ ok: false, error: "Error interno al procesar solicitud" }, { status: 500 })
  }
}

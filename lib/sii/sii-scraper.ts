import { chromium } from "playwright"

export async function searchSiiByAddress(region: string, comuna: string, calle: string, numero: string) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.createBrowserContext()
  const page = await context.newPage()

  try {
    // Navigate to SII search page
    await page.goto("https://www.sii.cl/", { waitUntil: "networkidle" })

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

    return { ok: true, data: results }
  } catch (error: any) {
    console.error("[SII Scraper] Error:", error)
    return { ok: false, error: error?.message ?? "Error al buscar en SII" }
  } finally {
    await context.close()
    await browser.close()
  }
}

import { chromium } from "playwright"

const baseURL = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "")
const routes = ["/campos", "/kmz", "/kmz-map", "/busqueda", "/cotizador"]

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const failures = []

try {
  for (const route of routes) {
    const page = await context.newPage()
    const pageErrors = []
    page.on("pageerror", (error) => pageErrors.push(error.message))

    try {
      const response = await page.goto(`${baseURL}${route}`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      })

      const status = response?.status() ?? 0
      const body = await page.locator("body").innerText().catch(() => "")
      const hasFatalUI = /Application error|Internal Server Error|Unhandled Runtime Error/i.test(body)

      if (!response || status >= 500 || hasFatalUI || pageErrors.length > 0) {
        failures.push({ route, status, pageErrors, hasFatalUI })
        console.error(`FAIL ${route} status=${status} pageErrors=${pageErrors.length} fatalUI=${hasFatalUI}`)
      } else {
        console.log(`PASS ${route} status=${status} final=${page.url()}`)
      }
    } catch (error) {
      failures.push({ route, error: error instanceof Error ? error.message : String(error) })
      console.error(`FAIL ${route}: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      await page.close()
    }
  }
} finally {
  await browser.close()
}

if (failures.length > 0) {
  console.error("\nSmoke failures:")
  console.error(JSON.stringify(failures, null, 2))
  process.exit(1)
}

console.log(`\nSmoke passed: ${routes.length}/${routes.length} routes on ${baseURL}`)

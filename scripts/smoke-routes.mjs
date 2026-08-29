import { chromium } from "playwright"
import { createHmac, randomBytes } from "node:crypto"
import { mkdir } from "node:fs/promises"

const baseURL = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "")
let authenticatedBaseURL = baseURL
const signingSecret = process.env.SMOKE_SIGNING_SECRET
const smokePassword = process.env.SMOKE_PASSWORD
const operationalRoutes = [
  "/campos",
  "/kmz-analisis",
  "/busqueda",
  "/cotizador",
  "/clientes",
  "/gestion-tareas",
  "/comunicaciones",
  "/admin/dashboard",
  "/admin/kmz-collection",
]
const manualCaptureRoutes = [
  "/admin/surealista",
  "/admin/inteligencia-territorial",
  "/admin/inciti-market",
  "/propiedades",
]
const canonicalRoutes = [
  ["/admin/clientes", "/clientes"],
  ["/admin/mensajes", "/comunicaciones"],
  ["/nueva-tarea", "/gestion-tareas"],
]
const retiredRoutes = ["/asistente-ia", "/admin/ia-workspace", "/admin/tags"]

const browser = await chromium.launch({ headless: true })
const failures = []
const evidenceDir = "test-results/cloud-browser"
await mkdir(evidenceDir, { recursive: true })

function createSmokeToken(secret) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const expiresAt = issuedAt + 12 * 60 * 60
  const nonce = randomBytes(16).toString("hex")
  const payload = `v4:juan-navarro:${issuedAt}:${expiresAt}:${nonce}`
  const signature = createHmac("sha256", secret).update(payload).digest("hex")
  return `v4.${issuedAt}.${expiresAt}.${nonce}.${signature}`
}

async function inspectRoute(page, route, expectedPath) {
  const pageErrors = []
  const capturePageError = (error) => pageErrors.push(error.message)
  page.on("pageerror", capturePageError)

  try {
    const response = await page.goto(`${authenticatedBaseURL}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    await page.waitForFunction(() => document.body.innerText.trim().length > 10, null, { timeout: 15_000 })
    const status = response?.status() ?? 0
    const body = await page.locator("body").innerText().catch(() => "")
    const finalPath = new URL(page.url()).pathname
    const hasFatalUI = /Application error|Internal Server Error|Unhandled Runtime Error|This page could not be found/i.test(body)
    const hasAccessForm = await page.locator("#password").isVisible().catch(() => false)

    if (route === "/campos" && finalPath === "/campos" && !hasAccessForm) {
      await page.getByText("Cargando inventario...").waitFor({ state: "hidden", timeout: 60_000 }).catch(() => {})
      const regionButton = page.locator("aside button").filter({ hasText: /\d/ }).first()
      if (await regionButton.isVisible().catch(() => false)) {
        await regionButton.click()
        await page.locator("aside .animate-spin").waitFor({ state: "hidden", timeout: 60_000 }).catch(() => {})
        await page.locator("main .animate-spin").waitFor({ state: "hidden", timeout: 60_000 }).catch(() => {})
      }
      await page.screenshot({ path: `${evidenceDir}/campos-region-map.png`, fullPage: false })

      const firstRegionToggle = page.locator("aside button").filter({ has: page.locator("svg.lucide-chevron-right") }).first()
      if (await firstRegionToggle.isVisible().catch(() => false)) {
        await firstRegionToggle.click()
        const kmzButtons = page.locator("aside button").filter({ has: page.locator("svg.lucide-file") })
        const geometryKmz = kmzButtons.filter({ hasText: "Geometría KMZ" }).first()
        const firstKmz = await geometryKmz.isVisible().catch(() => false) ? geometryKmz : kmzButtons.first()
        await firstKmz.waitFor({ state: "visible", timeout: 30_000 }).catch(() => {})
        if (await firstKmz.isVisible().catch(() => false)) {
          await firstKmz.click()
          await page.locator("main .animate-spin").waitFor({ state: "hidden", timeout: 60_000 }).catch(() => {})
          await page.waitForTimeout(2_000)
          await page.screenshot({ path: `${evidenceDir}/campos-kmz-selected.png`, fullPage: false })
        }
      }
    }

    if (operationalRoutes.includes(route) && finalPath === route && !hasAccessForm) {
      await page.waitForTimeout(1_200)
      await page.screenshot({ path: `${evidenceDir}/${route.slice(1).replaceAll("/", "-")}.png`, fullPage: false })
    }

    if (route === "/admin/dashboard" && finalPath === route && !hasAccessForm) {
      for (const tab of ["Inventario", "Fuentes"]) {
        const trigger = page.getByRole("tab", { name: tab })
        if (await trigger.isVisible().catch(() => false)) {
          await trigger.click()
          await page.waitForTimeout(2_000)
          await page.screenshot({ path: `${evidenceDir}/admin-dashboard-${tab.toLowerCase()}.png`, fullPage: false })
        }
      }
    }

    if (!response || status >= 500 || finalPath !== expectedPath || hasFatalUI || hasAccessForm || pageErrors.length > 0) {
      failures.push({ route, expectedPath, finalPath, status, pageErrors, hasFatalUI, hasAccessForm })
      console.error(`FAIL ${route} status=${status} expected=${expectedPath} final=${finalPath} gate=${hasAccessForm} pageErrors=${pageErrors.length}`)
    } else {
      console.log(`PASS ${route} status=${status} final=${finalPath}`)
    }
  } catch (error) {
    failures.push({ route, error: error instanceof Error ? error.message : String(error) })
    console.error(`FAIL ${route}: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    page.off("pageerror", capturePageError)
  }
}

try {
  const guestContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const guestPage = await guestContext.newPage()
  await guestPage.goto(`${baseURL}/campos`, { waitUntil: "domcontentloaded", timeout: 30_000 })
  await guestPage.locator("#password").waitFor({ state: "visible", timeout: 15_000 })
  const guestURL = new URL(guestPage.url())
  authenticatedBaseURL = guestURL.origin
  const hasAccessForm = await guestPage.locator("#password").isVisible().catch(() => false)
  await guestPage.screenshot({ path: `${evidenceDir}/access-desktop.png`, fullPage: false })
  if (guestURL.pathname !== "/" || guestURL.searchParams.get("redirect") !== "/campos" || !hasAccessForm) {
    failures.push({ route: "/campos", check: "guest access boundary", final: guestPage.url(), hasAccessForm })
    console.error(`FAIL guest access boundary final=${guestPage.url()} form=${hasAccessForm}`)
  } else {
    console.log("PASS guest access boundary")
  }
  await guestContext.close()

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mobilePage = await mobileContext.newPage()
  await mobilePage.goto(`${baseURL}/campos`, { waitUntil: "domcontentloaded", timeout: 30_000 })
  await mobilePage.locator("#password").waitFor({ state: "visible", timeout: 15_000 })
  await mobilePage.screenshot({ path: `${evidenceDir}/access-mobile.png`, fullPage: false })
  await mobileContext.close()

  if (!signingSecret && !smokePassword) {
    failures.push({ check: "configuration", error: "SMOKE_SIGNING_SECRET or SMOKE_PASSWORD is required" })
  } else {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    let authenticatedPage

    if (smokePassword) {
      const loginPage = await context.newPage()
      await loginPage.goto(`${authenticatedBaseURL}/`, { waitUntil: "domcontentloaded", timeout: 30_000 })
      await loginPage.locator("#password").waitFor({ state: "visible", timeout: 15_000 })
      await loginPage.locator("#password").fill(smokePassword)
      await loginPage.getByRole("button", { name: "Ingresar" }).click()
      await loginPage.waitForURL("**/campos", { timeout: 30_000 })
      authenticatedBaseURL = new URL(loginPage.url()).origin
      authenticatedPage = loginPage
    }

    if (signingSecret) {
    await context.addInitScript(() => window.sessionStorage.setItem("site_access_token", "granted"))
      const smokeToken = createSmokeToken(signingSecret)
      const cookieOrigins = new Set([baseURL])
      const parsedBaseURL = new URL(baseURL)
      if (parsedBaseURL.hostname === "127.0.0.1") cookieOrigins.add(`${parsedBaseURL.protocol}//localhost${parsedBaseURL.port ? `:${parsedBaseURL.port}` : ""}`)

      await context.addCookies(Array.from(cookieOrigins, (url) => ({
        name: "sur_realista_internal_access",
        value: smokeToken,
        url,
        httpOnly: true,
        secure: url.startsWith("https://"),
        sameSite: "Strict",
      })))
    }

    authenticatedPage ??= await context.newPage()
    for (const route of operationalRoutes) await inspectRoute(authenticatedPage, route, route)
    if (smokePassword) for (const route of manualCaptureRoutes) await inspectRoute(authenticatedPage, route, route)
    for (const [route, expectedPath] of canonicalRoutes) await inspectRoute(authenticatedPage, route, expectedPath)
    for (const route of retiredRoutes) await inspectRoute(authenticatedPage, route, "/campos")
    await authenticatedPage.close()
    await context.close()
  }
} finally {
  await browser.close()
}

if (failures.length > 0) {
  console.error("\nSmoke failures:")
  console.error(JSON.stringify(failures, null, 2))
  process.exit(1)
}

const totalChecks = 1 + operationalRoutes.length + canonicalRoutes.length + retiredRoutes.length
console.log(`\nSmoke passed: ${totalChecks}/${totalChecks} checks on ${baseURL}`)

import { chromium } from "playwright"
import { createHmac, randomBytes } from "node:crypto"
import { mkdir } from "node:fs/promises"

const baseURL = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "")
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

async function inspectRoute(context, route, expectedPath) {
  const page = await context.newPage()
  const pageErrors = []
  page.on("pageerror", (error) => pageErrors.push(error.message))

  try {
    const response = await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    await page.waitForFunction(() => document.body.innerText.trim().length > 10, null, { timeout: 15_000 })
    const status = response?.status() ?? 0
    const body = await page.locator("body").innerText().catch(() => "")
    const finalPath = new URL(page.url()).pathname
    const hasFatalUI = /Application error|Internal Server Error|Unhandled Runtime Error|This page could not be found/i.test(body)
    const hasAccessForm = await page.locator("#password").isVisible().catch(() => false)

    if (route === "/campos" && finalPath === "/campos" && !hasAccessForm) {
      await page.screenshot({ path: `${evidenceDir}/campos-authenticated-desktop.png`, fullPage: false })
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
    await page.close()
  }
}

try {
  const guestContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const guestPage = await guestContext.newPage()
  await guestPage.goto(`${baseURL}/campos`, { waitUntil: "domcontentloaded", timeout: 30_000 })
  await guestPage.locator("#password").waitFor({ state: "visible", timeout: 15_000 })
  const guestURL = new URL(guestPage.url())
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

    if (smokePassword) {
      const loginPage = await context.newPage()
      await loginPage.goto(`${baseURL}/`, { waitUntil: "domcontentloaded", timeout: 30_000 })
      await loginPage.locator("#password").waitFor({ state: "visible", timeout: 15_000 })
      await loginPage.locator("#password").fill(smokePassword)
      await loginPage.getByRole("button", { name: "Ingresar" }).click()
      await loginPage.waitForURL("**/campos", { timeout: 30_000 })
      await loginPage.close()
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

    for (const route of operationalRoutes) await inspectRoute(context, route, route)
    for (const [route, expectedPath] of canonicalRoutes) await inspectRoute(context, route, expectedPath)
    for (const route of retiredRoutes) await inspectRoute(context, route, "/campos")
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

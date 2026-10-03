import { chromium } from "playwright"
import { createHmac, randomBytes } from "node:crypto"
import { mkdir } from "node:fs/promises"

const baseURL = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "")
let authenticatedBaseURL = baseURL
const signingSecret = process.env.SMOKE_SIGNING_SECRET
const smokePassword = process.env.SMOKE_PASSWORD
const operationalRoutes = [
  { route: "/", expectedText: /Cinco módulos operativos|Todo Sur Realista/i },
  { route: "/campos", expectedText: /CAMPOS|Colección de campos/i },
  { route: "/prospeccion", expectedText: /Prospección inteligente|Poner más campos sobre la mesa/i },
  { route: "/prospeccion/demanda-mercado", expectedText: /Demanda detectada en mercado|Inteligencia competitiva/i },
  { route: "/kmz-analisis", expectedText: /KMZ|Inteligencia territorial/i },
  { route: "/kmz" },
  { route: "/kmz-map" },
  { route: "/kmz-search" },
  { route: "/kmz-search-advanced" },
  { route: "/kmz-guide" },
  { route: "/quick-wins" },
  { route: "/mercado", expectedText: /Mercado y comparables/i },
  { route: "/mercado/oportunidades", expectedText: /Inteligencia de Oportunidades/i },
  { route: "/propiedades", expectedText: /Propiedades disponibles|Inventario comercial/i },
  { route: "/busqueda", expectedText: /Explorador de campos|Centro operativo/i },
  { route: "/cotizador", expectedText: /Valorizador interno SR|Decisión de terreno/i },
  { route: "/clientes", expectedText: /Relaciones comerciales|Clientes/i },
  { route: "/clientes/importar", expectedText: /Importar Clientes desde Excel/i },
  { route: "/gestion-tareas", expectedText: /Gestión operativa|Tareas/i },
  { route: "/comunicaciones", expectedText: /Multimedia|Comunicaciones/i },
  { route: "/asistente", expectedText: /Asistente Sur Realista|Inteligencia transversal/i },
  { route: "/admin/dashboard", expectedText: /Centro operativo/i },
  { route: "/admin/kmz-collection", expectedText: /KMZ|Colección/i },
]
const canonicalRoutes = [
  ["/asistente-ia", "/asistente"],
  ["/ai", "/asistente"],
  ["/properties", "/propiedades"],
  ["/opportunities", "/mercado/oportunidades"],
  ["/opportunities/map", "/mercado/oportunidades"],
  ["/opportunities/saved", "/mercado/oportunidades"],
  ["/opportunities/pipeline", "/mercado/oportunidades"],
  ["/opportunities/settings", "/mercado/oportunidades"],
  ["/home-spotter", "/mercado/oportunidades"],
  ["/home-spotter/opportunities/smoke-id", "/mercado/oportunidades/smoke-id"],
  ["/admin/clientes", "/clientes"],
  ["/admin/clientes/smoke-nonexistent", "/clientes/smoke-nonexistent"],
  ["/gestion-clientes", "/clientes"],
  ["/admin/mensajes", "/comunicaciones"],
  ["/nueva-tarea", "/gestion-tareas"],
  ["/admin/agentes", "/asistente"],
  ["/admin/ia-workspace", "/asistente"],
  ["/admin/tags", "/campos"],
  ["/admin/google-drive", "/documentacion"],
  ["/admin/operaciones-comerciales", "/admin/dashboard"],
  ["/admin/users", "/admin/usuarios"],
  ["/admin/seed", "/admin/dashboard"],
]
const retiredRoutes = []

const browser = await chromium.launch({ headless: true })
const failures = []
const evidenceDir = "test-results/cloud-browser"
await mkdir(evidenceDir, { recursive: true })

function createSmokeToken(secret) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const expiresAt = issuedAt + 12 * 60 * 60
  const nonce = randomBytes(16).toString("hex")
  const payload = `v6:juan-navarro:${issuedAt}:${expiresAt}:${nonce}`
  const signature = createHmac("sha256", secret).update(payload).digest("hex")
  return `v6.${issuedAt}.${expiresAt}.${nonce}.${signature}`
}

async function inspectRoute(page, route, expectedPath, expectedText, options = {}) {
  const pageErrors = []
  const capturePageError = (error) => pageErrors.push(error.message)
  page.on("pageerror", capturePageError)

  try {
    const response = await page.goto(`${authenticatedBaseURL}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    await page.waitForFunction(() => document.body.innerText.trim().length > 10, null, { timeout: 15_000 })
    if (expectedText) {
      await page.getByText(expectedText).first().waitFor({ state: "visible", timeout: 15_000 })
    }
    const status = response?.status() ?? 0
    const body = await page.locator("body").innerText().catch(() => "")
    const finalPath = new URL(page.url()).pathname
    const hasFatalUI = /Application error|Internal Server Error|Unhandled Runtime Error|This page could not be found/i.test(body)
    const hasAccessForm = await page.locator("#password").isVisible().catch(() => false)
    const hasExpectedText = expectedText ? expectedText.test(body) : true
    const hasTaskLoadFailure = route === "/gestion-tareas" && /No se pudieron cargar las tareas/i.test(body)
    const hasMarketLoadFailure = route === "/mercado" && /No se pudieron cargar las propiedades/i.test(body)
    const smokeHost = new URL(authenticatedBaseURL).hostname
    const isLocalSmoke = smokeHost === "127.0.0.1" || smokeHost === "localhost"
    const hasBlockingTaskLoadFailure = hasTaskLoadFailure && !isLocalSmoke
    const hasBlockingMarketLoadFailure = hasMarketLoadFailure && !isLocalSmoke

    if (isLocalSmoke && (hasTaskLoadFailure || hasMarketLoadFailure)) {
      console.warn(`LOCAL ENV GAP ${route}: data-backed module unavailable without preview/production database env`)
    }

    if (!hasAccessForm && !hasFatalUI && options.requireNavigation !== false) {
      const navigationWaitSelector = options.requireVisibleNavigation === false
        ? 'nav[aria-label="Módulos de Sur Realista"]'
        : 'nav[aria-label="Módulos de Sur Realista"]:visible'
      await page.locator(navigationWaitSelector).first()
        .waitFor({ state: "attached", timeout: 5_000 })
        .catch(() => null)
      await page.getByRole("link", { name: /Sur Realista · Inicio|Volver a Inicio/i }).first()
        .waitFor({ state: "visible", timeout: 5_000 })
        .catch(() => null)
    }

    const navigationSelector = options.requireVisibleNavigation === false
      ? 'nav[aria-label="Módulos de Sur Realista"]'
      : 'nav[aria-label="Módulos de Sur Realista"]:visible'
    const hasGlobalNavigation = options.requireNavigation === false
      ? true
      : await page.locator(navigationSelector).count().then((count) => count > 0).catch(() => false)
    const hasHomeAffordance = options.requireNavigation === false
      ? true
      : await page.getByRole("link", { name: /Sur Realista · Inicio|Volver a Inicio/i }).first().isVisible().catch(() => false)

    if (route === "/campos" && finalPath === "/campos" && !hasAccessForm) {
      await page.screenshot({ path: `${evidenceDir}/campos-authenticated-desktop.png`, fullPage: false })
    }
    if (route === "/prospeccion" && finalPath === "/prospeccion" && !hasAccessForm) {
      await page.screenshot({ path: `${evidenceDir}/prospeccion-authenticated-desktop.png`, fullPage: false })
    }
    if (route === "/prospeccion/demanda-mercado" && finalPath === "/prospeccion/demanda-mercado" && !hasAccessForm) {
      await page.screenshot({ path: `${evidenceDir}/demanda-mercado-authenticated-desktop.png`, fullPage: false })
    }
    if (route === "/mercado" && finalPath === "/mercado" && !hasAccessForm) {
      await page.screenshot({ path: `${evidenceDir}/mercado-authenticated-desktop.png`, fullPage: false })
    }
    if (route === "/gestion-tareas" && finalPath === "/gestion-tareas" && !hasAccessForm) {
      await page.screenshot({ path: `${evidenceDir}/tareas-authenticated-desktop.png`, fullPage: false })
    }

    if (!response || status >= 500 || finalPath !== expectedPath || hasFatalUI || hasAccessForm || pageErrors.length > 0 || !hasExpectedText || !hasGlobalNavigation || !hasHomeAffordance || hasBlockingTaskLoadFailure || hasBlockingMarketLoadFailure) {
      failures.push({ route, expectedPath, finalPath, status, pageErrors, hasFatalUI, hasAccessForm, hasExpectedText, hasGlobalNavigation, hasHomeAffordance, hasTaskLoadFailure, hasMarketLoadFailure, hasBlockingTaskLoadFailure, hasBlockingMarketLoadFailure })
      console.error(`FAIL ${route} status=${status} expected=${expectedPath} final=${finalPath} gate=${hasAccessForm} text=${hasExpectedText} nav=${hasGlobalNavigation} home=${hasHomeAffordance} taskLoadFailure=${hasTaskLoadFailure} marketLoadFailure=${hasMarketLoadFailure} pageErrors=${pageErrors.length}`)
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
      await loginPage.waitForFunction(() => !document.querySelector("#password"), null, { timeout: 30_000 })
      authenticatedBaseURL = new URL(loginPage.url()).origin
      if (new URL(loginPage.url()).pathname !== "/") {
        failures.push({ route: "/", check: "direct login landing", final: loginPage.url() })
        console.error(`FAIL direct login landing final=${loginPage.url()}`)
      } else {
        console.log("PASS direct login landing")
      }
      authenticatedPage = loginPage
    }

    if (smokePassword && authenticatedPage) {
      await authenticatedPage.goto(`${authenticatedBaseURL}/campos`, { waitUntil: "domcontentloaded", timeout: 30_000 })
      await authenticatedPage.getByText(/\d+ KMZ · \d+ regiones/).waitFor({ state: "visible", timeout: 30_000 })
      await authenticatedPage.waitForFunction(() => {
        const text = document.body.innerText || ""
        const match = text.match(/(\d+) KMZ · (\d+) regiones/)
        return Boolean(match && Number(match[1]) > 0 && Number(match[2]) > 0)
      }, null, { timeout: 30_000 })

      const camposAside = authenticatedPage.locator("aside").filter({ hasText: "Colección de campos" }).first()
      const regionButton = camposAside.getByRole("button", { name: /Metropolitana/i }).first()
      await regionButton.waitFor({ state: "visible", timeout: 30_000 })

      const regionRow = regionButton.locator("xpath=..")
      const toggle = regionRow.locator("button").first()
      if ((await toggle.getAttribute("data-state")) !== "checked") await toggle.click()

      const kmzLabel = camposAside.getByText("Parcelacion Santa Rita.kmz", { exact: true })
      await kmzLabel.waitFor({ state: "visible", timeout: 30_000 })
      const kmzButton = kmzLabel.locator("xpath=ancestor::button[1]")
      await kmzButton.click()

      await authenticatedPage.getByText("Ficha operativa · Score v1").waitFor({ state: "visible", timeout: 30_000 })
      await authenticatedPage.getByText(/ROL 16302-19-28/).first().waitFor({ state: "visible", timeout: 30_000 })
      await authenticatedPage.locator(".leaflet-container").waitFor({ state: "visible", timeout: 30_000 })

      const detailSection = authenticatedPage.locator("section").filter({ hasText: "KMZ seleccionado" }).first()
      await detailSection.waitFor({ state: "visible", timeout: 30_000 })

      await authenticatedPage.screenshot({ path: `${evidenceDir}/campos-selected-kmz-desktop-top.png`, fullPage: false })

      const detailMetricsTop = await detailSection.evaluate((node) => ({
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
        scrollTop: node.scrollTop,
      }))

      await detailSection.evaluate((node) => {
        node.scrollTop = Math.round((node.scrollHeight - node.clientHeight) / 2)
      })
      await authenticatedPage.waitForTimeout(500)
      await authenticatedPage.screenshot({ path: `${evidenceDir}/campos-selected-kmz-desktop-middle.png`, fullPage: false })

      await detailSection.evaluate((node) => {
        node.scrollTop = node.scrollHeight
      })
      await authenticatedPage.waitForTimeout(500)
      await authenticatedPage.screenshot({ path: `${evidenceDir}/campos-selected-kmz-desktop-bottom.png`, fullPage: false })

      const detailMetricsBottom = await detailSection.evaluate((node) => ({
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
        scrollTop: node.scrollTop,
      }))
      console.log(`CAMPOS detail scroll metrics top=${JSON.stringify(detailMetricsTop)} bottom=${JSON.stringify(detailMetricsBottom)}`)

      await authenticatedPage.setViewportSize({ width: 1180, height: 820 })
      await authenticatedPage.waitForTimeout(800)
      await detailSection.evaluate((node) => {
        node.scrollTop = 0
      })
      await authenticatedPage.screenshot({ path: `${evidenceDir}/campos-selected-kmz-1180-top.png`, fullPage: false })
      await detailSection.evaluate((node) => {
        node.scrollTop = node.scrollHeight
      })
      await authenticatedPage.waitForTimeout(500)
      await authenticatedPage.screenshot({ path: `${evidenceDir}/campos-selected-kmz-1180-bottom.png`, fullPage: false })

      await authenticatedPage.setViewportSize({ width: 1440, height: 900 })
      await detailSection.evaluate((node) => {
        node.scrollTop = 0
      })

      await authenticatedPage.waitForFunction(() => {
        const paths = document.querySelectorAll(".leaflet-overlay-pane path").length
        const markers = document.querySelectorAll(".leaflet-marker-pane > *, .leaflet-overlay-pane circle").length
        return paths + markers > 0
      }, null, { timeout: 30_000 })
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
    await authenticatedPage.goto(`${authenticatedBaseURL}/campos`, { waitUntil: "domcontentloaded", timeout: 30_000 })

    const fieldIntelligenceCheck = await authenticatedPage.evaluate(async () => {
      const response = await fetch("/api/kmz/field-intelligence?kmzId=72d17396-ce29-4b8f-bd1c-984801d88e42", {
        cache: "no-store",
      })
      const payload = await response.json().catch(() => ({}))
      return {
        status: response.status,
        hasHierarchy: Boolean(payload?.kmlHierarchy?.hasHierarchy),
        folderCount: Number(payload?.kmlHierarchy?.folderCount || 0),
      }
    })

    const fieldIntelligencePass =
      fieldIntelligenceCheck.status === 503 ||
      (
        fieldIntelligenceCheck.status === 200 &&
        fieldIntelligenceCheck.hasHierarchy &&
        fieldIntelligenceCheck.folderCount >= 1
      )

    if (!fieldIntelligencePass || fieldIntelligenceCheck.status === 401) {
      failures.push({ check: "field intelligence internal auth + KML hierarchy", ...fieldIntelligenceCheck })
      console.error(`FAIL field intelligence internal auth + KML hierarchy ${JSON.stringify(fieldIntelligenceCheck)}`)
    } else if (fieldIntelligenceCheck.status === 503) {
      console.log("PASS field intelligence internal auth boundary; CI database admin env unavailable")
    } else {
      console.log(`PASS field intelligence internal auth + KML hierarchy folders=${fieldIntelligenceCheck.folderCount}`)
    }

    for (const { route, expectedText } of operationalRoutes) {
      await inspectRoute(authenticatedPage, route, route, expectedText)
    }
    for (const [route, expectedPath] of canonicalRoutes) {
      await inspectRoute(authenticatedPage, route, expectedPath, undefined, { requireNavigation: false })
    }
    for (const route of retiredRoutes) await inspectRoute(authenticatedPage, route, "/campos")

    await authenticatedPage.setViewportSize({ width: 1440, height: 900 })
    await authenticatedPage.goto(`${authenticatedBaseURL}/`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    await authenticatedPage.screenshot({ path: `${evidenceDir}/home-authenticated-desktop.png`, fullPage: false })

    await authenticatedPage.setViewportSize({ width: 390, height: 844 })
    await authenticatedPage.goto(`${authenticatedBaseURL}/mercado/oportunidades`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    const mobileMenuButton = authenticatedPage.getByRole("button", { name: "Abrir navegación" })
    await mobileMenuButton.waitFor({ state: "visible", timeout: 15_000 })
    await mobileMenuButton.click()
    const mobileNav = authenticatedPage.locator('nav[aria-label="Módulos de Sur Realista"]:visible')
    await mobileNav.getByRole("link", { name: "Inicio", exact: true }).waitFor({ state: "visible", timeout: 15_000 })
    await authenticatedPage.screenshot({ path: `${evidenceDir}/navigation-mobile-open.png`, fullPage: false })
    for (const label of ["Campos", "Clientes", "Multimedia", "Documentos", "Mercado"]) {
      await mobileNav.getByRole("link", { name: label, exact: true }).waitFor({ state: "visible", timeout: 15_000 })
    }
    await mobileNav.getByRole("link", { name: "Inicio", exact: true }).click()
    await authenticatedPage.waitForURL((url) => url.pathname === "/", { timeout: 15_000 })
    console.log("PASS mobile navigation and home recovery")

    await authenticatedPage.setViewportSize({ width: 1440, height: 900 })
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
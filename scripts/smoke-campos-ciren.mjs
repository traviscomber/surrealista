import { chromium } from "playwright"

const baseURL = (process.env.SMOKE_BASE_URL || "https://sur-realista.vercel.app").replace(/\/$/, "")
const password = process.env.SMOKE_APP_PASSWORD

if (!password) {
  console.error("SMOKE_APP_PASSWORD is required")
  process.exit(2)
}

const samples = {
  losLagos: {
    kmzId: "f9037599-562e-44ee-aca7-c2feaa974e00",
    region: "Los Lagos",
    fileName: "El cabrito290  2.kmz",
    expectedRol: "161-35",
    expectedPropertyYear: 2016,
    expectedSoilYear: 2020,
  },
  maule: {
    kmzId: "28dd0f9e-4242-4475-90f1-5ab2f4a2486e",
    region: "Región del Maule",
    expectedPropertyYear: 2021,
    expectedSoilYear: 2011,
  },
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function assertCirenContext(request, sample) {
  const response = await request.get(`${baseURL}/api/kmz/ciren-context?kmzId=${encodeURIComponent(sample.kmzId)}&radiusM=1200`)
  assert(response.ok(), `CIREN context failed for ${sample.region}: ${response.status()}`)
  const payload = await response.json()
  assert(payload.region === sample.region, `Unexpected CIREN region for ${sample.region}: ${payload.region}`)
  assert(payload.properties, `Missing CIREN properties dataset for ${sample.region}`)
  assert(payload.soils, `Missing CIREN soils dataset for ${sample.region}`)
  assert(payload.properties.sourceYear === sample.expectedPropertyYear, `Unexpected property year for ${sample.region}`)
  assert(payload.soils.sourceYear === sample.expectedSoilYear, `Unexpected soil year for ${sample.region}`)
  return payload
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()
const pageErrors = []
page.on("pageerror", (error) => pageErrors.push(error.message))

try {
  const unauthenticatedAdmin = await context.request.get(`${baseURL}/api/admin/kmz/geometry-audit`)
  assert(unauthenticatedAdmin.status() === 401, `Admin API must reject unauthenticated access, got ${unauthenticatedAdmin.status()}`)

  const initial = await page.goto(`${baseURL}/campos`, { waitUntil: "domcontentloaded", timeout: 30_000 })
  assert(initial && initial.status() < 500, `CAMPOS failed to load: ${initial?.status()}`)

  const passwordInput = page.getByLabel("Contraseña")
  await passwordInput.waitFor({ state: "visible", timeout: 15_000 })
  await passwordInput.fill(password)
  await page.getByRole("button", { name: "Ingresar" }).click()
  await page.getByText("Colección de campos").waitFor({ state: "visible", timeout: 30_000 })

  const authenticatedAdmin = await context.request.get(`${baseURL}/api/admin/kmz/geometry-audit`)
  assert(authenticatedAdmin.ok(), `Admin API rejected authenticated session: ${authenticatedAdmin.status()}`)

  const deprecatedNeighbor = await context.request.post(`${baseURL}/api/admin/kmz/owner-discovery/neighbors`, { data: {} })
  assert(deprecatedNeighbor.status() === 410, `Synthetic neighbor route must stay disabled, got ${deprecatedNeighbor.status()}`)

  const aside = page.locator("aside").filter({ hasText: "Colección de campos" }).first()
  const regionButton = aside.getByRole("button", { name: /Los Lagos/ }).first()
  await regionButton.waitFor({ state: "visible", timeout: 30_000 })
  const regionRow = regionButton.locator("xpath=..")
  await regionRow.locator("button").first().click()

  const fileButton = aside.getByRole("button", { name: new RegExp(samples.losLagos.fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).first()
  await fileButton.waitFor({ state: "visible", timeout: 30_000 })
  await fileButton.click()

  await page.getByText("Contexto territorial CIREN").waitFor({ state: "visible", timeout: 30_000 })
  await page.getByText(`ROL CIREN ${samples.losLagos.expectedRol}`).waitFor({ state: "visible", timeout: 30_000 })
  await page.getByText(/Clases VIII/).waitFor({ state: "visible", timeout: 30_000 })
  assert(!(await page.getByText(/CIREN no está disponible/).isVisible().catch(() => false)), "CIREN UI shows unavailable state")

  const leafletPaths = await page.locator(".leaflet-overlay-pane path").count()
  assert(leafletPaths > 1, `Expected KMZ + CIREN map polygons, found ${leafletPaths}`)

  const losLagos = await assertCirenContext(context.request, samples.losLagos)
  assert((losLagos.properties.neighbors || []).some((neighbor) => neighbor.rol === samples.losLagos.expectedRol), "Expected Los Lagos CIREN ROL not found")
  await assertCirenContext(context.request, samples.maule)

  assert(pageErrors.length === 0, `Browser page errors: ${pageErrors.join(" | ")}`)
  console.log("PASS CAMPOS + CIREN production smoke")
} finally {
  await browser.close()
}

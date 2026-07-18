import { chromium } from "playwright"

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] })
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  locale: "es-CL",
})
const page = await ctx.newPage()

// Establish session once
await page.goto("https://seia.sea.gob.cl/busqueda/buscarProyecto.php", { waitUntil: "domcontentloaded", timeout: 30000 })
await page.waitForTimeout(1000)

// Now try hitting the JSON endpoint directly via context.request for multiple terms
const terms = ["idahue", "los alamos", "san jose"]
for (const term of terms) {
  const t0 = Date.now()
  const resp = await ctx.request.get(
    `https://seia.sea.gob.cl/busqueda/buscarProyectoResumenAction.php?nombre=${encodeURIComponent(term)}`,
    { timeout: 20000 }
  )
  const status = resp.status()
  let n = 0, first = null
  try {
    const j = JSON.parse(await resp.text())
    n = j.data?.length || 0
    first = j.data?.[0] ? { name: j.data[0].EXPEDIENTE_NOMBRE, comuna: j.data[0].COMUNA_NOMBRE, titular: j.data[0].TITULAR } : null
  } catch (e) { first = "parse-fail: " + e.message }
  console.log(`[${term}] status=${status} results=${n} time=${Date.now() - t0}ms first=${JSON.stringify(first)}`)
}
await browser.close()

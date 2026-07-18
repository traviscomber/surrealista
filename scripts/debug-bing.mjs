import { chromium } from "playwright"
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] })
const ctx = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  locale: "es-CL",
})
const page = await ctx.newPage()

async function probe(label, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 })
  await page.waitForTimeout(2000)
  const info = await page.evaluate(() => ({
    b_algo: document.querySelectorAll("li.b_algo").length,
    h2: document.querySelectorAll("h2").length,
    allLi: document.querySelectorAll("li").length,
    bodyLen: document.body.innerText.length,
    bodySample: document.body.innerText.slice(0, 400),
  }))
  console.log(`\n=== ${label} ===`)
  console.log("URL:", page.url())
  console.log("TITLE:", await page.title())
  console.log(JSON.stringify(info, null, 2))
}

await probe("BING", "https://www.bing.com/search?q=" + encodeURIComponent("fundo agricola chile propietario"))
await probe("DUCKDUCKGO", "https://html.duckduckgo.com/html/?q=" + encodeURIComponent("fundo agricola chile propietario"))
await probe("GOOGLE", "https://www.google.com/search?q=" + encodeURIComponent("fundo agricola chile propietario") + "&hl=es")

await browser.close()

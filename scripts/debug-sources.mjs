// Test which real data sources are reachable from this datacenter IP
const tests = [
  ["SEA seia buscador", "https://seia.sea.gob.cl/busqueda/buscarProyecto.php"],
  ["DuckDuckGo Lite", "https://lite.duckduckgo.com/lite/?q=fundo+chile"],
  ["Brave Search", "https://search.brave.com/search?q=fundo+chile"],
  ["Mojeek", "https://www.mojeek.com/search?q=fundo+agricola+chile"],
  ["SII home", "https://www.sii.cl"],
]

for (const [label, url] of tests) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "es-CL,es;q=0.9",
      },
    })
    const text = await res.text()
    const lower = text.toLowerCase()
    const blocked =
      lower.includes("captcha") ||
      lower.includes("unusual traffic") ||
      lower.includes("desafío") ||
      lower.includes("un último paso") ||
      lower.includes("robot")
    console.log(`${label}: HTTP ${res.status} | len ${text.length} | blocked=${blocked}`)
  } catch (err) {
    console.log(`${label}: ERROR ${err.message}`)
  }
}

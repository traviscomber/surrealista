import * as cheerio from 'cheerio'
const urls = [
  'https://rura.cl/venta/parcelas-y-terrenos',
  'https://rura.cl/venta/parcelas',
  'https://rura.cl/parcelas',
  'https://rura.cl/',
]
for (const u of urls) {
  try {
    const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0', 'accept-language': 'es-CL' } })
    const t = await r.text()
    const $ = cheerio.load(t)
    const propLinks = $('a[href*="/propiedad/"]').length
    console.log(u, '| status', r.status, '| size', t.length, '| propLinks', propLinks, '| next', t.includes('__NEXT_DATA__'), '| nuxt', t.includes('__NUXT__'))
    if (propLinks > 0) {
      $('a[href*="/propiedad/"]').slice(0, 3).each((_, e) => console.log('   ->', $(e).attr('href')))
    }
  } catch (e) {
    console.log(u, 'ERR', e.message)
  }
}

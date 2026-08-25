function parseNumber(raw: string) {
  const value = raw.trim().replace(/\s/g, '')
  if (!value) return null

  if (/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(value)) {
    const parsed = Number(value.replace(/\./g, '').replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : null
  }

  if (/^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(value)) {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }

  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseNaturalArea(input: unknown): number | null {
  const text = String(input ?? '').trim().toLocaleLowerCase('es-CL')
  if (!text) return null

  const hectareMatch = text.match(/(\d[\d.,\s]*)\s*(?:ha\b|hect[aá]rea(?:s)?\b)/i)
  if (hectareMatch) {
    const hectares = parseNumber(hectareMatch[1])
    if (hectares && hectares > 0) return Math.round(hectares * 10_000)
  }

  const sqmMatch = text.match(/(\d[\d.,\s]*)\s*(?:m2\b|m²|mt2\b|mts2\b|metros?\s+cuadrados?|mts?\s+cuadrados?)/i)
  if (sqmMatch) {
    const sqm = parseNumber(sqmMatch[1])
    if (sqm && sqm > 0) return Math.round(sqm)
  }

  if (/^\s*\d[\d.,\s]*\s*$/.test(text)) {
    const sqm = parseNumber(text)
    if (sqm && sqm >= 100) return Math.round(sqm)
  }

  return null
}

export function inferLandType(input: unknown) {
  const text = String(input ?? '').toLocaleLowerCase('es-CL')
  if (/\bfundo\b/.test(text)) return 'campo'
  if (/\bcampo\b/.test(text)) return 'campo'
  if (/\bparcela|parcelaci[oó]n\b/.test(text)) return 'parcela'
  if (/\bagricol|agrícola|agrícola\b/.test(text)) return 'agrícola'
  if (/\bforestal\b/.test(text)) return 'campo forestal'
  return 'terreno'
}

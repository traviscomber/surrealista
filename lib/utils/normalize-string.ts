/**
 * Normalize a string by removing accents and converting to lowercase
 * This allows searching for "araucania" to match "Araucanía"
 */
export function normalizeString(str: string): string {
  if (!str) return ""
  return str
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase()
    .trim()
}

/**
 * Check if a string matches a query (accent-insensitive)
 */
export function matchesQuery(text: string, query: string): boolean {
  if (!text || !query) return false
  return normalizeString(text).includes(normalizeString(query))
}

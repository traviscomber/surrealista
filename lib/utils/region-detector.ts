// Utility to detect Chilean region from coordinates
// Used for organizing 1500+ KMZ files by geographic region

export interface Bounds {
  north: number
  south: number
  east: number
  west: number
}

export interface RegionInfo {
  name: string
  code: string
  latRange: [number, number]
}

// Chilean regions from north to south with their latitude ranges
export const CHILEAN_REGIONS: RegionInfo[] = [
  { name: "Región de Arica y Parinacota", code: "AP", latRange: [-18.5, -17.5] },
  { name: "Región de Tarapacá", code: "TA", latRange: [-21.5, -18.5] },
  { name: "Región de Antofagasta", code: "AN", latRange: [-26.5, -21.5] },
  { name: "Región de Atacama", code: "AT", latRange: [-29, -26.5] },
  { name: "Región de Coquimbo", code: "CO", latRange: [-32, -29] },
  { name: "Región de Valparaíso", code: "VA", latRange: [-33.5, -32] },
  { name: "Región Metropolitana", code: "RM", latRange: [-34, -33] },
  { name: "Región de O'Higgins", code: "OH", latRange: [-35, -33.5] },
  { name: "Región del Maule", code: "MA", latRange: [-36.5, -35] },
  { name: "Región de Ñuble", code: "NB", latRange: [-37, -36.5] },
  { name: "Región del Biobío", code: "BB", latRange: [-38.5, -36.5] },
  { name: "Región de La Araucanía", code: "AR", latRange: [-39.5, -37.5] },
  { name: "Región de Los Ríos", code: "LR", latRange: [-40.5, -39] },
  { name: "Región de Los Lagos", code: "LL", latRange: [-44, -40.5] },
  { name: "Región de Aysén", code: "AI", latRange: [-49, -43.5] },
  { name: "Región de Magallanes", code: "MG", latRange: [-56, -48] },
]

/**
 * Detects the Chilean region from coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @returns Region name or 'Sin Región' if not found
 */
export function detectRegionFromCoordinates(lat: number, lng: number): string {
  // Check if coordinates are in Chile (longitude range)
  if (lng < -76 || lng > -66) {
    return "Sin Región"
  }

  // Find matching region by latitude
  for (const region of CHILEAN_REGIONS) {
    const [minLat, maxLat] = region.latRange
    if (lat >= minLat && lat <= maxLat) {
      return region.name
    }
  }

  return "Sin Región"
}

/**
 * Detects region from bounds (geographic bounding box)
 * Uses the center point of the bounds
 */
export function detectRegionFromBounds(bounds: Bounds): string {
  const centerLat = (bounds.north + bounds.south) / 2
  const centerLng = (bounds.east + bounds.west) / 2
  return detectRegionFromCoordinates(centerLat, centerLng)
}

/**
 * Detects region from an array of coordinates
 * Uses the center of all coordinates
 */
export function detectRegionFromCoordinateArray(coordinates: number[][]): string {
  if (!coordinates || coordinates.length === 0) {
    return "Sin Región"
  }

  // Calculate center point
  let sumLat = 0
  let sumLng = 0
  let count = 0

  for (const coord of coordinates) {
    if (coord && coord.length >= 2) {
      sumLng += coord[0] // KMZ format: [lng, lat]
      sumLat += coord[1]
      count++
    }
  }

  if (count === 0) {
    return "Sin Región"
  }

  const centerLat = sumLat / count
  const centerLng = sumLng / count

  return detectRegionFromCoordinates(centerLat, centerLng)
}

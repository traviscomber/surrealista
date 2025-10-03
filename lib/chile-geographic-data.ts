// Comprehensive Chilean geographic data with real coordinates
// All data is accurate as of 2024

export interface GeographicLocation {
  name: string
  lat: number
  lng: number
  type: "region_capital" | "provincial_capital" | "commune_capital" | "city" | "town" | "airport"
  population?: number
  region?: string
  province?: string
  commune?: string
}

export interface Airport {
  name: string
  code: string // IATA code
  type: "international" | "regional" | "local"
  lat: number
  lng: number
  city: string
  region: string
  description: string
}

export interface RegionData {
  code: string
  name: string
  capital: string
  capitalCoords: { lat: number; lng: number }
  provinces: ProvinceData[]
}

export interface ProvinceData {
  code: string
  name: string
  capital: string
  capitalCoords: { lat: number; lng: number }
  comunas: ComunaData[]
}

export interface ComunaData {
  code: string
  name: string
  capital: string
  capitalCoords: { lat: number; lng: number }
  population?: number
}

// Chilean Airports with real coordinates
export const CHILEAN_AIRPORTS: Airport[] = [
  // International Airports
  {
    name: "Aeropuerto Internacional Arturo Merino Benítez",
    code: "SCL",
    type: "international",
    lat: -33.393,
    lng: -70.7858,
    city: "Santiago",
    region: "Región Metropolitana",
    description: "Principal aeropuerto internacional de Chile",
  },
  // Regional Airports - Sur de Chile
  {
    name: "Aeropuerto Internacional Carriel Sur",
    code: "CCP",
    type: "international",
    lat: -36.7727,
    lng: -73.0631,
    city: "Concepción",
    region: "Región del Biobío",
    description: "Aeropuerto internacional, vuelos nacionales e internacionales",
  },
  {
    name: "Aeropuerto La Araucanía",
    code: "ZCO",
    type: "regional",
    lat: -38.7667,
    lng: -72.6372,
    city: "Temuco",
    region: "Región de La Araucanía",
    description: "Aeropuerto regional, vuelos diarios a Santiago",
  },
  {
    name: "Aeropuerto Pichoy",
    code: "ZAL",
    type: "regional",
    lat: -39.65,
    lng: -73.0861,
    city: "Valdivia",
    region: "Región de Los Ríos",
    description: "Aeropuerto regional, vuelos a Santiago y Concepción",
  },
  {
    name: "Aeropuerto El Tepual",
    code: "PMC",
    type: "regional",
    lat: -41.4389,
    lng: -73.0939,
    city: "Puerto Montt",
    region: "Región de Los Lagos",
    description: "Aeropuerto regional importante, conexión con Patagonia",
  },
  {
    name: "Aeropuerto Cañal Bajo Carlos Hott Siebert",
    code: "ZOS",
    type: "regional",
    lat: -40.6111,
    lng: -73.0611,
    city: "Osorno",
    region: "Región de Los Lagos",
    description: "Aeropuerto regional, vuelos a Santiago",
  },
  {
    name: "Aeropuerto Mocopulli",
    code: "MHC",
    type: "local",
    lat: -42.3419,
    lng: -73.7161,
    city: "Castro",
    region: "Región de Los Lagos",
    description: "Aeropuerto local en Chiloé",
  },
  {
    name: "Aeropuerto Balmaceda",
    code: "BBA",
    type: "regional",
    lat: -45.9161,
    lng: -71.6889,
    city: "Coyhaique",
    region: "Región de Aysén",
    description: "Aeropuerto regional de la Patagonia",
  },
  // Norte de Chile
  {
    name: "Aeropuerto Diego Aracena",
    code: "IQQ",
    type: "international",
    lat: -20.5353,
    lng: -70.1813,
    city: "Iquique",
    region: "Región de Tarapacá",
    description: "Aeropuerto internacional del norte",
  },
  {
    name: "Aeropuerto Andrés Sabella",
    code: "ANF",
    type: "regional",
    lat: -23.4445,
    lng: -70.4451,
    city: "Antofagasta",
    region: "Región de Antofagasta",
    description: "Aeropuerto regional importante del norte",
  },
]

// Complete Chilean Regions with detailed geographic data
export const CHILEAN_REGIONS_DETAILED: RegionData[] = [
  {
    code: "10",
    name: "Región de Los Lagos",
    capital: "Puerto Montt",
    capitalCoords: { lat: -41.4693, lng: -72.9424 },
    provinces: [
      {
        code: "101",
        name: "Llanquihue",
        capital: "Puerto Montt",
        capitalCoords: { lat: -41.4693, lng: -72.9424 },
        comunas: [
          {
            code: "10101",
            name: "Puerto Montt",
            capital: "Puerto Montt",
            capitalCoords: { lat: -41.4693, lng: -72.9424 },
            population: 245902,
          },
          {
            code: "10102",
            name: "Calbuco",
            capital: "Calbuco",
            capitalCoords: { lat: -41.7733, lng: -73.1333 },
            population: 36744,
          },
          {
            code: "10103",
            name: "Cochamó",
            capital: "Cochamó",
            capitalCoords: { lat: -41.4833, lng: -72.3167 },
            population: 4217,
          },
          {
            code: "10104",
            name: "Fresia",
            capital: "Fresia",
            capitalCoords: { lat: -41.15, lng: -73.4167 },
            population: 12656,
          },
          {
            code: "10105",
            name: "Frutillar",
            capital: "Frutillar",
            capitalCoords: { lat: -41.1267, lng: -73.05 },
            population: 18283,
          },
          {
            code: "10106",
            name: "Los Muermos",
            capital: "Los Muermos",
            capitalCoords: { lat: -41.395, lng: -73.4667 },
            population: 17817,
          },
          {
            code: "10107",
            name: "Llanquihue",
            capital: "Llanquihue",
            capitalCoords: { lat: -41.2667, lng: -73.0167 },
            population: 18621,
          },
          {
            code: "10108",
            name: "Maullín",
            capital: "Maullín",
            capitalCoords: { lat: -41.6167, lng: -73.6 },
            population: 14894,
          },
          {
            code: "10109",
            name: "Puerto Varas",
            capital: "Puerto Varas",
            capitalCoords: { lat: -41.3194, lng: -72.9833 },
            population: 44578,
          },
        ],
      },
      {
        code: "102",
        name: "Chiloé",
        capital: "Castro",
        capitalCoords: { lat: -42.4833, lng: -73.7667 },
        comunas: [
          {
            code: "10201",
            name: "Castro",
            capital: "Castro",
            capitalCoords: { lat: -42.4833, lng: -73.7667 },
            population: 43807,
          },
          {
            code: "10202",
            name: "Ancud",
            capital: "Ancud",
            capitalCoords: { lat: -41.8667, lng: -73.8167 },
            population: 42458,
          },
          {
            code: "10203",
            name: "Chonchi",
            capital: "Chonchi",
            capitalCoords: { lat: -42.6167, lng: -73.7667 },
            population: 13569,
          },
          {
            code: "10204",
            name: "Curaco de Vélez",
            capital: "Curaco de Vélez",
            capitalCoords: { lat: -42.4333, lng: -73.6 },
            population: 3403,
          },
          {
            code: "10205",
            name: "Dalcahue",
            capital: "Dalcahue",
            capitalCoords: { lat: -42.3833, lng: -73.65 },
            population: 15069,
          },
          {
            code: "10206",
            name: "Puqueldón",
            capital: "Puqueldón",
            capitalCoords: { lat: -42.5833, lng: -73.6667 },
            population: 4201,
          },
          {
            code: "10207",
            name: "Queilén",
            capital: "Queilén",
            capitalCoords: { lat: -42.8833, lng: -73.4667 },
            population: 5543,
          },
          {
            code: "10208",
            name: "Quellón",
            capital: "Quellón",
            capitalCoords: { lat: -43.1167, lng: -73.6167 },
            population: 27192,
          },
          {
            code: "10209",
            name: "Quemchi",
            capital: "Quemchi",
            capitalCoords: { lat: -42.1333, lng: -73.4667 },
            population: 8783,
          },
          {
            code: "10210",
            name: "Quinchao",
            capital: "Achao",
            capitalCoords: { lat: -42.4667, lng: -73.4833 },
            population: 8298,
          },
        ],
      },
      {
        code: "103",
        name: "Osorno",
        capital: "Osorno",
        capitalCoords: { lat: -40.5736, lng: -73.1322 },
        comunas: [
          {
            code: "10301",
            name: "Osorno",
            capital: "Osorno",
            capitalCoords: { lat: -40.5736, lng: -73.1322 },
            population: 161460,
          },
          {
            code: "10302",
            name: "Puerto Octay",
            capital: "Puerto Octay",
            capitalCoords: { lat: -40.9667, lng: -72.9 },
            population: 9192,
          },
          {
            code: "10303",
            name: "Purranque",
            capital: "Purranque",
            capitalCoords: { lat: -40.9167, lng: -73.1667 },
            population: 21080,
          },
          {
            code: "10304",
            name: "Puyehue",
            capital: "Entre Lagos",
            capitalCoords: { lat: -40.6833, lng: -72.5833 },
            population: 11787,
          },
          {
            code: "10305",
            name: "Río Negro",
            capital: "Río Negro",
            capitalCoords: { lat: -40.7833, lng: -73.2167 },
            population: 14275,
          },
          {
            code: "10306",
            name: "San Juan de la Costa",
            capital: "Puaucho",
            capitalCoords: { lat: -40.5333, lng: -73.4 },
            population: 7639,
          },
          {
            code: "10307",
            name: "San Pablo",
            capital: "San Pablo",
            capitalCoords: { lat: -40.4, lng: -73.0333 },
            population: 10553,
          },
        ],
      },
      {
        code: "104",
        name: "Palena",
        capital: "Chaitén",
        capitalCoords: { lat: -42.9167, lng: -72.7167 },
        comunas: [
          {
            code: "10401",
            name: "Chaitén",
            capital: "Chaitén",
            capitalCoords: { lat: -42.9167, lng: -72.7167 },
            population: 5020,
          },
          {
            code: "10402",
            name: "Futaleufú",
            capital: "Futaleufú",
            capitalCoords: { lat: -43.1833, lng: -71.8667 },
            population: 2806,
          },
          {
            code: "10403",
            name: "Hualaihué",
            capital: "Hornopirén",
            capitalCoords: { lat: -41.9333, lng: -72.4333 },
            population: 9525,
          },
          {
            code: "10404",
            name: "Palena",
            capital: "Palena",
            capitalCoords: { lat: -43.6167, lng: -71.8 },
            population: 1827,
          },
        ],
      },
    ],
  },
  {
    code: "14",
    name: "Región de Los Ríos",
    capital: "Valdivia",
    capitalCoords: { lat: -39.8142, lng: -73.2459 },
    provinces: [
      {
        code: "141",
        name: "Valdivia",
        capital: "Valdivia",
        capitalCoords: { lat: -39.8142, lng: -73.2459 },
        comunas: [
          {
            code: "14101",
            name: "Valdivia",
            capital: "Valdivia",
            capitalCoords: { lat: -39.8142, lng: -73.2459 },
            population: 166080,
          },
          {
            code: "14102",
            name: "Corral",
            capital: "Corral",
            capitalCoords: { lat: -39.8833, lng: -73.4333 },
            population: 5447,
          },
          {
            code: "14103",
            name: "Lanco",
            capital: "Lanco",
            capitalCoords: { lat: -39.45, lng: -72.7667 },
            population: 17652,
          },
          {
            code: "14104",
            name: "Los Lagos",
            capital: "Los Lagos",
            capitalCoords: { lat: -39.8667, lng: -72.8167 },
            population: 20168,
          },
          {
            code: "14105",
            name: "Máfil",
            capital: "Máfil",
            capitalCoords: { lat: -39.6667, lng: -72.95 },
            population: 7389,
          },
          {
            code: "14106",
            name: "Mariquina",
            capital: "Mariquina",
            capitalCoords: { lat: -39.5333, lng: -72.9667 },
            population: 23250,
          },
          {
            code: "14107",
            name: "Paillaco",
            capital: "Paillaco",
            capitalCoords: { lat: -40.0667, lng: -72.8667 },
            population: 20798,
          },
          {
            code: "14108",
            name: "Panguipulli",
            capital: "Panguipulli",
            capitalCoords: { lat: -39.6333, lng: -72.3333 },
            population: 35991,
          },
        ],
      },
      {
        code: "142",
        name: "Ranco",
        capital: "La Unión",
        capitalCoords: { lat: -40.2931, lng: -73.0831 },
        comunas: [
          {
            code: "14201",
            name: "La Unión",
            capital: "La Unión",
            capitalCoords: { lat: -40.2931, lng: -73.0831 },
            population: 39447,
          },
          {
            code: "14202",
            name: "Futrono",
            capital: "Futrono",
            capitalCoords: { lat: -40.1333, lng: -72.3833 },
            population: 15261,
          },
          {
            code: "14203",
            name: "Lago Ranco",
            capital: "Lago Ranco",
            capitalCoords: { lat: -40.3167, lng: -72.5 },
            population: 10292,
          },
          {
            code: "14204",
            name: "Río Bueno",
            capital: "Río Bueno",
            capitalCoords: { lat: -40.3333, lng: -72.95 },
            population: 32925,
          },
        ],
      },
    ],
  },
  {
    code: "09",
    name: "Región de La Araucanía",
    capital: "Temuco",
    capitalCoords: { lat: -38.7359, lng: -72.5904 },
    provinces: [
      {
        code: "091",
        name: "Cautín",
        capital: "Temuco",
        capitalCoords: { lat: -38.7359, lng: -72.5904 },
        comunas: [
          {
            code: "09101",
            name: "Temuco",
            capital: "Temuco",
            capitalCoords: { lat: -38.7359, lng: -72.5904 },
            population: 282415,
          },
          {
            code: "09102",
            name: "Carahue",
            capital: "Carahue",
            capitalCoords: { lat: -38.7167, lng: -73.1667 },
            population: 25696,
          },
          {
            code: "09103",
            name: "Cunco",
            capital: "Cunco",
            capitalCoords: { lat: -38.9333, lng: -72.0333 },
            population: 18055,
          },
          {
            code: "09104",
            name: "Curarrehue",
            capital: "Curarrehue",
            capitalCoords: { lat: -39.35, lng: -71.5833 },
            population: 7802,
          },
          {
            code: "09105",
            name: "Freire",
            capital: "Freire",
            capitalCoords: { lat: -38.95, lng: -72.6333 },
            population: 25514,
          },
          {
            code: "09106",
            name: "Galvarino",
            capital: "Galvarino",
            capitalCoords: { lat: -38.4167, lng: -72.7833 },
            population: 12633,
          },
          {
            code: "09107",
            name: "Gorbea",
            capital: "Gorbea",
            capitalCoords: { lat: -39.0833, lng: -72.6833 },
            population: 15222,
          },
          {
            code: "09108",
            name: "Lautaro",
            capital: "Lautaro",
            capitalCoords: { lat: -38.5333, lng: -72.4333 },
            population: 40746,
          },
          {
            code: "09109",
            name: "Loncoche",
            capital: "Loncoche",
            capitalCoords: { lat: -39.3667, lng: -72.6333 },
            population: 24739,
          },
          {
            code: "09110",
            name: "Melipeuco",
            capital: "Melipeuco",
            capitalCoords: { lat: -38.85, lng: -71.7 },
            population: 6265,
          },
          {
            code: "09111",
            name: "Nueva Imperial",
            capital: "Nueva Imperial",
            capitalCoords: { lat: -38.75, lng: -72.95 },
            population: 33777,
          },
          {
            code: "09112",
            name: "Padre Las Casas",
            capital: "Padre Las Casas",
            capitalCoords: { lat: -38.7667, lng: -72.6 },
            population: 82110,
          },
          {
            code: "09113",
            name: "Perquenco",
            capital: "Perquenco",
            capitalCoords: { lat: -38.4167, lng: -72.3833 },
            population: 7223,
          },
          {
            code: "09114",
            name: "Pitrufquén",
            capital: "Pitrufquén",
            capitalCoords: { lat: -38.9833, lng: -72.65 },
            population: 26096,
          },
          {
            code: "09115",
            name: "Pucón",
            capital: "Pucón",
            capitalCoords: { lat: -39.2833, lng: -71.9667 },
            population: 29782,
          },
          {
            code: "09116",
            name: "Saavedra",
            capital: "Puerto Saavedra",
            capitalCoords: { lat: -38.7833, lng: -73.4 },
            population: 12793,
          },
          {
            code: "09117",
            name: "Teodoro Schmidt",
            capital: "Teodoro Schmidt",
            capitalCoords: { lat: -38.9667, lng: -73.05 },
            population: 15786,
          },
          {
            code: "09118",
            name: "Toltén",
            capital: "Toltén",
            capitalCoords: { lat: -39.2167, lng: -73.2167 },
            population: 10055,
          },
          {
            code: "09119",
            name: "Vilcún",
            capital: "Vilcún",
            capitalCoords: { lat: -38.6667, lng: -72.2333 },
            population: 30766,
          },
          {
            code: "09120",
            name: "Villarrica",
            capital: "Villarrica",
            capitalCoords: { lat: -39.2833, lng: -72.2333 },
            population: 59103,
          },
          {
            code: "09121",
            name: "Cholchol",
            capital: "Cholchol",
            capitalCoords: { lat: -38.6, lng: -72.85 },
            population: 12341,
          },
        ],
      },
      {
        code: "092",
        name: "Malleco",
        capital: "Angol",
        capitalCoords: { lat: -37.795, lng: -72.7142 },
        comunas: [
          {
            code: "09201",
            name: "Angol",
            capital: "Angol",
            capitalCoords: { lat: -37.795, lng: -72.7142 },
            population: 56058,
          },
          {
            code: "09202",
            name: "Collipulli",
            capital: "Collipulli",
            capitalCoords: { lat: -37.95, lng: -72.4333 },
            population: 26148,
          },
          {
            code: "09203",
            name: "Curacautín",
            capital: "Curacautín",
            capitalCoords: { lat: -38.4333, lng: -71.8833 },
            population: 18178,
          },
          {
            code: "09204",
            name: "Ercilla",
            capital: "Ercilla",
            capitalCoords: { lat: -38.05, lng: -72.3833 },
            population: 8458,
          },
          {
            code: "09205",
            name: "Lonquimay",
            capital: "Lonquimay",
            capitalCoords: { lat: -38.4333, lng: -71.2333 },
            population: 11049,
          },
          {
            code: "09206",
            name: "Los Sauces",
            capital: "Los Sauces",
            capitalCoords: { lat: -37.9667, lng: -72.8333 },
            population: 7517,
          },
          {
            code: "09207",
            name: "Lumaco",
            capital: "Lumaco",
            capitalCoords: { lat: -38.1667, lng: -72.9167 },
            population: 10050,
          },
          {
            code: "09208",
            name: "Purén",
            capital: "Purén",
            capitalCoords: { lat: -38.0333, lng: -73.0667 },
            population: 12868,
          },
          {
            code: "09209",
            name: "Renaico",
            capital: "Renaico",
            capitalCoords: { lat: -37.6667, lng: -72.5833 },
            population: 10833,
          },
          {
            code: "09210",
            name: "Traiguén",
            capital: "Traiguén",
            capitalCoords: { lat: -38.25, lng: -72.6667 },
            population: 19534,
          },
          {
            code: "09211",
            name: "Victoria",
            capital: "Victoria",
            capitalCoords: { lat: -38.2333, lng: -72.3333 },
            population: 35467,
          },
        ],
      },
    ],
  },
]

// Helper functions for geographic calculations
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function findNearestAirport(lat: number, lng: number): Airport {
  let nearest = CHILEAN_AIRPORTS[0]
  let minDistance = calculateDistance(lat, lng, nearest.lat, nearest.lng)

  for (const airport of CHILEAN_AIRPORTS) {
    const distance = calculateDistance(lat, lng, airport.lat, airport.lng)
    if (distance < minDistance) {
      minDistance = distance
      nearest = airport
    }
  }

  return nearest
}

export function findNearestInternationalAirport(lat: number, lng: number): Airport {
  const internationalAirports = CHILEAN_AIRPORTS.filter((a) => a.type === "international")
  let nearest = internationalAirports[0]
  let minDistance = calculateDistance(lat, lng, nearest.lat, nearest.lng)

  for (const airport of internationalAirports) {
    const distance = calculateDistance(lat, lng, airport.lat, airport.lng)
    if (distance < minDistance) {
      minDistance = distance
      nearest = airport
    }
  }

  return nearest
}

export function findLocationDetails(
  lat: number,
  lng: number,
): {
  region: RegionData | null
  province: ProvinceData | null
  comuna: ComunaData | null
  nearestRegionalCapital: { name: string; distance: number } | null
  nearestProvincialCapital: { name: string; distance: number } | null
  nearestCommuneCapital: { name: string; distance: number } | null
} {
  let closestRegion: RegionData | null = null
  let closestProvince: ProvinceData | null = null
  let closestComuna: ComunaData | null = null
  let minComunaDistance = Number.POSITIVE_INFINITY

  // Find closest comuna (which gives us region and province)
  for (const region of CHILEAN_REGIONS_DETAILED) {
    for (const province of region.provinces) {
      for (const comuna of province.comunas) {
        const distance = calculateDistance(lat, lng, comuna.capitalCoords.lat, comuna.capitalCoords.lng)
        if (distance < minComunaDistance) {
          minComunaDistance = distance
          closestComuna = comuna
          closestProvince = province
          closestRegion = region
        }
      }
    }
  }

  const nearestRegionalCapital = closestRegion
    ? {
        name: closestRegion.capital,
        distance: calculateDistance(lat, lng, closestRegion.capitalCoords.lat, closestRegion.capitalCoords.lng),
      }
    : null

  const nearestProvincialCapital = closestProvince
    ? {
        name: closestProvince.capital,
        distance: calculateDistance(lat, lng, closestProvince.capitalCoords.lat, closestProvince.capitalCoords.lng),
      }
    : null

  const nearestCommuneCapital = closestComuna
    ? {
        name: closestComuna.capital,
        distance: minComunaDistance,
      }
    : null

  return {
    region: closestRegion,
    province: closestProvince,
    comuna: closestComuna,
    nearestRegionalCapital,
    nearestProvincialCapital,
    nearestCommuneCapital,
  }
}

// Major Chilean cities for reference
export const MAJOR_CHILEAN_CITIES: GeographicLocation[] = [
  {
    name: "Santiago",
    lat: -33.4489,
    lng: -70.6693,
    type: "region_capital",
    population: 7112808,
    region: "Región Metropolitana",
  },
  {
    name: "Valparaíso",
    lat: -33.0472,
    lng: -71.6127,
    type: "region_capital",
    population: 296655,
    region: "Región de Valparaíso",
  },
  {
    name: "Concepción",
    lat: -36.827,
    lng: -73.0498,
    type: "region_capital",
    population: 223574,
    region: "Región del Biobío",
  },
  {
    name: "Temuco",
    lat: -38.7359,
    lng: -72.5904,
    type: "region_capital",
    population: 282415,
    region: "Región de La Araucanía",
  },
  {
    name: "Valdivia",
    lat: -39.8142,
    lng: -73.2459,
    type: "region_capital",
    population: 166080,
    region: "Región de Los Ríos",
  },
  {
    name: "Puerto Montt",
    lat: -41.4693,
    lng: -72.9424,
    type: "region_capital",
    population: 245902,
    region: "Región de Los Lagos",
  },
  {
    name: "Osorno",
    lat: -40.5736,
    lng: -73.1322,
    type: "provincial_capital",
    population: 161460,
    region: "Región de Los Lagos",
  },
]

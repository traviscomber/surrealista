// Comprehensive Chilean administrative divisions data
// Structure: País > Región > Provincia > Comuna

export interface Comuna {
  code: string
  name: string
}

export interface Provincia {
  code: string
  name: string
  comunas: Comuna[]
}

export interface Region {
  code: string
  name: string
  shortName: string
  provincias: Provincia[]
}

// Complete Chilean regions with their provincias and comunas
export const CHILEAN_REGIONS: Region[] = [
  {
    code: "10",
    name: "Región de Los Lagos",
    shortName: "Los Lagos",
    provincias: [
      {
        code: "101",
        name: "Llanquihue",
        comunas: [
          { code: "10101", name: "Puerto Montt" },
          { code: "10102", name: "Calbuco" },
          { code: "10103", name: "Cochamó" },
          { code: "10104", name: "Fresia" },
          { code: "10105", name: "Frutillar" },
          { code: "10106", name: "Los Muermos" },
          { code: "10107", name: "Llanquihue" },
          { code: "10108", name: "Maullín" },
          { code: "10109", name: "Puerto Varas" },
        ],
      },
      {
        code: "102",
        name: "Chiloé",
        comunas: [
          { code: "10201", name: "Castro" },
          { code: "10202", name: "Ancud" },
          { code: "10203", name: "Chonchi" },
          { code: "10204", name: "Curaco de Vélez" },
          { code: "10205", name: "Dalcahue" },
          { code: "10206", name: "Puqueldón" },
          { code: "10207", name: "Queilén" },
          { code: "10208", name: "Quellón" },
          { code: "10209", name: "Quemchi" },
          { code: "10210", name: "Quinchao" },
        ],
      },
      {
        code: "103",
        name: "Osorno",
        comunas: [
          { code: "10301", name: "Osorno" },
          { code: "10302", name: "Puerto Octay" },
          { code: "10303", name: "Purranque" },
          { code: "10304", name: "Puyehue" },
          { code: "10305", name: "Río Negro" },
          { code: "10306", name: "San Juan de la Costa" },
          { code: "10307", name: "San Pablo" },
        ],
      },
      {
        code: "104",
        name: "Palena",
        comunas: [
          { code: "10401", name: "Chaitén" },
          { code: "10402", name: "Futaleufú" },
          { code: "10403", name: "Hualaihué" },
          { code: "10404", name: "Palena" },
        ],
      },
    ],
  },
  {
    code: "14",
    name: "Región de Los Ríos",
    shortName: "Los Ríos",
    provincias: [
      {
        code: "141",
        name: "Valdivia",
        comunas: [
          { code: "14101", name: "Valdivia" },
          { code: "14102", name: "Corral" },
          { code: "14103", name: "Lanco" },
          { code: "14104", name: "Los Lagos" },
          { code: "14105", name: "Máfil" },
          { code: "14106", name: "Mariquina" },
          { code: "14107", name: "Paillaco" },
          { code: "14108", name: "Panguipulli" },
        ],
      },
      {
        code: "142",
        name: "Ranco",
        comunas: [
          { code: "14201", name: "La Unión" },
          { code: "14202", name: "Futrono" },
          { code: "14203", name: "Lago Ranco" },
          { code: "14204", name: "Río Bueno" },
        ],
      },
    ],
  },
  {
    code: "09",
    name: "Región de La Araucanía",
    shortName: "La Araucanía",
    provincias: [
      {
        code: "091",
        name: "Cautín",
        comunas: [
          { code: "09101", name: "Temuco" },
          { code: "09102", name: "Carahue" },
          { code: "09103", name: "Cunco" },
          { code: "09104", name: "Curarrehue" },
          { code: "09105", name: "Freire" },
          { code: "09106", name: "Galvarino" },
          { code: "09107", name: "Gorbea" },
          { code: "09108", name: "Lautaro" },
          { code: "09109", name: "Loncoche" },
          { code: "09110", name: "Melipeuco" },
          { code: "09111", name: "Nueva Imperial" },
          { code: "09112", name: "Padre Las Casas" },
          { code: "09113", name: "Perquenco" },
          { code: "09114", name: "Pitrufquén" },
          { code: "09115", name: "Pucón" },
          { code: "09116", name: "Saavedra" },
          { code: "09117", name: "Teodoro Schmidt" },
          { code: "09118", name: "Toltén" },
          { code: "09119", name: "Vilcún" },
          { code: "09120", name: "Villarrica" },
          { code: "09121", name: "Cholchol" },
        ],
      },
      {
        code: "092",
        name: "Malleco",
        comunas: [
          { code: "09201", name: "Angol" },
          { code: "09202", name: "Collipulli" },
          { code: "09203", name: "Curacautín" },
          { code: "09204", name: "Ercilla" },
          { code: "09205", name: "Lonquimay" },
          { code: "09206", name: "Los Sauces" },
          { code: "09207", name: "Lumaco" },
          { code: "09208", name: "Purén" },
          { code: "09209", name: "Renaico" },
          { code: "09210", name: "Traiguén" },
          { code: "09211", name: "Victoria" },
        ],
      },
    ],
  },
  {
    code: "13",
    name: "Región Metropolitana de Santiago",
    shortName: "Metropolitana",
    provincias: [
      {
        code: "131",
        name: "Santiago",
        comunas: [
          { code: "13101", name: "Santiago" },
          { code: "13102", name: "Cerrillos" },
          { code: "13103", name: "Cerro Navia" },
          { code: "13104", name: "Conchalí" },
          { code: "13105", name: "El Bosque" },
          { code: "13106", name: "Estación Central" },
          { code: "13107", name: "Huechuraba" },
          { code: "13108", name: "Independencia" },
          { code: "13109", name: "La Cisterna" },
          { code: "13110", name: "La Florida" },
          { code: "13111", name: "La Granja" },
          { code: "13112", name: "La Pintana" },
          { code: "13113", name: "La Reina" },
          { code: "13114", name: "Las Condes" },
          { code: "13115", name: "Lo Barnechea" },
          { code: "13116", name: "Lo Espejo" },
          { code: "13117", name: "Lo Prado" },
          { code: "13118", name: "Macul" },
          { code: "13119", name: "Maipú" },
          { code: "13120", name: "Ñuñoa" },
          { code: "13121", name: "Pedro Aguirre Cerda" },
          { code: "13122", name: "Peñalolén" },
          { code: "13123", name: "Providencia" },
          { code: "13124", name: "Pudahuel" },
          { code: "13125", name: "Quilicura" },
          { code: "13126", name: "Quinta Normal" },
          { code: "13127", name: "Recoleta" },
          { code: "13128", name: "Renca" },
          { code: "13129", name: "San Joaquín" },
          { code: "13130", name: "San Miguel" },
          { code: "13131", name: "San Ramón" },
          { code: "13132", name: "Vitacura" },
        ],
      },
      {
        code: "132",
        name: "Cordillera",
        comunas: [
          { code: "13201", name: "Puente Alto" },
          { code: "13202", name: "Pirque" },
          { code: "13203", name: "San José de Maipo" },
        ],
      },
      {
        code: "133",
        name: "Chacabuco",
        comunas: [
          { code: "13301", name: "Colina" },
          { code: "13302", name: "Lampa" },
          { code: "13303", name: "Tiltil" },
        ],
      },
      {
        code: "134",
        name: "Maipo",
        comunas: [
          { code: "13401", name: "San Bernardo" },
          { code: "13402", name: "Buin" },
          { code: "13403", name: "Calera de Tango" },
          { code: "13404", name: "Paine" },
        ],
      },
      {
        code: "135",
        name: "Melipilla",
        comunas: [
          { code: "13501", name: "Melipilla" },
          { code: "13502", name: "Alhué" },
          { code: "13503", name: "Curacaví" },
          { code: "13504", name: "María Pinto" },
          { code: "13505", name: "San Pedro" },
        ],
      },
      {
        code: "136",
        name: "Talagante",
        comunas: [
          { code: "13601", name: "Talagante" },
          { code: "13602", name: "El Monte" },
          { code: "13603", name: "Isla de Maipo" },
          { code: "13604", name: "Padre Hurtado" },
          { code: "13605", name: "Peñaflor" },
        ],
      },
    ],
  },
]

// Helper functions
export function getAllRegions(): Region[] {
  return CHILEAN_REGIONS
}

export function getRegionByCode(code: string): Region | undefined {
  return CHILEAN_REGIONS.find((r) => r.code === code)
}

export function getRegionByName(name: string): Region | undefined {
  return CHILEAN_REGIONS.find((r) => r.name === name || r.shortName === name)
}

export function getProvinciasForRegion(regionCode: string): Provincia[] {
  const region = getRegionByCode(regionCode)
  return region?.provincias || []
}

export function getComunasForProvincia(regionCode: string, provinciaCode: string): Comuna[] {
  const region = getRegionByCode(regionCode)
  const provincia = region?.provincias.find((p) => p.code === provinciaCode)
  return provincia?.comunas || []
}

export function getAllComunasForRegion(regionCode: string): Comuna[] {
  const region = getRegionByCode(regionCode)
  if (!region) return []

  return region.provincias.flatMap((p) => p.comunas)
}

export function searchComuna(query: string): { region: Region; provincia: Provincia; comuna: Comuna }[] {
  const results: { region: Region; provincia: Provincia; comuna: Comuna }[] = []
  const lowerQuery = query.toLowerCase()

  for (const region of CHILEAN_REGIONS) {
    for (const provincia of region.provincias) {
      for (const comuna of provincia.comunas) {
        if (comuna.name.toLowerCase().includes(lowerQuery)) {
          results.push({ region, provincia, comuna })
        }
      }
    }
  }

  return results
}

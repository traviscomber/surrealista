// Chilean administrative divisions used by controlled selectors and normalization.
// Region/province names follow the current national administrative structure.

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

function makeComunas(provinceCode: string, names: string[]): Comuna[] {
  return names.map((name, index) => ({
    code: `${provinceCode}${String(index + 1).padStart(2, "0")}`,
    name,
  }))
}

export const CHILEAN_REGIONS: Region[] = [
  {
    code: "15",
    name: "Región de Arica y Parinacota",
    shortName: "Arica y Parinacota",
    provincias: [
      { code: "151", name: "Arica", comunas: makeComunas("151", ["Arica", "Camarones"]) },
      { code: "152", name: "Parinacota", comunas: makeComunas("152", ["Putre", "General Lagos"]) },
    ],
  },
  {
    code: "01",
    name: "Región de Tarapacá",
    shortName: "Tarapacá",
    provincias: [
      { code: "011", name: "Iquique", comunas: makeComunas("011", ["Iquique", "Alto Hospicio"]) },
      { code: "014", name: "Tamarugal", comunas: makeComunas("014", ["Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"]) },
    ],
  },
  {
    code: "02",
    name: "Región de Antofagasta",
    shortName: "Antofagasta",
    provincias: [
      { code: "021", name: "Antofagasta", comunas: makeComunas("021", ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal"]) },
      { code: "022", name: "El Loa", comunas: makeComunas("022", ["Calama", "Ollagüe", "San Pedro de Atacama"]) },
      { code: "023", name: "Tocopilla", comunas: makeComunas("023", ["Tocopilla", "María Elena"]) },
    ],
  },
  {
    code: "03",
    name: "Región de Atacama",
    shortName: "Atacama",
    provincias: [
      { code: "031", name: "Copiapó", comunas: makeComunas("031", ["Copiapó", "Caldera", "Tierra Amarilla"]) },
      { code: "032", name: "Chañaral", comunas: makeComunas("032", ["Chañaral", "Diego de Almagro"]) },
      { code: "033", name: "Huasco", comunas: makeComunas("033", ["Vallenar", "Alto del Carmen", "Freirina", "Huasco"]) },
    ],
  },
  {
    code: "04",
    name: "Región de Coquimbo",
    shortName: "Coquimbo",
    provincias: [
      { code: "041", name: "Elqui", comunas: makeComunas("041", ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña"]) },
      { code: "042", name: "Choapa", comunas: makeComunas("042", ["Illapel", "Canela", "Los Vilos", "Salamanca"]) },
      { code: "043", name: "Limarí", comunas: makeComunas("043", ["Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"]) },
    ],
  },
  {
    code: "05",
    name: "Región de Valparaíso",
    shortName: "Valparaíso",
    provincias: [
      { code: "051", name: "Valparaíso", comunas: makeComunas("051", ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar"]) },
      { code: "052", name: "Isla de Pascua", comunas: makeComunas("052", ["Isla de Pascua"]) },
      { code: "053", name: "Los Andes", comunas: makeComunas("053", ["Los Andes", "Calle Larga", "Rinconada", "San Esteban"]) },
      { code: "054", name: "Petorca", comunas: makeComunas("054", ["La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar"]) },
      { code: "055", name: "Quillota", comunas: makeComunas("055", ["Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales"]) },
      { code: "056", name: "San Antonio", comunas: makeComunas("056", ["San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo"]) },
      { code: "057", name: "San Felipe de Aconcagua", comunas: makeComunas("057", ["San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María"]) },
      { code: "058", name: "Marga Marga", comunas: makeComunas("058", ["Quilpué", "Limache", "Olmué", "Villa Alemana"]) },
    ],
  },
  {
    code: "06",
    name: "Región del Libertador General Bernardo O'Higgins",
    shortName: "O'Higgins",
    provincias: [
      { code: "061", name: "Cachapoal", comunas: makeComunas("061", ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente"]) },
      { code: "062", name: "Cardenal Caro", comunas: makeComunas("062", ["Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones"]) },
      { code: "063", name: "Colchagua", comunas: makeComunas("063", ["San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"]) },
    ],
  },
  {
    code: "07",
    name: "Región del Maule",
    shortName: "Maule",
    provincias: [
      { code: "071", name: "Talca", comunas: makeComunas("071", ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael"]) },
      { code: "072", name: "Cauquenes", comunas: makeComunas("072", ["Cauquenes", "Chanco", "Pelluhue"]) },
      { code: "073", name: "Curicó", comunas: makeComunas("073", ["Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén"]) },
      { code: "074", name: "Linares", comunas: makeComunas("074", ["Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"]) },
    ],
  },
  {
    code: "16",
    name: "Región de Ñuble",
    shortName: "Ñuble",
    provincias: [
      { code: "161", name: "Diguillín", comunas: makeComunas("161", ["Bulnes", "Chillán", "Chillán Viejo", "El Carmen", "Pemuco", "Pinto", "Quillón", "San Ignacio", "Yungay"]) },
      { code: "162", name: "Itata", comunas: makeComunas("162", ["Cobquecura", "Coelemu", "Ninhue", "Portezuelo", "Quirihue", "Ránquil", "Treguaco"]) },
      { code: "163", name: "Punilla", comunas: makeComunas("163", ["Coihueco", "Ñiquén", "San Carlos", "San Fabián", "San Nicolás"]) },
    ],
  },
  {
    code: "08",
    name: "Región del Biobío",
    shortName: "Biobío",
    provincias: [
      { code: "081", name: "Concepción", comunas: makeComunas("081", ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén"]) },
      { code: "082", name: "Arauco", comunas: makeComunas("082", ["Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa"]) },
      { code: "083", name: "Biobío", comunas: makeComunas("083", ["Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío"]) },
    ],
  },
  {
    code: "09",
    name: "Región de La Araucanía",
    shortName: "La Araucanía",
    provincias: [
      { code: "091", name: "Cautín", comunas: makeComunas("091", ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre Las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol"]) },
      { code: "092", name: "Malleco", comunas: makeComunas("092", ["Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"]) },
    ],
  },
  {
    code: "14",
    name: "Región de Los Ríos",
    shortName: "Los Ríos",
    provincias: [
      { code: "141", name: "Valdivia", comunas: makeComunas("141", ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli"]) },
      { code: "142", name: "Ranco", comunas: makeComunas("142", ["La Unión", "Futrono", "Lago Ranco", "Río Bueno"]) },
    ],
  },
  {
    code: "10",
    name: "Región de Los Lagos",
    shortName: "Los Lagos",
    provincias: [
      { code: "101", name: "Llanquihue", comunas: makeComunas("101", ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas"]) },
      { code: "102", name: "Chiloé", comunas: makeComunas("102", ["Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao"]) },
      { code: "103", name: "Osorno", comunas: makeComunas("103", ["Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo"]) },
      { code: "104", name: "Palena", comunas: makeComunas("104", ["Chaitén", "Futaleufú", "Hualaihué", "Palena"]) },
    ],
  },
  {
    code: "11",
    name: "Región de Aysén del General Carlos Ibáñez del Campo",
    shortName: "Aysén",
    provincias: [
      { code: "111", name: "Coyhaique", comunas: makeComunas("111", ["Coyhaique", "Lago Verde"]) },
      { code: "112", name: "Aysén", comunas: makeComunas("112", ["Aysén", "Cisnes", "Guaitecas"]) },
      { code: "113", name: "Capitán Prat", comunas: makeComunas("113", ["Cochrane", "O'Higgins", "Tortel"]) },
      { code: "114", name: "General Carrera", comunas: makeComunas("114", ["Chile Chico", "Río Ibáñez"]) },
    ],
  },
  {
    code: "12",
    name: "Región de Magallanes y de la Antártica Chilena",
    shortName: "Magallanes",
    provincias: [
      { code: "121", name: "Magallanes", comunas: makeComunas("121", ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio"]) },
      { code: "122", name: "Antártica Chilena", comunas: makeComunas("122", ["Cabo de Hornos", "Antártica"]) },
      { code: "123", name: "Tierra del Fuego", comunas: makeComunas("123", ["Porvenir", "Primavera", "Timaukel"]) },
      { code: "124", name: "Última Esperanza", comunas: makeComunas("124", ["Natales", "Torres del Paine"]) },
    ],
  },
  {
    code: "13",
    name: "Región Metropolitana de Santiago",
    shortName: "Metropolitana",
    provincias: [
      { code: "131", name: "Santiago", comunas: makeComunas("131", ["Santiago", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Ramón", "Vitacura"]) },
      { code: "132", name: "Cordillera", comunas: makeComunas("132", ["Puente Alto", "Pirque", "San José de Maipo"]) },
      { code: "133", name: "Chacabuco", comunas: makeComunas("133", ["Colina", "Lampa", "Tiltil"]) },
      { code: "134", name: "Maipo", comunas: makeComunas("134", ["San Bernardo", "Buin", "Calera de Tango", "Paine"]) },
      { code: "135", name: "Melipilla", comunas: makeComunas("135", ["Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro"]) },
      { code: "136", name: "Talagante", comunas: makeComunas("136", ["Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"]) },
    ],
  },
]

export function getAllRegions(): Region[] {
  return CHILEAN_REGIONS
}

export function getRegionByCode(code: string): Region | undefined {
  return CHILEAN_REGIONS.find((region) => region.code === code)
}

export function getRegionByName(name: string): Region | undefined {
  return CHILEAN_REGIONS.find((region) => region.name === name || region.shortName === name)
}

export function getProvinciasForRegion(regionCode: string): Provincia[] {
  return getRegionByCode(regionCode)?.provincias || []
}

export function getComunasForProvincia(regionCode: string, provinciaCode: string): Comuna[] {
  return getRegionByCode(regionCode)?.provincias.find((province) => province.code === provinciaCode)?.comunas || []
}

export function getAllComunasForRegion(regionCode: string): Comuna[] {
  return getRegionByCode(regionCode)?.provincias.flatMap((province) => province.comunas) || []
}

export function searchComuna(query: string): { region: Region; provincia: Provincia; comuna: Comuna }[] {
  const target = query.toLocaleLowerCase("es-CL")
  const results: { region: Region; provincia: Provincia; comuna: Comuna }[] = []

  for (const region of CHILEAN_REGIONS) {
    for (const provincia of region.provincias) {
      for (const comuna of provincia.comunas) {
        if (comuna.name.toLocaleLowerCase("es-CL").includes(target)) results.push({ region, provincia, comuna })
      }
    }
  }

  return results
}

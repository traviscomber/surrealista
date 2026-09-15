export type ProspectingSpeciesOption = {
  value: string
  label: string
  group: string
  keywords: string[]
}

export const PROSPECTING_SPECIES_OPTIONS: ProspectingSpeciesOption[] = [
  { value: "CEREZO", label: "Cerezo", group: "Carozos", keywords: ["cereza", "cerezas", "cerezo", "cerezos", "cherry"] },
  { value: "CIRUELO EUROPEO", label: "Ciruelo europeo", group: "Carozos", keywords: ["ciruela", "ciruelas", "ciruelo europeo", "prune"] },
  { value: "CIRUELO JAPONES", label: "Ciruelo japonés", group: "Carozos", keywords: ["ciruelo japones", "ciruela japonesa", "ciruelas japonesas"] },
  { value: "DURAZNERO", label: "Duraznero", group: "Carozos", keywords: ["durazno", "duraznos", "duraznero", "melocoton"] },
  { value: "NECTARINO", label: "Nectarino", group: "Carozos", keywords: ["nectarina", "nectarinas", "nectarino", "nectarinos"] },
  { value: "DAMASCO", label: "Damasco", group: "Carozos", keywords: ["damasco", "damascos", "albaricoque"] },
  { value: "MANZANO", label: "Manzano", group: "Pomáceas", keywords: ["manzana", "manzanas", "manzano", "manzanos", "apple"] },
  { value: "PERAL", label: "Peral", group: "Pomáceas", keywords: ["pera", "peras", "peral", "perales", "pear"] },
  { value: "MEMBRILLO", label: "Membrillo", group: "Pomáceas", keywords: ["membrillo", "membrillos"] },
  { value: "ARANDANO", label: "Arándano", group: "Berries", keywords: ["arandano", "arandanos", "blueberry", "blueberries"] },
  { value: "FRAMBUESA", label: "Frambuesa", group: "Berries", keywords: ["frambuesa", "frambuesas", "raspberry"] },
  { value: "FRUTILLA", label: "Frutilla", group: "Berries", keywords: ["frutilla", "frutillas", "fresa", "fresas", "strawberry"] },
  { value: "MORA", label: "Mora", group: "Berries", keywords: ["mora", "moras", "blackberry"] },
  { value: "NOGAL", label: "Nogal", group: "Frutos secos", keywords: ["nuez", "nueces", "nogal", "nogales", "walnut"] },
  { value: "AVELLANO EUROPEO", label: "Avellano europeo", group: "Frutos secos", keywords: ["avellana", "avellanas", "avellano europeo", "hazelnut"] },
  { value: "ALMENDRO", label: "Almendro", group: "Frutos secos", keywords: ["almendra", "almendras", "almendro", "almendros"] },
  { value: "CASTANO", label: "Castaño", group: "Frutos secos", keywords: ["castano", "castanos", "castaña", "castañas"] },
  { value: "KIWI", label: "Kiwi", group: "Otros frutales", keywords: ["kiwi", "kiwis"] },
  { value: "VID DE MESA", label: "Vid de mesa", group: "Otros frutales", keywords: ["uva de mesa", "uvas de mesa", "vid de mesa", "parron"] },
  { value: "VID VINIFERA", label: "Vid vinífera", group: "Otros frutales", keywords: ["uva vinifera", "uva vinifera", "vid vinifera", "viña", "vina"] },
  { value: "OLIVO", label: "Olivo", group: "Otros frutales", keywords: ["oliva", "olivas", "aceituna", "aceitunas", "olivo", "olivos"] },
  { value: "PALTO", label: "Palto", group: "Otros frutales", keywords: ["palta", "paltas", "palto", "paltos", "avocado"] },
  { value: "LIMONERO", label: "Limonero", group: "Cítricos", keywords: ["limon", "limones", "limonero", "limoneros"] },
  { value: "NARANJO", label: "Naranjo", group: "Cítricos", keywords: ["naranja", "naranjas", "naranjo", "naranjos"] },
  { value: "MANDARINO", label: "Mandarino", group: "Cítricos", keywords: ["mandarina", "mandarinas", "mandarino", "mandarinos", "clementina"] },
]

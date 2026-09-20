export type ChileRegionKey =
  | "arica-parinacota"
  | "tarapaca"
  | "antofagasta"
  | "atacama"
  | "coquimbo"
  | "valparaiso"
  | "metropolitana"
  | "ohiggins"
  | "maule"
  | "nuble"
  | "biobio"
  | "araucania"
  | "los-rios"
  | "los-lagos"
  | "aysen"
  | "magallanes"

const REGION_ALIASES: Array<{ key: ChileRegionKey; label: string; aliases: string[] }> = [
  { key: "arica-parinacota", label: "Arica y Parinacota", aliases: ["arica y parinacota", "arica parinacota", "arica"] },
  { key: "tarapaca", label: "Tarapacá", aliases: ["tarapaca"] },
  { key: "antofagasta", label: "Antofagasta", aliases: ["antofagasta"] },
  { key: "atacama", label: "Atacama", aliases: ["atacama"] },
  { key: "coquimbo", label: "Coquimbo", aliases: ["coquimbo"] },
  { key: "valparaiso", label: "Valparaíso", aliases: ["valparaiso"] },
  { key: "metropolitana", label: "Metropolitana de Santiago", aliases: ["metropolitana", "metropolitana de santiago", "region metropolitana", "rm", "santiago"] },
  { key: "ohiggins", label: "O'Higgins", aliases: ["ohiggins", "o higgins", "o'higgins", "o’higgins", "libertador general bernardo ohiggins", "libertador general bernardo o higgins", "libertador bernardo ohiggins", "libertador bernardo o higgins", "region del libertador general bernardo ohiggins"] },
  { key: "maule", label: "Maule", aliases: ["maule"] },
  { key: "nuble", label: "Ñuble", aliases: ["nuble", "ñuble"] },
  { key: "biobio", label: "Biobío", aliases: ["biobio", "bio bio", "bío bío", "bio-bio"] },
  { key: "araucania", label: "La Araucanía", aliases: ["araucania", "la araucania"] },
  { key: "los-rios", label: "Los Ríos", aliases: ["los rios", "rios"] },
  { key: "los-lagos", label: "Los Lagos", aliases: ["los lagos", "lagos"] },
  { key: "aysen", label: "Aysén", aliases: ["aysen", "aysen del general carlos ibanez del campo", "region de aysen del general carlos ibanez del campo"] },
  { key: "magallanes", label: "Magallanes", aliases: ["magallanes", "magallanes y de la antartica chilena", "region de magallanes y de la antartica chilena"] },
]

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\bregion\b/g, " ")
    .replace(/\b(del|de|la)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

export function canonicalRegionKey(value: unknown): ChileRegionKey | null {
  const target = normalize(value)
  if (!target) return null
  for (const region of REGION_ALIASES) {
    if (region.aliases.some((alias) => normalize(alias) === target)) return region.key
  }
  return null
}

export function canonicalRegionLabel(value: unknown): string | null {
  const key = canonicalRegionKey(value)
  return REGION_ALIASES.find((region) => region.key === key)?.label ?? null
}

export function sameChileRegion(a: unknown, b: unknown) {
  const left = canonicalRegionKey(a)
  const right = canonicalRegionKey(b)
  return Boolean(left && right && left === right)
}

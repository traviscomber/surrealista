import { createClient } from "@supabase/supabase-js"
import { normalizeOwnerResearchRol } from "@/lib/prospeccion/owner-research-cache"

export type VerifiedOwnerContact = {
  name: string | null
  phone: string | null
  email: string | null
  source: "properties_enhanced" | "properties_summary" | "kmz_collection"
  confidence: number
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function normalizeName(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function clean(value: unknown) {
  const text = String(value ?? "").trim()
  return text || null
}

function rolVariants(value: string) {
  const canonical = normalizeOwnerResearchRol(value)
  return Array.from(new Set([canonical, canonical.replace(/-/g, "/"), canonical.replace(/-/g, "")].filter(Boolean)))
}

export async function lookupVerifiedOwnerContact(input: { rol: string; ownerName?: string | null }) {
  const supabase = db()
  const rol = normalizeOwnerResearchRol(input.rol)
  const ownerName = normalizeName(input.ownerName)
  if (!supabase || !rol || !ownerName) return null

  const variants = rolVariants(rol)
  const [enhanced, summary, kmz] = await Promise.all([
    supabase
      .from("properties_enhanced")
      .select("property_rol,owner_name,contact_name,contact_phone,contact_email")
      .in("property_rol", variants)
      .limit(20),
    supabase
      .from("properties_summary")
      .select("property_rol,owner_name,contact_name,contact_phone,contact_email")
      .in("property_rol", variants)
      .limit(20),
    supabase
      .from("kmz_collection")
      .select("owner,pic,pic_phone,pic_email,rol_numbers,metadata,is_active")
      .eq("is_active", true)
      .not("rol_numbers", "is", null)
      .limit(5000),
  ])

  for (const [source, rows] of [
    ["properties_enhanced", enhanced.data ?? []],
    ["properties_summary", summary.data ?? []],
  ] as const) {
    for (const row of rows) {
      if (normalizeName(row.owner_name) !== ownerName) continue
      const phone = clean(row.contact_phone)
      const email = clean(row.contact_email)
      if (!phone && !email) continue
      return {
        name: clean(row.contact_name) || clean(row.owner_name),
        phone,
        email,
        source,
        confidence: 0.98,
      } satisfies VerifiedOwnerContact
    }
  }

  for (const row of kmz.data ?? []) {
    const rowRoles = Array.isArray(row.rol_numbers) ? row.rol_numbers.map(normalizeOwnerResearchRol) : []
    const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {}
    for (const key of ["rol", "rol_predio", "rolpredi", "property_rol"]) {
      if (metadata[key]) rowRoles.push(normalizeOwnerResearchRol(metadata[key]))
    }
    if (!rowRoles.includes(rol)) continue

    const candidateOwner = clean(metadata.confirmed_owner) || clean(row.owner)
    if (normalizeName(candidateOwner) !== ownerName) continue
    const phone = clean(row.pic_phone) || clean(metadata.contact_phone)
    const email = clean(row.pic_email) || clean(metadata.contact_email)
    if (!phone && !email) continue

    return {
      name: clean(row.pic) || candidateOwner,
      phone,
      email,
      source: "kmz_collection",
      confidence: metadata.confirmed_owner ? 0.99 : 0.96,
    } satisfies VerifiedOwnerContact
  }

  return null
}

export function scoreOwnerOpportunity(input: {
  decision: "contactar" | "validar_propietario" | "descartar"
  ownerConfidence?: number | null
  contact?: VerifiedOwnerContact | null
}) {
  if (input.decision === "descartar") return 0
  const ownerConfidence = Math.max(0, Math.min(1, Number(input.ownerConfidence) || 0))
  const ownerPoints = Math.round(ownerConfidence * 55)
  const contactPoints = input.contact?.phone || input.contact?.email ? 35 : 0
  const decisionPoints = input.decision === "contactar" ? 10 : 0
  return Math.min(100, ownerPoints + contactPoints + decisionPoints)
}

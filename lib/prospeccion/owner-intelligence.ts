import { createClient } from "@supabase/supabase-js"
import { CHILEAN_REGIONS } from "@/lib/chile-locations"
import { normalizeSearchText } from "@/lib/prospeccion/normalization"

export type OwnerEvidence = {
  source: "internal_exact_rol" | "sii_tax_roll" | "ciren_directory" | "cbr_verification"
  title: string
  ownerName: string | null
  confidence: number
  documentType: string
  url: string
  note: string
}

export type OwnerResearchAttempt = {
  source: OwnerEvidence["source"]
  status: "found" | "not_found" | "unavailable" | "requires_dataset" | "manual_verification"
  note: string
}

export type OwnerResearchResult = {
  rol: string
  commune: string | null
  owner: OwnerEvidence | null
  evidence: OwnerEvidence[]
  attempts: OwnerResearchAttempt[]
  status: "owner_candidate_found" | "owner_pending"
  nextAction: string
}

const KNOWN_SII_COMMUNES: Record<string, { code: string; name: string; regionCode: string; regionName: string }> = {
  curico: { code: "07101", name: "Curicó", regionCode: "07", regionName: "Maule" },
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function normalizeRol(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/[^0-9K-]/g, "")
}

function looksLikeRealOwner(value: unknown) {
  const name = String(value ?? "").trim()
  if (!name || name.length < 4) return false
  const normalized = normalizeSearchText(name)
  if (!normalized) return false
  const junk = [
    "planta curico",
    "curico romeral",
    "lote",
    "kmz",
    "has curico",
    "ha curico",
    "propiedad",
    "predio",
  ]
  if (junk.some((token) => normalized === token || normalized.endsWith(` ${token}`))) return false
  return true
}

function findCommuneCode(commune: string) {
  const key = normalizeSearchText(commune)
  if (!key) return null
  const known = KNOWN_SII_COMMUNES[key]
  if (known) return known
  for (const region of CHILEAN_REGIONS) {
    for (const province of region.provincias) {
      const found = province.comunas.find((item) => normalizeSearchText(item.name) === key)
      if (found) return { code: found.code, name: found.name, regionCode: region.code, regionName: region.shortName }
    }
  }
  return null
}

async function lookupInternalExactRol(rol: string): Promise<OwnerEvidence[]> {
  const supabase = db()
  if (!supabase) return []
  const normalizedRol = normalizeRol(rol)
  const evidence: OwnerEvidence[] = []

  const [kmzResult, enhancedResult, summaryResult] = await Promise.all([
    supabase
      .from("kmz_collection")
      .select("id,file_name,owner,pic,pic_phone,pic_email,rol_numbers,metadata,is_active")
      .contains("rol_numbers", [normalizedRol])
      .eq("is_active", true)
      .limit(10),
    supabase
      .from("properties_enhanced")
      .select("id,title,property_rol,owner_name,contact_name,contact_phone,contact_email")
      .eq("property_rol", normalizedRol)
      .limit(10),
    supabase
      .from("properties_summary")
      .select("id,title,property_rol,owner_name,contact_name,contact_phone,contact_email")
      .eq("property_rol", normalizedRol)
      .limit(10),
  ])

  for (const row of kmzResult.data ?? []) {
    const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, any> : {}
    const candidates = [
      { name: metadata.confirmed_owner, confidence: 0.99, type: "confirmed-owner" },
      { name: row.owner, confidence: 0.97, type: "kmz-owner" },
      { name: metadata.confirmed_company, confidence: 0.95, type: "confirmed-company" },
      { name: typeof metadata.public_owner_candidate === "string" ? metadata.public_owner_candidate : metadata.public_owner_candidate?.name, confidence: Number(metadata.owner_confidence || metadata.public_owner_candidate?.confidence || 0), type: "public-owner-candidate" },
    ]
    for (const candidate of candidates) {
      if (!looksLikeRealOwner(candidate.name)) continue
      const confidence = candidate.confidence > 0 ? candidate.confidence : 0.55
      evidence.push({
        source: "internal_exact_rol",
        title: `Sur Realista · ROL exacto ${rol}`,
        ownerName: String(candidate.name).trim(),
        confidence,
        documentType: candidate.type,
        url: `/admin/kmz-collection?id=${encodeURIComponent(String(row.id))}`,
        note: "Coincidencia exacta de ROL en inventario interno. Debe revalidarse antes de contacto si no está marcado como confirmado.",
      })
      break
    }
  }

  for (const row of [...(enhancedResult.data ?? []), ...(summaryResult.data ?? [])]) {
    if (!looksLikeRealOwner(row.owner_name)) continue
    evidence.push({
      source: "internal_exact_rol",
      title: `Sur Realista · propiedad enriquecida · ROL ${rol}`,
      ownerName: String(row.owner_name).trim(),
      confidence: 0.9,
      documentType: "enriched-property-owner",
      url: `/busqueda?rol=${encodeURIComponent(rol)}`,
      note: "Propietario almacenado en una propiedad interna con el mismo ROL.",
    })
  }

  return evidence
}

async function lookupSiiTaxRoll(rol: string, commune: string): Promise<{ evidence: OwnerEvidence[]; attempt: OwnerResearchAttempt }> {
  const location = findCommuneCode(commune)
  if (!location) {
    return { evidence: [], attempt: { source: "sii_tax_roll", status: "unavailable", note: "No se pudo resolver el código oficial de la comuna para consultar SII." } }
  }

  const [manzana, predio] = normalizeRol(rol).split("-")
  if (!manzana || !predio) {
    return { evidence: [], attempt: { source: "sii_tax_roll", status: "unavailable", note: "El ROL no tiene el formato manzana-predio requerido por SII." } }
  }

  let browser: any = null
  try {
    const [{ default: puppeteer }, { default: chromium }] = await Promise.all([
      import("puppeteer"),
      import("@sparticuz/chromium"),
    ])
    const executablePath = await chromium.executablePath()
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 900 },
      executablePath,
      headless: true,
    })
    const page = await browser.newPage()
    page.setDefaultTimeout(10_000)
    await page.goto("https://zeus.sii.cl/avalu_cgi/br/br_rol.sh", { waitUntil: "domcontentloaded", timeout: 15_000 })

    const formResult = await page.evaluate(({
      communeCode,
      communeName,
      manzanaValue,
      predioValue,
    }: {
      communeCode: string
      communeName: string
      manzanaValue: string
      predioValue: string
    }) => {
      const norm = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
      const selects = Array.from(document.querySelectorAll("select")) as HTMLSelectElement[]
      let communeSelect: HTMLSelectElement | null = null
      let communeValue = ""
      for (const select of selects) {
        const match = Array.from(select.options).find((option) => option.value === communeCode || norm(option.textContent).includes(norm(communeName)))
        if (match) { communeSelect = select; communeValue = match.value; break }
      }
      if (communeSelect) {
        communeSelect.value = communeValue
        communeSelect.dispatchEvent(new Event("change", { bubbles: true }))
      }

      const textInputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])')) as HTMLInputElement[]
      const rolInputs = textInputs.filter((input) => {
        const context = norm(input.closest("tr")?.textContent || input.parentElement?.textContent || input.name || input.id)
        return context.includes("rol") || context.includes("manzana") || context.includes("predio")
      })
      const candidates = rolInputs.length >= 2 ? rolInputs : textInputs
      const numericCandidates = candidates.filter((input) => !/comuna/i.test(input.name || input.id))
      if (numericCandidates[0]) numericCandidates[0].value = manzanaValue
      if (numericCandidates[1]) numericCandidates[1].value = predioValue

      const submit = Array.from(document.querySelectorAll('input[type="submit"], button')).find((node) => /buscar|consultar/i.test(node.textContent || (node as HTMLInputElement).value || "")) as HTMLElement | undefined
      return { hasCommune: Boolean(communeSelect), communeValue, hasRolInputs: numericCandidates.length >= 2, submitTag: submit?.tagName || null, submitText: submit?.textContent || (submit as HTMLInputElement | undefined)?.value || null }
    }, { communeCode: location.code, communeName: location.name, manzanaValue: manzana, predioValue: predio })

    if (!formResult.hasCommune || !formResult.hasRolInputs) {
      return { evidence: [], attempt: { source: "sii_tax_roll", status: "unavailable", note: "SII respondió, pero el formulario cambió y no fue posible completar comuna/ROL de forma segura." } }
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 12_000 }).catch(() => null),
      page.evaluate(() => {
        const submit = Array.from(document.querySelectorAll('input[type="submit"], button')).find((node) => /buscar|consultar/i.test(node.textContent || (node as HTMLInputElement).value || "")) as HTMLElement | undefined
        submit?.click()
      }),
    ])

    const parsed = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("tr"))
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll("th,td")).map((cell) => (cell.textContent || "").replace(/\s+/g, " ").trim())
        for (let i = 0; i < cells.length; i += 1) {
          if (/nombre\s+(del\s+)?propietario/i.test(cells[i])) {
            const value = cells.slice(i + 1).find((cell) => cell && !/rut|direcci[oó]n|rol/i.test(cell)) || ""
            if (value) return { owner: value, body: "" }
          }
        }
      }
      const body = (document.body?.innerText || "").replace(/\r/g, "")
      const match = body.match(/Nombre\s+(?:del\s+)?Propietario\s*[:\-]?\s*([^\n]{4,120})/i)
      return { owner: match?.[1]?.trim() || "", body: body.slice(0, 4000) }
    })

    if (looksLikeRealOwner(parsed.owner)) {
      const evidence: OwnerEvidence = {
        source: "sii_tax_roll",
        title: `SII · Rol semestral · ${location.name} · ${rol}`,
        ownerName: parsed.owner,
        confidence: 0.9,
        documentType: "sii-tax-roll-owner",
        url: "https://zeus.sii.cl/avalu_cgi/br/br_rol.sh",
        note: "Nombre registrado ante SII para efectos de impuesto territorial. SII no acredita dominio; el dueño jurídico debe verificarse en el Conservador de Bienes Raíces.",
      }
      return { evidence: [evidence], attempt: { source: "sii_tax_roll", status: "found", note: "SII devolvió un nombre asociado al ROL." } }
    }

    return {
      evidence: [],
      attempt: {
        source: "sii_tax_roll",
        status: "not_found",
        note: /captcha|c[oó]digo de seguridad/i.test(parsed.body) ? "SII exigió validación interactiva/captcha en esta ejecución." : "SII respondió sin un nombre de propietario parseable para este ROL.",
      },
    }
  } catch (error) {
    return {
      evidence: [],
      attempt: { source: "sii_tax_roll", status: "unavailable", note: `Consulta SII no disponible: ${error instanceof Error ? error.message.slice(0, 180) : "error desconocido"}.` },
    }
  } finally {
    await browser?.close().catch(() => undefined)
  }
}

export async function researchOwnerByRol(input: { rol: string; commune?: string | null }): Promise<OwnerResearchResult> {
  const rol = normalizeRol(input.rol)
  const commune = String(input.commune ?? "").trim()
  const evidence: OwnerEvidence[] = []
  const attempts: OwnerResearchAttempt[] = []

  const internal = await lookupInternalExactRol(rol)
  evidence.push(...internal)
  attempts.push({ source: "internal_exact_rol", status: internal.length ? "found" : "not_found", note: internal.length ? `Se encontraron ${internal.length} evidencias internas con ROL exacto.` : "Sin propietario confiable en las tablas internas para este ROL." })

  if (!internal.some((item) => item.confidence >= 0.95) && commune) {
    const sii = await lookupSiiTaxRoll(rol, commune)
    evidence.push(...sii.evidence)
    attempts.push(sii.attempt)
  }

  attempts.push({
    source: "ciren_directory",
    status: "requires_dataset",
    note: "El Directorio Frutícola CIREN con razón social es un producto comercial. El conector queda preparado para usarlo cuando el archivo/licencia esté disponible; no se simula acceso que no existe.",
  })
  attempts.push({
    source: "cbr_verification",
    status: "manual_verification",
    note: "El Conservador acredita dominio vigente. Requiere la jurisdicción y antecedentes registrales correctos; se usa como verificación jurídica, no como fuente inventada por IA.",
  })

  const best = evidence
    .filter((item) => item.ownerName && looksLikeRealOwner(item.ownerName))
    .sort((a, b) => b.confidence - a.confidence)[0] ?? null

  return {
    rol,
    commune: commune || null,
    owner: best,
    evidence: evidence.sort((a, b) => b.confidence - a.confidence),
    attempts,
    status: best ? "owner_candidate_found" : "owner_pending",
    nextAction: best
      ? best.source === "sii_tax_roll"
        ? "Usar el nombre SII como pista fuerte y validar dominio vigente en el Conservador antes de contacto."
        : "Revalidar la evidencia de propietario y resolver un contacto verificable antes de acercamiento."
      : "SII/CIREN/CBR siguen siendo las fuentes de cierre. Si SII no resuelve automáticamente, verificar el ROL en SII y luego dominio vigente en CBR; cargar Directorio Frutícola CIREN cuando esté disponible.",
  }
}

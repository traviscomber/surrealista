import { createClient } from "@supabase/supabase-js"
import { CHILEAN_REGIONS } from "@/lib/chile-locations"
import { normalizeSearchText } from "@/lib/prospeccion/normalization"
import { researchOwnerOnPublicWeb, type WebOwnerRelation } from "@/lib/prospeccion/owner-web-intelligence"

export type OwnerRelation = Exclude<WebOwnerRelation, "unknown">

export type OwnerEvidence = {
  source: "internal_exact_rol" | "sii_tax_roll" | "public_web" | "ciren_directory" | "cbr_verification"
  relation: OwnerRelation
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

type ResolvedParty = {
  name: string
  confidence: number
  source: OwnerEvidence["source"]
  evidenceUrl: string
  documentType: string
  relation: OwnerRelation
}

export type OwnerResearchResult = {
  rol: string
  commune: string | null
  owner: OwnerEvidence | null
  producer: ResolvedParty | null
  historicalOwner: ResolvedParty | null
  evidence: OwnerEvidence[]
  attempts: OwnerResearchAttempt[]
  status: "owner_candidate_found" | "producer_candidate_found" | "historical_owner_found" | "owner_pending"
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
    .replace(/\//g, "-")
    .replace(/\s+/g, "")
    .replace(/[^0-9K-]/g, "")
    .replace(/-+/g, "-")
}

function rolVariants(value: unknown) {
  const canonical = normalizeRol(value)
  if (!canonical) return []
  return Array.from(new Set([canonical, canonical.replace(/-/g, "/"), canonical.replace(/-/g, "")]))
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
      .eq("is_active", true)
      .not("rol_numbers", "is", null)
      .limit(5000),
    supabase
      .from("properties_enhanced")
      .select("id,title,property_rol,owner_name,contact_name,contact_phone,contact_email")
      .in("property_rol", rolVariants(normalizedRol))
      .limit(20),
    supabase
      .from("properties_summary")
      .select("id,title,property_rol,owner_name,contact_name,contact_phone,contact_email")
      .in("property_rol", rolVariants(normalizedRol))
      .limit(20),
  ])

  for (const row of kmzResult.data ?? []) {
    const rowRoles = Array.isArray(row.rol_numbers) ? row.rol_numbers.map(normalizeRol) : []
    const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, any> : {}
    for (const key of ["rol", "rol_predio", "rolpredi", "property_rol"]) {
      if (metadata[key]) rowRoles.push(normalizeRol(metadata[key]))
    }
    if (!rowRoles.includes(normalizedRol)) continue

    const publicCandidate = typeof metadata.public_owner_candidate === "string"
      ? metadata.public_owner_candidate
      : metadata.public_owner_candidate?.name
    const candidates = [
      { name: metadata.confirmed_owner, confidence: 0.99, type: "confirmed-owner", url: metadata.cbr_document_url || metadata.web_owner_evidence_url },
      { name: row.owner, confidence: 0.97, type: "kmz-owner", url: metadata.cbr_document_url || metadata.web_owner_evidence_url },
      { name: metadata.confirmed_company, confidence: 0.95, type: "confirmed-company", url: metadata.cbr_document_url || metadata.web_owner_evidence_url },
      { name: publicCandidate, confidence: Number(metadata.owner_confidence || metadata.public_owner_candidate?.confidence || 0), type: "public-owner-candidate", url: metadata.web_owner_evidence_url },
    ]

    for (const candidate of candidates) {
      if (!looksLikeRealOwner(candidate.name)) continue
      if (candidate.type === "public-owner-candidate" && (!candidate.url || candidate.confidence < 0.75)) continue
      evidence.push({
        source: "internal_exact_rol",
        relation: "legal_owner",
        title: `Sur Realista · ROL exacto ${rol}`,
        ownerName: String(candidate.name).trim(),
        confidence: candidate.confidence > 0 ? candidate.confidence : 0.55,
        documentType: candidate.type,
        url: String(candidate.url || `/admin/kmz-collection?id=${encodeURIComponent(String(row.id))}`),
        note: "Coincidencia exacta de ROL en inventario interno. Si no proviene de dominio vigente, se mantiene como candidato y debe revalidarse antes de contacto.",
      })
      break
    }
  }

  for (const row of [...(enhancedResult.data ?? []), ...(summaryResult.data ?? [])]) {
    if (!looksLikeRealOwner(row.owner_name)) continue
    evidence.push({
      source: "internal_exact_rol",
      relation: "legal_owner",
      title: `Sur Realista · propiedad enriquecida · ROL ${rol}`,
      ownerName: String(row.owner_name).trim(),
      confidence: 0.9,
      documentType: "enriched-property-owner",
      url: `/busqueda?rol=${encodeURIComponent(rol)}`,
      note: "Propietario almacenado en una propiedad interna con el mismo ROL; requiere revalidación si no existe documento registral enlazado.",
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
      return { hasCommune: Boolean(communeSelect), hasRolInputs: numericCandidates.length >= 2, hasSubmit: Boolean(submit) }
    }, { communeCode: location.code, communeName: location.name, manzanaValue: manzana, predioValue: predio })

    if (!formResult.hasCommune || !formResult.hasRolInputs || !formResult.hasSubmit) {
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
      return {
        evidence: [{
          source: "sii_tax_roll",
          relation: "legal_owner",
          title: `SII · Rol semestral · ${location.name} · ${rol}`,
          ownerName: parsed.owner,
          confidence: 0.9,
          documentType: "sii-tax-roll-owner-candidate",
          url: "https://zeus.sii.cl/avalu_cgi/br/br_rol.sh",
          note: "Nombre asociado al ROL ante SII para efectos tributarios. Es una pista fuerte, pero SII no acredita dominio jurídico; debe verificarse con dominio vigente del CBR.",
        }],
        attempt: { source: "sii_tax_roll", status: "found", note: "SII devolvió un nombre asociado al ROL." },
      }
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

function partyFromEvidence(item: OwnerEvidence | undefined): ResolvedParty | null {
  if (!item?.ownerName) return null
  return {
    name: item.ownerName,
    confidence: item.confidence,
    source: item.source,
    evidenceUrl: item.url,
    documentType: item.documentType,
    relation: item.relation,
  }
}

export async function researchOwnerByRol(input: { rol: string; commune?: string | null }): Promise<OwnerResearchResult> {
  const rol = normalizeRol(input.rol)
  const commune = String(input.commune ?? "").trim()
  const evidence: OwnerEvidence[] = []
  const attempts: OwnerResearchAttempt[] = []

  const internal = await lookupInternalExactRol(rol)
  evidence.push(...internal)
  attempts.push({
    source: "internal_exact_rol",
    status: internal.length ? "found" : "not_found",
    note: internal.length ? `Se encontraron ${internal.length} evidencias internas con ROL exacto.` : "Sin propietario confiable en las tablas internas para este ROL.",
  })

  let siiFound = false
  if (!internal.some((item) => item.relation === "legal_owner" && item.confidence >= 0.95) && commune) {
    const sii = await lookupSiiTaxRoll(rol, commune)
    evidence.push(...sii.evidence)
    attempts.push(sii.attempt)
    siiFound = sii.evidence.some((item) => item.ownerName)
  }

  if (!internal.some((item) => item.relation === "legal_owner" && item.confidence >= 0.95) && !siiFound && commune) {
    const web = await researchOwnerOnPublicWeb({ rol, commune })
    if (!web.available) {
      attempts.push({ source: "public_web", status: "unavailable", note: "Búsqueda pública no disponible porque falta el proveedor de búsqueda o el extractor IA." })
    } else if (!web.evidence) {
      attempts.push({ source: "public_web", status: "not_found", note: `Se ejecutaron ${web.attemptedQueries} consultas públicas sin evidencia suficiente que coincidiera en ROL + comuna.` })
    } else {
      evidence.push({
        source: "public_web",
        relation: web.evidence.relation,
        title: `Web pública · ${web.evidence.source} · ROL ${rol}`,
        ownerName: web.evidence.name,
        confidence: web.evidence.confidence,
        documentType: web.evidence.relation === "producer_operator" ? "producer-operator-evidence" : web.evidence.relation === "historical_owner" ? "historical-owner-evidence" : "public-owner-evidence",
        url: web.evidence.url,
        note: web.evidence.relation === "producer_operator"
          ? "La fuente vincula un productor/operador con este ROL y comuna; no acredita dominio."
          : web.evidence.relation === "historical_owner"
            ? "La fuente identifica propietario en evidencia histórica; no se asume vigencia actual."
            : "La fuente pública nombra explícitamente propietario/dueño/titular para este ROL y comuna; CBR sigue siendo la validación jurídica final.",
      })
      attempts.push({ source: "public_web", status: "found", note: `Evidencia pública clasificada como ${web.evidence.relation}; se preserva la diferencia entre propietario, productor e histórico.` })
    }
  }

  attempts.push({
    source: "ciren_directory",
    status: "requires_dataset",
    note: "El Directorio Frutícola CIREN con razón social es un producto comercial. El conector queda preparado para usarlo cuando el archivo/licencia esté disponible; no se simula acceso que no existe.",
  })
  attempts.push({
    source: "cbr_verification",
    status: "manual_verification",
    note: "El Conservador acredita dominio vigente. Para Curicó, Conservadores Digitales identifica al Conservador de Bienes Raíces de Curicó dentro de su red; el cierre jurídico requiere índice/antecedentes registrales y dominio vigente cuando corresponda.",
  })

  const sorted = evidence
    .filter((item) => item.ownerName && looksLikeRealOwner(item.ownerName))
    .sort((a, b) => b.confidence - a.confidence)
  const ownerEvidence = sorted.find((item) => item.relation === "legal_owner") ?? null
  const producerEvidence = sorted.find((item) => item.relation === "producer_operator")
  const historicalEvidence = sorted.find((item) => item.relation === "historical_owner")

  const status: OwnerResearchResult["status"] = ownerEvidence
    ? "owner_candidate_found"
    : producerEvidence
      ? "producer_candidate_found"
      : historicalEvidence
        ? "historical_owner_found"
        : "owner_pending"

  return {
    rol,
    commune: commune || null,
    owner: ownerEvidence,
    producer: partyFromEvidence(producerEvidence),
    historicalOwner: partyFromEvidence(historicalEvidence),
    evidence: sorted,
    attempts,
    status,
    nextAction: ownerEvidence
      ? ownerEvidence.source === "sii_tax_roll"
        ? "Usar el nombre SII como pista fuerte y validar dominio vigente en el Conservador de Bienes Raíces antes de contacto."
        : "Revalidar la evidencia y obtener dominio vigente si se necesita certeza jurídica antes del acercamiento."
      : producerEvidence
        ? "Usar el productor/operador como pista comercial, pero no presentarlo como dueño; continuar a CBR/CIREN para resolver dominio."
        : historicalEvidence
          ? "Usar el propietario histórico para rastrear la cadena de títulos; no asumir que sigue siendo el dueño actual."
          : "Mantener el ROL en investigación: CIREN Directorio Frutícola y dominio vigente CBR son las fuentes de cierre si SII/web no resuelven.",
  }
}

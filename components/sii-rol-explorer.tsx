"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type RoleResult = {
  rol?: string
  rol_manzana?: string
  rol_predio?: string
  direccion?: string
  destino?: string
  comuna?: string
  comuna_codigo?: string
  comunaCodigo?: string
  source?: string
  confidence?: number
}

type AvaluoResult = RoleResult & {
  avaluoTotal?: number
  avaluoAfecto?: number
  avaluoExento?: number
  superficieTerreno?: number
  superficieConstruida?: number
  areaHomogenea?: string
  periodo?: string
}

type CommuneResult = {
  codigo: string
  nombre: string
}

type CbrRouteResult = {
  source: string
  conservatorName: string
  communeName: string
  communeCode?: string
  rol?: string
  supportsOnlineIndex: boolean
  supportsOnlineDomainRequest: boolean
  searchUrl: string
  domainUrl?: string
  notes: string[]
  references: Array<{
    label: string
    url: string
    verified: boolean
  }>
}

type EvidenceConfidence = "candidate" | "probable" | "strong"

type PublicSearchLink = {
  label: string
  url: string
  note: string
  query: string
}

type QueueTier = "critical" | "high" | "medium" | "low"
type QueueStatus = "pending" | "evidence-found" | "confirmed" | "skipped"

type OwnerResearchQueueItem = {
  rol: string
  priorityScore: number
  priorityTier: QueueTier
  status: QueueStatus
  southFocus: boolean
  resolvedAt?: string | null
  resolvedRecently?: boolean
  affectedKmzCount: number
  evidenceCount: number
  confirmedCount: number
  regions: string[]
  sampleKmz: Array<{
    id: string
    file_name: string
    region: string | null
  }>
  reasons: string[]
  suggestedNextStep: string
  searchQueries: string[]
}

type OwnerResearchQueueSummary = {
  critical: number
  high: number
  medium: number
  low: number
  evidenceFound?: number
  pending?: number
}

const EXAMPLES = [
  {
    label: "Santiago, Alameda 3",
    comunaCode: "13101",
    calle: "ALAMEDA",
    numero: "3",
    rol: "13101-42-998",
  },
  {
    label: "Santiago, Ahumada 1",
    comunaCode: "13101",
    calle: "AHUMADA",
    numero: "1",
    rol: "13101-29-59",
  },
  {
    label: "Valdivia, Picarte 500",
    comunaCode: "10101",
    calle: "PICARTE",
    numero: "500",
    rol: "10101-74-31",
  },
  {
    label: "Puerto Montt, Urmeneta 500",
    comunaCode: "10301",
    calle: "URMENETA",
    numero: "500",
    rol: "10301-84-7",
  },
  {
    label: "Vitacura, Av Nueva Vitacura 3296",
    comunaCode: "15160",
    calle: "VITACURA",
    numero: "3296",
    rol: "15160-465-165",
  },
]

function formatMoney(value?: number) {
  if (typeof value !== "number") return "-"
  return `$${Math.round(value).toLocaleString("es-CL")}`
}

function getDisplayRol(role: RoleResult) {
  return role.rol || [role.comuna_codigo, role.rol_manzana, role.rol_predio].filter(Boolean).join("-")
}

function buildPublicSearchLinks(input: { rol: string; comunaCode?: string; comunaName?: string; direccion?: string }) {
  const terms = [input.rol, input.comunaName, input.direccion].filter(Boolean).join(" ")
  const pdfTerms = [input.rol, input.comunaName, "filetype:pdf"].filter(Boolean).join(" ")
  const legalTerms = [input.rol, input.comunaName, "propiedad OR dominio OR inscripción"].filter(Boolean).join(" ")

  return [
    {
      label: "Google exacto",
      url: `https://www.google.com/search?q=${encodeURIComponent(`"${input.rol}" ${terms}`)}`,
      note: "Busca coincidencias exactas del rol con comuna o direccion.",
    },
    {
      label: "Google PDF",
      url: `https://www.google.com/search?q=${encodeURIComponent(pdfTerms)}`,
      note: "Prioriza expedientes, PDFs y documentos descargables.",
    },
    {
      label: "Bing legal",
      url: `https://www.bing.com/search?q=${encodeURIComponent(legalTerms)}`,
      note: "A veces indexa mejor fallos, SEA y municipalidades.",
    },
    {
      label: "DuckDuckGo",
      url: `https://duckduckgo.com/?q=${encodeURIComponent(`${input.rol} ${input.comunaName || ""} propietario`)}`,
      note: "Sirve como contraste cuando Google no muestra nada util.",
    },
  ]
}

function buildInvestigationLinks(input: { rol: string; comunaCode?: string; comunaName?: string; direccion?: string }): PublicSearchLink[] {
  const terms = [input.rol, input.comunaName, input.direccion].filter(Boolean).join(" ")
  const pdfTerms = [input.rol, input.comunaName, "filetype:pdf"].filter(Boolean).join(" ")
  const legalTerms = [input.rol, input.comunaName, "propiedad OR dominio OR inscripcion"].filter(Boolean).join(" ")
  const publicRecordTerms = [input.rol, input.comunaName, "site:sea.gob.cl OR site:pjud.cl OR site:mercadopublico.cl"].filter(Boolean).join(" ")

  return [
    {
      label: "Google exacto",
      url: `https://www.google.com/search?q=${encodeURIComponent(`"${input.rol}" ${terms}`)}`,
      note: "Busca coincidencias exactas del rol con comuna o direccion.",
      query: `"${input.rol}" ${terms}`.trim(),
    },
    {
      label: "Google PDF",
      url: `https://www.google.com/search?q=${encodeURIComponent(pdfTerms)}`,
      note: "Prioriza expedientes, PDFs y documentos descargables.",
      query: pdfTerms.trim(),
    },
    {
      label: "Bing legal",
      url: `https://www.bing.com/search?q=${encodeURIComponent(legalTerms)}`,
      note: "A veces indexa mejor fallos, SEA y municipalidades.",
      query: legalTerms.trim(),
    },
    {
      label: "DuckDuckGo",
      url: `https://duckduckgo.com/?q=${encodeURIComponent(`${input.rol} ${input.comunaName || ""} propietario`)}`,
      note: "Sirve como contraste cuando Google no muestra nada util.",
      query: `${input.rol} ${input.comunaName || ""} propietario`.trim(),
    },
    {
      label: "Fuentes publicas",
      url: `https://www.google.com/search?q=${encodeURIComponent(publicRecordTerms)}`,
      note: "Cruza Poder Judicial, SEA y Mercado Publico.",
      query: publicRecordTerms.trim(),
    },
  ]
}

function getResultStage(input: { hasAddressResults: boolean; hasVerifiedRol: boolean; hasCbrRoute: boolean }) {
  if (input.hasCbrRoute) {
    return {
      label: "Ruta formal lista",
      tone: "border-amber-400/30 bg-amber-500/10 text-amber-100",
      detail: "Ya tienes la ruta del conservador para confirmar dominio vigente.",
    }
  }

  if (input.hasVerifiedRol) {
    return {
      label: "Rol confirmado por SII",
      tone: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
      detail: "La ficha tributaria visible ya viene del endpoint oficial de SII Mapas.",
    }
  }

  if (input.hasAddressResults) {
    return {
      label: "Coincidencias por direccion",
      tone: "border-sky-400/30 bg-sky-500/10 text-sky-100",
      detail: "Son candidatos utiles, pero todavia conviene pasar a verificacion exacta por rol.",
    }
  }

  return {
    label: "Sin verificacion aun",
    tone: "border-slate-700 bg-slate-900 text-slate-100",
    detail: "Primero busca por direccion o verifica un rol exacto.",
  }
}

export default function SiiRolExplorer() {
  const [comunaCode, setComunaCode] = useState("13101")
  const [comunaQuery, setComunaQuery] = useState("Santiago")
  const [communeResults, setCommuneResults] = useState<CommuneResult[]>([])
  const [communeStatus, setCommuneStatus] = useState<"idle" | "running" | "done" | "error">("idle")
  const [calle, setCalle] = useState("ALAMEDA")
  const [numero, setNumero] = useState("3")
  const [rol, setRol] = useState("13101-42-998")

  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle")
  const [msg, setMsg] = useState("")
  const [source, setSource] = useState("")
  const [roles, setRoles] = useState<RoleResult[]>([])
  const [avaluo, setAvaluo] = useState<AvaluoResult | null>(null)
  const [cbrStatus, setCbrStatus] = useState<"idle" | "running" | "done" | "error">("idle")
  const [cbrRoute, setCbrRoute] = useState<CbrRouteResult | null>(null)
  const [ownerName, setOwnerName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [documentUrl, setDocumentUrl] = useState("")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "done" | "error">("idle")
  const [saveMessage, setSaveMessage] = useState("")
  const [evidenceOwnerName, setEvidenceOwnerName] = useState("")
  const [evidenceCompanyName, setEvidenceCompanyName] = useState("")
  const [evidenceUrl, setEvidenceUrl] = useState("")
  const [evidenceNotes, setEvidenceNotes] = useState("")
  const [evidenceSourceType, setEvidenceSourceType] = useState("public-web")
  const [evidenceConfidence, setEvidenceConfidence] = useState<EvidenceConfidence>("candidate")
  const [evidenceStatus, setEvidenceStatus] = useState<"idle" | "saving" | "done" | "error">("idle")
  const [evidenceMessage, setEvidenceMessage] = useState("")
  const [copyMessage, setCopyMessage] = useState("")
  const [queueItems, setQueueItems] = useState<OwnerResearchQueueItem[]>([])
  const [queueSummary, setQueueSummary] = useState<OwnerResearchQueueSummary | null>(null)
  const [queueTierFilter, setQueueTierFilter] = useState<"all" | QueueTier>("all")
  const [queueStatus, setQueueStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [queueRefreshStatus, setQueueRefreshStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [queueMessage, setQueueMessage] = useState("")
  const [queueRefreshMessage, setQueueRefreshMessage] = useState("")

  useEffect(() => {
    loadOwnerResearchQueue()
  }, [queueTierFilter])

  const loadExample = (example: (typeof EXAMPLES)[number]) => {
    setComunaCode(example.comunaCode)
    setComunaQuery("")
    setCommuneResults([])
    setCommuneStatus("idle")
    setCalle(example.calle)
    setNumero(example.numero)
    setRol(example.rol)
    setMsg("")
    setRoles([])
    setAvaluo(null)
    setSource("")
    setStatus("idle")
    setCbrRoute(null)
    setCbrStatus("idle")
    setSaveStatus("idle")
    setSaveMessage("")
    setEvidenceStatus("idle")
    setEvidenceMessage("")
  }

  async function loadOwnerResearchQueue() {
    setQueueStatus("loading")
    setQueueMessage("")

    try {
      const tierQuery = queueTierFilter === "all" ? "" : `&tier=${queueTierFilter}`
      const response = await fetch(`/api/admin/kmz/owner-research-queue?groupBy=role&limit=40${tierQuery}`)
      const data = await response.json()

      if (!response.ok || !data?.success) {
        setQueueStatus("error")
        setQueueMessage(data?.error || "No se pudo cargar la cola de investigacion.")
        return
      }

      const items = (data.results || []) as OwnerResearchQueueItem[]
      const nextSummary = (data.counts || {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        evidenceFound: 0,
        pending: 0,
      }) as OwnerResearchQueueSummary

      setQueueItems(items)
      setQueueSummary(nextSummary)
      setQueueStatus("done")
      setQueueMessage(items.length > 0 ? `Cola cargada: ${items.length} roles visibles.` : "Aun no hay cola generada.")
    } catch (error: any) {
      setQueueStatus("error")
      setQueueMessage(error?.message || "No se pudo cargar la cola de investigacion.")
    }
  }

  async function refreshOwnerResearchQueue() {
    setQueueRefreshStatus("loading")
    setQueueRefreshMessage("")

    try {
      const response = await fetch("/api/admin/kmz/owner-research-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persist: true,
          onlyMissingOwner: true,
          onlyWithRole: true,
        }),
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        setQueueRefreshStatus("error")
        setQueueRefreshMessage(data?.error || "No se pudo poblar la cola.")
        return
      }

      setQueueRefreshStatus("done")
      setQueueRefreshMessage(
        `Cola actualizada sobre ${data.processed} KMZ con rol. Roles criticos: ${data.roleQueueCounts?.critical || 0}, altos: ${data.roleQueueCounts?.high || 0}.`,
      )
      await loadOwnerResearchQueue()
    } catch (error: any) {
      setQueueRefreshStatus("error")
      setQueueRefreshMessage(error?.message || "No se pudo poblar la cola.")
    }
  }

  async function searchCommunes() {
    setCommuneStatus("running")
    setCommuneResults([])

    try {
      const response = await fetch(`/api/sii/communes/search?q=${encodeURIComponent(comunaQuery)}`)
      const data = await response.json()

      if (!response.ok || !data?.success) {
        setCommuneStatus("error")
        return
      }

      setCommuneResults(data.results || [])
      setCommuneStatus("done")
    } catch {
      setCommuneStatus("error")
    }
  }

  function selectCommune(commune: CommuneResult) {
    setComunaCode(commune.codigo)
    setComunaQuery(commune.nombre)
    setCommuneResults([])
    setCommuneStatus("idle")
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage(`${label} copiado.`)
      window.setTimeout(() => {
        setCopyMessage((current) => (current === `${label} copiado.` ? "" : current))
      }, 2200)
    } catch {
      setCopyMessage(`No se pudo copiar ${label.toLowerCase()}.`)
    }
  }

  function useRoleFromResult(role: RoleResult) {
    const nextRol = getDisplayRol(role)
    if (!nextRol) return

    setRol(nextRol)
    if (role.comunaCodigo || role.comuna_codigo) {
      setComunaCode(role.comunaCodigo || role.comuna_codigo || "")
    }
    if (role.comuna) {
      setComunaQuery(role.comuna)
    }
    setMsg(`Rol ${nextRol} cargado para verificacion exacta.`)
  }

  async function searchAddress() {
    setStatus("running")
    setMsg("Consultando direccion en SII Mapas...")
    setRoles([])
    setAvaluo(null)

    try {
      const response = await fetch("/api/sii/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comuna: comunaCode, calle, numero }),
      })
      const data = await response.json()

      if (!response.ok) {
        setStatus("error")
        setMsg(data?.error ?? "Error al consultar SII.")
        return
      }

      setStatus("done")
      setSource(data?.source || "")
      setRoles(data?.roles ?? [])
      setMsg(`Resultado listo: ${data?.count ?? 0} coincidencia(s).`)
    } catch (error: any) {
      setStatus("error")
      setMsg(error?.message ?? "Error desconocido")
    }
  }

  async function verifyRol() {
    setStatus("running")
    setMsg("Verificando rol exacto en SII Mapas...")
    setAvaluo(null)

    try {
      const response = await fetch("/api/sii/roles/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol, persist: false }),
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        setStatus("error")
        setMsg(data?.error ?? "No se pudo verificar el rol.")
        return
      }

      setStatus("done")
      setSource(data?.provider?.source || "")
      setAvaluo(data?.rol ?? null)
      setCbrRoute(null)
      setCbrStatus("idle")
      setMsg(data?.rol ? "Rol verificado contra SII Mapas." : "SII no devolvio datos para ese rol.")
    } catch (error: any) {
      setStatus("error")
      setMsg(error?.message ?? "Error desconocido")
    }
  }

  async function prepareCbrRoute() {
    const activeRol = avaluo ? getDisplayRol(avaluo) : rol
    const activeComunaCode = avaluo?.comunaCodigo || avaluo?.comuna_codigo || comunaCode
    const activeComunaName = avaluo?.comuna || comunaQuery

    if (!activeRol && !activeComunaCode && !activeComunaName) return

    setCbrStatus("running")
    setCbrRoute(null)

    try {
      const response = await fetch("/api/cbr/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rol: activeRol,
          comunaCode: activeComunaCode,
          comunaName: activeComunaName,
        }),
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        setCbrStatus("error")
        return
      }

      setCbrRoute(data.route || null)
      setCbrStatus("done")
    } catch {
      setCbrStatus("error")
    }
  }

  async function saveOwnerRecord() {
    const activeRol = avaluo ? getDisplayRol(avaluo) : rol
    if (!activeRol || (!ownerName.trim() && !companyName.trim())) return

    setSaveStatus("saving")
    setSaveMessage("")

    try {
      const response = await fetch("/api/cbr/owner-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rol: activeRol,
          ownerName: ownerName.trim() || undefined,
          companyName: companyName.trim() || undefined,
          documentType: "dominio_vigente",
          documentUrl: documentUrl.trim() || undefined,
        }),
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        setSaveStatus("error")
        setSaveMessage(data?.error || "No se pudo guardar el respaldo del CBR.")
        return
      }

      setSaveStatus("done")
      setSaveMessage(`Respaldo guardado para ${data.updated} KMZ asociado(s) al rol.`)
    } catch (error: any) {
      setSaveStatus("error")
      setSaveMessage(error?.message || "Error al guardar respaldo CBR.")
    }
  }

  async function savePublicEvidence() {
    const activeRol = avaluo ? getDisplayRol(avaluo) : rol
    if (!activeRol || (!evidenceOwnerName.trim() && !evidenceCompanyName.trim())) return

    setEvidenceStatus("saving")
    setEvidenceMessage("")

    try {
      const response = await fetch("/api/owner-evidence/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rol: activeRol,
          ownerName: evidenceOwnerName.trim() || undefined,
          companyName: evidenceCompanyName.trim() || undefined,
          documentType: "public-reference",
          documentUrl: evidenceUrl.trim() || undefined,
          notes: evidenceNotes.trim() || undefined,
          sourceType: evidenceSourceType,
          confidence: evidenceConfidence,
          authoritative: false,
        }),
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        setEvidenceStatus("error")
        setEvidenceMessage(data?.error || "No se pudo guardar la evidencia publica.")
        return
      }

      setEvidenceStatus("done")
      setEvidenceMessage(`Evidencia publica guardada para ${data.updated} KMZ asociado(s) al rol.`)
    } catch (error: any) {
      setEvidenceStatus("error")
      setEvidenceMessage(error?.message || "Error al guardar evidencia publica.")
    }
  }

  const activeRol = avaluo ? getDisplayRol(avaluo) : rol
  const activeComunaCode = avaluo?.comunaCodigo || avaluo?.comuna_codigo || comunaCode
  const activeComunaName = avaluo?.comuna || comunaQuery
  const activeDireccion = avaluo?.direccion || roles[0]?.direccion || `${calle}${numero ? ` ${numero}` : ""}`.trim()
  const publicSearchLinks = buildInvestigationLinks({
    rol: activeRol,
    comunaCode: activeComunaCode,
    comunaName: activeComunaName,
    direccion: activeDireccion,
  })
  const stage = getResultStage({
    hasAddressResults: roles.length > 0,
    hasVerifiedRol: Boolean(avaluo),
    hasCbrRoute: Boolean(cbrRoute),
  })

  return (
    <section className="w-full max-w-5xl rounded-3xl border border-slate-700 bg-slate-950 p-6 text-slate-100 shadow-2xl">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">SII Mapas publico</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Explorador predial real</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Usa endpoints publicos de SII Mapas. No usa mocks ni BaseAPI cuando no hay `BASEAPI_API_KEY`.
            La busqueda por direccion depende del nombre exacto que publica SII; si devuelve 0, verifica por rol exacto.
          </p>
        </div>
        <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-200">
          Fuente esperada: sii-public
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <Button
            key={example.label}
            type="button"
            variant="outline"
            onClick={() => loadExample(example)}
            className="border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white"
          >
            {example.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-700 bg-slate-900 p-5 text-slate-100">
          <h3 className="text-lg font-semibold text-white">Buscar roles por direccion</h3>
          <p className="mt-1 text-sm text-slate-400">El codigo de comuna SII es obligatorio. Ejemplo: Santiago = 13101.</p>
          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Convertir comuna a codigo SII
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Fuente: catalogo oficial SII Mapas. Algunos codigos no coinciden con codigos INE; por ejemplo Vitacura es 15160 en SII Mapas.
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
              <Input
                aria-label="Buscar comuna"
                value={comunaQuery}
                onChange={(event) => setComunaQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    searchCommunes()
                  }
                }}
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
                placeholder="Escribe una comuna: Vitacura, Caldera, Santiago..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={searchCommunes}
                disabled={communeStatus === "running" || !comunaQuery.trim()}
                className="border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white"
              >
                {communeStatus === "running" ? "Buscando..." : "Buscar codigo"}
              </Button>
            </div>
            {communeStatus === "error" && (
              <p className="mt-2 text-xs text-red-300">No se pudo consultar el catalogo de comunas SII.</p>
            )}
            {communeResults.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {communeResults.map((commune) => (
                  <button
                    key={`${commune.codigo}-${commune.nombre}`}
                    type="button"
                    onClick={() => selectCommune(commune)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm text-slate-100 transition hover:border-emerald-400 hover:bg-emerald-950"
                  >
                    <span className="font-semibold">{commune.nombre}</span>
                    <span className="ml-2 font-mono text-emerald-300">{commune.codigo}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              aria-label="Codigo comuna SII"
              value={comunaCode}
              onChange={(event) => setComunaCode(event.target.value)}
              className="border-slate-600 bg-slate-950 text-white placeholder:text-slate-500"
              placeholder="13101"
            />
            <Input
              aria-label="Calle"
              value={calle}
              onChange={(event) => setCalle(event.target.value)}
              className="border-slate-600 bg-slate-950 text-white placeholder:text-slate-500 md:col-span-1"
              placeholder="ALAMEDA"
            />
            <Input
              aria-label="Numero"
              value={numero}
              onChange={(event) => setNumero(event.target.value)}
              className="border-slate-600 bg-slate-950 text-white placeholder:text-slate-500"
              placeholder="3"
            />
          </div>
          <Button
            onClick={searchAddress}
            disabled={status === "running" || !comunaCode || !calle || !numero}
            className="mt-4 w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
          >
            Buscar en SII Mapas
          </Button>
        </Card>

        <Card className="border-slate-700 bg-slate-900 p-5 text-slate-100">
          <h3 className="text-lg font-semibold text-white">Verificar rol exacto</h3>
          <p className="mt-1 text-sm text-slate-400">Formato requerido: comuna-manzana-predio.</p>
          <Input
            aria-label="Rol exacto"
            value={rol}
            onChange={(event) => setRol(event.target.value)}
            className="mt-4 border-slate-600 bg-slate-950 text-white placeholder:text-slate-500"
            placeholder="13101-42-998"
          />
          <Button
            onClick={verifyRol}
            disabled={status === "running" || !rol}
            className="mt-4 w-full bg-sky-400 text-slate-950 hover:bg-sky-300"
          >
            Verificar avaluo real
          </Button>
        </Card>
      </div>

      {msg && (
        <Card
          className={`mt-5 border p-4 ${
            status === "error"
              ? "border-red-400/50 bg-red-950 text-red-100"
              : "border-slate-700 bg-slate-900 text-slate-100"
          }`}
        >
          <p className="text-sm font-medium">{msg}</p>
          {source && <p className="mt-1 text-xs text-slate-400">Contrato: {source}</p>}
        </Card>
      )}

      <Card className={`mt-5 border p-4 ${stage.tone}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Estado del dato</p>
            <p className="mt-1 text-lg font-bold">{stage.label}</p>
            <p className="mt-1 text-sm opacity-90">{stage.detail}</p>
          </div>
          <div className="grid gap-2 text-xs md:text-right">
            <p>SII direccion: {roles.length > 0 ? `${roles.length} coincidencia(s)` : "sin resultados"}</p>
            <p>SII rol exacto: {avaluo ? "confirmado" : "pendiente"}</p>
            <p>Dominio / dueno: solo CBR o respaldo manual fuerte</p>
          </div>
        </div>
      </Card>

      {roles.length > 0 && (
        <div className="mt-5 space-y-3">
          <h3 className="text-lg font-semibold text-white">Resultados por direccion</h3>
          {roles.slice(0, 20).map((role, index) => (
            <Card key={`${getDisplayRol(role)}-${index}`} className="border-slate-700 bg-slate-900 p-4 text-slate-100">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-base font-bold text-white">{getDisplayRol(role)}</p>
                  {role.direccion && <p className="mt-1 text-sm text-slate-300">{role.direccion}</p>}
                  {role.destino && <p className="text-sm text-slate-400">Destino: {role.destino}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                    {role.source || "sii-public"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => useRoleFromResult(role)}
                    className="border-slate-600 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white"
                  >
                    Usar este rol
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {avaluo && (
        <Card className="mt-5 border-emerald-500/40 bg-emerald-950 p-5 text-emerald-50">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Avaluo confirmado</p>
              <h3 className="mt-1 font-mono text-2xl font-bold text-white">{getDisplayRol(avaluo)}</h3>
              {avaluo.direccion && <p className="mt-2 text-sm text-emerald-100">{avaluo.direccion}</p>}
              {avaluo.periodo && <p className="text-sm text-emerald-200">Periodo: {avaluo.periodo}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-emerald-900 p-3">
                <p className="text-emerald-300">Total</p>
                <p className="font-bold text-white">{formatMoney(avaluo.avaluoTotal)}</p>
              </div>
              <div className="rounded-xl bg-emerald-900 p-3">
                <p className="text-emerald-300">Afecto</p>
                <p className="font-bold text-white">{formatMoney(avaluo.avaluoAfecto)}</p>
              </div>
              <div className="rounded-xl bg-emerald-900 p-3">
                <p className="text-emerald-300">AH</p>
                <p className="font-bold text-white">{avaluo.areaHomogenea || "-"}</p>
              </div>
              <div className="rounded-xl bg-emerald-900 p-3">
                <p className="text-emerald-300">Fuente</p>
                <p className="font-bold text-white">{avaluo.source || "sii-public"}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="mt-5 border-slate-700 bg-slate-900 p-5 text-slate-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">CBR / Dominio</p>
            <h3 className="mt-1 text-xl font-bold text-white">Ruta para conocer dueño o sociedad</h3>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              El SII no acredita dominio. Este bloque prepara el conservador correcto para buscar indice de propiedad y
              solicitar dominio vigente, y permite guardar el resultado respaldado por rol.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={prepareCbrRoute}
            disabled={cbrStatus === "running" || (!rol && !avaluo)}
            className="border-amber-400/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 hover:text-white"
          >
            {cbrStatus === "running" ? "Preparando..." : "Preparar consulta CBR"}
          </Button>
        </div>

        {cbrStatus === "error" && (
          <p className="mt-3 text-sm text-red-300">No se pudo resolver la ruta CBR para este rol/comuna.</p>
        )}

        {cbrRoute && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-white">{cbrRoute.conservatorName}</p>
              <p className="mt-1 text-sm text-slate-400">
                Comuna: {cbrRoute.communeName}
                {cbrRoute.communeCode ? ` (${cbrRoute.communeCode})` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={cbrRoute.searchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-slate-950"
                >
                  Ir a indice / consultas
                </a>
                {cbrRoute.domainUrl && (
                  <a
                    href={cbrRoute.domainUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950"
                  >
                    Ir a dominio vigente
                  </a>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {cbrRoute.notes.map((note) => (
                  <p key={note} className="text-sm text-slate-300">
                    {note}
                  </p>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {cbrRoute.references.map((reference) => (
                  <a
                    key={reference.url}
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm text-amber-300 underline underline-offset-4"
                  >
                    {reference.label}
                    {reference.verified ? " (verificado)" : ""}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-white">Guardar dueño / sociedad con respaldo</p>
              <p className="mt-1 text-sm text-slate-400">
                Guarda el nombre respaldado por dominio vigente para todos los KMZ que tengan este rol.
              </p>
              <div className="mt-3 space-y-3">
                <Input
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
                  placeholder="Nombre de persona natural"
                />
                <Input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
                  placeholder="Nombre de sociedad / SpA / Ltda"
                />
                <Input
                  value={documentUrl}
                  onChange={(event) => setDocumentUrl(event.target.value)}
                  className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
                  placeholder="Link al respaldo: PDF, Drive, CBR..."
                />
                <Button
                  type="button"
                  onClick={saveOwnerRecord}
                  disabled={saveStatus === "saving" || (!ownerName.trim() && !companyName.trim())}
                  className="w-full bg-amber-400 text-slate-950 hover:bg-amber-300"
                >
                  {saveStatus === "saving" ? "Guardando..." : "Guardar respaldo CBR"}
                </Button>
                {saveMessage && (
                  <p
                    className={`text-sm ${
                      saveStatus === "error" ? "text-red-300" : saveStatus === "done" ? "text-emerald-300" : "text-slate-300"
                    }`}
                  >
                    {saveMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-5 border-slate-700 bg-slate-900 p-5 text-slate-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Evidencia publica por rol</p>
            <h3 className="mt-1 text-xl font-bold text-white">Nombre candidato desde web abierta</h3>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Sirve para capturar nombres que aparecen indexados junto al rol en Google, Bing o PDFs publicos. No acredita
              dominio y no reemplaza al CBR.
            </p>
          </div>
          <div className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-semibold text-sky-100">
            Rol activo: {activeRol || "-"}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-sm font-semibold text-white">Atajos de busqueda</p>
          <p className="mt-1 text-sm text-slate-400">
            Usa el rol exacto con comuna y direccion. Si hay coincidencias, registra el nombre como evidencia, no como dominio.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {publicSearchLinks.map((link) => (
              <div key={link.url} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-sky-300">{link.label}</p>
                    <p className="mt-1 text-sm text-slate-300">{link.note}</p>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-slate-950"
                  >
                    Abrir
                  </a>
                </div>
                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <p className="font-mono text-xs text-slate-300">{link.query}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyText(link.query, link.label)}
                  className="mt-3 border-slate-600 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white"
                >
                  Copiar consulta
                </Button>
              </div>
            ))}
          </div>
          {copyMessage && <p className="mt-3 text-sm text-emerald-300">{copyMessage}</p>}
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Comuna</p>
              <p className="mt-1 text-sm text-white">
                {activeComunaName || "-"}
                {activeComunaCode ? ` (${activeComunaCode})` : ""}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Direccion</p>
              <p className="mt-1 text-sm text-white">{activeDireccion || "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Uso recomendado</p>
              <p className="mt-1 text-sm text-white">Precalificar persona o sociedad antes del CBR.</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
            <p className="text-sm font-semibold text-white">Registrar nombre candidato</p>
            <p className="mt-1 text-sm text-slate-400">
              Guarda el nombre encontrado, la URL y una nota corta sobre por que parece relacionado con este rol.
            </p>
            <div className="mt-3 space-y-3">
              <Input
                value={evidenceOwnerName}
                onChange={(event) => setEvidenceOwnerName(event.target.value)}
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
                placeholder="Persona natural encontrada en evidencia publica"
              />
              <Input
                value={evidenceCompanyName}
                onChange={(event) => setEvidenceCompanyName(event.target.value)}
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
                placeholder="Sociedad / SpA / Ltda encontrada en evidencia publica"
              />
              <Input
                value={evidenceUrl}
                onChange={(event) => setEvidenceUrl(event.target.value)}
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
                placeholder="URL exacta del PDF, expediente, ficha municipal o resultado indexado"
              />
              <Input
                value={evidenceSourceType}
                onChange={(event) => setEvidenceSourceType(event.target.value)}
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
                placeholder="Tipo de fuente: judicial, municipal, ambiental, licitacion, prensa..."
              />
              <div className="grid gap-2 md:grid-cols-3">
                {(["candidate", "probable", "strong"] as EvidenceConfidence[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEvidenceConfidence(level)}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      evidenceConfidence === level
                        ? "border-sky-400 bg-sky-500/20 text-white"
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {level === "candidate" ? "Candidato" : level === "probable" ? "Probable" : "Fuerte"}
                  </button>
                ))}
              </div>
              <Textarea
                value={evidenceNotes}
                onChange={(event) => setEvidenceNotes(event.target.value)}
                className="min-h-[110px] border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
                placeholder="Ejemplo: el PDF municipal menciona este rol junto al nombre de la sociedad en una solicitud de subdivision."
              />
              <Button
                type="button"
                onClick={savePublicEvidence}
                disabled={evidenceStatus === "saving" || (!evidenceOwnerName.trim() && !evidenceCompanyName.trim())}
                className="w-full bg-sky-400 text-slate-950 hover:bg-sky-300"
              >
                {evidenceStatus === "saving" ? "Guardando..." : "Guardar evidencia publica"}
              </Button>
              {evidenceMessage && (
                <p
                  className={`text-sm ${
                    evidenceStatus === "error"
                      ? "text-red-300"
                      : evidenceStatus === "done"
                        ? "text-emerald-300"
                        : "text-slate-300"
                  }`}
                >
                  {evidenceMessage}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
            <p className="text-sm font-semibold text-white">Reglas de calidad</p>
            <div className="mt-3 space-y-3 text-sm text-slate-300">
              <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-emerald-100">
                Solo el bloque <span className="font-semibold text-white">Avaluo confirmado</span> viene del SII oficial. Todo lo
                demas es apoyo para investigacion.
              </p>
              <p>
                <span className="font-semibold text-white">Candidato:</span> aparece una vez, sin contexto suficiente.
              </p>
              <p>
                <span className="font-semibold text-white">Probable:</span> el rol y el nombre aparecen juntos en un documento serio.
              </p>
              <p>
                <span className="font-semibold text-white">Fuerte:</span> el documento publico conecta rol, nombre y predio con claridad.
              </p>
              <p className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-amber-100">
                Aunque la evidencia sea fuerte, este modulo no la sube a dueÃ±o confirmado. El campo `owner` debe quedar
                reservado para respaldo CBR o confirmacion manual fuerte.
              </p>
              <p className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                Flujo recomendado: <span className="font-semibold text-white">rol exacto → busqueda web → candidato → CBR solo si vale la pena.</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-5 border-violet-400/30 bg-violet-500/10 p-5 text-slate-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Cola de investigacion</p>
            <h3 className="mt-1 text-xl font-bold text-white">Dueño / sociedad por prioridad</h3>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Aprovecha los roles SII ya resueltos para ordenar que roles conviene investigar primero en web abierta y luego en CBR.
            </p>
          </div>
          <Button
            type="button"
            onClick={refreshOwnerResearchQueue}
            disabled={queueRefreshStatus === "loading"}
            className="bg-violet-300 text-slate-950 hover:bg-violet-200"
          >
            {queueRefreshStatus === "loading" ? "Poblando cola..." : "Poblar desde roles resueltos"}
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-violet-400/20 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Criticos</p>
            <p className="mt-2 text-2xl font-bold text-white">{queueSummary?.critical || 0}</p>
          </div>
          <div className="rounded-2xl border border-violet-400/20 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Altos</p>
            <p className="mt-2 text-2xl font-bold text-white">{queueSummary?.high || 0}</p>
          </div>
          <div className="rounded-2xl border border-violet-400/20 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Evidencia</p>
            <p className="mt-2 text-2xl font-bold text-white">{queueSummary?.evidenceFound || 0}</p>
          </div>
          <div className="rounded-2xl border border-violet-400/20 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pendientes</p>
            <p className="mt-2 text-2xl font-bold text-white">{queueSummary?.pending || 0}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["all", "critical", "high", "medium", "low"] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setQueueTierFilter(tier)}
              className={`rounded-full border px-3 py-2 text-sm transition ${
                queueTierFilter === tier
                  ? "border-violet-300 bg-violet-400/20 text-white"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
              }`}
            >
              {tier === "all" ? "Todos" : tier}
            </button>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={loadOwnerResearchQueue}
            disabled={queueStatus === "loading"}
            className="border-slate-600 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white"
          >
            {queueStatus === "loading" ? "Cargando..." : "Recargar vista"}
          </Button>
        </div>

        {queueRefreshMessage && (
          <p
            className={`mt-3 text-sm ${
              queueRefreshStatus === "error" ? "text-red-300" : queueRefreshStatus === "done" ? "text-emerald-300" : "text-slate-300"
            }`}
          >
            {queueRefreshMessage}
          </p>
        )}

        {queueMessage && (
          <p className={`mt-2 text-sm ${queueStatus === "error" ? "text-red-300" : "text-slate-300"}`}>{queueMessage}</p>
        )}

        <div className="mt-4 space-y-3">
          {queueItems.map((item) => (
            <div key={item.rol} className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-base font-semibold text-white">{item.rol}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.affectedKmzCount} KMZ impactados por este rol</p>
                  <p className="text-sm text-slate-500">{item.regions.join(", ") || "Sin region"}</p>
                  {item.resolvedAt && (
                    <p className="text-xs text-slate-500">Ultima resolucion SII: {new Date(item.resolvedAt).toLocaleString("es-CL")}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-violet-400/15 px-3 py-1 text-xs font-semibold text-violet-200">
                    {item.priorityTier} · {item.priorityScore} pts
                  </span>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
                    {item.status}
                  </span>
                  {item.resolvedRecently && (
                    <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-200">
                      Rol reciente
                    </span>
                  )}
                  {item.southFocus && (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                      Sur prioritario
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Por que subio en prioridad</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.reasons.map((reason) => (
                      <span key={reason} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200">
                        {reason}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{item.suggestedNextStep}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Consultas sugeridas</p>
                  <div className="mt-2 space-y-2">
                    {item.searchQueries.slice(0, 3).map((query) => (
                      <button
                        key={query}
                        type="button"
                        onClick={() => copyText(query, "Consulta")}
                        className="block w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-left font-mono text-xs text-slate-200 hover:border-slate-500"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}

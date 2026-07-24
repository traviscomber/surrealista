"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"

type PhaseId = "mapa" | "contexto" | "ia" | "timeline" | "dashboard"

type Snapshot = {
  title: string
  role: string | null
  owner: string | null
  commune: string | null
  area: string | null
  latitude: string | null
  longitude: string | null
  score: number
  coverage: number
  risk: "Bajo" | "Medio" | "Alto"
  sections: string[]
  text: string
  capturedAt: string
}

type TimelineEntry = {
  id: string
  title: string
  score: number
  risk: string
  capturedAt: string
}

const TIMELINE_KEY = "campos-five-phase-timeline"

const phases: { id: PhaseId; label: string; short: string }[] = [
  { id: "mapa", label: "Mapa inteligente", short: "01" },
  { id: "contexto", label: "Contexto territorial", short: "02" },
  { id: "ia", label: "IA territorial", short: "03" },
  { id: "timeline", label: "Timeline GIS", short: "04" },
  { id: "dashboard", label: "Plataforma ejecutiva", short: "05" },
]

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

const compact = (value: string, max = 70) => value.replace(/\s+/g, " ").trim().slice(0, max)

const extract = (text: string, labels: string[]) => {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n|]{2,80})`, "i"))
    if (match?.[1]) return compact(match[1])
  }
  return null
}

const readSnapshot = (): Snapshot | null => {
  const detailHeading = Array.from(document.querySelectorAll("h2")).find(
    (node) => normalize(node.textContent || "").trim() === "detalles",
  )
  const panel = detailHeading?.parentElement?.parentElement
  if (!(panel instanceof HTMLElement)) return null

  const text = panel.innerText || ""
  if (!text.trim()) return null

  const normalized = normalize(text)
  const sections = ["ubicacion", "descripcion", "sii", "propiedad", "documentos"].filter((section) =>
    normalized.includes(section),
  )
  const role = extract(text, ["rol(?: sii)?", "rol de avaluo", "rol predial"])
  const owner = extract(text, ["propietario", "dueno", "sociedad"])
  const commune = extract(text, ["comuna", "localidad", "sector"])
  const area = extract(text, ["superficie", "area", "hectareas", "ha"])
  const latitude = extract(text, ["latitud", "latitude", "lat"])
  const longitude = extract(text, ["longitud", "longitude", "lng", "lon"])
  const title =
    extract(text, ["nombre(?: del)? predio", "predio", "nombre", "titulo"]) ||
    panel.querySelector("h3, h4, strong")?.textContent?.trim() ||
    "Predio seleccionado"

  let score = 12
  if (sections.includes("ubicacion")) score += 18
  if (latitude && longitude) score += 8
  if (sections.includes("sii")) score += 14
  if (role) score += 12
  if (sections.includes("propiedad")) score += 9
  if (owner) score += 12
  if (sections.includes("documentos")) score += 10
  if (sections.includes("descripcion")) score += 3
  if (area) score += 1
  if (commune) score += 1
  score = Math.min(100, score)

  const coverage = Math.round((sections.length / 5) * 100)
  const risk = score >= 76 ? "Bajo" : score >= 48 ? "Medio" : "Alto"

  return {
    title: compact(title),
    role,
    owner,
    commune,
    area,
    latitude,
    longitude,
    score,
    coverage,
    risk,
    sections,
    text,
    capturedAt: new Date().toISOString(),
  }
}

const loadTimeline = (): TimelineEntry[] => {
  try {
    return JSON.parse(window.localStorage.getItem(TIMELINE_KEY) || "[]")
  } catch {
    return []
  }
}

const saveTimelineEntry = (snapshot: Snapshot) => {
  const current = loadTimeline()
  const previous = current[0]
  if (previous?.title === snapshot.title && previous.score === snapshot.score) return current

  const next: TimelineEntry[] = [
    {
      id: `${Date.now()}-${snapshot.title}`,
      title: snapshot.title,
      score: snapshot.score,
      risk: snapshot.risk,
      capturedAt: snapshot.capturedAt,
    },
    ...current,
  ].slice(0, 20)
  window.localStorage.setItem(TIMELINE_KEY, JSON.stringify(next))
  return next
}

export function CAMPOSFivePhaseSuite() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<PhaseId>("mapa")
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!pathname?.toLowerCase().includes("campos")) return

    let frame = 0
    const refresh = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = readSnapshot()
        setSnapshot(next)
        if (next) setTimeline(saveTimelineEntry(next))
      })
    }

    const observer = new MutationObserver(refresh)
    observer.observe(document.body, { subtree: true, childList: true, characterData: true })
    refresh()

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [pathname])

  const insights = useMemo(() => {
    if (!snapshot) return []
    return [
      {
        label: "Acceso y geometría",
        value: snapshot.sections.includes("ubicacion") ? "Disponible" : "Pendiente",
        ok: snapshot.sections.includes("ubicacion"),
      },
      { label: "Trazabilidad SII", value: snapshot.role || "Sin rol", ok: Boolean(snapshot.role) },
      { label: "Titularidad", value: snapshot.owner || "No confirmada", ok: Boolean(snapshot.owner) },
      {
        label: "Respaldo documental",
        value: snapshot.sections.includes("documentos") ? "Disponible" : "Pendiente",
        ok: snapshot.sections.includes("documentos"),
      },
      { label: "Cobertura del expediente", value: `${snapshot.coverage}%`, ok: snapshot.coverage >= 80 },
    ]
  }, [snapshot])

  if (!pathname?.toLowerCase().includes("campos")) return null

  const exportSnapshot = () => {
    if (!snapshot) return
    const payload = {
      product: "CAMPOS Territorial Intelligence",
      generatedAt: new Date().toISOString(),
      snapshot,
      insights,
      timeline,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `campos-${normalize(snapshot.title).replace(/[^a-z0-9]+/g, "-") || "expediente"}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const openMainMap = () => {
    const map = document.querySelector(".leaflet-container")
    if (map instanceof HTMLElement) {
      map.scrollIntoView({ behavior: "smooth", block: "center" })
      map.animate([{ boxShadow: "0 0 0 0 rgba(13,148,136,0)" }, { boxShadow: "0 0 0 8px rgba(13,148,136,.28)" }, { boxShadow: "0 0 0 0 rgba(13,148,136,0)" }], { duration: 900 })
    }
    setOpen(false)
  }

  const report = snapshot
    ? `${snapshot.title} presenta un score territorial de ${snapshot.score}/100 y riesgo ${snapshot.risk.toLowerCase()}. ${snapshot.role ? `El rol detectado es ${snapshot.role}.` : "El rol SII permanece pendiente."} ${snapshot.owner ? `La titularidad se asocia a ${snapshot.owner}.` : "La titularidad requiere verificación."} La cobertura documental alcanza ${snapshot.coverage}%.`
    : "Selecciona un predio para generar el informe territorial."

  const searchResults = snapshot
    ? snapshot.text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 3)
        .filter((line, index, array) => array.indexOf(line) === index)
        .filter((line) => !query || normalize(line).includes(normalize(query)))
        .slice(0, 12)
    : []

  return (
    <>
      <button className="campos-suite-launcher" type="button" onClick={() => setOpen(true)} aria-label="Abrir centro de inteligencia territorial">
        <span>⌘</span>
        <strong>Inteligencia</strong>
        {snapshot && <em>{snapshot.score}</em>}
      </button>

      {open && (
        <div className="campos-suite-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <section className="campos-suite-shell" role="dialog" aria-modal="true" aria-label="Centro de inteligencia territorial CAMPOS">
            <header className="campos-suite-header">
              <div>
                <span className="campos-suite-kicker">CAMPOS · Territorial Intelligence OS</span>
                <h2>{snapshot?.title || "Sin predio seleccionado"}</h2>
              </div>
              <div className="campos-suite-header-actions">
                <button type="button" onClick={exportSnapshot} disabled={!snapshot}>Exportar</button>
                <button type="button" onClick={() => window.print()}>Imprimir</button>
                <button type="button" className="campos-suite-close" onClick={() => setOpen(false)} aria-label="Cerrar">×</button>
              </div>
            </header>

            <nav className="campos-suite-phases" aria-label="Cinco fases CAMPOS">
              {phases.map((phase) => (
                <button key={phase.id} type="button" className={active === phase.id ? "is-active" : ""} onClick={() => setActive(phase.id)}>
                  <span>{phase.short}</span>
                  <strong>{phase.label}</strong>
                </button>
              ))}
            </nav>

            <div className="campos-suite-content">
              {!snapshot && <div className="campos-suite-empty">Selecciona un expediente en CAMPOS para activar las cinco fases.</div>}

              {snapshot && active === "mapa" && (
                <div className="campos-suite-grid campos-suite-map-layout">
                  <article className="campos-suite-card campos-suite-map-card">
                    <div className="campos-suite-map-canvas">
                      <span className="campos-suite-map-lines" />
                      <span className="campos-suite-map-polygon" />
                      <span className="campos-suite-map-center">⌖</span>
                      <div className="campos-suite-map-hud"><span>LAT {snapshot.latitude || "—"}</span><span>LNG {snapshot.longitude || "—"}</span></div>
                    </div>
                    <button type="button" onClick={openMainMap}>Ir al mapa principal</button>
                  </article>
                  <article className="campos-suite-card">
                    <span className="campos-suite-kicker">Geometría seleccionada</span>
                    <h3>{snapshot.commune || "Ubicación por validar"}</h3>
                    <dl className="campos-suite-data-list">
                      <div><dt>Superficie</dt><dd>{snapshot.area || "Sin dato"}</dd></div>
                      <div><dt>Coordenadas</dt><dd>{snapshot.latitude && snapshot.longitude ? "Detectadas" : "Pendientes"}</dd></div>
                      <div><dt>Cobertura</dt><dd>{snapshot.coverage}%</dd></div>
                    </dl>
                  </article>
                </div>
              )}

              {snapshot && active === "contexto" && (
                <div className="campos-suite-grid">
                  {insights.map((item) => (
                    <article className={`campos-suite-card campos-suite-context ${item.ok ? "is-ok" : "is-alert"}`} key={item.label}>
                      <span className="campos-suite-context-dot" />
                      <div><small>{item.label}</small><strong>{item.value}</strong></div>
                    </article>
                  ))}
                  <article className="campos-suite-card campos-suite-context-wide">
                    <span className="campos-suite-kicker">Capas preparadas</span>
                    <div className="campos-suite-layer-list"><span>Caminos</span><span>Hidrografía</span><span>Red eléctrica</span><span>Uso de suelo</span><span>Pendiente</span><span>Vegetación</span></div>
                    <p>Las capas aparecen como preparadas para conexión; los valores reales dependen de fuentes GIS disponibles en el proyecto.</p>
                  </article>
                </div>
              )}

              {snapshot && active === "ia" && (
                <div className="campos-suite-grid campos-suite-ai-layout">
                  <article className="campos-suite-card campos-suite-score-panel">
                    <div className={`campos-suite-score risk-${normalize(snapshot.risk)}`} style={{ "--score": snapshot.score } as React.CSSProperties}>
                      <strong>{snapshot.score}</strong><span>/100</span>
                    </div>
                    <div><span className="campos-suite-kicker">Riesgo territorial</span><h3>{snapshot.risk}</h3><p>Score basado en la evidencia disponible en el expediente.</p></div>
                  </article>
                  <article className="campos-suite-card campos-suite-report-card">
                    <span className="campos-suite-kicker">Informe ejecutivo generado</span>
                    <h3>Conclusión territorial</h3>
                    <p>{report}</p>
                    <div className="campos-suite-actions">
                      <button type="button" onClick={() => navigator.clipboard?.writeText(report)}>Copiar informe</button>
                      <button type="button" onClick={() => document.querySelector<HTMLButtonElement>("[aria-label*='inteligencia artificial'], [aria-label*='asistente']")?.click()}>Abrir agente IA</button>
                    </div>
                  </article>
                </div>
              )}

              {snapshot && active === "timeline" && (
                <article className="campos-suite-card campos-suite-timeline-card">
                  <div className="campos-suite-section-heading"><div><span className="campos-suite-kicker">Auditoría persistente</span><h3>Timeline del expediente</h3></div><span>{timeline.length} eventos</span></div>
                  <div className="campos-suite-timeline-list">
                    {timeline.length === 0 && <p>La actividad aparecerá cuando cambie la selección o el score.</p>}
                    {timeline.map((entry) => (
                      <div key={entry.id} className="campos-suite-timeline-row">
                        <span className="campos-suite-timeline-node" />
                        <div><strong>{entry.title}</strong><small>{new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.capturedAt))}</small></div>
                        <div><b>{entry.score}</b><span>Riesgo {entry.risk.toLowerCase()}</span></div>
                      </div>
                    ))}
                  </div>
                </article>
              )}

              {snapshot && active === "dashboard" && (
                <div className="campos-suite-dashboard">
                  <div className="campos-suite-dashboard-kpis">
                    <article><span>Score</span><strong>{snapshot.score}</strong></article>
                    <article><span>Cobertura</span><strong>{snapshot.coverage}%</strong></article>
                    <article><span>Alertas</span><strong>{insights.filter((item) => !item.ok).length}</strong></article>
                    <article><span>Evidencias</span><strong>{snapshot.sections.length}</strong></article>
                  </div>
                  <article className="campos-suite-card campos-suite-search-card">
                    <div className="campos-suite-section-heading"><div><span className="campos-suite-kicker">Búsqueda semántica local</span><h3>Explorar expediente</h3></div></div>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar rol, propietario, comuna, documento..." />
                    <div className="campos-suite-search-results">
                      {searchResults.map((result) => <button type="button" key={result} onClick={() => navigator.clipboard?.writeText(result)}>{result}</button>)}
                      {searchResults.length === 0 && <p>Sin coincidencias.</p>}
                    </div>
                  </article>
                  <article className="campos-suite-card campos-suite-heatmap-card">
                    <span className="campos-suite-kicker">Heatmap de completitud</span>
                    {insights.map((item) => <div key={item.label}><span>{item.label}</span><i><b style={{ width: item.ok ? "100%" : "34%" }} /></i></div>)}
                  </article>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}

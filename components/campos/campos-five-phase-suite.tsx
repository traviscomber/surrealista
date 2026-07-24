"use client"

import { useEffect, useRef, useMemo, useState, useCallback } from "react"
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

const compact = (value: string, max = 70) =>
  value.replace(/\s+/g, " ").trim().slice(0, max)

const extract = (text: string, labels: string[]) => {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n|]{2,80})`, "i"))
    if (match?.[1]) return compact(match[1])
  }
  return null
}

// ---------------------------------------------------------------------------
// Build a Snapshot from the structured custom event detail (priority 1)
// ---------------------------------------------------------------------------
const snapshotFromEvent = (detail: Record<string, any>): Snapshot => {
  const sections: string[] = []
  if (detail.latitude && detail.longitude) sections.push("ubicacion")
  if (detail.role) sections.push("sii")
  if (detail.owner) sections.push("propiedad")
  if (detail.area) sections.push("descripcion")

  let score = 12
  if (sections.includes("ubicacion")) score += 26
  if (sections.includes("sii")) score += 26
  if (detail.role) score += 12
  if (sections.includes("propiedad")) score += 9
  if (detail.owner) score += 12
  if (detail.area) score += 3
  score = Math.min(100, score)

  const coverage = Math.round((sections.length / 5) * 100)
  const risk = score >= 76 ? "Bajo" : score >= 48 ? "Medio" : "Alto"

  return {
    title: compact(detail.title || "Predio seleccionado"),
    role: detail.role ?? null,
    owner: detail.owner ?? null,
    commune: detail.commune ?? null,
    area: detail.area ?? null,
    latitude: detail.latitude ?? null,
    longitude: detail.longitude ?? null,
    score,
    coverage,
    risk,
    sections,
    text: detail.text || detail.title || "",
    capturedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Build a Snapshot from DOM parsing (fallback)
// ---------------------------------------------------------------------------
const readSnapshotFromDOM = (): Snapshot | null => {
  // Strategy 1: look for [data-campos-panel] attribute
  let panel = document.querySelector<HTMLElement>("[data-campos-panel]")
  // Strategy 2: look for h2 "Detalles" as original implementation
  if (!panel) {
    const heading = Array.from(document.querySelectorAll("h2")).find(
      (node) => normalize(node.textContent || "").trim() === "detalles",
    )
    panel = heading?.parentElement?.parentElement as HTMLElement | null ?? null
  }
  if (!(panel instanceof HTMLElement)) return null

  const text = panel.innerText || ""
  if (!text.trim()) return null

  const normalized = normalize(text)
  const sections = ["ubicacion", "descripcion", "sii", "propiedad", "documentos"].filter((s) =>
    normalized.includes(s),
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
  const risk: "Bajo" | "Medio" | "Alto" = score >= 76 ? "Bajo" : score >= 48 ? "Medio" : "Alto"

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

const saveTimelineEntry = (snapshot: Snapshot): TimelineEntry[] => {
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

// ---------------------------------------------------------------------------
// Safe clipboard helper with execCommand fallback
// ---------------------------------------------------------------------------
const copyToClipboard = (text: string) => {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {})
    return
  }
  try {
    const el = document.createElement("textarea")
    el.value = text
    el.style.position = "fixed"
    el.style.opacity = "0"
    document.body.appendChild(el)
    el.focus()
    el.select()
    document.execCommand("copy")
    document.body.removeChild(el)
  } catch {}
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CAMPOSFivePhaseSuite() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<PhaseId>("mapa")
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [query, setQuery] = useState("")

  // Refs for focus management
  const launcherRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const shellRef = useRef<HTMLElement>(null)

  const onCampos = Boolean(pathname?.toLowerCase().includes("campos"))

  // -------------------------------------------------------------------------
  // 1. Listen for structured custom event (priority 1)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!onCampos) return

    const handleSelectionChange = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.title) return
      const next = snapshotFromEvent(detail)
      setSnapshot(next)
      setTimeline(saveTimelineEntry(next))
    }

    window.addEventListener("campos:selection-change", handleSelectionChange)
    return () => window.removeEventListener("campos:selection-change", handleSelectionChange)
  }, [onCampos])

  // -------------------------------------------------------------------------
  // 2. MutationObserver as fallback (DOM parsing)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!onCampos) return

    let frame = 0
    const refresh = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = readSnapshotFromDOM()
        if (next) {
          setSnapshot((prev) => {
            // only update if title changed — avoid overwriting event-sourced data
            if (prev?.title && prev.title !== "Predio seleccionado" && prev.title === next.title) return prev
            return next
          })
          setTimeline(saveTimelineEntry(next))
        }
      })
    }

    const observer = new MutationObserver(refresh)
    observer.observe(document.body, { subtree: true, childList: true, characterData: true })
    refresh()

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [onCampos])

  // -------------------------------------------------------------------------
  // 3. Listen for campos:open-ai-agent event
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!onCampos) return
    const handle = () => {
      // Find and click the Sparkles AI toggle button in the CAMPOS folder view
      const btn = document.querySelector<HTMLButtonElement>(
        "[aria-label*='agente'], [aria-label*='inteligencia artificial'], [aria-label*='asistente'], button[aria-label*='IA']",
      )
      btn?.click()
    }
    window.addEventListener("campos:open-ai-agent", handle)
    return () => window.removeEventListener("campos:open-ai-agent", handle)
  }, [onCampos])

  // -------------------------------------------------------------------------
  // 4. Keyboard: Escape to close, focus trap
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return
    // Move focus to close button when modal opens
    closeRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        launcherRef.current?.focus()
        return
      }
      // Focus trap
      if (e.key !== "Tab" || !shellRef.current) return
      const focusable = Array.from(
        shellRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  const handleClose = useCallback(() => {
    setOpen(false)
    launcherRef.current?.focus()
  }, [])

  const insights = useMemo(() => {
    if (!snapshot) return []
    return [
      {
        label: "Acceso y geometria",
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

  if (!onCampos) return null

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
    // Release object URL after a short delay to allow the download to start
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  const openMainMap = () => {
    const map = document.querySelector<HTMLElement>(".leaflet-container")
    if (map) {
      map.scrollIntoView({ behavior: "smooth", block: "center" })
      map.animate(
        [
          { boxShadow: "0 0 0 0 rgba(13,148,136,0)" },
          { boxShadow: "0 0 0 8px rgba(13,148,136,.28)" },
          { boxShadow: "0 0 0 0 rgba(13,148,136,0)" },
        ],
        { duration: 900 },
      )
    }
    setOpen(false)
  }

  const openAIAgent = () => {
    // Dispatch event first — the AI agent listener in the folder view will handle it
    window.dispatchEvent(new CustomEvent("campos:open-ai-agent"))
    setOpen(false)
  }

  const report = snapshot
    ? `${snapshot.title} presenta un score territorial de ${snapshot.score}/100 y riesgo ${snapshot.risk.toLowerCase()}. ${
        snapshot.role
          ? `El rol detectado es ${snapshot.role}.`
          : "El rol SII permanece pendiente de conexion."
      } ${
        snapshot.owner
          ? `La titularidad se asocia a ${snapshot.owner}.`
          : "La titularidad requiere verificacion."
      } La cobertura documental alcanza ${snapshot.coverage}%. ${
        insights.filter((i) => !i.ok).length > 0
          ? `Pendiente: ${insights
              .filter((i) => !i.ok)
              .map((i) => i.label)
              .join(", ")}.`
          : "Informacion completa."
      }`
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
      <button
        ref={launcherRef}
        className="campos-suite-launcher"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir centro de inteligencia territorial CAMPOS"
      >
        <span aria-hidden="true">&#8984;</span>
        <strong>Inteligencia</strong>
        {snapshot && <em aria-label={`Score ${snapshot.score}`}>{snapshot.score}</em>}
      </button>

      {open && (
        <div
          className="campos-suite-backdrop"
          role="presentation"
          onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <section
            ref={shellRef}
            className="campos-suite-shell"
            role="dialog"
            aria-modal="true"
            aria-label="Centro de inteligencia territorial CAMPOS"
          >
            <header className="campos-suite-header">
              <div>
                <span className="campos-suite-kicker">CAMPOS &middot; Territorial Intelligence OS</span>
                <h2>{snapshot?.title || "Sin predio seleccionado"}</h2>
              </div>
              <div className="campos-suite-header-actions">
                <button type="button" onClick={exportSnapshot} disabled={!snapshot} aria-disabled={!snapshot}>
                  Exportar
                </button>
                <button type="button" onClick={() => window.print()}>
                  Imprimir
                </button>
                <button
                  ref={closeRef}
                  type="button"
                  className="campos-suite-close"
                  onClick={handleClose}
                  aria-label="Cerrar centro de inteligencia"
                >
                  &times;
                </button>
              </div>
            </header>

            <nav className="campos-suite-phases" aria-label="Cinco fases territoriales CAMPOS">
              {phases.map((phase) => (
                <button
                  key={phase.id}
                  type="button"
                  className={active === phase.id ? "is-active" : ""}
                  onClick={() => setActive(phase.id)}
                  aria-pressed={active === phase.id}
                  aria-label={`Fase ${phase.short}: ${phase.label}`}
                >
                  <span aria-hidden="true">{phase.short}</span>
                  <strong>{phase.label}</strong>
                </button>
              ))}
            </nav>

            <div className="campos-suite-content">
              {!snapshot && (
                <div className="campos-suite-empty" role="status">
                  Selecciona un expediente en CAMPOS para activar las cinco fases.
                </div>
              )}

              {/* FASE 01 — Mapa inteligente */}
              {snapshot && active === "mapa" && (
                <div className="campos-suite-grid campos-suite-map-layout">
                  <article className="campos-suite-card campos-suite-map-card">
                    <div className="campos-suite-map-canvas" role="img" aria-label="Vista previa del predio seleccionado">
                      <span className="campos-suite-map-lines" aria-hidden="true" />
                      <span className="campos-suite-map-polygon" aria-hidden="true" />
                      <span className="campos-suite-map-center" aria-hidden="true">&#8982;</span>
                      <div className="campos-suite-map-hud" aria-label="Coordenadas">
                        <span>LAT {snapshot.latitude || "—"}</span>
                        <span>LNG {snapshot.longitude || "—"}</span>
                      </div>
                    </div>
                    <button type="button" onClick={openMainMap} aria-label="Ir al mapa principal de CAMPOS">
                      Ir al mapa principal
                    </button>
                  </article>
                  <article className="campos-suite-card">
                    <span className="campos-suite-kicker">Geometria seleccionada</span>
                    <h3>{snapshot.commune || "Ubicacion por validar"}</h3>
                    <dl className="campos-suite-data-list">
                      <div>
                        <dt>Superficie</dt>
                        <dd>{snapshot.area || "Sin dato"}</dd>
                      </div>
                      <div>
                        <dt>Coordenadas</dt>
                        <dd>{snapshot.latitude && snapshot.longitude ? "Detectadas" : "Pendientes"}</dd>
                      </div>
                      <div>
                        <dt>Cobertura</dt>
                        <dd>{snapshot.coverage}%</dd>
                      </div>
                    </dl>
                  </article>
                </div>
              )}

              {/* FASE 02 — Contexto territorial */}
              {snapshot && active === "contexto" && (
                <div className="campos-suite-grid">
                  {insights.map((item) => (
                    <article
                      className={`campos-suite-card campos-suite-context ${item.ok ? "is-ok" : "is-alert"}`}
                      key={item.label}
                    >
                      <span className="campos-suite-context-dot" aria-hidden="true" />
                      <div>
                        <small>{item.label}</small>
                        <strong>{item.value}</strong>
                      </div>
                    </article>
                  ))}
                  <article className="campos-suite-card campos-suite-context-wide">
                    <span className="campos-suite-kicker">Capas territoriales</span>
                    <div className="campos-suite-layer-list" role="list" aria-label="Capas GIS disponibles">
                      {[
                        "Caminos",
                        "Hidrografia",
                        "Red electrica",
                        "Uso de suelo",
                        "Pendiente",
                        "Vegetacion",
                      ].map((layer) => (
                        <span key={layer} role="listitem">{layer}</span>
                      ))}
                    </div>
                    <p>
                      Capas preparadas para conexion con fuentes GIS del proyecto. Los valores reales
                      dependen de las fuentes disponibles — no se muestran datos simulados.
                    </p>
                    <p style={{ marginTop: "0.4rem", fontSize: "0.7rem", color: "#4a6175" }}>
                      Fuente pendiente de conexion para todas las capas en esta version.
                    </p>
                  </article>
                </div>
              )}

              {/* FASE 03 — IA territorial */}
              {snapshot && active === "ia" && (
                <div className="campos-suite-grid campos-suite-ai-layout">
                  <article className="campos-suite-card campos-suite-score-panel">
                    <div
                      className={`campos-suite-score risk-${normalize(snapshot.risk)}`}
                      style={{ "--score": snapshot.score } as React.CSSProperties}
                      role="meter"
                      aria-valuenow={snapshot.score}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Score territorial ${snapshot.score} de 100`}
                    >
                      <strong>{snapshot.score}</strong>
                      <span>/100</span>
                    </div>
                    <div>
                      <span className="campos-suite-kicker">Riesgo territorial</span>
                      <h3>{snapshot.risk}</h3>
                      <p>Score basado en la evidencia disponible en el expediente.</p>
                    </div>
                  </article>
                  <article className="campos-suite-card campos-suite-report-card">
                    <span className="campos-suite-kicker">Informe ejecutivo generado</span>
                    <h3>Conclusion territorial</h3>
                    <p>{report}</p>
                    <div className="campos-suite-actions">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(report)}
                        aria-label="Copiar informe al portapapeles"
                      >
                        Copiar informe
                      </button>
                      <button
                        type="button"
                        onClick={openAIAgent}
                        aria-label="Abrir agente de inteligencia artificial de CAMPOS"
                      >
                        Abrir agente IA
                      </button>
                    </div>
                  </article>
                </div>
              )}

              {/* FASE 04 — Timeline GIS */}
              {snapshot && active === "timeline" && (
                <article className="campos-suite-card campos-suite-timeline-card">
                  <div className="campos-suite-section-heading">
                    <div>
                      <span className="campos-suite-kicker">Auditoria persistente</span>
                      <h3>Timeline del expediente</h3>
                    </div>
                    <span>{timeline.length} eventos</span>
                  </div>
                  <div className="campos-suite-timeline-list" role="list" aria-label="Historial de selecciones territoriales">
                    {timeline.length === 0 && (
                      <p role="status">La actividad aparecera cuando cambie la seleccion o el score.</p>
                    )}
                    {timeline.map((entry) => (
                      <div key={entry.id} className="campos-suite-timeline-row" role="listitem">
                        <span className="campos-suite-timeline-node" aria-hidden="true" />
                        <div>
                          <strong>{entry.title}</strong>
                          <small>
                            {new Intl.DateTimeFormat("es-CL", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(entry.capturedAt))}
                          </small>
                        </div>
                        <div>
                          <b>{entry.score}</b>
                          <span>Riesgo {entry.risk.toLowerCase()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              )}

              {/* FASE 05 — Plataforma ejecutiva */}
              {snapshot && active === "dashboard" && (
                <div className="campos-suite-dashboard">
                  <div className="campos-suite-dashboard-kpis" role="list" aria-label="Indicadores clave">
                    <article role="listitem">
                      <span>Score</span>
                      <strong>{snapshot.score}</strong>
                    </article>
                    <article role="listitem">
                      <span>Cobertura</span>
                      <strong>{snapshot.coverage}%</strong>
                    </article>
                    <article role="listitem">
                      <span>Alertas</span>
                      <strong>{insights.filter((i) => !i.ok).length}</strong>
                    </article>
                    <article role="listitem">
                      <span>Evidencias</span>
                      <strong>{snapshot.sections.length}</strong>
                    </article>
                  </div>
                  <article className="campos-suite-card campos-suite-search-card">
                    <div className="campos-suite-section-heading">
                      <div>
                        <span className="campos-suite-kicker">Busqueda semantica local</span>
                        <h3>Explorar expediente</h3>
                      </div>
                    </div>
                    <label htmlFor="campos-search" className="sr-only">
                      Buscar en el expediente territorial
                    </label>
                    <input
                      id="campos-search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar rol, propietario, comuna, documento..."
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <div
                      className="campos-suite-search-results"
                      role="list"
                      aria-label="Resultados de busqueda"
                      aria-live="polite"
                    >
                      {searchResults.map((result) => (
                        <button
                          type="button"
                          key={result}
                          onClick={() => copyToClipboard(result)}
                          role="listitem"
                          title="Clic para copiar"
                          aria-label={`Copiar: ${result.slice(0, 40)}`}
                        >
                          {result}
                        </button>
                      ))}
                      {searchResults.length === 0 && <p role="status">Sin coincidencias.</p>}
                    </div>
                  </article>
                  <article className="campos-suite-card campos-suite-heatmap-card">
                    <span className="campos-suite-kicker">Heatmap de completitud</span>
                    {insights.map((item) => (
                      <div key={item.label}>
                        <span>{item.label}</span>
                        <i aria-hidden="true">
                          <b style={{ width: item.ok ? "100%" : "34%" }} />
                        </i>
                      </div>
                    ))}
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

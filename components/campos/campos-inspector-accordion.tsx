"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const STORAGE_KEY = "campos-inspector-section"

const sections = [
  { id: "resumen", label: "Resumen" },
  { id: "ubicacion", label: "Ubicación" },
  { id: "descripcion", label: "Descripción" },
  { id: "sii", label: "SII" },
  { id: "propiedad", label: "Propiedad" },
  { id: "documentos", label: "Documentos" },
] as const

type SectionId = (typeof sections)[number]["id"]

type SummaryMetric = {
  label: string
  value: string
  tone?: "default" | "success" | "warning"
}

type IntelligenceSignal = {
  title: string
  detail: string
  tone: "success" | "warning" | "neutral"
  section: SectionId
}

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

const compactValue = (value: string) => value.replace(/\s+/g, " ").trim().slice(0, 42)

const extractValue = (text: string, labels: string[]) => {
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n|]{2,48})`, "i")
    const match = text.match(pattern)
    if (match?.[1]) return compactValue(match[1])
  }
  return null
}

const getSectionId = (element: HTMLElement, index: number): SectionId => {
  const text = normalizeText(element.innerText || "")

  if (index === 0 || text.includes("estado del kmz")) return "resumen"
  if (text.includes("descripcion del kmz") || text.includes("metadata actual")) return "descripcion"
  if (text.includes("ficha sii") || text.includes("trazabilidad sii") || text.includes("cruce sii")) return "sii"

  if (
    text.includes("dueno / sociedad") ||
    text.includes("propietario") ||
    text.includes("investigacion") ||
    text.includes("asignacion manual") ||
    text.includes("editar informacion")
  ) {
    return "propiedad"
  }

  if (
    text.includes("documentos") ||
    text.includes("google docs") ||
    text.includes("archivos cargados") ||
    text.includes("carpeta de documentos")
  ) {
    return "documentos"
  }

  if (
    text.includes("predio") ||
    text.includes("ubicacion") ||
    text.includes("latitud") ||
    text.includes("longitud") ||
    text.includes("capa seleccionada") ||
    text.includes("geometr")
  ) {
    return "ubicacion"
  }

  return "resumen"
}

const findInspectorBody = () => {
  const headings = Array.from(document.querySelectorAll("h2")).filter(
    (heading) => normalizeText(heading.textContent || "").trim() === "detalles",
  )

  for (const heading of headings.reverse()) {
    const content = heading.parentElement?.nextElementSibling
    if (!(content instanceof HTMLElement)) continue

    const body = content.querySelector(":scope > div.flex-1.overflow-y-auto.p-4")
    if (body instanceof HTMLElement) return body
  }

  return null
}

const clearGeneratedUI = (scope: ParentNode = document) => {
  scope.querySelectorAll("[data-campos-generated='true']").forEach((node) => node.remove())
}

const getInspectorData = (cards: HTMLElement[], availableCount: number) => {
  const rawText = cards.map((card) => card.innerText || "").join("\n")
  const normalized = normalizeText(rawText)
  const role = extractValue(rawText, ["rol(?: sii)?", "rol de avaluo", "rol predial"])
  const area = extractValue(rawText, ["superficie", "area", "hectareas", "ha"])
  const commune = extractValue(rawText, ["comuna", "localidad", "sector"])
  const owner = extractValue(rawText, ["propietario", "dueno", "sociedad"])
  const coverage = Math.round((availableCount / sections.length) * 100)

  return { rawText, normalized, role, area, commune, owner, coverage }
}

const buildExecutiveSummary = (cards: HTMLElement[], availableCount: number) => {
  const data = getInspectorData(cards, availableCount)
  const title =
    extractValue(data.rawText, ["nombre(?: del)? predio", "predio", "nombre", "titulo"]) ||
    cards[0]?.querySelector("h3, h4, strong")?.textContent?.trim() ||
    "Predio seleccionado"

  const status =
    extractValue(data.rawText, ["estado(?: del kmz)?", "situacion", "status"]) ||
    (data.normalized.includes("completo")
      ? "Completo"
      : data.normalized.includes("pendiente")
        ? "Pendiente"
        : "En revisión")

  const metrics: SummaryMetric[] = [
    { label: "Rol SII", value: data.role || "Sin rol" },
    { label: "Superficie", value: data.area || "Sin dato" },
    { label: "Comuna", value: data.commune || "Sin comuna" },
    { label: "Propiedad", value: data.owner || "No asignado" },
    {
      label: "Cobertura",
      value: `${data.coverage}%`,
      tone: data.coverage >= 80 ? "success" : data.coverage >= 50 ? "warning" : "default",
    },
  ]

  const summary = document.createElement("section")
  summary.dataset.camposGenerated = "true"
  summary.className = "campos-inspector-executive"
  summary.setAttribute("aria-label", "Resumen ejecutivo del predio")

  const header = document.createElement("div")
  header.className = "campos-inspector-executive-header"

  const identity = document.createElement("div")
  identity.className = "campos-inspector-identity"

  const marker = document.createElement("span")
  marker.className = "campos-inspector-marker"
  marker.setAttribute("aria-hidden", "true")
  marker.textContent = "⌖"

  const headingWrap = document.createElement("div")
  headingWrap.className = "campos-inspector-heading-wrap"

  const eyebrow = document.createElement("span")
  eyebrow.className = "campos-inspector-eyebrow"
  eyebrow.textContent = "Inteligencia territorial"

  const heading = document.createElement("h3")
  heading.className = "campos-inspector-title"
  heading.textContent = compactValue(title)

  headingWrap.append(eyebrow, heading)
  identity.append(marker, headingWrap)

  const badge = document.createElement("span")
  badge.className = `campos-inspector-status ${normalizeText(status).includes("complet") ? "is-complete" : ""}`
  badge.textContent = compactValue(status)

  header.append(identity, badge)

  const grid = document.createElement("div")
  grid.className = "campos-inspector-kpi-grid"

  metrics.forEach((metric) => {
    const item = document.createElement("div")
    item.className = `campos-inspector-kpi${metric.tone ? ` is-${metric.tone}` : ""}`

    const label = document.createElement("span")
    label.className = "campos-inspector-kpi-label"
    label.textContent = metric.label

    const value = document.createElement("strong")
    value.className = "campos-inspector-kpi-value"
    value.textContent = compactValue(metric.value)
    value.title = metric.value

    item.append(label, value)
    grid.appendChild(item)
  })

  const progress = document.createElement("div")
  progress.className = "campos-inspector-progress"
  progress.setAttribute("aria-label", `Cobertura de información ${data.coverage}%`)

  const progressBar = document.createElement("span")
  progressBar.style.width = `${data.coverage}%`
  progress.appendChild(progressBar)

  summary.append(header, grid, progress)
  return summary
}

const buildIntelligencePanel = (
  cards: HTMLElement[],
  available: readonly { id: SectionId; label: string }[],
  onNavigate: (section: SectionId) => void,
) => {
  const data = getInspectorData(cards, available.length)
  const hasDocuments = available.some((section) => section.id === "documentos")
  const hasSii = available.some((section) => section.id === "sii")
  const hasLocation = available.some((section) => section.id === "ubicacion")
  const signals: IntelligenceSignal[] = [
    {
      title: hasLocation ? "Geometría territorial disponible" : "Falta validar ubicación",
      detail: hasLocation
        ? "La selección contiene información espacial para revisión cartográfica."
        : "No se detectó una sección de ubicación o geometría consolidada.",
      tone: hasLocation ? "success" : "warning",
      section: "ubicacion",
    },
    {
      title: data.role && hasSii ? "Cruce SII identificado" : "Cruce SII pendiente",
      detail:
        data.role && hasSii
          ? `Se detectó el rol ${data.role} dentro de la ficha disponible.`
          : "Conviene confirmar rol, avalúo y trazabilidad tributaria del predio.",
      tone: data.role && hasSii ? "success" : "warning",
      section: "sii",
    },
    {
      title: data.owner ? "Propiedad asociada" : "Propietario no confirmado",
      detail: data.owner
        ? `La información disponible vincula el predio con ${data.owner}.`
        : "No se detectó un propietario o sociedad claramente asignada.",
      tone: data.owner ? "success" : "warning",
      section: "propiedad",
    },
    {
      title: hasDocuments ? "Evidencia documental disponible" : "Sin evidencia documental",
      detail: hasDocuments
        ? "El expediente incluye una sección de documentos para respaldo y auditoría."
        : "Agrega archivos, enlaces o antecedentes para fortalecer la investigación.",
      tone: hasDocuments ? "neutral" : "warning",
      section: "documentos",
    },
  ]

  const panel = document.createElement("section")
  panel.dataset.camposGenerated = "true"
  panel.className = "campos-inspector-intelligence"
  panel.setAttribute("aria-label", "Señales y línea de investigación")

  const panelHeader = document.createElement("div")
  panelHeader.className = "campos-inspector-intelligence-header"
  panelHeader.innerHTML = `<div><span class="campos-inspector-eyebrow">Análisis automático</span><h3>Señales de investigación</h3></div><span class="campos-inspector-signal-count">${signals.filter((signal) => signal.tone === "warning").length} alertas</span>`

  const signalList = document.createElement("div")
  signalList.className = "campos-inspector-signal-list"

  signals.forEach((signal) => {
    const button = document.createElement("button")
    button.type = "button"
    button.className = `campos-inspector-signal is-${signal.tone}`
    button.setAttribute("aria-label", `${signal.title}. Abrir ${signal.section}`)
    button.addEventListener("click", () => onNavigate(signal.section))

    const dot = document.createElement("span")
    dot.className = "campos-inspector-signal-dot"
    dot.setAttribute("aria-hidden", "true")

    const content = document.createElement("span")
    content.className = "campos-inspector-signal-content"

    const title = document.createElement("strong")
    title.textContent = signal.title

    const detail = document.createElement("span")
    detail.textContent = signal.detail

    const arrow = document.createElement("span")
    arrow.className = "campos-inspector-signal-arrow"
    arrow.setAttribute("aria-hidden", "true")
    arrow.textContent = "›"

    content.append(title, detail)
    button.append(dot, content, arrow)
    signalList.appendChild(button)
  })

  const timeline = document.createElement("div")
  timeline.className = "campos-inspector-timeline"

  const timelineTitle = document.createElement("div")
  timelineTitle.className = "campos-inspector-timeline-title"
  timelineTitle.textContent = "Ruta sugerida"
  timeline.appendChild(timelineTitle)

  const steps = [
    { label: "Validar geometría", done: hasLocation },
    { label: "Confirmar ficha SII", done: Boolean(data.role && hasSii) },
    { label: "Verificar propiedad", done: Boolean(data.owner) },
    { label: "Consolidar documentos", done: hasDocuments },
  ]

  steps.forEach((step, index) => {
    const item = document.createElement("div")
    item.className = `campos-inspector-timeline-item${step.done ? " is-done" : ""}`
    item.innerHTML = `<span class="campos-inspector-timeline-index">${step.done ? "✓" : index + 1}</span><span>${step.label}</span>`
    timeline.appendChild(item)
  })

  panel.append(panelHeader, signalList, timeline)
  return panel
}

export function CAMPOSInspectorAccordion() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname?.toLowerCase().includes("campos")) return

    let frameId = 0
    let observer: MutationObserver | null = null
    let currentBody: HTMLElement | null = null
    let currentSignature = ""

    const observe = () => {
      if (!observer) return
      observer.observe(document.body, { childList: true, subtree: true })
    }

    const applyAccordion = () => {
      const body = findInspectorBody()
      if (!body) return

      const originalCards = Array.from(body.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && child.dataset.camposGenerated !== "true",
      )

      if (originalCards.length === 0) return

      const signature = originalCards
        .map((card, index) => `${index}:${normalizeText(card.innerText || "").slice(0, 90)}`)
        .join("|")

      if (body === currentBody && signature === currentSignature && body.querySelector(".campos-inspector-quick-nav")) {
        return
      }

      observer?.disconnect()
      clearGeneratedUI(body)

      originalCards.forEach((card) => {
        card.classList.remove("campos-inspector-section-content", "is-open")
        card.removeAttribute("data-campos-section")
        card.removeAttribute("aria-hidden")
      })

      originalCards.forEach((card, index) => {
        card.dataset.camposSection = getSectionId(card, index)
        card.classList.add("campos-inspector-section-content")
      })

      const available = sections.filter((section) =>
        originalCards.some((card) => card.dataset.camposSection === section.id),
      )

      let active = (window.localStorage.getItem(STORAGE_KEY) || "resumen") as SectionId
      if (!available.some((section) => section.id === active)) active = available[0]?.id || "resumen"

      const render = (next: SectionId) => {
        const target = available.some((section) => section.id === next) ? next : available[0]?.id || "resumen"
        active = target
        window.localStorage.setItem(STORAGE_KEY, target)

        originalCards.forEach((card) => {
          const isOpen = card.dataset.camposSection === target
          card.classList.toggle("is-open", isOpen)
          card.setAttribute("aria-hidden", isOpen ? "false" : "true")
        })

        body.querySelectorAll<HTMLElement>("[data-campos-section-button]").forEach((button) => {
          const selected = button.dataset.camposSectionButton === target
          button.classList.toggle("is-active", selected)
          button.setAttribute("aria-expanded", selected ? "true" : "false")
        })
      }

      const executiveSummary = buildExecutiveSummary(originalCards, available.length)
      const intelligencePanel = buildIntelligencePanel(originalCards, available, render)

      const quickNav = document.createElement("nav")
      quickNav.dataset.camposGenerated = "true"
      quickNav.className = "campos-inspector-quick-nav"
      quickNav.setAttribute("aria-label", "Navegación del inspector")

      available.forEach((section) => {
        const button = document.createElement("button")
        button.type = "button"
        button.dataset.camposSectionButton = section.id
        button.className = "campos-inspector-nav-button"
        button.textContent = section.label
        button.addEventListener("click", () => render(section.id))
        quickNav.appendChild(button)
      })

      const aiButton = document.createElement("button")
      aiButton.type = "button"
      aiButton.className = "campos-inspector-nav-button campos-inspector-ai-button"
      aiButton.textContent = "IA"
      aiButton.setAttribute("aria-label", "Abrir asistente de inteligencia artificial")
      aiButton.addEventListener("click", () => {
        const candidate = Array.from(document.querySelectorAll("button")).find((button) =>
          normalizeText(button.getAttribute("title") || button.textContent || "").includes("asistente"),
        )
        if (candidate instanceof HTMLButtonElement) candidate.click()
      })
      quickNav.appendChild(aiButton)
      body.prepend(executiveSummary, intelligencePanel, quickNav)

      available.forEach((section) => {
        const firstCard = originalCards.find((card) => card.dataset.camposSection === section.id)
        if (!firstCard) return

        const trigger = document.createElement("button")
        trigger.type = "button"
        trigger.dataset.camposGenerated = "true"
        trigger.dataset.camposSectionButton = section.id
        trigger.className = "campos-inspector-accordion-trigger"
        trigger.setAttribute("aria-controls", `campos-inspector-${section.id}`)
        trigger.innerHTML = `<span>${section.label}</span><span aria-hidden="true" class="campos-inspector-chevron">⌄</span>`
        trigger.addEventListener("click", () => render(section.id))

        firstCard.id = `campos-inspector-${section.id}`
        body.insertBefore(trigger, firstCard)
      })

      render(active)
      currentBody = body
      currentSignature = signature
      observe()
    }

    const scheduleApply = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(applyAccordion)
    }

    observer = new MutationObserver((mutations) => {
      const hasExternalChange = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some(
          (node) => !(node instanceof HTMLElement) || node.dataset.camposGenerated !== "true",
        ),
      )

      if (hasExternalChange) scheduleApply()
    })

    observe()
    scheduleApply()

    return () => {
      observer?.disconnect()
      window.cancelAnimationFrame(frameId)
      clearGeneratedUI()
      document.querySelectorAll<HTMLElement>("[data-campos-section]").forEach((node) => {
        node.classList.remove("campos-inspector-section-content", "is-open")
        node.removeAttribute("data-campos-section")
        node.removeAttribute("aria-hidden")
        if (node.id.startsWith("campos-inspector-")) node.removeAttribute("id")
      })
    }
  }, [pathname])

  return null
}

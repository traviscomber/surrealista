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

const buildExecutiveSummary = (cards: HTMLElement[], availableCount: number) => {
  const rawText = cards.map((card) => card.innerText || "").join("\n")
  const normalized = normalizeText(rawText)

  const title =
    extractValue(rawText, ["nombre(?: del)? predio", "predio", "nombre", "titulo"]) ||
    cards[0]?.querySelector("h3, h4, strong")?.textContent?.trim() ||
    "Predio seleccionado"

  const status =
    extractValue(rawText, ["estado(?: del kmz)?", "situacion", "status"]) ||
    (normalized.includes("completo") ? "Completo" : normalized.includes("pendiente") ? "Pendiente" : "En revisión")

  const role = extractValue(rawText, ["rol(?: sii)?", "rol de avaluo", "rol predial"]) || "Sin rol"
  const area = extractValue(rawText, ["superficie", "area", "hectareas", "ha"]) || "Sin dato"
  const commune = extractValue(rawText, ["comuna", "localidad", "sector"]) || "Sin comuna"
  const owner = extractValue(rawText, ["propietario", "dueno", "sociedad"]) || "No asignado"
  const coverage = Math.round((availableCount / sections.length) * 100)

  const metrics: SummaryMetric[] = [
    { label: "Rol SII", value: role },
    { label: "Superficie", value: area },
    { label: "Comuna", value: commune },
    { label: "Propiedad", value: owner },
    {
      label: "Cobertura",
      value: `${coverage}%`,
      tone: coverage >= 80 ? "success" : coverage >= 50 ? "warning" : "default",
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
  progress.setAttribute("aria-label", `Cobertura de información ${coverage}%`)

  const progressBar = document.createElement("span")
  progressBar.style.width = `${coverage}%`
  progress.appendChild(progressBar)

  summary.append(header, grid, progress)
  return summary
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
        active = next
        window.localStorage.setItem(STORAGE_KEY, next)

        originalCards.forEach((card) => {
          const isOpen = card.dataset.camposSection === next
          card.classList.toggle("is-open", isOpen)
          card.setAttribute("aria-hidden", isOpen ? "false" : "true")
        })

        body.querySelectorAll<HTMLElement>("[data-campos-section-button]").forEach((button) => {
          const selected = button.dataset.camposSectionButton === next
          button.classList.toggle("is-active", selected)
          button.setAttribute("aria-expanded", selected ? "true" : "false")
        })
      }

      const executiveSummary = buildExecutiveSummary(originalCards, available.length)

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
      body.prepend(executiveSummary, quickNav)

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

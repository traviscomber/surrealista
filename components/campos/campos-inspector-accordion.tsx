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

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

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
      aiButton.className = "campos-inspector-nav-button"
      aiButton.textContent = "IA"
      aiButton.setAttribute("aria-label", "Abrir asistente de inteligencia artificial")
      aiButton.addEventListener("click", () => {
        const candidate = Array.from(document.querySelectorAll("button")).find((button) =>
          normalizeText(button.getAttribute("title") || button.textContent || "").includes("asistente"),
        )
        if (candidate instanceof HTMLButtonElement) candidate.click()
      })
      quickNav.appendChild(aiButton)
      body.prepend(quickNav)

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

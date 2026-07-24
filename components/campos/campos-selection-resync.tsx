"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

const compact = (value: string, max = 140) => value.replace(/\s+/g, " ").trim().slice(0, max)

const extract = (text: string, labels: string[]) => {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n|]{2,140})`, "i"))
    if (match?.[1]) return compact(match[1])
  }
  return null
}

const findDetailsPanel = () => {
  const structured = document.querySelector<HTMLElement>("[data-campos-panel]")
  if (structured) return structured

  const heading = Array.from(document.querySelectorAll("h2, h3")).find((node) => {
    const text = normalize(node.textContent || "").trim()
    return text === "detalles" || text.includes("detalle del predio") || text.includes("expediente")
  })

  return heading?.closest<HTMLElement>("aside, section, [role='dialog']") || heading?.parentElement?.parentElement || null
}

export function CAMPOSSelectionResync() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname?.toLowerCase().includes("campos")) return

    let timer: ReturnType<typeof setTimeout> | null = null
    let lastSignature = ""

    const emitEnrichedSelection = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const panel = findDetailsPanel()
        if (!(panel instanceof HTMLElement)) return

        const text = panel.innerText || ""
        if (!text.trim()) return

        const title =
          extract(text, ["nombre(?: del)? predio", "predio", "nombre", "titulo"]) ||
          panel.querySelector("h3, h4, strong")?.textContent?.trim() ||
          "Predio seleccionado"
        const role = extract(text, ["rol(?: sii)?", "rol de avaluo", "rol predial"])
        const owner = extract(text, ["propietario", "dueno", "sociedad"])
        const commune = extract(text, ["comuna", "localidad", "sector"])
        const area = extract(text, ["superficie", "area", "hectareas", "ha"])
        const latitude = extract(text, ["latitud", "latitude", "lat"])
        const longitude = extract(text, ["longitud", "longitude", "lng", "lon"])
        const sections = ["ubicacion", "descripcion", "sii", "propiedad", "documentos"].filter((section) =>
          normalize(text).includes(section),
        )

        const signature = JSON.stringify({ title, role, owner, commune, area, latitude, longitude, sections, text })
        if (signature === lastSignature) return
        lastSignature = signature

        window.dispatchEvent(
          new CustomEvent("campos:selection-change", {
            detail: {
              title: compact(title),
              role,
              owner,
              commune,
              area,
              latitude,
              longitude,
              sections,
              text,
              source: "details-panel-resync",
            },
          }),
        )
      }, 180)
    }

    const observer = new MutationObserver(emitEnrichedSelection)
    observer.observe(document.body, { subtree: true, childList: true, characterData: true })
    emitEnrichedSelection()

    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [pathname])

  return null
}

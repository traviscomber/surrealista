"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { CAMPOSAIWidget, type CAMPOSAgentContext } from "@/components/campos/campos-ai-widget"

const STORAGE_KEY = "campos-ai-agent-context"

function sanitizeContext(value: unknown): CAMPOSAgentContext | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>
  const title = typeof raw.title === "string" ? raw.title.trim() : ""
  if (!title) return null

  return {
    title,
    role: typeof raw.role === "string" ? raw.role : null,
    commune: typeof raw.commune === "string" ? raw.commune : null,
    area: typeof raw.area === "string" ? raw.area : null,
    latitude: typeof raw.latitude === "string" ? raw.latitude : null,
    longitude: typeof raw.longitude === "string" ? raw.longitude : null,
    sections: Array.isArray(raw.sections) ? raw.sections.filter((item): item is string => typeof item === "string") : [],
    text: typeof raw.text === "string" ? raw.text : "",
    source: typeof raw.source === "string" ? raw.source : "campos-selection",
    capturedAt: typeof raw.capturedAt === "string" ? raw.capturedAt : new Date().toISOString(),
  }
}

function readStoredContext(): CAMPOSAgentContext | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? sanitizeContext(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function CAMPOSAIAgentHost() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [context, setContext] = useState<CAMPOSAgentContext | null>(null)
  const onCampos = Boolean(pathname?.toLowerCase().includes("campos"))

  useEffect(() => {
    if (!onCampos) return
    setContext(readStoredContext())

    const handleSelection = (event: Event) => {
      const next = sanitizeContext((event as CustomEvent<unknown>).detail)
      if (!next) return

      const captured = { ...next, capturedAt: new Date().toISOString() }
      setContext(captured)
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured))
      } catch {}
    }

    const handleOpen = (event: Event) => {
      handleSelection(event)
      setIsOpen(true)
    }

    window.addEventListener("campos:selection-change", handleSelection)
    window.addEventListener("campos:open-ai-agent", handleOpen)

    return () => {
      window.removeEventListener("campos:selection-change", handleSelection)
      window.removeEventListener("campos:open-ai-agent", handleOpen)
    }
  }, [onCampos])

  if (!onCampos) return null

  return <CAMPOSAIWidget isOpen={isOpen} onOpenChange={setIsOpen} context={context} />
}

"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { CAMPOSAIWidget } from "@/components/campos/campos-ai-widget"

type CAMPOSAgentContext = {
  title?: string | null
  role?: string | null
  owner?: string | null
  commune?: string | null
  area?: string | null
  latitude?: string | null
  longitude?: string | null
  sections?: string[]
  text?: string
  source?: string
  capturedAt?: string
}

const STORAGE_KEY = "campos-ai-agent-context"

const readStoredContext = (): CAMPOSAgentContext | null => {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
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
      const detail = (event as CustomEvent<CAMPOSAgentContext>).detail
      if (!detail?.title) return

      const next: CAMPOSAgentContext = {
        title: detail.title,
        role: detail.role ?? null,
        owner: detail.owner ?? null,
        commune: detail.commune ?? null,
        area: detail.area ?? null,
        latitude: detail.latitude ?? null,
        longitude: detail.longitude ?? null,
        sections: Array.isArray(detail.sections) ? detail.sections : [],
        text: detail.text || "",
        source: detail.source || "campos-selection",
        capturedAt: new Date().toISOString(),
      }

      setContext(next)
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
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

  return <CAMPOSAIWidget isOpen={isOpen} onOpenChange={setIsOpen} />
}

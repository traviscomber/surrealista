"use client"

import { useEffect } from "react"

export function LeafletPopupBehavior() {
  useEffect(() => {
    let cancelled = false
    let attempts = 0

    const configure = () => {
      if (cancelled) return

      const L = (window as any).L
      if (L?.Popup?.prototype?.options) {
        L.Popup.prototype.options.autoPan = false
        L.Popup.prototype.options.keepInView = false
        L.Popup.prototype.options.maxHeight = 260
        return
      }

      attempts += 1
      if (attempts < 80) window.setTimeout(configure, 100)
    }

    configure()
    return () => {
      cancelled = true
    }
  }, [])

  return null
}

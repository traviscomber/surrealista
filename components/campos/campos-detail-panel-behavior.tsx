"use client"

import { useEffect } from "react"

const PANEL_SELECTOR = '.campos-desktop-shell > div > div:nth-child(3) > div:nth-child(2) > div[class*="transition-[height]"]'

export function CAMPOSDetailPanelBehavior() {
  useEffect(() => {
    let observer: MutationObserver | null = null

    const enhance = () => {
      const panel = document.querySelector<HTMLElement>(PANEL_SELECTOR)
      if (!panel) return

      panel.dataset.camposDetailPanel = "true"

      const header = panel.firstElementChild as HTMLElement | null
      if (header) {
        header.dataset.camposDetailHeader = "true"

        const selectedRow = document.querySelector<HTMLElement>(
          '.campos-desktop-shell > div > div:first-child .overflow-y-auto button.bg-secondary span.flex-1, .campos-desktop-shell > div > div:first-child .overflow-y-auto button[data-state="active"] span.flex-1',
        )
        const selectedName = selectedRow?.textContent?.trim()
        const title = header.querySelector<HTMLElement>("h2")
        const subtitle = header.querySelector<HTMLElement>("p")

        if (title) title.textContent = selectedName || "Detalle del KMZ"
        if (subtitle) {
          subtitle.textContent = "Información territorial y documental"
          subtitle.hidden = false
        } else if (selectedName && !header.querySelector('[data-campos-detail-subtitle="true"]')) {
          const context = document.createElement("p")
          context.dataset.camposDetailSubtitle = "true"
          context.textContent = "Información territorial y documental"
          context.className = "truncate text-xs text-muted-foreground"
          title?.insertAdjacentElement("afterend", context)
        }
      }

      const tablist = panel.querySelector<HTMLElement>('[role="tablist"]')
      if (tablist) {
        tablist.dataset.camposDetailTabs = "true"
        tablist.style.pointerEvents = "auto"
        tablist.style.position = "relative"
        tablist.style.zIndex = "5"
      }

      panel.querySelectorAll<HTMLElement>('[role="tab"]').forEach((tab) => {
        tab.style.pointerEvents = "auto"
        tab.style.position = "relative"
        tab.style.zIndex = "6"
      })
    }

    enhance()
    observer = new MutationObserver(enhance)
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "data-state"] })

    return () => observer?.disconnect()
  }, [])

  return null
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CAMPOSRegionalTagFilterV3 } from "@/components/campos/campos-regional-tag-filter-v3"

const clean = (value: string) => value.replace(/\s+/g, " ").trim()

function readSidebarRegions(): string[] {
  const shell = document.querySelector(".campos-desktop-shell")
  if (!shell) return []

  const selected = new Set<string>()
  const checked = shell.querySelectorAll('[role="checkbox"][data-state="checked"], button[role="checkbox"][aria-checked="true"]')

  checked.forEach((control) => {
    const row = control.closest("div.flex.items-center") || control.parentElement
    const button = row?.querySelector("button[class*='justify-start']")
    const label = clean(button?.textContent || "")
      .replace(/\d+\s*%$/g, "")
      .replace(/\d+$/g, "")
      .trim()
    if (label) selected.add(label)
  })

  return Array.from(selected)
}

export function CAMPOSRegionalTagFilterSynced() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hostRef = useRef<HTMLDivElement>(null)
  const [sidebarRegions, setSidebarRegions] = useState<string[]>([])

  useEffect(() => {
    let frame = 0
    const sync = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = readSidebarRegions()
        setSidebarRegions((current) =>
          current.length === next.length && current.every((value, index) => value === next[index]) ? current : next,
        )
      })
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-state", "aria-checked", "class"],
    })

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!sidebarRegions.length) return
    const current = searchParams.get("regions")?.split("|").filter(Boolean) || []
    if (current.length === sidebarRegions.length && current.every((value, index) => value === sidebarRegions[index])) return

    const params = new URLSearchParams(searchParams.toString())
    params.set("regions", sidebarRegions.join("|"))
    params.delete("tags")
    params.delete("q")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router, searchParams, sidebarRegions])

  const canonicalRegions = useMemo(
    () => sidebarRegions.length ? sidebarRegions : searchParams.get("regions")?.split("|").filter(Boolean) || [],
    [searchParams, sidebarRegions],
  )

  const key = `${canonicalRegions.join("|")}::${searchParams.get("tags") || ""}::${searchParams.get("q") || ""}`

  const protectCanonicalRegion = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!sidebarRegions.length) return
    const button = (event.target as HTMLElement).closest("button")
    const section = button?.closest("section")
    if (!button || !section) return

    const sections = Array.from(section.parentElement?.querySelectorAll(":scope > section") || [])
    if (sections.indexOf(section) !== 0) return

    const label = clean(button.textContent || "").replace(/\d+$/g, "").trim()
    const isCanonical = sidebarRegions.some((region) => clean(region) === label || clean(region).includes(label) || label.includes(clean(region)))
    if (!isCanonical) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  return (
    <div ref={hostRef} onClickCapture={protectCanonicalRegion} className="contents">
      <CAMPOSRegionalTagFilterV3 key={key} />
      {sidebarRegions.length > 0 && (
        <style jsx global>{`
          @media (min-width: 1024px) {
            .campos-desktop-shell ~ div section:first-child button:not([class*="bg-slate-900"]) {
              opacity: 0.38 !important;
              cursor: not-allowed !important;
            }
          }
        `}</style>
      )}
    </div>
  )
}

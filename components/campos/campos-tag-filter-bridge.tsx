"use client"

import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"

declare global {
  interface Window {
    __camposTagFilterTags?: string[]
    __camposOriginalFetch?: typeof fetch
  }
}

const splitParam = (value: string | null) => value?.split("|").map((item) => item.trim()).filter(Boolean) || []

function addTagContainment(input: RequestInfo | URL, init?: RequestInit) {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
  if (!raw.includes("/rest/v1/kmz_collection")) return null

  const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase()
  if (method !== "GET") return null

  const url = new URL(raw, window.location.origin)
  const hasRegionalScope = url.searchParams.has("region")
  const tags = window.__camposTagFilterTags || []
  if (!hasRegionalScope || tags.length === 0 || url.searchParams.has("tags")) return null

  url.searchParams.set("tags", `cs.{${tags.join(",")}}`)
  return url.toString()
}

function reloadSelectedRegions() {
  const controls = Array.from(
    document.querySelectorAll<HTMLElement>(
      '.campos-desktop-shell [role="checkbox"][data-state="checked"], .campos-desktop-shell button[role="checkbox"][aria-checked="true"]',
    ),
  )
  if (!controls.length) return

  controls.forEach((control) => control.click())
  requestAnimationFrame(() => controls.forEach((control) => control.click()))
}

export function CAMPOSTagFilterBridge() {
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createBrowserClient(), [])
  const previousSignature = useRef("")
  const tags = splitParam(searchParams.get("tags"))
  const regions = splitParam(searchParams.get("regions"))
  const query = (searchParams.get("q") || "").trim()
  const signature = `${regions.join("|")}::${tags.join("|")}::${query}`

  useLayoutEffect(() => {
    window.__camposTagFilterTags = tags
    if (window.__camposOriginalFetch) return

    const original = window.fetch.bind(window)
    window.__camposOriginalFetch = original
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const filteredUrl = addTagContainment(input, init)
      return original(filteredUrl || input, init)
    }) as typeof fetch

    return () => {
      if (window.__camposOriginalFetch) {
        window.fetch = window.__camposOriginalFetch
        delete window.__camposOriginalFetch
      }
    }
  }, [])

  useEffect(() => {
    window.__camposTagFilterTags = tags
    if (!previousSignature.current) {
      previousSignature.current = signature
      return
    }
    if (previousSignature.current === signature) return
    previousSignature.current = signature
    reloadSelectedRegions()
  }, [signature, tags])

  useEffect(() => {
    let cancelled = false
    let observer: MutationObserver | null = null

    const clearVisibility = () => {
      document.querySelectorAll<HTMLElement>('[data-campos-tag-filtered="true"]').forEach((element) => {
        element.hidden = false
        element.removeAttribute("data-campos-tag-filtered")
      })
    }

    const run = async () => {
      clearVisibility()
      if (!regions.length || (!tags.length && !query)) return

      let request = supabase
        .from("kmz_collection")
        .select("file_name")
        .eq("is_active", true)
        .in("region", regions)
        .limit(5000)

      if (tags.length) request = request.contains("tags", tags)
      if (query) request = request.or(`file_name.ilike.%${query}%,owner.ilike.%${query}%`)

      const { data } = await request
      if (cancelled) return
      const visibleNames = new Set((data || []).map((record: any) => `${record.file_name || ""}`.trim()))

      const apply = () => {
        document
          .querySelectorAll<HTMLElement>('.campos-desktop-shell .ml-8 button[class*="justify-start"]')
          .forEach((button) => {
            const name = button.querySelector<HTMLElement>("span.flex-1")?.textContent?.trim() || ""
            button.hidden = !visibleNames.has(name)
            button.setAttribute("data-campos-tag-filtered", "true")
          })
      }

      apply()
      observer = new MutationObserver(apply)
      const shell = document.querySelector(".campos-desktop-shell")
      if (shell) observer.observe(shell, { subtree: true, childList: true })
    }

    run()
    return () => {
      cancelled = true
      observer?.disconnect()
      clearVisibility()
    }
  }, [query, regions.join("|"), supabase, tags.join("|")])

  return null
}

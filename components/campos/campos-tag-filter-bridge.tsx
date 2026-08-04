"use client"

import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"

declare global {
  interface Window {
    __camposTagFilterTags?: string[]
    __camposFocusedKmzId?: string
    __camposOriginalFetch?: typeof fetch
  }
}

const splitParam = (value: string | null) => value?.split("|").map((item) => item.trim()).filter(Boolean) || []

function applyWorkspaceScope(input: RequestInfo | URL, init?: RequestInit) {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
  if (!raw.includes("/rest/v1/kmz_collection")) return null

  const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase()
  if (method !== "GET") return null

  const url = new URL(raw, window.location.origin)
  const hasRegionalScope = url.searchParams.has("region")
  if (!hasRegionalScope) return null

  const focusedKmzId = window.__camposFocusedKmzId
  if (focusedKmzId) {
    url.searchParams.set("id", `eq.${focusedKmzId}`)
    url.searchParams.delete("tags")
    return url.toString()
  }

  const tags = window.__camposTagFilterTags || []
  if (tags.length > 0 && !url.searchParams.has("tags")) {
    url.searchParams.set("tags", `cs.{${tags.join(",")}}`)
    return url.toString()
  }

  return null
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

function selectedSidebarFileName() {
  const selected = document.querySelector<HTMLElement>(
    '.campos-desktop-shell .ml-8 button[class*="justify-start"].bg-secondary, .campos-desktop-shell .ml-8 button[class*="justify-start"][data-state="active"], .campos-desktop-shell .ml-8 button[class*="justify-start"][aria-current="true"]',
  )
  return selected?.querySelector<HTMLElement>("span.flex-1")?.textContent?.trim() || ""
}

export function CAMPOSTagFilterBridge() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createBrowserClient(), [])
  const previousSignature = useRef("")
  const resolvingFile = useRef("")
  const tags = splitParam(searchParams.get("tags"))
  const regions = splitParam(searchParams.get("regions"))
  const query = (searchParams.get("q") || "").trim()
  const focusedKmzId = (searchParams.get("kmz") || "").trim()
  const signature = `${regions.join("|")}::${tags.join("|")}::${query}::${focusedKmzId}`

  useLayoutEffect(() => {
    window.__camposTagFilterTags = tags
    window.__camposFocusedKmzId = focusedKmzId || undefined
    if (window.__camposOriginalFetch) return

    const original = window.fetch.bind(window)
    window.__camposOriginalFetch = original
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const filteredUrl = applyWorkspaceScope(input, init)
      return original(filteredUrl || input, init)
    }) as typeof fetch

    return () => {
      if (window.__camposOriginalFetch) {
        window.fetch = window.__camposOriginalFetch
        delete window.__camposOriginalFetch
      }
      delete window.__camposFocusedKmzId
    }
  }, [])

  useEffect(() => {
    window.__camposTagFilterTags = tags
    window.__camposFocusedKmzId = focusedKmzId || undefined
    if (!previousSignature.current) {
      previousSignature.current = signature
      return
    }
    if (previousSignature.current === signature) return
    previousSignature.current = signature
    reloadSelectedRegions()
  }, [focusedKmzId, signature, tags])

  useEffect(() => {
    let cancelled = false
    let timer = 0

    const syncSelectedFile = async () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(async () => {
        const fileName = selectedSidebarFileName()
        if (!fileName || resolvingFile.current === fileName) return
        resolvingFile.current = fileName

        let request = supabase
          .from("kmz_collection")
          .select("id,region")
          .eq("is_active", true)
          .eq("file_name", fileName)
          .limit(2)
        if (regions.length) request = request.in("region", regions)

        const { data } = await request
        resolvingFile.current = ""
        if (cancelled || !data?.length) return

        const record = data[0] as { id: string; region: string | null }
        if (record.id === focusedKmzId) return
        const params = new URLSearchParams(searchParams.toString())
        params.set("kmz", record.id)
        if (!regions.length && record.region) params.set("regions", record.region)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      }, 80)
    }

    const shell = document.querySelector(".campos-desktop-shell")
    if (!shell) return
    shell.addEventListener("click", syncSelectedFile, true)
    const observer = new MutationObserver(syncSelectedFile)
    observer.observe(shell, { subtree: true, attributes: true, attributeFilter: ["class", "data-state", "aria-current"] })

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      shell.removeEventListener("click", syncSelectedFile, true)
      observer.disconnect()
    }
  }, [focusedKmzId, pathname, regions.join("|"), router, searchParams, supabase])

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
      if (!regions.length || (!tags.length && !query && !focusedKmzId)) return

      let request = supabase
        .from("kmz_collection")
        .select("file_name")
        .eq("is_active", true)
        .in("region", regions)
        .limit(5000)

      if (focusedKmzId) request = request.eq("id", focusedKmzId)
      else {
        if (tags.length) request = request.contains("tags", tags)
        if (query) request = request.or(`file_name.ilike.%${query}%,owner.ilike.%${query}%`)
      }

      const { data } = await request
      if (cancelled) return
      const visibleNames = new Set((data || []).map((record: any) => `${record.file_name || ""}`.trim()))

      const apply = () => {
        document
          .querySelectorAll<HTMLElement>('.campos-desktop-shell .ml-8 button[class*="justify-start"]')
          .forEach((button) => {
            const name = button.querySelector<HTMLElement>("span.flex-1")?.textContent?.trim() || ""
            button.hidden = focusedKmzId ? false : !visibleNames.has(name)
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
  }, [focusedKmzId, query, regions.join("|"), supabase, tags.join("|")])

  return null
}

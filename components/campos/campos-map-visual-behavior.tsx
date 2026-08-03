"use client"

import { useEffect } from "react"

export function CAMPOSMapVisualBehavior() {
  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    const patchLeaflet = () => {
      const L = (window as any).L
      if (!L || L.__CAMPOS_VISUAL_PATCHED__) return false

      L.__CAMPOS_VISUAL_PATCHED__ = true
      let selectedPath: any = null

      const bindPathStates = (path: any, base: Record<string, any>, hover: Record<string, any>, selected: Record<string, any>) => {
        if (!path?.on || !path?.setStyle) return path
        ;(path as any).__camposBaseStyle = base

        path.on("mouseover", () => {
          if (selectedPath !== path) path.setStyle(hover)
          path.bringToFront?.()
        })
        path.on("mouseout", () => {
          if (selectedPath !== path) path.setStyle(base)
        })
        path.on("click", () => {
          if (selectedPath && selectedPath !== path) {
            selectedPath.setStyle?.(selectedPath.__camposBaseStyle || base)
          }
          selectedPath = path
          path.setStyle(selected)
          path.bringToFront?.()
        })
        return path
      }

      const originalPolygon = L.polygon.bind(L)
      L.polygon = (latlngs: any, options: Record<string, any> = {}) => {
        const isReference = Boolean(options.dashArray) || Number(options.fillOpacity) <= 0.05
        if (isReference) return originalPolygon(latlngs, options)

        const base = {
          ...options,
          weight: Math.max(Number(options.weight || 0), 2.25),
          opacity: 0.92,
          fillOpacity: 0.16,
          lineCap: "round",
          lineJoin: "round",
        }
        const path = originalPolygon(latlngs, base)
        return bindPathStates(
          path,
          base,
          { ...base, weight: 3.25, opacity: 1, fillOpacity: 0.23 },
          { ...base, weight: 4, opacity: 1, fillOpacity: 0.28 },
        )
      }

      const originalPolyline = L.polyline.bind(L)
      L.polyline = (latlngs: any, options: Record<string, any> = {}) => {
        const base = {
          ...options,
          weight: Math.max(Number(options.weight || 0), 2.5),
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }
        const path = originalPolyline(latlngs, base)
        return bindPathStates(
          path,
          base,
          { ...base, weight: 3.5, opacity: 1 },
          { ...base, weight: 4.25, opacity: 1 },
        )
      }

      const originalCircleMarker = L.circleMarker.bind(L)
      L.circleMarker = (latlng: any, options: Record<string, any> = {}) => {
        const base = {
          ...options,
          radius: Math.max(Number(options.radius || 0), 5.5),
          weight: Math.max(Number(options.weight || 0), 2),
        }
        const marker = originalCircleMarker(latlng, base)
        marker.on?.("mouseover", () => marker.setStyle?.({ weight: 3, fillOpacity: 1 }))
        marker.on?.("mouseout", () => marker.setStyle?.(base))
        return marker
      }

      return true
    }

    const attempt = () => {
      if (cancelled || patchLeaflet()) return
      timer = window.setTimeout(attempt, 25)
    }

    attempt()
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  return null
}

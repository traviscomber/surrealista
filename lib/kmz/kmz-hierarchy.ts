import type { KMZPlacemark } from "./kmz-reader"

export type KmlHierarchyPath = {
  path: string[]
  placemarkCount: number
}

export type KmlHierarchySummary = {
  version: 1
  source: "kml-folder-path"
  hasHierarchy: boolean
  folderCount: number
  maxDepth: number
  rootFolders: string[]
  paths: KmlHierarchyPath[]
}

function normalizePath(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12)
}

export function buildKmlHierarchySummary(
  placemarks: Array<Pick<KMZPlacemark, "properties">>,
): KmlHierarchySummary {
  const counts = new Map<string, { path: string[]; placemarkCount: number }>()
  const folders = new Set<string>()
  const roots = new Set<string>()
  let maxDepth = 0

  for (const placemark of placemarks) {
    const path = normalizePath(placemark.properties?.folderPath)
    if (!path.length) continue

    maxDepth = Math.max(maxDepth, path.length)
    roots.add(path[0])

    for (let depth = 1; depth <= path.length; depth += 1) {
      folders.add(path.slice(0, depth).join(" / "))
    }

    const key = path.join(" / ")
    const current = counts.get(key)
    if (current) current.placemarkCount += 1
    else counts.set(key, { path, placemarkCount: 1 })
  }

  return {
    version: 1,
    source: "kml-folder-path",
    hasHierarchy: counts.size > 0,
    folderCount: folders.size,
    maxDepth,
    rootFolders: Array.from(roots).sort((a, b) => a.localeCompare(b, "es")),
    paths: Array.from(counts.values())
      .sort((a, b) => b.placemarkCount - a.placemarkCount || a.path.join("/").localeCompare(b.path.join("/"), "es"))
      .slice(0, 100),
  }
}

export function hierarchyPathLabel(path: string[]) {
  return path.join(" › ")
}

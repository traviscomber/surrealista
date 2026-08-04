export type GeometryStatus =
  | "real_geometry"
  | "direct_reference"
  | "metadata_reference"
  | "sii_reference"
  | "bounds_reference"
  | "missing"

export interface GeometryStatusPresentation {
  label: string
  shortLabel: string
  description: string
  kind: "real" | "reference" | "missing"
  marker: {
    radius: number
    color: string
    fillColor: string
    fillOpacity: number
    weight: number
    dashArray?: string
  }
}

const PRESENTATION: Record<GeometryStatus, GeometryStatusPresentation> = {
  real_geometry: {
    label: "Geometría real",
    shortLabel: "Geometría",
    description: "Polígono, línea o punto recuperado desde el archivo KMZ.",
    kind: "real",
    marker: {
      radius: 5,
      color: "#ffffff",
      fillColor: "#2f6f55",
      fillOpacity: 1,
      weight: 2,
    },
  },
  direct_reference: {
    label: "Coordenada directa",
    shortLabel: "Punto",
    description: "Ubicación tomada desde latitud y longitud almacenadas en el registro.",
    kind: "reference",
    marker: {
      radius: 6,
      color: "#ffffff",
      fillColor: "#2f6484",
      fillOpacity: 0.95,
      weight: 2,
    },
  },
  metadata_reference: {
    label: "Referencia geográfica",
    shortLabel: "Referencia",
    description: "Ubicación recuperada desde los metadatos territoriales del registro.",
    kind: "reference",
    marker: {
      radius: 6,
      color: "#ffffff",
      fillColor: "#6c5c8d",
      fillOpacity: 0.92,
      weight: 2,
    },
  },
  sii_reference: {
    label: "Centro territorial SII",
    shortLabel: "Centro SII",
    description: "Punto territorial de referencia resuelto mediante información del SII.",
    kind: "reference",
    marker: {
      radius: 7,
      color: "#ffffff",
      fillColor: "#2563eb",
      fillOpacity: 0.95,
      weight: 2,
    },
  },
  bounds_reference: {
    label: "Ubicación aproximada",
    shortLabel: "Aproximada",
    description: "Centro calculado desde los límites geográficos disponibles.",
    kind: "reference",
    marker: {
      radius: 6,
      color: "#64748b",
      fillColor: "#cbd5e1",
      fillOpacity: 0.8,
      weight: 2,
      dashArray: "3 3",
    },
  },
  missing: {
    label: "Sin ubicación",
    shortLabel: "Sin ubicación",
    description: "No existe geometría ni referencia espacial recuperable.",
    kind: "missing",
    marker: {
      radius: 5,
      color: "#991b1b",
      fillColor: "#fecaca",
      fillOpacity: 0.75,
      weight: 2,
      dashArray: "3 3",
    },
  },
}

export function normalizeGeometryStatus(value: unknown): GeometryStatus {
  const status = String(value || "").trim() as GeometryStatus
  return status in PRESENTATION ? status : "missing"
}

export function getGeometryStatusPresentation(value: unknown): GeometryStatusPresentation {
  return PRESENTATION[normalizeGeometryStatus(value)]
}

export function getPlacemarkGeometryStatus(placemark: any): GeometryStatus {
  const explicit = placemark?.properties?.geometryStatus
  if (explicit) return normalizeGeometryStatus(explicit)

  if (placemark?.properties?.isReferenceLocation) {
    const source = String(placemark?.properties?.locationSource || "")
    if (source === "sii_reference") return "sii_reference"
    if (source === "bounds") return "bounds_reference"
    if (source.startsWith("metadata")) return "metadata_reference"
    return "direct_reference"
  }

  if (Array.isArray(placemark?.coordinates) && placemark.coordinates.length > 0) {
    return "real_geometry"
  }

  return "missing"
}

export function summarizeGeometryStatuses(placemarks: any[] = []) {
  return placemarks.reduce(
    (summary, placemark) => {
      const status = getPlacemarkGeometryStatus(placemark)
      summary[status] += 1
      return summary
    },
    {
      real_geometry: 0,
      direct_reference: 0,
      metadata_reference: 0,
      sii_reference: 0,
      bounds_reference: 0,
      missing: 0,
    } satisfies Record<GeometryStatus, number>,
  )
}

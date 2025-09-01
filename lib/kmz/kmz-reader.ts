import JSZip from "jszip"
import { DOMParser } from "@xmldom/xmldom"

export interface KMZPlacemark {
  name: string
  description?: string
  coordinates: Array<[number, number, number?]> // [lng, lat, altitude?]
  type: "Point" | "LineString" | "Polygon"
  styleUrl?: string
  properties?: Record<string, any>
}

export interface KMZData {
  fileName: string
  placemarks: KMZPlacemark[]
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  metadata?: {
    name?: string
    description?: string
    author?: string
  }
}

export class KMZReader {
  async readKMZFile(file: File): Promise<KMZData> {
    try {
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(file)

      // Buscar archivo KML principal (usualmente doc.kml)
      let kmlFile = zipContent.file("doc.kml")
      if (!kmlFile) {
        // Buscar cualquier archivo .kml
        const kmlFiles = Object.keys(zipContent.files).filter((name) => name.endsWith(".kml"))
        if (kmlFiles.length > 0) {
          kmlFile = zipContent.file(kmlFiles[0])
        }
      }

      if (!kmlFile) {
        throw new Error("No se encontró archivo KML en el KMZ")
      }

      const kmlContent = await kmlFile.async("string")
      return this.parseKML(kmlContent, file.name)
    } catch (error) {
      console.error("Error reading KMZ file:", error)
      throw new Error(`Error al leer archivo KMZ: ${error.message}`)
    }
  }

  async readMultipleKMZ(files: File[]): Promise<KMZData[]> {
    const results = await Promise.allSettled(files.map((file) => this.readKMZFile(file)))

    return results
      .filter((result): result is PromiseFulfilledResult<KMZData> => result.status === "fulfilled")
      .map((result) => result.value)
  }

  private parseKML(kmlContent: string, fileName: string): KMZData {
    const parser = new DOMParser()
    const doc = parser.parseFromString(kmlContent, "text/xml")

    const placemarks: KMZPlacemark[] = []
    const placemarksNodes = doc.getElementsByTagName("Placemark")

    for (let i = 0; i < placemarksNodes.length; i++) {
      const placemark = placemarksNodes[i]
      const parsedPlacemark = this.parsePlacemark(placemark)
      if (parsedPlacemark) {
        placemarks.push(parsedPlacemark)
      }
    }

    // Extraer metadatos del documento
    const documentNode = doc.getElementsByTagName("Document")[0]
    const metadata = this.extractMetadata(documentNode)

    // Calcular bounds
    const bounds = this.calculateBounds(placemarks)

    return {
      fileName,
      placemarks,
      bounds,
      metadata,
    }
  }

  private parsePlacemark(placemark: Element): KMZPlacemark | null {
    try {
      const name = placemark.getElementsByTagName("name")[0]?.textContent || "Sin nombre"
      const description = placemark.getElementsByTagName("description")[0]?.textContent
      const styleUrl = placemark.getElementsByTagName("styleUrl")[0]?.textContent

      // Buscar geometría
      const point = placemark.getElementsByTagName("Point")[0]
      const lineString = placemark.getElementsByTagName("LineString")[0]
      const polygon = placemark.getElementsByTagName("Polygon")[0]

      let coordinates: Array<[number, number, number?]> = []
      let type: "Point" | "LineString" | "Polygon" = "Point"

      if (point) {
        const coordsText = point.getElementsByTagName("coordinates")[0]?.textContent?.trim()
        if (coordsText) {
          const [lng, lat, alt] = coordsText.split(",").map(Number)
          coordinates = [[lng, lat, alt]]
          type = "Point"
        }
      } else if (lineString) {
        const coordsText = lineString.getElementsByTagName("coordinates")[0]?.textContent?.trim()
        if (coordsText) {
          coordinates = this.parseCoordinateString(coordsText)
          type = "LineString"
        }
      } else if (polygon) {
        const outerBoundary = polygon.getElementsByTagName("outerBoundaryIs")[0]
        const linearRing = outerBoundary?.getElementsByTagName("LinearRing")[0]
        const coordsText = linearRing?.getElementsByTagName("coordinates")[0]?.textContent?.trim()
        if (coordsText) {
          coordinates = this.parseCoordinateString(coordsText)
          type = "Polygon"
        }
      }

      if (coordinates.length === 0) {
        return null
      }

      // Extraer propiedades adicionales de ExtendedData
      const properties = this.extractExtendedData(placemark)

      return {
        name,
        description,
        coordinates,
        type,
        styleUrl,
        properties,
      }
    } catch (error) {
      console.error("Error parsing placemark:", error)
      return null
    }
  }

  private parseCoordinateString(coordsText: string): Array<[number, number, number?]> {
    return coordsText
      .split(/\s+/)
      .filter((coord) => coord.trim())
      .map((coord) => {
        const [lng, lat, alt] = coord.split(",").map(Number)
        return alt !== undefined ? [lng, lat, alt] : [lng, lat]
      })
  }

  private extractExtendedData(placemark: Element): Record<string, any> {
    const properties: Record<string, any> = {}
    const extendedData = placemark.getElementsByTagName("ExtendedData")[0]

    if (extendedData) {
      const dataNodes = extendedData.getElementsByTagName("Data")
      for (let i = 0; i < dataNodes.length; i++) {
        const dataNode = dataNodes[i]
        const name = dataNode.getAttribute("name")
        const value = dataNode.getElementsByTagName("value")[0]?.textContent
        if (name && value) {
          properties[name] = value
        }
      }
    }

    return properties
  }

  private extractMetadata(documentNode?: Element): Record<string, any> {
    if (!documentNode) return {}

    return {
      name: documentNode.getElementsByTagName("name")[0]?.textContent,
      description: documentNode.getElementsByTagName("description")[0]?.textContent,
      author: documentNode.getElementsByTagName("atom:author")[0]?.textContent,
    }
  }

  private calculateBounds(
    placemarks: KMZPlacemark[],
  ): { north: number; south: number; east: number; west: number } | undefined {
    if (placemarks.length === 0) return undefined

    let north = -90,
      south = 90,
      east = -180,
      west = 180

    placemarks.forEach((placemark) => {
      placemark.coordinates.forEach(([lng, lat]) => {
        north = Math.max(north, lat)
        south = Math.min(south, lat)
        east = Math.max(east, lng)
        west = Math.min(west, lng)
      })
    })

    return { north, south, east, west }
  }

  // Método para extraer números de rol de propiedades KMZ
  extractPropertyRoles(kmzData: KMZData): string[] {
    const roles: string[] = []

    kmzData.placemarks.forEach((placemark) => {
      // Buscar en el nombre
      const nameRoles = this.extractRolesFromText(placemark.name)
      roles.push(...nameRoles)

      // Buscar en la descripción
      if (placemark.description) {
        const descRoles = this.extractRolesFromText(placemark.description)
        roles.push(...descRoles)
      }

      // Buscar en propiedades extendidas
      if (placemark.properties) {
        Object.values(placemark.properties).forEach((value) => {
          if (typeof value === "string") {
            const propRoles = this.extractRolesFromText(value)
            roles.push(...propRoles)
          }
        })
      }
    })

    return [...new Set(roles)] // Eliminar duplicados
  }

  private extractRolesFromText(text: string): string[] {
    const roles: string[] = []

    // Patrones para números de rol chilenos
    const patterns = [
      /\b\d{1,5}-\d{4}\b/g, // Formato: 140-2024
      /\bROL\s*:?\s*(\d{1,5}-\d{4})\b/gi, // ROL: 140-2024
      /\bFUNDO\s*:?\s*(\d{1,5}-\d{4})\b/gi, // FUNDO: 140-2024
      /\bPARCELA\s*:?\s*(\d{1,5}-\d{4})\b/gi, // PARCELA: 140-2024
    ]

    patterns.forEach((pattern) => {
      const matches = text.match(pattern)
      if (matches) {
        roles.push(...matches)
      }
    })

    return roles
  }
}

export const kmzReader = new KMZReader()

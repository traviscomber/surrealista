import JSZip from "jszip"
import { DOMParser } from "@xmldom/xmldom"
import { extractRolNumbersFromTargets } from "./rol-extraction"

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
    styles?: Record<string, Record<string, string>>
  }
  fileSize?: number
  skipped?: boolean
  skipReason?: string
}

export class KMZReader {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  async readKMZFile(file: File): Promise<KMZData> {
    if (file.size > this.MAX_FILE_SIZE) {
      console.warn(`[v0] Skipping large KMZ file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`)
      return {
        fileName: file.name,
        placemarks: [],
        fileSize: file.size,
        skipped: true,
        skipReason: `File too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      }
    }

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
      const kmzData = this.parseKML(kmlContent, file.name)

      return {
        ...kmzData,
        fileSize: file.size,
        skipped: false,
      }
    } catch (error: any) {
      console.error("Error reading KMZ file:", error)
      throw new Error(`Error al leer archivo KMZ: ${error.message}`)
    }
  }

  async readMultipleKMZ(files: File[]): Promise<KMZData[]> {
    const validFiles = files.filter((file) => {
      if (file.size > this.MAX_FILE_SIZE) {
        console.warn(
          `[v0] Skipping large file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit)`,
        )
        return false
      }
      return true
    })

    console.log(
      `[v0] Processing ${validFiles.length} of ${files.length} KMZ files (${files.length - validFiles.length} skipped due to size)`,
    )

    const results = await Promise.allSettled(validFiles.map((file) => this.readKMZFile(file)))

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
      placemarks.push(...this.parsePlacemarkGeometries(placemark))
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

  private parsePlacemarkGeometries(placemark: Element): KMZPlacemark[] {
    try {
      const baseName = placemark.getElementsByTagName("name")[0]?.textContent?.trim() || "Sin nombre"
      const description = placemark.getElementsByTagName("description")[0]?.textContent || undefined
      const styleUrl = placemark.getElementsByTagName("styleUrl")[0]?.textContent?.trim() || undefined
      const properties = {
        ...this.extractExtendedData(placemark),
        folderPath: this.extractFolderPath(placemark),
      }
      const geometries: KMZPlacemark[] = []

      const appendGeometry = (
        type: KMZPlacemark["type"],
        coordinates: Array<[number, number, number?]>,
        extraProperties: Record<string, any> = {},
      ) => {
        if (coordinates.length === 0) return
        const geometryNumber = geometries.length + 1
        geometries.push({
          name: geometryNumber === 1 ? baseName : `${baseName} · geometría ${geometryNumber}`,
          description,
          coordinates,
          type,
          styleUrl,
          properties: { ...properties, ...extraProperties },
        })
      }

      const points = placemark.getElementsByTagName("Point")
      for (let index = 0; index < points.length; index++) {
        const coordsText = points[index].getElementsByTagName("coordinates")[0]?.textContent?.trim()
        if (coordsText) appendGeometry("Point", this.parseCoordinateString(coordsText).slice(0, 1))
      }

      const lineStrings = placemark.getElementsByTagName("LineString")
      for (let index = 0; index < lineStrings.length; index++) {
        const coordsText = lineStrings[index].getElementsByTagName("coordinates")[0]?.textContent?.trim()
        if (coordsText) appendGeometry("LineString", this.parseCoordinateString(coordsText))
      }

      const polygons = placemark.getElementsByTagName("Polygon")
      for (let index = 0; index < polygons.length; index++) {
        const outerBoundary = polygons[index].getElementsByTagName("outerBoundaryIs")[0]
        const coordsText = outerBoundary
          ?.getElementsByTagName("LinearRing")[0]
          ?.getElementsByTagName("coordinates")[0]
          ?.textContent?.trim()
        if (!coordsText) continue

        const innerBoundaries: Array<Array<[number, number, number?]>> = []
        const innerNodes = polygons[index].getElementsByTagName("innerBoundaryIs")
        for (let innerIndex = 0; innerIndex < innerNodes.length; innerIndex++) {
          const innerCoords = innerNodes[innerIndex]
            .getElementsByTagName("LinearRing")[0]
            ?.getElementsByTagName("coordinates")[0]
            ?.textContent?.trim()
          if (innerCoords) innerBoundaries.push(this.parseCoordinateString(innerCoords))
        }

        appendGeometry("Polygon", this.parseCoordinateString(coordsText), { innerBoundaries })
      }

      return geometries
    } catch (error) {
      console.error("Error parsing placemark:", error)
      return []
    }
  }

  private extractFolderPath(placemark: Element): string[] {
    const path: string[] = []
    let parent = placemark.parentNode

    while (parent && parent.nodeType === 1) {
      const element = parent as Element
      if (element.tagName === "Folder") {
        const folderName = element.getElementsByTagName("name")[0]?.textContent?.trim()
        if (folderName) path.unshift(folderName)
      }
      parent = parent.parentNode
    }

    return path
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
        if (name && value) properties[name] = value
      }

      const simpleDataNodes = extendedData.getElementsByTagName("SimpleData")
      for (let i = 0; i < simpleDataNodes.length; i++) {
        const simpleDataNode = simpleDataNodes[i]
        const name = simpleDataNode.getAttribute("name")
        const value = simpleDataNode.textContent
        if (name && value) properties[name] = value.trim()
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
      styles: this.extractStyles(documentNode),
    }
  }

  private extractStyles(documentNode: Element): Record<string, Record<string, string>> {
    const styles: Record<string, Record<string, string>> = {}
    const styleNodes = documentNode.getElementsByTagName("Style")

    for (let index = 0; index < styleNodes.length; index++) {
      const style = styleNodes[index]
      const id = style.getAttribute("id")
      if (!id) continue

      const lineStyle = style.getElementsByTagName("LineStyle")[0]
      const polyStyle = style.getElementsByTagName("PolyStyle")[0]
      const iconStyle = style.getElementsByTagName("IconStyle")[0]
      const icon = iconStyle?.getElementsByTagName("Icon")[0]
      styles[`#${id}`] = {
        lineColor: lineStyle?.getElementsByTagName("color")[0]?.textContent?.trim() || "",
        lineWidth: lineStyle?.getElementsByTagName("width")[0]?.textContent?.trim() || "",
        polygonColor: polyStyle?.getElementsByTagName("color")[0]?.textContent?.trim() || "",
        polygonFill: polyStyle?.getElementsByTagName("fill")[0]?.textContent?.trim() || "",
        polygonOutline: polyStyle?.getElementsByTagName("outline")[0]?.textContent?.trim() || "",
        iconHref: icon?.getElementsByTagName("href")[0]?.textContent?.trim() || "",
        iconScale: iconStyle?.getElementsByTagName("scale")[0]?.textContent?.trim() || "",
      }
    }

    return styles
  }

  private calculateBounds(
    placemarks: KMZPlacemark[],
  ): { north: number; south: number; east: number; west: number } | undefined {
    if (placemarks.length === 0) return undefined

    let north = -90
    let south = 90
    let east = -180
    let west = 180

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
    return extractRolNumbersFromTargets(
      kmzData.placemarks.map((placemark) => ({
        name: placemark.name,
        description: placemark.description,
        properties: placemark.properties || {},
        metadata: placemark.properties || {},
      })),
    )
  }
}

export const kmzReader = new KMZReader()

export async function parseKMZFile(file: File): Promise<KMZData> {
  return kmzReader.readKMZFile(file)
}

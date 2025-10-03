"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

interface Property {
  id: string
  title: string
  type: "casa" | "departamento" | "terreno" | "comercial"
  price: number
  location: {
    city: string
    region: string
    coordinates: [number, number]
  }
  features: {
    bedrooms?: number
    bathrooms?: number
    area: number
  }
  description: string
  image: string
  featured: boolean
}

interface KMZData {
  fileName: string
  placemarks: Array<{
    name: string
    coordinates: Array<[number, number]>
    type: string
    description?: string
  }>
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
}

interface CanvasMapProps {
  properties: Property[]
  kmzData: KMZData[]
  showKMZOverlay?: boolean
  onPropertySelect: (property: Property | null) => void
  selectedProperty: Property | null
  onToggleKmzOverlay?: () => void
}

const CanvasMap = ({
  properties,
  kmzData,
  showKMZOverlay = true,
  onPropertySelect,
  selectedProperty,
  onToggleKmzOverlay,
}: CanvasMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [hoveredProperty, setHoveredProperty] = useState<Property | null>(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const [highlightedType, setHighlightedType] = useState<string | null>(null)

  const bounds = {
    north: -38.5,
    south: -43.5,
    west: -74.5,
    east: -71.0,
  }

  const mapWidth = 800
  const mapHeight = 600

  const latLngToCanvas = (lat: number, lng: number) => {
    const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * mapWidth
    const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * mapHeight
    return { x: x * zoom + pan.x, y: y * zoom + pan.y }
  }

  const canvasToLatLng = (x: number, y: number) => {
    const adjustedX = (x - pan.x) / zoom
    const adjustedY = (y - pan.y) / zoom
    const lng = bounds.west + (adjustedX / mapWidth) * (bounds.east - bounds.west)
    const lat = bounds.north - (adjustedY / mapHeight) * (bounds.north - bounds.south)
    return { lat, lng }
  }

  const getPropertyColor = (type: string) => {
    switch (type) {
      case "casa":
        return "#3B82F6" // blue
      case "departamento":
        return "#10B981" // green
      case "terreno":
        return "#F59E0B" // yellow
      case "comercial":
        return "#8B5CF6" // purple
      default:
        return "#6B7280" // gray
    }
  }

  const drawMap = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.log("[v0] Canvas not found")
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      console.log("[v0] Canvas context not available")
      return
    }

    console.log("[v0] Drawing map with", properties.length, "properties and", kmzData.length, "KMZ files")

    canvas.width = mapWidth
    canvas.height = mapHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "#E0F2FE"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "#F3F4F6"
    ctx.strokeStyle = "#D1D5DB"
    ctx.lineWidth = 2
    ctx.beginPath()

    const coastline = [
      [-74.0, -38.5],
      [-73.5, -39.0],
      [-73.8, -40.0],
      [-73.2, -41.0],
      [-73.5, -42.0],
      [-74.0, -42.5],
      [-73.0, -43.0],
      [-72.5, -43.5],
      [-71.5, -43.0],
      [-71.8, -42.0],
      [-71.5, -41.0],
      [-72.0, -40.0],
      [-71.8, -39.0],
      [-72.2, -38.5],
    ]

    coastline.forEach((point, index) => {
      const { x, y } = latLngToCanvas(point[1], point[0])
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = "#3B82F6"
    const lakes = [
      { lat: -41.1, lng: -72.8, radius: 15 },
      { lat: -39.3, lng: -71.9, radius: 8 },
      { lat: -40.6, lng: -72.1, radius: 6 },
    ]

    lakes.forEach((lake) => {
      const { x, y } = latLngToCanvas(lake.lat, lake.lng)
      ctx.beginPath()
      ctx.arc(x, y, lake.radius * zoom, 0, 2 * Math.PI)
      ctx.fill()
    })

    properties.forEach((property) => {
      const { x, y } = latLngToCanvas(property.location.coordinates[0], property.location.coordinates[1])

      if (x < -50 || x > canvas.width + 50 || y < -50 || y > canvas.height + 50) return

      const color = getPropertyColor(property.type)
      const baseRadius = property.featured ? 8 : 6
      const radius = highlightedType === property.type ? baseRadius * 1.5 : baseRadius
      const isSelected = selectedProperty?.id === property.id
      const isHovered = hoveredProperty?.id === property.id
      const isHighlighted = highlightedType === property.type

      ctx.fillStyle = color
      ctx.strokeStyle = isSelected ? "#EF4444" : isHovered ? "#F59E0B" : isHighlighted ? "#FBBF24" : "#FFFFFF"
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : isHighlighted ? 3 : 1

      ctx.beginPath()
      ctx.arc(x, y, radius * zoom, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()

      if (property.featured || isSelected || isHovered || isHighlighted) {
        ctx.fillStyle = "#1F2937"
        ctx.font = `${12 * Math.min(zoom, 1.5)}px Inter, sans-serif`
        ctx.textAlign = "center"
        ctx.fillText(property.location.city, x, y - (radius + 5) * zoom)
      }
    })

    if (showKMZOverlay && kmzData.length > 0) {
      kmzData.forEach((data) => {
        ctx.fillStyle = "#8B5CF6"
        ctx.strokeStyle = "#FFFFFF"
        ctx.lineWidth = 1

        data.placemarks.forEach((placemark) => {
          placemark.coordinates.forEach((coord) => {
            const { x, y } = latLngToCanvas(coord[0], coord[1])
            if (x >= -20 && x <= canvas.width + 20 && y >= -20 && y <= canvas.height + 20) {
              ctx.beginPath()
              ctx.arc(x, y, 4 * zoom, 0, 2 * Math.PI)
              ctx.fill()
              ctx.stroke()
            }
          })

          if (placemark.coordinates.length > 2) {
            ctx.strokeStyle = "#8B5CF6"
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])
            ctx.beginPath()

            placemark.coordinates.forEach((coord, index) => {
              const { x, y } = latLngToCanvas(coord[0], coord[1])
              if (index === 0) {
                ctx.moveTo(x, y)
              } else {
                ctx.lineTo(x, y)
              }
            })

            ctx.closePath()
            ctx.stroke()
            ctx.setLineDash([])
          }
        })
      })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setLastMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x
      const deltaY = e.clientY - lastMousePos.y
      setPan((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }))
      setLastMousePos({ x: e.clientX, y: e.clientY })
    } else {
      let foundProperty: Property | null = null

      for (const property of properties) {
        const { x, y } = latLngToCanvas(property.location.coordinates[0], property.location.coordinates[1])
        const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2)
        const radius = (property.featured ? 8 : 6) * zoom

        if (distance <= radius + 5) {
          foundProperty = property
          break
        }
      }

      setHoveredProperty(foundProperty)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    for (const property of properties) {
      const { x, y } = latLngToCanvas(property.location.coordinates[0], property.location.coordinates[1])
      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2)
      const radius = (property.featured ? 8 : 6) * zoom

      if (distance <= radius + 5) {
        onPropertySelect(property)
        return
      }
    }

    onPropertySelect(null)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.5, 5))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.5, 0.5))
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    onPropertySelect(null)
  }

  const handleLegendClick = (type: string) => {
    const propertiesOfType = properties.filter((p) => p.type === type)

    if (propertiesOfType.length === 0) return

    const avgLat = propertiesOfType.reduce((sum, p) => sum + p.location.coordinates[0], 0) / propertiesOfType.length
    const avgLng = propertiesOfType.reduce((sum, p) => sum + p.location.coordinates[1], 0) / propertiesOfType.length

    const centerCanvas = latLngToCanvas(avgLat, avgLng)

    const canvas = canvasRef.current
    if (!canvas) return

    const targetX = canvas.width / 2 - centerCanvas.x / zoom
    const targetY = canvas.height / 2 - centerCanvas.y / zoom

    setPan({ x: targetX, y: targetY })
    setZoom(1.5)

    setHighlightedType(type)
    setTimeout(() => setHighlightedType(null), 3000)
  }

  const handleKmzLegendClick = () => {
    if (kmzData.length === 0) return

    let allCoordinates: Array<[number, number]> = []

    kmzData.forEach((data) => {
      data.placemarks.forEach((placemark) => {
        allCoordinates = allCoordinates.concat(placemark.coordinates)
      })
    })

    if (allCoordinates.length === 0) return

    // Calculate average position of all KMZ points
    const avgLat = allCoordinates.reduce((sum, coord) => sum + coord[0], 0) / allCoordinates.length
    const avgLng = allCoordinates.reduce((sum, coord) => sum + coord[1], 0) / allCoordinates.length

    const centerCanvas = latLngToCanvas(avgLat, avgLng)

    const canvas = canvasRef.current
    if (!canvas) return

    const targetX = canvas.width / 2 - centerCanvas.x / zoom
    const targetY = canvas.height / 2 - centerCanvas.y / zoom

    setPan({ x: targetX, y: targetY })
    setZoom(2)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      console.log("[v0] Canvas initialized")
      setCanvasReady(true)
    }
  }, [])

  useEffect(() => {
    if (canvasReady) {
      console.log("[v0] Drawing map - canvas ready")
      drawMap()
    }
  }, [properties, kmzData, showKMZOverlay, zoom, pan, selectedProperty, hoveredProperty, canvasReady, highlightedType])

  return (
    <div className="relative bg-white rounded-lg border shadow-sm">
      {!canvasReady && (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <p className="text-gray-500">Cargando mapa...</p>
        </div>
      )}

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        width={mapWidth}
        height={mapHeight}
        className="w-full border rounded-lg"
        style={{
          maxHeight: "600px",
          display: canvasReady ? "block" : "none",
          backgroundColor: "#f8f9fa",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />

      {hoveredProperty && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border max-w-xs">
          <h4 className="font-semibold text-sm">{hoveredProperty.title}</h4>
          <p className="text-xs text-muted-foreground">
            {hoveredProperty.location.city}, {hoveredProperty.location.region}
          </p>
          <p className="text-sm font-medium text-green-600">
            $
            {hoveredProperty.price >= 1000000000
              ? `${(hoveredProperty.price / 1000000000).toFixed(1)}B`
              : `${(hoveredProperty.price / 1000000).toFixed(0)}M`}
          </p>
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border min-w-[280px]">
        <h4 className="font-semibold text-sm mb-2">Leyenda</h4>
        <div className="space-y-1 text-xs">
          <button
            onClick={() => handleLegendClick("casa")}
            className="flex items-center gap-2 w-full hover:bg-gray-100 p-1 rounded transition-colors cursor-pointer text-left"
          >
            <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
            <span className="whitespace-nowrap">Casas ({properties.filter((p) => p.type === "casa").length})</span>
          </button>
          <button
            onClick={() => handleLegendClick("departamento")}
            className="flex items-center gap-2 w-full hover:bg-gray-100 p-1 rounded transition-colors cursor-pointer text-left"
          >
            <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
            <span className="whitespace-nowrap">
              Departamentos ({properties.filter((p) => p.type === "departamento").length})
            </span>
          </button>
          <button
            onClick={() => handleLegendClick("terreno")}
            className="flex items-center gap-2 w-full hover:bg-gray-100 p-1 rounded transition-colors cursor-pointer text-left"
          >
            <div className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0"></div>
            <span className="whitespace-nowrap">
              Terrenos ({properties.filter((p) => p.type === "terreno").length})
            </span>
          </button>
          {showKMZOverlay && (
            <button
              onClick={handleKmzLegendClick}
              className="flex items-center gap-2 w-full hover:bg-gray-100 p-1 rounded transition-colors cursor-pointer text-left"
            >
              <div className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0"></div>
              <span className="whitespace-nowrap">
                Puntos KMZ ({kmzData.reduce((sum, d) => sum + d.placemarks.length, 0)})
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export { CanvasMap }
export default CanvasMap

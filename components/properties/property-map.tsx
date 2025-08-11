"use client"

import { useEffect, useRef } from "react"

interface PropertyMapProps {
  property: any
}

export function PropertyMap({ property }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // This is a placeholder for the actual map implementation
    // In a real application, you would use a library like Leaflet or Google Maps
    if (mapRef.current) {
      const mapElement = mapRef.current
      mapElement.innerHTML = `
        <div class="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div class="text-center p-4">
            <p class="text-gray-500 mb-2">Mapa interactivo</p>
            <p class="font-semibold">${property.address || property.location || "Ubicación de la propiedad"}</p>
          </div>
        </div>
      `
    }
  }, [property])

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Ubicación</h2>
      <div ref={mapRef} className="h-64 rounded-lg overflow-hidden"></div>
    </div>
  )
}

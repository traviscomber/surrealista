"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

interface PropertyLocationFormProps {
  data: {
    address: string
    city: string
    region: string
    postal_code: string
    latitude: string | number
    longitude: string | number
  }
  onChange: (data: any) => void
}

export function PropertyLocationForm({ data, onChange }: PropertyLocationFormProps) {
  const [formData, setFormData] = useState(data)

  useEffect(() => {
    setFormData(data)
  }, [data])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updatedData = { ...formData, [name]: value }
    setFormData(updatedData)
    onChange(updatedData)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Ej: Av. Vicente Pérez Rosales 1234"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="Ej: Puerto Varas" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Región</Label>
          <Input
            id="region"
            name="region"
            value={formData.region}
            onChange={handleChange}
            placeholder="Ej: Los Lagos"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postal_code">Código Postal</Label>
          <Input
            id="postal_code"
            name="postal_code"
            value={formData.postal_code}
            onChange={handleChange}
            placeholder="Ej: 5550000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitud</Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            value={formData.latitude}
            onChange={handleChange}
            step="0.000001"
            placeholder="Ej: -41.3178"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">Longitud</Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            value={formData.longitude}
            onChange={handleChange}
            step="0.000001"
            placeholder="Ej: -72.9858"
          />
        </div>
      </div>

      <Card className="p-4">
        <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
          <p className="text-muted-foreground">Mapa interactivo para seleccionar ubicación (próximamente)</p>
        </div>
      </Card>
    </div>
  )
}

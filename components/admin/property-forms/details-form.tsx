"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PropertyDetailsFormProps {
  data: {
    bedrooms: string | number
    bathrooms: string | number
    area: string | number
    land_area: string | number
    year_built: string | number
    parking: string | number
  }
  onChange: (data: any) => void
}

export function PropertyDetailsForm({ data, onChange }: PropertyDetailsFormProps) {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Dormitorios</Label>
          <Input
            id="bedrooms"
            name="bedrooms"
            type="number"
            value={formData.bedrooms}
            onChange={handleChange}
            min="0"
            step="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms">Baños</Label>
          <Input
            id="bathrooms"
            name="bathrooms"
            type="number"
            value={formData.bathrooms}
            onChange={handleChange}
            min="0"
            step="0.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parking">Estacionamientos</Label>
          <Input
            id="parking"
            name="parking"
            type="number"
            value={formData.parking}
            onChange={handleChange}
            min="0"
            step="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="area">Área Construida (m²)</Label>
          <Input
            id="area"
            name="area"
            type="number"
            value={formData.area}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="land_area">Área Terreno (m²)</Label>
          <Input
            id="land_area"
            name="land_area"
            type="number"
            value={formData.land_area}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="year_built">Año de Construcción</Label>
        <Input
          id="year_built"
          name="year_built"
          type="number"
          value={formData.year_built}
          onChange={handleChange}
          min="1900"
          max={new Date().getFullYear()}
          step="1"
        />
      </div>
    </div>
  )
}

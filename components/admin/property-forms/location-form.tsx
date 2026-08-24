"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin } from "lucide-react"
import {
  getAllRegions,
  getProvinciasForRegion,
  type Provincia,
  type Comuna,
} from "@/lib/chile-locations"

interface PropertyLocationFormProps {
  data: {
    address: string
    city: string
    region: string
    provincia?: string
    comuna?: string
    postal_code: string
    latitude: string | number
    longitude: string | number
    roll_number?: string
  }
  onChange: (data: any) => void
}

export function PropertyLocationForm({ data, onChange }: PropertyLocationFormProps) {
  const [formData, setFormData] = useState(data)
  const regions = useMemo(() => getAllRegions(), [])
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [comunas, setComunas] = useState<Comuna[]>([])
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>("")
  const [selectedProvinciaCode, setSelectedProvinciaCode] = useState<string>("")

  useEffect(() => {
    setFormData(data)
  }, [data])

  useEffect(() => {
    if (data.region && selectedRegionCode === "") {
      const region = regions.find((item) => item.name === data.region || item.shortName === data.region)
      if (region) {
        setSelectedRegionCode(region.code)
        const nextProvincias = getProvinciasForRegion(region.code)
        setProvincias(nextProvincias)

        if (data.provincia) {
          const provincia = nextProvincias.find((item) => item.name === data.provincia)
          if (provincia) {
            setSelectedProvinciaCode(provincia.code)
            setComunas(provincia.comunas)
          }
        }
      }
    }
  }, [data.provincia, data.region, regions, selectedRegionCode])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    const updatedData = { ...formData, [name]: value }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleRegionChange = (regionCode: string) => {
    const region = regions.find((item) => item.code === regionCode)
    if (!region) return

    setSelectedRegionCode(regionCode)
    setSelectedProvinciaCode("")
    setProvincias(getProvinciasForRegion(regionCode))
    setComunas([])

    const updatedData = {
      ...formData,
      region: region.shortName,
      provincia: "",
      comuna: "",
    }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleProvinciaChange = (provinciaCode: string) => {
    setSelectedProvinciaCode(provinciaCode)
    const provincia = provincias.find((item) => item.code === provinciaCode)
    if (!provincia) return

    setComunas(provincia.comunas)
    const updatedData = {
      ...formData,
      provincia: provincia.name,
      comuna: "",
    }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleComunaChange = (comunaName: string) => {
    const updatedData = {
      ...formData,
      comuna: comunaName,
      city: comunaName,
    }
    setFormData(updatedData)
    onChange(updatedData)
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex gap-3 text-sm leading-6 text-muted-foreground">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            Usa coordenadas provenientes de KMZ, SII/CIREN u otra evidencia territorial verificada. La búsqueda automática por ROL que generaba referencias no verificadas está deshabilitada.
          </p>
        </div>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="roll_number">ROL de referencia</Label>
        <Input
          id="roll_number"
          name="roll_number"
          value={formData.roll_number || ""}
          onChange={handleChange}
          placeholder="Ej: 123-45"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Dirección respaldada por la fuente disponible"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="region">Región *</Label>
          <Select value={selectedRegionCode} onValueChange={handleRegionChange}>
            <SelectTrigger id="region">
              <SelectValue placeholder="Seleccione región" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.code} value={region.code}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="provincia">Provincia</Label>
          <Select value={selectedProvinciaCode} onValueChange={handleProvinciaChange} disabled={!selectedRegionCode}>
            <SelectTrigger id="provincia">
              <SelectValue placeholder={selectedRegionCode ? "Seleccione provincia" : "Primero seleccione región"} />
            </SelectTrigger>
            <SelectContent>
              {provincias.map((provincia) => (
                <SelectItem key={provincia.code} value={provincia.code}>
                  {provincia.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="comuna">Comuna *</Label>
          <Select value={formData.comuna || ""} onValueChange={handleComunaChange} disabled={!selectedProvinciaCode}>
            <SelectTrigger id="comuna">
              <SelectValue placeholder={selectedProvinciaCode ? "Seleccione comuna" : "Primero seleccione provincia"} />
            </SelectTrigger>
            <SelectContent>
              {comunas.map((comuna) => (
                <SelectItem key={comuna.code} value={comuna.name}>
                  {comuna.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="postal_code">Código Postal</Label>
          <Input
            id="postal_code"
            name="postal_code"
            value={formData.postal_code}
            onChange={handleChange}
            placeholder="Código postal verificado"
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
          {formData.latitude && formData.longitude ? (
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Coordenadas registradas</p>
              <p className="text-xs text-muted-foreground">
                {formData.latitude}, {formData.longitude}
              </p>
              {formData.comuna && formData.region && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.comuna}, {formData.provincia && `${formData.provincia}, `}
                  {formData.region}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Sin coordenadas verificadas registradas.</p>
          )}
        </div>
      </Card>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Loader2, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getAllRegions,
  getProvinciasForRegion,
  getAllComunasForRegion,
  type Region,
  type Provincia,
  type Comuna,
} from "@/lib/chile-locations"

interface PropertyLocationFormProps {
  data: {
    address: string
    city: string
    region: string
    provincia?: string // Added provincia field
    comuna?: string // Added comuna field
    postal_code: string
    latitude: string | number
    longitude: string | number
    roll_number?: string
  }
  onChange: (data: any) => void
}

export function PropertyLocationForm({ data, onChange }: PropertyLocationFormProps) {
  const [formData, setFormData] = useState(data)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const { toast } = useToast()

  const [regions] = useState<Region[]>(getAllRegions())
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [comunas, setComunas] = useState<Comuna[]>([])
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>("")

  useEffect(() => {
    setFormData(data)
    if (data.region) {
      const region = regions.find((r) => r.name === data.region || r.shortName === data.region)
      if (region) {
        setSelectedRegionCode(region.code)
        const provs = getProvinciasForRegion(region.code)
        setProvincias(provs)
        const coms = getAllComunasForRegion(region.code)
        setComunas(coms)
      }
    }
  }, [data, regions])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updatedData = { ...formData, [name]: value }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleRegionChange = (regionCode: string) => {
    const region = regions.find((r) => r.code === regionCode)
    if (!region) return

    setSelectedRegionCode(regionCode)
    const provs = getProvinciasForRegion(regionCode)
    setProvincias(provs)
    const coms = getAllComunasForRegion(regionCode)
    setComunas(coms)

    const updatedData = {
      ...formData,
      region: region.shortName,
      provincia: "",
      comuna: "",
    }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleProvinciaChange = (provinciaName: string) => {
    const updatedData = {
      ...formData,
      provincia: provinciaName,
    }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleComunaChange = (comunaName: string) => {
    const updatedData = {
      ...formData,
      comuna: comunaName,
      city: comunaName, // Also set city to comuna name
    }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleRollNumberLookup = async () => {
    if (!formData.roll_number) {
      toast({
        title: "Error",
        description: "Por favor ingrese un número de rol válido",
        variant: "destructive",
      })
      return
    }

    setIsLookingUp(true)
    try {
      const response = await fetch("/api/v1/properties/lookup-coordinates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rollNumber: formData.roll_number }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        const updatedData = {
          ...formData,
          latitude: result.data.coordinates.lat,
          longitude: result.data.coordinates.lng,
          address: result.data.address || formData.address,
          city: result.data.city || formData.city,
          region: result.data.region || formData.region,
          provincia: result.data.provincia || formData.provincia,
          comuna: result.data.comuna || formData.comuna,
        }
        setFormData(updatedData)
        onChange(updatedData)

        // Update dropdowns if region changed
        if (result.data.region) {
          const region = regions.find((r) => r.name === result.data.region || r.shortName === result.data.region)
          if (region) {
            setSelectedRegionCode(region.code)
            const provs = getProvinciasForRegion(region.code)
            setProvincias(provs)
            const coms = getAllComunasForRegion(region.code)
            setComunas(coms)
          }
        }

        toast({
          title: "Coordenadas encontradas",
          description: `Lat: ${result.data.coordinates.lat}, Lng: ${result.data.coordinates.lng}`,
        })
      } else {
        toast({
          title: "No encontrado",
          description: result.error || "No se encontraron coordenadas para este número de rol",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al buscar coordenadas. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLookingUp(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <Label className="text-blue-800 font-medium">Búsqueda por Número de Rol</Label>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                name="roll_number"
                value={formData.roll_number || ""}
                onChange={handleChange}
                placeholder="Ej: 12345-67"
                className="border-blue-300 focus:border-blue-500"
              />
            </div>
            <Button
              onClick={handleRollNumberLookup}
              disabled={isLookingUp || !formData.roll_number}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLookingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-blue-600">
            Ingrese el número de rol para obtener automáticamente las coordenadas y dirección de la propiedad.
          </p>
        </div>
      </Card>

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
          <Select value={formData.provincia || ""} onValueChange={handleProvinciaChange} disabled={!selectedRegionCode}>
            <SelectTrigger id="provincia">
              <SelectValue placeholder={selectedRegionCode ? "Seleccione provincia" : "Primero seleccione región"} />
            </SelectTrigger>
            <SelectContent>
              {provincias.map((provincia) => (
                <SelectItem key={provincia.code} value={provincia.name}>
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
          <Select value={formData.comuna || ""} onValueChange={handleComunaChange} disabled={!selectedRegionCode}>
            <SelectTrigger id="comuna">
              <SelectValue placeholder={selectedRegionCode ? "Seleccione comuna" : "Primero seleccione región"} />
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
          {formData.latitude && formData.longitude ? (
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Coordenadas establecidas</p>
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
            <p className="text-muted-foreground">Mapa interactivo para seleccionar ubicación (próximamente)</p>
          )}
        </div>
      </Card>
    </div>
  )
}

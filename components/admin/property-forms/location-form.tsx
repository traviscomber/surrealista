"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Loader2, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PropertyLocationFormProps {
  data: {
    address: string
    city: string
    region: string
    postal_code: string
    latitude: string | number
    longitude: string | number
    roll_number?: string // Added roll number field
  }
  onChange: (data: any) => void
}

export function PropertyLocationForm({ data, onChange }: PropertyLocationFormProps) {
  const [formData, setFormData] = useState(data)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setFormData(data)
  }, [data])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updatedData = { ...formData, [name]: value }
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
        }
        setFormData(updatedData)
        onChange(updatedData)

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
          {formData.latitude && formData.longitude ? (
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Coordenadas establecidas</p>
              <p className="text-xs text-muted-foreground">
                {formData.latitude}, {formData.longitude}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">Mapa interactivo para seleccionar ubicación (próximamente)</p>
          )}
        </div>
      </Card>
    </div>
  )
}

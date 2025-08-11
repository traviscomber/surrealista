"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface PropertyBasicInfoFormProps {
  data: {
    title: string
    description: string
    property_type: string
    status: string
    featured: boolean
  }
  onChange: (data: any) => void
}

export function PropertyBasicInfoForm({ data, onChange }: PropertyBasicInfoFormProps) {
  const [formData, setFormData] = useState(data)

  useEffect(() => {
    setFormData(data)
  }, [data])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const updatedData = { ...formData, [name]: value }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleSelectChange = (name: string, value: string) => {
    const updatedData = { ...formData, [name]: value }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    const updatedData = { ...formData, [name]: checked }
    setFormData(updatedData)
    onChange(updatedData)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Título de la Propiedad</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Ej: Casa con vista al lago en Puerto Varas"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describa la propiedad en detalle..."
          rows={6}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="property_type">Tipo de Propiedad</Label>
          <Select value={formData.property_type} onValueChange={(value) => handleSelectChange("property_type", value)}>
            <SelectTrigger id="property_type">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="house">Casa</SelectItem>
              <SelectItem value="apartment">Departamento</SelectItem>
              <SelectItem value="land">Terreno</SelectItem>
              <SelectItem value="rural">Parcela</SelectItem>
              <SelectItem value="commercial">Comercial</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="office">Oficina</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="sold">Vendido</SelectItem>
              <SelectItem value="reserved">Reservado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="featured"
          checked={formData.featured}
          onCheckedChange={(checked) => handleSwitchChange("featured", checked)}
        />
        <Label htmlFor="featured">Propiedad Destacada</Label>
      </div>
    </div>
  )
}

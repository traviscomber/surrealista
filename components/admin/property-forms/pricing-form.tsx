"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PropertyPricingFormProps {
  data: {
    price: string | number
    price_currency: string
    price_per_sqm: string | number
    maintenance_fee: string | number
  }
  onChange: (data: any) => void
}

export function PropertyPricingForm({ data, onChange }: PropertyPricingFormProps) {
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

  const handleSelectChange = (name: string, value: string) => {
    const updatedData = { ...formData, [name]: value }
    setFormData(updatedData)
    onChange(updatedData)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="price">Precio</Label>
          <Input
            id="price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="1000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_currency">Moneda</Label>
          <Select
            value={formData.price_currency}
            onValueChange={(value) => handleSelectChange("price_currency", value)}
          >
            <SelectTrigger id="price_currency">
              <SelectValue placeholder="Seleccionar moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
              <SelectItem value="UF">Unidad de Fomento (UF)</SelectItem>
              <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="price_per_sqm">Precio por m²</Label>
          <Input
            id="price_per_sqm"
            name="price_per_sqm"
            type="number"
            value={formData.price_per_sqm}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance_fee">Gastos Comunes</Label>
          <Input
            id="maintenance_fee"
            name="maintenance_fee"
            type="number"
            value={formData.maintenance_fee}
            onChange={handleChange}
            min="0"
            step="1000"
          />
        </div>
      </div>
    </div>
  )
}

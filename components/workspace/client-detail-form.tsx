"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Phone, Building, MapPin, Briefcase, DollarSign, FileText, Save, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ClientFormData {
  // Personal
  first_name: string
  last_name: string
  second_last_name: string
  rut: string
  birth_date: string
  nationality: string
  // Contact
  email: string
  phone: string
  mobile: string
  // Professional
  company_name: string
  position: string
  company_rut: string
  industry: string
  // Location
  address: string
  city: string
  region: string
  country: string
  // Commercial
  client_type: string
  main_interest: string
  locations_of_interest: string[]
  desired_surface_area_min: string
  desired_surface_area_max: string
  budget_min: string
  budget_max: string
  notes: string
}

interface ClientDetailFormProps {
  clientId?: string
  onSave?: () => void
  onCancel?: () => void
}

export function ClientDetailForm({ clientId, onSave, onCancel }: ClientDetailFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    first_name: "",
    last_name: "",
    second_last_name: "",
    rut: "",
    birth_date: "",
    nationality: "Chilena",
    email: "",
    phone: "",
    mobile: "",
    company_name: "",
    position: "",
    company_rut: "",
    industry: "",
    address: "",
    city: "",
    region: "",
    country: "Chile",
    client_type: "buyer",
    main_interest: "agricultural_field",
    locations_of_interest: [],
    desired_surface_area_min: "",
    desired_surface_area_max: "",
    budget_min: "",
    budget_max: "",
    notes: "",
  })

  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const clientData = {
        ...formData,
        desired_surface_area_min: formData.desired_surface_area_min
          ? Number.parseFloat(formData.desired_surface_area_min)
          : null,
        desired_surface_area_max: formData.desired_surface_area_max
          ? Number.parseFloat(formData.desired_surface_area_max)
          : null,
        budget_min: formData.budget_min ? Number.parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? Number.parseFloat(formData.budget_max) : null,
      }

      if (clientId) {
        const { error } = await supabase.from("clients").update(clientData).eq("id", clientId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("clients").insert([clientData])
        if (error) throw error
      }

      onSave?.()
    } catch (error) {
      console.error("[v0] Error saving client:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {clientId ? "Editar Cliente" : "Nuevo Cliente"}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
            <TabsTrigger value="professional">Profesional</TabsTrigger>
            <TabsTrigger value="location">Ubicación</TabsTrigger>
            <TabsTrigger value="commercial">Comercial</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombres *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="Juan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellido Paterno *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="Pérez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="second_last_name">Apellido Materno</Label>
                <Input
                  id="second_last_name"
                  value={formData.second_last_name}
                  onChange={(e) => handleInputChange("second_last_name", e.target.value)}
                  placeholder="González"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  value={formData.rut}
                  onChange={(e) => handleInputChange("rut", e.target.value)}
                  placeholder="12.345.678-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange("birth_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidad</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange("nationality", e.target.value)}
                  placeholder="Chilena"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="cliente@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+56 2 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Móvil
                </Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange("mobile", e.target.value)}
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="professional" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">
                  <Building className="h-4 w-4 inline mr-2" />
                  Empresa / Razón Social
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  placeholder="Empresa Ltda."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">
                  <Briefcase className="h-4 w-4 inline mr-2" />
                  Cargo
                </Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                  placeholder="Gerente General"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_rut">RUT Empresa</Label>
                <Input
                  id="company_rut"
                  value={formData.company_rut}
                  onChange={(e) => handleInputChange("company_rut", e.target.value)}
                  placeholder="76.123.456-7"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Rubro / Industria</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => handleInputChange("industry", e.target.value)}
                  placeholder="Agrícola, Forestal, Inmobiliaria..."
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Dirección
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Av. Principal 123, Depto 45"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Puerto Varas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Región</Label>
                <Select value={formData.region} onValueChange={(value) => handleInputChange("region", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar región" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Los Lagos">Los Lagos</SelectItem>
                    <SelectItem value="Los Ríos">Los Ríos</SelectItem>
                    <SelectItem value="Araucanía">Araucanía</SelectItem>
                    <SelectItem value="Maule">Maule</SelectItem>
                    <SelectItem value="Ñuble">Ñuble</SelectItem>
                    <SelectItem value="Biobío">Biobío</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  placeholder="Chile"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="commercial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_type">Tipo de Cliente</Label>
                <Select value={formData.client_type} onValueChange={(value) => handleInputChange("client_type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Comprador</SelectItem>
                    <SelectItem value="seller">Vendedor</SelectItem>
                    <SelectItem value="investor">Inversionista</SelectItem>
                    <SelectItem value="tenant">Arrendatario</SelectItem>
                    <SelectItem value="both">Comprador y Vendedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="main_interest">Interés Principal</Label>
                <Select
                  value={formData.main_interest}
                  onValueChange={(value) => handleInputChange("main_interest", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agricultural_field">Campo Agrícola</SelectItem>
                    <SelectItem value="parcel">Parcela</SelectItem>
                    <SelectItem value="conservation_project">Proyecto de Conservación</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="residential">Residencial</SelectItem>
                    <SelectItem value="mixed">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desired_surface_area_min">Superficie Deseada Mínima (m²)</Label>
                <Input
                  id="desired_surface_area_min"
                  type="number"
                  value={formData.desired_surface_area_min}
                  onChange={(e) => handleInputChange("desired_surface_area_min", e.target.value)}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desired_surface_area_max">Superficie Deseada Máxima (m²)</Label>
                <Input
                  id="desired_surface_area_max"
                  type="number"
                  value={formData.desired_surface_area_max}
                  onChange={(e) => handleInputChange("desired_surface_area_max", e.target.value)}
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_min">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Presupuesto Mínimo (CLP)
                </Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={formData.budget_min}
                  onChange={(e) => handleInputChange("budget_min", e.target.value)}
                  placeholder="100000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_max">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Presupuesto Máximo (CLP)
                </Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={formData.budget_max}
                  onChange={(e) => handleInputChange("budget_max", e.target.value)}
                  placeholder="500000000"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Información adicional sobre el cliente..."
                  rows={4}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

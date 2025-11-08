"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { createClient } from "@/app/actions/clients"
import { useToast } from "@/hooks/use-toast"
import { RutInputWithLookup } from "./rut-input-with-lookup"

export function CreateClientDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    rut: "",
    first_name: "",
    last_name: "",
    company_name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })

  const handleRutDataFound = (data: {
    name: string
    businessName?: string
    activities?: string[]
    address?: string
  }) => {
    setFormData((prev) => ({
      ...prev,
      company_name: data.businessName || data.name,
      first_name: data.name,
      address: data.address || prev.address,
      notes: data.activities ? `Actividades: ${data.activities.join(", ")}` : prev.notes,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createClient(formData)

      if (result.success) {
        toast({
          title: "Cliente creado",
          description: "El cliente se ha creado exitosamente",
        })
        setOpen(false)
        setFormData({
          rut: "",
          first_name: "",
          last_name: "",
          company_name: "",
          email: "",
          phone: "",
          address: "",
          notes: "",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo crear el cliente",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear el cliente",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="rut">
              RUT <span className="text-red-500">*</span>
            </Label>
            <RutInputWithLookup
              value={formData.rut}
              onChange={(value) => setFormData((prev) => ({ ...prev, rut: value }))}
              onCompanyDataFound={handleRutDataFound}
              placeholder="12345678-9"
            />
            <p className="text-sm text-muted-foreground">
              Ingresa el RUT y presiona buscar para autocompletar con datos del SII
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre / Razón Social</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                placeholder="Juan o Empresa S.A."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                placeholder="Pérez"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Nombre Empresa</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, company_name: e.target.value }))}
              placeholder="Nombre de la empresa"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="contacto@empresa.cl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+56912345678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Dirección completa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Información adicional"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.rut}>
              {isSubmitting ? "Creando..." : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

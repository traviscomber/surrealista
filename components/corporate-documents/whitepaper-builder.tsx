"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FileText, Sparkles, Download, Eye } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface WhitepaperVariable {
  key: string
  label: string
  type: "text" | "textarea" | "image" | "number"
  placeholder?: string
  required: boolean
}

const WHITEPAPER_VARIABLES: WhitepaperVariable[] = [
  {
    key: "property_name",
    label: "Nombre de la Propiedad",
    type: "text",
    placeholder: "Campo Los Aromos",
    required: true,
  },
  {
    key: "property_subtitle",
    label: "Subtítulo",
    type: "text",
    placeholder: "Propiedad agrícola premium",
    required: false,
  },
  { key: "hero_image", label: "Imagen Principal", type: "image", required: true },
  {
    key: "superficie_total",
    label: "Superficie Total (hectáreas)",
    type: "number",
    placeholder: "10.67",
    required: true,
  },
  { key: "ubicacion", label: "Ubicación", type: "text", placeholder: "Paine, Región Metropolitana", required: true },
  { key: "comuna", label: "Comuna", type: "text", placeholder: "Paine", required: true },
  { key: "region", label: "Región", type: "text", placeholder: "Metropolitana", required: true },
  { key: "provincia", label: "Provincia", type: "text", placeholder: "Maipo", required: false },
  { key: "poblacion", label: "Población", type: "text", placeholder: "82.000 habitantes", required: false },
  {
    key: "infraestructura",
    label: "Infraestructura",
    type: "textarea",
    placeholder: "Casa principal, bodega, galpones...",
    required: true,
  },
  {
    key: "agua_riego",
    label: "Agua y Riego",
    type: "textarea",
    placeholder: "Derechos de agua, riego tecnificado...",
    required: false,
  },
  {
    key: "servicios",
    label: "Servicios y Accesos",
    type: "textarea",
    placeholder: "Luz, camino pavimentado...",
    required: false,
  },
  {
    key: "poblados_cercanos",
    label: "Poblados Cercanos",
    type: "textarea",
    placeholder: "Santiago (35 km), Buin (15 km)...",
    required: false,
  },
  { key: "polygon_image", label: "Imagen Polígono/KMZ", type: "image", required: false },
  { key: "location_map", label: "Mapa de Ubicación", type: "image", required: false },
  { key: "photo_1", label: "Fotografía 1", type: "image", required: false },
  { key: "photo_2", label: "Fotografía 2", type: "image", required: false },
  { key: "cover_image", label: "Imagen Contraportada", type: "image", required: false },
  { key: "tour_image", label: "Imagen Recorrido Visual", type: "image", required: false },
  {
    key: "contact_name",
    label: "Nombre de Contacto",
    type: "text",
    placeholder: "Juan Eduardo Navarro",
    required: true,
  },
  {
    key: "contact_email",
    label: "Email de Contacto",
    type: "text",
    placeholder: "contacto@sur-realista.cl",
    required: true,
  },
  { key: "contact_phone", label: "Teléfono de Contacto", type: "text", placeholder: "+56 9 8888 9999", required: true },
  { key: "contact_website", label: "Sitio Web", type: "text", placeholder: "www.sur-realista.cl", required: false },
  { key: "commission", label: "Comisión", type: "text", placeholder: "2% + IVA", required: false },
]

export function WhitepaperBuilder() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<"data" | "preview">("data")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  const handleInputChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value })
  }

  const handleImageUpload = async (key: string, file: File) => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `whitepaper-images/${fileName}`

      const { data, error } = await supabase.storage.from("property-images").upload(filePath, file)

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from("property-images").getPublicUrl(filePath)

      setFormData({ ...formData, [key]: publicUrl })
      toast.success("Imagen subida exitosamente")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Error al subir imagen")
    }
  }

  const handleGenerate = async () => {
    try {
      setLoading(true)

      const missingFields = WHITEPAPER_VARIABLES.filter((v) => v.required && !formData[v.key]).map((v) => v.label)

      if (missingFields.length > 0) {
        toast.error(`Campos requeridos faltantes: ${missingFields.join(", ")}`)
        return
      }

      const { data, error } = await supabase
        .from("generated_corporate_documents")
        .insert([
          {
            document_name: formData.property_name || "Whitepaper",
            document_data: formData,
            status: "generated",
            created_by: "system",
          },
        ])
        .select()
        .single()

      if (error) throw error

      toast.success("Whitepaper generado exitosamente")
      setIsOpen(false)
      setFormData({})
    } catch (error) {
      console.error("Error generating whitepaper:", error)
      toast.error("Error al generar whitepaper")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-purple-600" />
                Generador de Whitepapers
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Crea documentos corporativos profesionales para presentación de propiedades
              </p>
            </div>
            <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Crear Whitepaper
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Whitepaper</DialogTitle>
            <DialogDescription>
              Completa la información de la propiedad para generar un documento profesional de 7 páginas
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={currentStep}
            onValueChange={(v) => setCurrentStep(v as any)}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="data">Datos de la Propiedad</TabsTrigger>
              <TabsTrigger value="preview">Vista Previa</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="flex-1 overflow-y-auto mt-4 space-y-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Badge>1</Badge> Información Básica
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {WHITEPAPER_VARIABLES.filter((v) =>
                    ["property_name", "property_subtitle", "superficie_total", "ubicacion"].includes(v.key),
                  ).map((variable) => (
                    <div key={variable.key} className="space-y-2">
                      <Label>
                        {variable.label}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        type={variable.type === "number" ? "number" : "text"}
                        placeholder={variable.placeholder}
                        value={formData[variable.key] || ""}
                        onChange={(e) => handleInputChange(variable.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ubicación Detallada */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Badge>2</Badge> Ubicación Detallada
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {WHITEPAPER_VARIABLES.filter((v) =>
                    ["comuna", "region", "provincia", "poblacion", "poblados_cercanos"].includes(v.key),
                  ).map((variable) => (
                    <div key={variable.key} className="space-y-2">
                      <Label>{variable.label}</Label>
                      {variable.type === "textarea" ? (
                        <Textarea
                          placeholder={variable.placeholder}
                          value={formData[variable.key] || ""}
                          onChange={(e) => handleInputChange(variable.key, e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <Input
                          placeholder={variable.placeholder}
                          value={formData[variable.key] || ""}
                          onChange={(e) => handleInputChange(variable.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Características */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Badge>3</Badge> Características de la Propiedad
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {WHITEPAPER_VARIABLES.filter((v) =>
                    ["infraestructura", "agua_riego", "servicios"].includes(v.key),
                  ).map((variable) => (
                    <div key={variable.key} className="space-y-2">
                      <Label>
                        {variable.label}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Textarea
                        placeholder={variable.placeholder}
                        value={formData[variable.key] || ""}
                        onChange={(e) => handleInputChange(variable.key, e.target.value)}
                        rows={4}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Imágenes */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Badge>4</Badge> Imágenes
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {WHITEPAPER_VARIABLES.filter((v) => v.type === "image").map((variable) => (
                    <div key={variable.key} className="space-y-2">
                      <Label>
                        {variable.label}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(variable.key, file)
                          }}
                          className="flex-1"
                        />
                        {formData[variable.key] && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(formData[variable.key], "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Badge>5</Badge> Información de Contacto
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {WHITEPAPER_VARIABLES.filter((v) =>
                    ["contact_name", "contact_email", "contact_phone", "contact_website", "commission"].includes(v.key),
                  ).map((variable) => (
                    <div key={variable.key} className="space-y-2">
                      <Label>
                        {variable.label}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        placeholder={variable.placeholder}
                        value={formData[variable.key] || ""}
                        onChange={(e) => handleInputChange(variable.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-y-auto mt-4">
              <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg">Vista Previa del Whitepaper</h3>
                <div className="space-y-6">
                  {/* Slide 1: Cover */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Slide 1: Portada</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>
                        <strong>Título:</strong> {formData.property_name || "[Nombre de propiedad]"}
                      </p>
                      <p>
                        <strong>Subtítulo:</strong> {formData.property_subtitle || "[Subtítulo]"}
                      </p>
                      <p>
                        <strong>Imagen Hero:</strong> {formData.hero_image ? "✓ Cargada" : "❌ Falta"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Slide 2: Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Slide 2: Detalles de Propiedad</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>
                        <strong>Ubicación:</strong> {formData.ubicacion || "[ubicación]"}
                      </p>
                      <p>
                        <strong>Superficie:</strong> {formData.superficie_total || "[hectáreas]"} has.
                      </p>
                      <p>
                        <strong>Infraestructura:</strong> {formData.infraestructura ? "✓ Completada" : "❌ Falta"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Additional slides preview... */}
                  <div className="text-center text-gray-500 py-4">
                    <p>+ 5 slides adicionales con toda la información completada</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? "Generando..." : "Generar Whitepaper"}
              <Download className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

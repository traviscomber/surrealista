"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { MessageSquare, Instagram, Mail, FileText, Sparkles } from "lucide-react"
import { TemplateDialog } from "./template-dialog"
import { createBrowserClient } from "@/lib/supabase/client"

interface CommunicationTemplate {
  id: string
  name: string
  type: string
  icon: any
  category: string
  template: string
  variables: string[]
}

interface TemplateLibraryProps {
  onCommunicationCreated?: () => void
}

export function TemplateLibrary({ onCommunicationCreated }: TemplateLibraryProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null)
  const supabase = createBrowserClient()

  const templates: CommunicationTemplate[] = [
    {
      id: "instagram-property",
      name: "Post Instagram - Propiedad",
      type: "instagram",
      icon: Instagram,
      category: "redes_sociales",
      template: `🏡 ¡Propiedad Exclusiva en {UBICACION}!

✨ {TIPO_PROPIEDAD} de {METROS} m²
💰 Precio: ${"{PRECIO}"}
📍 Ubicación: {UBICACION}

Características destacadas:
🛏️ {DORMITORIOS} dormitorios
🚿 {BANOS} baños
🌳 {CARACTERISTICAS}

📞 Contáctanos para más información
✉️ {CORREO_CONTACTO}
📱 {TELEFONO_CONTACTO}

#Propiedades #BienesRaices {HASHTAG_UBICACION} #InversiónInmobiliaria`,
      variables: [
        "UBICACION",
        "TIPO_PROPIEDAD",
        "METROS",
        "PRECIO",
        "DORMITORIOS",
        "BANOS",
        "CARACTERISTICAS",
        "CORREO_CONTACTO",
        "TELEFONO_CONTACTO",
        "HASHTAG_UBICACION",
      ],
    },
    {
      id: "instagram-campo",
      name: "Post Instagram - Campo",
      type: "instagram",
      icon: Instagram,
      category: "redes_sociales",
      template: `🌾 Campo en Venta - {UBICACION}

📊 Superficie: {HECTAREAS} hectáreas
💰 Precio: ${"{PRECIO}"}
📍 {UBICACION}, {REGION}

Características:
🚜 {USO_SUELO}
💧 {DERECHOS_AGUA}
🏠 {CONSTRUCCIONES}
🌳 {VEGETACION}

Ideal para {USO_OBJETIVO}

📞 Consultas: {TELEFONO_CONTACTO}
✉️ {CORREO_CONTACTO}

#Campo #Agricultura #InversiónRural #Fundo {HASHTAG_UBICACION}`,
      variables: [
        "UBICACION",
        "HECTAREAS",
        "PRECIO",
        "REGION",
        "USO_SUELO",
        "DERECHOS_AGUA",
        "CONSTRUCCIONES",
        "VEGETACION",
        "USO_OBJETIVO",
        "TELEFONO_CONTACTO",
        "CORREO_CONTACTO",
        "HASHTAG_UBICACION",
      ],
    },
    {
      id: "portal-inmobiliario",
      name: "Portal Inmobiliario - Publicación",
      type: "portal",
      icon: FileText,
      category: "portales_venta",
      template: `PUBLICACIÓN PORTAL INMOBILIARIO

TÍTULO:
{TIPO_PROPIEDAD} en {UBICACION} - {METROS} m²

DESCRIPCIÓN:
{DESCRIPCION}

CARACTERÍSTICAS:
- Superficie total: {METROS} m²
- Dormitorios: {DORMITORIOS}
- Baños: {BANOS}

UBICACIÓN:
{DIRECCION}, {COMUNA}, {CIUDAD}

PRECIO: ${"{PRECIO}"}

CONTACTO:
{NOMBRE_CORREDOR}
{TELEFONO_CORREDOR}
{EMAIL_CORREDOR}`,
      variables: [
        "TIPO_PROPIEDAD",
        "UBICACION",
        "METROS",
        "DESCRIPCION",
        "DORMITORIOS",
        "BANOS",
        "DIRECCION",
        "COMUNA",
        "CIUDAD",
        "PRECIO",
        "NOMBRE_CORREDOR",
        "TELEFONO_CORREDOR",
        "EMAIL_CORREDOR",
      ],
    },
    {
      id: "mandato-venta",
      name: "Mandato de Venta",
      type: "document",
      icon: FileText,
      category: "documentos_legales",
      template: `MANDATO DE VENTA EXCLUSIVO

En {CIUDAD}, {FECHA}

MANDANTE: {NOMBRE_PROPIETARIO}, RUT: {RUT_PROPIETARIO}
MANDATARIO: Sur-Realista

PROPIEDAD:
Rol: {ROL_PROPIEDAD}
Dirección: {DIRECCION_PROPIEDAD}

PRECIO DE VENTA: ${"{PRECIO_VENTA}"}
COMISIÓN: {COMISION}%
VIGENCIA: {DURACION} meses`,
      variables: [
        "CIUDAD",
        "FECHA",
        "NOMBRE_PROPIETARIO",
        "RUT_PROPIETARIO",
        "ROL_PROPIEDAD",
        "DIRECCION_PROPIEDAD",
        "PRECIO_VENTA",
        "COMISION",
        "DURACION",
      ],
    },
    {
      id: "email-followup",
      name: "Email - Seguimiento Cliente",
      type: "email",
      icon: Mail,
      category: "comunicacion_clientes",
      template: `Asunto: Seguimiento - Propiedades en {UBICACION}

Estimado/a {NOMBRE_CLIENTE},

Le escribo para darle seguimiento a su búsqueda de {TIPO_PROPIEDAD} en {UBICACION}.

{MENSAJE_PRINCIPAL}

Saludos cordiales,

{NOMBRE_CORREDOR}
Sur-Realista
📱 {TELEFONO_CORREDOR}`,
      variables: [
        "NOMBRE_CLIENTE",
        "TIPO_PROPIEDAD",
        "UBICACION",
        "MENSAJE_PRINCIPAL",
        "NOMBRE_CORREDOR",
        "TELEFONO_CORREDOR",
      ],
    },
    {
      id: "whatsapp-quick",
      name: "WhatsApp - Consulta Rápida",
      type: "whatsapp",
      icon: MessageSquare,
      category: "comunicacion_clientes",
      template: `Hola {NOMBRE_CLIENTE} 👋

Te escribo sobre la propiedad en {UBICACION}.

📍 {DIRECCION_PROPIEDAD}
💰 Precio: ${"{PRECIO}"}

¿Te gustaría más información?

Saludos,
{NOMBRE_CORREDOR}`,
      variables: ["NOMBRE_CLIENTE", "UBICACION", "DIRECCION_PROPIEDAD", "PRECIO", "NOMBRE_CORREDOR"],
    },
  ]

  const handleCreateFromTemplate = async (template: CommunicationTemplate, filledContent: string, subject: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let communicationType = "email" // default fallback

      if (template.type === "instagram") {
        communicationType = "instagram"
      } else if (template.type === "whatsapp") {
        communicationType = "whatsapp"
      } else if (template.type === "email") {
        communicationType = "email"
      } else if (template.type === "portal") {
        communicationType = "portal"
      } else if (template.type === "document") {
        communicationType = "document"
      }

      console.log("[v0] Creating communication with type:", communicationType, "from template:", template.type)

      const { error } = await supabase.from("client_communications").insert([
        {
          communication_type: communicationType,
          subject: subject,
          content: filledContent,
          direction: "outbound", // Changed from 'outgoing' to 'outbound'
          created_by: user?.email || "system",
          communication_date: new Date().toISOString(),
          attachments: {
            template_used: template.name,
            template_type: template.type,
            category: template.category,
            status: "draft",
          },
        },
      ])

      if (error) {
        console.error("[v0] Database error:", error)
        throw error
      }

      console.log("[v0] Communication created successfully")

      setDialogOpen(false)
      setSelectedTemplate(null)

      if (onCommunicationCreated) {
        onCommunicationCreated()
      }
    } catch (error) {
      console.error("Error creating communication:", error)
      alert(`Error al crear la comunicación: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Templates Disponibles</h3>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            {templates.length} plantillas
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Dialog key={template.id} open={dialogOpen && selectedTemplate?.id === template.id}>
              <DialogTrigger asChild>
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-purple-300 group"
                  onClick={() => {
                    setSelectedTemplate(template)
                    setDialogOpen(true)
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
                        <template.icon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              {selectedTemplate?.id === template.id && (
                <TemplateDialog
                  template={template}
                  open={dialogOpen}
                  onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) setSelectedTemplate(null)
                  }}
                  onSave={handleCreateFromTemplate}
                />
              )}
            </Dialog>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

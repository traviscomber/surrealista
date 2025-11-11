"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  MessageSquare,
  Instagram,
  Mail,
  FileText,
  Calendar,
  User,
  Send,
  Copy,
  Sparkles,
  Search,
  Filter,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface Communication {
  id: string
  client_id?: string
  communication_type: string
  subject: string
  content: string
  communication_date: string
  direction: string
  created_by: string
  attachments?: any
}

interface CommunicationTemplate {
  id: string
  name: string
  type: string
  icon: any
  category: string
  template: string
  variables: string[]
}

export function CommunicationsManager() {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

  const supabase = createBrowserClient()

  const templates: CommunicationTemplate[] = [
    {
      id: "instagram-property",
      name: "Post Instagram - Propiedad",
      type: "instagram",
      icon: Instagram,
      category: "social_media",
      template: `🏡 ¡Propiedad Exclusiva en {LOCATION}!

✨ {PROPERTY_TYPE} de {SIZE} m²
💰 Precio: ${"{PRICE}"}
📍 Ubicación: {LOCATION}

Características destacadas:
🛏️ {BEDROOMS} dormitorios
🚿 {BATHROOMS} baños
🌳 {SPECIAL_FEATURES}

📞 Contáctanos para más información
✉️ {CONTACT_EMAIL}
📱 {CONTACT_PHONE}

#Propiedades #BienesRaices {LOCATION_HASHTAG} #InversiónInmobiliaria`,
      variables: [
        "LOCATION",
        "PROPERTY_TYPE",
        "SIZE",
        "PRICE",
        "BEDROOMS",
        "BATHROOMS",
        "SPECIAL_FEATURES",
        "CONTACT_EMAIL",
        "CONTACT_PHONE",
        "LOCATION_HASHTAG",
      ],
    },
    {
      id: "instagram-campo",
      name: "Post Instagram - Campo",
      type: "instagram",
      icon: Instagram,
      category: "social_media",
      template: `🌾 Campo en Venta - {LOCATION}

📊 Superficie: {SIZE} hectáreas
💰 Precio: ${"{PRICE}"}
📍 {LOCATION}, {REGION}

Características:
🚜 {LAND_USE}
💧 {WATER_RIGHTS}
🏠 {BUILDINGS}
🌳 {VEGETATION}

Ideal para {TARGET_USE}

📞 Consultas: {CONTACT_PHONE}
✉️ {CONTACT_EMAIL}

#Campo #Agricultura #InversiónRural #Fundo {LOCATION_HASHTAG}`,
      variables: [
        "LOCATION",
        "SIZE",
        "PRICE",
        "REGION",
        "LAND_USE",
        "WATER_RIGHTS",
        "BUILDINGS",
        "VEGETATION",
        "TARGET_USE",
        "CONTACT_PHONE",
        "CONTACT_EMAIL",
        "LOCATION_HASHTAG",
      ],
    },
    {
      id: "portal-inmobiliario",
      name: "Portal Inmobiliario - Listing",
      type: "portal",
      icon: FileText,
      category: "portales_venta",
      template: `PUBLICACIÓN PORTAL INMOBILIARIO

TÍTULO:
{PROPERTY_TYPE} en {LOCATION} - {SIZE} m²

DESCRIPCIÓN:
{DESCRIPTION}

CARACTERÍSTICAS:
- Superficie total: {SIZE} m²
- Superficie útil: {USABLE_SIZE} m²
- Dormitorios: {BEDROOMS}
- Baños: {BATHROOMS}
- Estacionamientos: {PARKING}
- Bodegas: {STORAGE}
- Año construcción: {YEAR_BUILT}
- Orientación: {ORIENTATION}

SERVICIOS Y COMODIDADES:
{AMENITIES}

UBICACIÓN:
Dirección: {ADDRESS}
Comuna: {COMUNA}
Ciudad: {CITY}
Región: {REGION}

PRECIO: ${"{PRICE}"}
GASTOS COMUNES: ${"{COMMON_EXPENSES}"}
CONTRIBUCIONES: ${"{PROPERTY_TAX}"}

CONTACTO:
Corredor: {AGENT_NAME}
Teléfono: {AGENT_PHONE}
Email: {AGENT_EMAIL}
Empresa: Sur-Realista

DOCUMENTACIÓN:
- Certificado de dominio vigente
- Avalúo fiscal actualizado
- Planos
- {ADDITIONAL_DOCS}

NOTAS:
{ADDITIONAL_NOTES}`,
      variables: [
        "PROPERTY_TYPE",
        "LOCATION",
        "SIZE",
        "DESCRIPTION",
        "USABLE_SIZE",
        "BEDROOMS",
        "BATHROOMS",
        "PARKING",
        "STORAGE",
        "YEAR_BUILT",
        "ORIENTATION",
        "AMENITIES",
        "ADDRESS",
        "COMUNA",
        "CITY",
        "REGION",
        "PRICE",
        "COMMON_EXPENSES",
        "PROPERTY_TAX",
        "AGENT_NAME",
        "AGENT_PHONE",
        "AGENT_EMAIL",
        "ADDITIONAL_DOCS",
        "ADDITIONAL_NOTES",
      ],
    },
    {
      id: "portalinmuebles",
      name: "Portalinmuebles.com - Listing",
      type: "portal",
      icon: FileText,
      category: "portales_venta",
      template: `PUBLICACIÓN PORTALINMUEBLES.COM

{PROPERTY_TYPE} EN VENTA - {LOCATION}

PRECIO: UF {PRICE_UF} (${"{PRICE_CLP}"})

DETALLES PRINCIPALES:
✓ {SIZE} m² totales / {USABLE_SIZE} m² útiles
✓ {BEDROOMS} dorms
✓ {BATHROOMS} baños completos
✓ {PARKING} estacionamientos
✓ {STORAGE} bodegas

DESCRIPCIÓN DETALLADA:
{DETAILED_DESCRIPTION}

CARACTERÍSTICAS ESPECIALES:
{SPECIAL_FEATURES}

EQUIPAMIENTO:
{EQUIPMENT}

UBICACIÓN Y ENTORNO:
📍 {ADDRESS}, {COMUNA}
🏙️ Cerca de: {NEARBY_PLACES}
🚌 Transporte: {TRANSPORT_ACCESS}

GASTOS MENSUALES:
- Gastos comunes: ${"{COMMON_EXPENSES}"}
- Contribuciones: ${"{PROPERTY_TAX}"}

ROL DE AVALÚO: {ROL_NUMBER}

CONTACTO DIRECTO:
{AGENT_NAME} - Sur-Realista
📱 {AGENT_PHONE}
📧 {AGENT_EMAIL}
🌐 www.sur-realista.cl`,
      variables: [
        "PROPERTY_TYPE",
        "LOCATION",
        "PRICE_UF",
        "PRICE_CLP",
        "SIZE",
        "USABLE_SIZE",
        "BEDROOMS",
        "BATHROOMS",
        "PARKING",
        "STORAGE",
        "DETAILED_DESCRIPTION",
        "SPECIAL_FEATURES",
        "EQUIPMENT",
        "ADDRESS",
        "COMUNA",
        "NEARBY_PLACES",
        "TRANSPORT_ACCESS",
        "COMMON_EXPENSES",
        "PROPERTY_TAX",
        "ROL_NUMBER",
        "AGENT_NAME",
        "AGENT_PHONE",
        "AGENT_EMAIL",
      ],
    },
    {
      id: "combined-ig-portals",
      name: "Workflow Completo: IG + Portales",
      type: "workflow",
      icon: Sparkles,
      category: "workflow",
      template: `📋 WORKFLOW DE PUBLICACIÓN COMPLETA

PROPIEDAD: {PROPERTY_TYPE} en {LOCATION}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 1. POST INSTAGRAM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏡 ¡Nueva Propiedad en {LOCATION}!

✨ {PROPERTY_TYPE} de {SIZE} m²
💰 ${"{PRICE}"} | UF {PRICE_UF}
📍 {COMUNA}, {CITY}

Características:
🛏️ {BEDROOMS} dorms | 🚿 {BATHROOMS} baños
🚗 {PARKING} estac. | 📦 {STORAGE} bodegas
{HIGHLIGHT_FEATURES}

📞 {AGENT_PHONE} | ✉️ {AGENT_EMAIL}

#PropiedadesChile #{COMUNA} #BienesRaices #InversiónInmobiliaria

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 2. PORTAL INMOBILIARIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TÍTULO: {PROPERTY_TYPE} en {LOCATION} - {SIZE} m²

DESCRIPCIÓN:
{PORTAL_DESCRIPTION}

DETALLES:
- Superficie: {SIZE} m² / {USABLE_SIZE} m² útiles
- Dormitorios: {BEDROOMS} | Baños: {BATHROOMS}
- Estacionamientos: {PARKING} | Bodegas: {STORAGE}
- Año: {YEAR_BUILT} | Orientación: {ORIENTATION}

UBICACIÓN: {ADDRESS}, {COMUNA}, {CITY}
PRECIO: ${"{PRICE}"} | G.C.: ${"{COMMON_EXPENSES}"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 3. PORTALINMUEBLES.COM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{PROPERTY_TYPE} EN VENTA | {LOCATION}

UF {PRICE_UF} (${"{PRICE_CLP}"})

✓ {SIZE} m² | {BEDROOMS} dorms | {BATHROOMS} baños
✓ {PARKING} estac. | {STORAGE} bodegas
✓ {SPECIAL_AMENITIES}

📍 {ADDRESS}, {COMUNA}
🚌 Metro/Bus: {TRANSPORT}
🏪 Cerca: {NEARBY_SERVICES}

ROL: {ROL_NUMBER}
G.C.: ${"{COMMON_EXPENSES}"} | Contrib.: ${"{PROPERTY_TAX}"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CHECKLIST DE PUBLICACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Fotos profesionales (min. 10)
□ Video recorrido
□ Plano de planta
□ Certificado dominio vigente
□ Post Instagram publicado
□ Listing en Portal Inmobiliario
□ Listing en Portalinmuebles.com
□ Histórico de portales.cl
□ Yapo.cl
□ Grupo Facebook propiedades

RESPONSABLE: {AGENT_NAME}
FECHA: {PUBLICATION_DATE}`,
      variables: [
        "PROPERTY_TYPE",
        "LOCATION",
        "SIZE",
        "PRICE",
        "PRICE_UF",
        "PRICE_CLP",
        "COMUNA",
        "CITY",
        "BEDROOMS",
        "BATHROOMS",
        "PARKING",
        "STORAGE",
        "HIGHLIGHT_FEATURES",
        "AGENT_PHONE",
        "AGENT_EMAIL",
        "PORTAL_DESCRIPTION",
        "USABLE_SIZE",
        "YEAR_BUILT",
        "ORIENTATION",
        "ADDRESS",
        "COMMON_EXPENSES",
        "SPECIAL_AMENITIES",
        "TRANSPORT",
        "NEARBY_SERVICES",
        "ROL_NUMBER",
        "PROPERTY_TAX",
        "AGENT_NAME",
        "PUBLICATION_DATE",
      ],
    },
    {
      id: "mandato-venta",
      name: "Mandato de Venta",
      type: "document",
      icon: FileText,
      category: "legal",
      template: `MANDATO DE VENTA EXCLUSIVO

En {CITY}, {DATE}

Comparecen:

MANDANTE: {OWNER_NAME}, RUT: {OWNER_RUT}
Dirección: {OWNER_ADDRESS}
Email: {OWNER_EMAIL}
Teléfono: {OWNER_PHONE}

MANDATARIO: Sur-Realista
RUT: {COMPANY_RUT}
Representada por: {AGENT_NAME}

PROPIEDAD:
Rol: {PROPERTY_ROL}
Dirección: {PROPERTY_ADDRESS}
Comuna: {PROPERTY_COMUNA}
Superficie: {PROPERTY_SIZE} m²

PRECIO DE VENTA: ${"{SALE_PRICE}"}
COMISIÓN: {COMMISSION}%
VIGENCIA: {DURATION} meses desde la fecha

El mandante otorga facultad exclusiva al mandatario para:
- Publicitar la propiedad en medios digitales y físicos
- Realizar visitas con potenciales compradores
- Negociar el precio dentro del rango acordado
- Gestionar la documentación necesaria

Firmado en conformidad,

_________________          _________________
{OWNER_NAME}               {AGENT_NAME}
Mandante                   Mandatario`,
      variables: [
        "CITY",
        "DATE",
        "OWNER_NAME",
        "OWNER_RUT",
        "OWNER_ADDRESS",
        "OWNER_EMAIL",
        "OWNER_PHONE",
        "COMPANY_RUT",
        "AGENT_NAME",
        "PROPERTY_ROL",
        "PROPERTY_ADDRESS",
        "PROPERTY_COMUNA",
        "PROPERTY_SIZE",
        "SALE_PRICE",
        "COMMISSION",
        "DURATION",
      ],
    },
    {
      id: "email-followup",
      name: "Email - Seguimiento Cliente",
      type: "email",
      icon: Mail,
      category: "client_communication",
      template: `Asunto: Seguimiento - Propiedades en {LOCATION}

Estimado/a {CLIENT_NAME},

Espero que se encuentre muy bien.

Le escribo para darle seguimiento a su búsqueda de {PROPERTY_TYPE} en {LOCATION}.

Tenemos {NEW_PROPERTIES} nuevas propiedades que coinciden con sus criterios:

{PROPERTY_LIST}

¿Le gustaría agendar una visita para conocerlas? Estoy disponible {AVAILABLE_DATES}.

Quedo atento a su respuesta.

Saludos cordiales,

{AGENT_NAME}
{AGENT_TITLE}
Sur-Realista
📱 {AGENT_PHONE}
✉️ {AGENT_EMAIL}`,
      variables: [
        "CLIENT_NAME",
        "PROPERTY_TYPE",
        "LOCATION",
        "NEW_PROPERTIES",
        "PROPERTY_LIST",
        "AVAILABLE_DATES",
        "AGENT_NAME",
        "AGENT_TITLE",
        "AGENT_PHONE",
        "AGENT_EMAIL",
      ],
    },
    {
      id: "whatsapp-quick",
      name: "WhatsApp - Consulta Rápida",
      type: "whatsapp",
      icon: MessageSquare,
      category: "client_communication",
      template: `Hola {CLIENT_NAME} 👋

Te escribo sobre la propiedad en {LOCATION} que consultaste.

📍 {PROPERTY_ADDRESS}
💰 Precio: ${"{PRICE}"}
📊 {SIZE} m²

¿Te gustaría más información o agendar una visita?

Saludos,
{AGENT_NAME}`,
      variables: ["CLIENT_NAME", "LOCATION", "PROPERTY_ADDRESS", "PRICE", "SIZE", "AGENT_NAME"],
    },
  ]

  useEffect(() => {
    loadCommunications()
  }, [])

  const loadCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from("client_communications")
        .select("*")
        .order("communication_date", { ascending: false })
        .limit(50)

      if (error) throw error
      setCommunications(data || [])
    } catch (error) {
      console.error("Error loading communications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFromTemplate = async (template: CommunicationTemplate, filledContent: string, subject: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from("client_communications").insert([
        {
          communication_type: template.type,
          subject: subject,
          content: filledContent,
          direction: "outgoing",
          created_by: user?.email || "system",
          communication_date: new Date().toISOString(),
        },
      ])

      if (error) throw error

      loadCommunications()
      setDialogOpen(false)
      setSelectedTemplate(null)
    } catch (error) {
      console.error("Error creating communication:", error)
    }
  }

  const filteredCommunications = communications.filter((comm) => {
    const matchesSearch =
      comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || comm.communication_type === filterType
    return matchesSearch && matchesFilter
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "instagram":
        return <Instagram className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />
      case "document":
        return <FileText className="h-4 w-4" />
      case "portal":
        return <FileText className="h-4 w-4" />
      case "workflow":
        return <Sparkles className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            Gestión de Comunicaciones
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Templates para Social Media, Mandatos de Venta, y Comunicaciones con Clientes
          </p>
        </CardHeader>
      </Card>

      {/* Templates Section */}
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

      {/* Communications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Historial de Comunicaciones</h3>
            <Badge variant="outline">{filteredCommunications.length} registros</Badge>
          </div>
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar comunicaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="document">Documentos</SelectItem>
                <SelectItem value="portal">Portales</SelectItem>
                <SelectItem value="workflow">Workflows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando comunicaciones...</p>
            </div>
          ) : filteredCommunications.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay comunicaciones</h3>
              <p className="text-gray-500 mb-6">Comienza creando comunicaciones desde los templates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCommunications.map((comm) => (
                <Card key={comm.id} className="hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-purple-50">{getTypeIcon(comm.communication_type)}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{comm.subject}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{comm.content}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              comm.direction === "outgoing" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
                            }
                          >
                            {comm.direction === "outgoing" ? "Enviado" : "Recibido"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(comm.communication_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {comm.created_by}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {comm.communication_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TemplateDialog({
  template,
  open,
  onOpenChange,
  onSave,
}: {
  template: CommunicationTemplate
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (template: CommunicationTemplate, content: string, subject: string) => void
}) {
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [subject, setSubject] = useState(template.name)
  const [preview, setPreview] = useState(template.template)

  useEffect(() => {
    // Initialize variables
    const initialVars: Record<string, string> = {}
    template.variables.forEach((v) => {
      initialVars[v] = ""
    })
    setVariables(initialVars)
  }, [template])

  useEffect(() => {
    // Update preview with filled variables
    let updatedPreview = template.template
    Object.entries(variables).forEach(([key, value]) => {
      updatedPreview = updatedPreview.replaceAll(`{${key}}`, value || `{${key}}`)
    })
    setPreview(updatedPreview)
  }, [variables, template])

  const handleCopy = () => {
    navigator.clipboard.writeText(preview)
    alert("Contenido copiado al portapapeles")
  }

  const handleSave = () => {
    onSave(template, preview, subject)
  }

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <template.icon className="h-5 w-5 text-purple-600" />
          {template.name}
        </DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-6">
        {/* Variables Form */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Completar Variables</h4>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            <div>
              <Label>Asunto / Título</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto" />
            </div>
            {template.variables.map((variable) => (
              <div key={variable}>
                <Label className="text-sm text-gray-700">{variable.replace(/_/g, " ")}</Label>
                <Input
                  value={variables[variable] || ""}
                  onChange={(e) => setVariables({ ...variables, [variable]: e.target.value })}
                  placeholder={`Ingrese ${variable.toLowerCase().replace(/_/g, " ")}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Vista Previa</h4>
            <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2 bg-transparent">
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-[500px] overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-sans">{preview}</pre>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSave} className="gap-2 bg-purple-600 hover:bg-purple-700">
          <Send className="h-4 w-4" />
          Guardar Comunicación
        </Button>
      </div>
    </DialogContent>
  )
}

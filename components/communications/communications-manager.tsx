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
      name: "Portal Inmobiliario - Listing",
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
- Superficie útil: {METROS_UTILES} m²
- Dormitorios: {DORMITORIOS}
- Baños: {BANOS}
- Estacionamientos: {ESTACIONAMIENTOS}
- Bodegas: {BODEGAS}
- Año construcción: {ANO_CONSTRUCCION}
- Orientación: {ORIENTACION}

SERVICIOS Y COMODIDADES:
{SERVICIOS}

UBICACIÓN:
Dirección: {DIRECCION}
Comuna: {COMUNA}
Ciudad: {CIUDAD}
Región: {REGION}

PRECIO: ${"{PRECIO}"}
GASTOS COMUNES: ${"{GASTOS_COMUNES}"}
CONTRIBUCIONES: ${"{CONTRIBUCIONES}"}

CONTACTO:
Corredor: {NOMBRE_CORREDOR}
Teléfono: {TELEFONO_CORREDOR}
Email: {EMAIL_CORREDOR}
Empresa: Sur-Realista

DOCUMENTACIÓN:
- Certificado de dominio vigente
- Avalúo fiscal actualizado
- Planos
- {DOCUMENTOS_ADICIONALES}

NOTAS:
{NOTAS_ADICIONALES}`,
      variables: [
        "TIPO_PROPIEDAD",
        "UBICACION",
        "METROS",
        "DESCRIPCION",
        "METROS_UTILES",
        "DORMITORIOS",
        "BANOS",
        "ESTACIONAMIENTOS",
        "BODEGAS",
        "ANO_CONSTRUCCION",
        "ORIENTACION",
        "SERVICIOS",
        "DIRECCION",
        "COMUNA",
        "CIUDAD",
        "REGION",
        "PRECIO",
        "GASTOS_COMUNES",
        "CONTRIBUCIONES",
        "NOMBRE_CORREDOR",
        "TELEFONO_CORREDOR",
        "EMAIL_CORREDOR",
        "DOCUMENTOS_ADICIONALES",
        "NOTAS_ADICIONALES",
      ],
    },
    {
      id: "portalinmuebles",
      name: "Portalinmuebles.com - Listing",
      type: "portal",
      icon: FileText,
      category: "portales_venta",
      template: `PUBLICACIÓN PORTALINMUEBLES.COM

{TIPO_PROPIEDAD} EN VENTA - {UBICACION}

PRECIO: UF {PRECIO_UF} (${"{PRECIO_CLP}"})

DETALLES PRINCIPALES:
✓ {METROS} m² totales / {METROS_UTILES} m² útiles
✓ {DORMITORIOS} dorms
✓ {BANOS} baños completos
✓ {ESTACIONAMIENTOS} estacionamientos
✓ {BODEGAS} bodegas

DESCRIPCIÓN DETALLADA:
{DESCRIPCION_DETALLADA}

CARACTERÍSTICAS ESPECIALES:
{CARACTERISTICAS_ESPECIALES}

EQUIPAMIENTO:
{EQUIPAMIENTO}

UBICACIÓN Y ENTORNO:
📍 {DIRECCION}, {COMUNA}
🏙️ Cerca de: {LUGARES_CERCANOS}
🚌 Transporte: {ACCESO_TRANSPORTE}

GASTOS MENSUALES:
- Gastos comunes: ${"{GASTOS_COMUNES}"}
- Contribuciones: ${"{CONTRIBUCIONES}"}

ROL DE AVALÚO: {NUMERO_ROL}

CONTACTO DIRECTO:
{NOMBRE_CORREDOR} - Sur-Realista
📱 {TELEFONO_CORREDOR}
📧 {EMAIL_CORREDOR}
🌐 www.sur-realista.cl`,
      variables: [
        "TIPO_PROPIEDAD",
        "UBICACION",
        "PRECIO_UF",
        "PRECIO_CLP",
        "METROS",
        "METROS_UTILES",
        "DORMITORIOS",
        "BANOS",
        "ESTACIONAMIENTOS",
        "BODEGAS",
        "DESCRIPCION_DETALLADA",
        "CARACTERISTICAS_ESPECIALES",
        "EQUIPAMIENTO",
        "DIRECCION",
        "COMUNA",
        "LUGARES_CERCANOS",
        "ACCESO_TRANSPORTE",
        "GASTOS_COMUNES",
        "CONTRIBUCIONES",
        "NUMERO_ROL",
        "NOMBRE_CORREDOR",
        "TELEFONO_CORREDOR",
        "EMAIL_CORREDOR",
      ],
    },
    {
      id: "combined-ig-portals",
      name: "Workflow Completo: IG + Portales",
      type: "workflow",
      icon: Sparkles,
      category: "workflow_completo",
      template: `📋 WORKFLOW DE PUBLICACIÓN COMPLETA

PROPIEDAD: {TIPO_PROPIEDAD} en {UBICACION}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 1. POST INSTAGRAM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏡 ¡Nueva Propiedad en {UBICACION}!

✨ {TIPO_PROPIEDAD} de {METROS} m²
💰 ${"{PRECIO}"} | UF {PRECIO_UF}
📍 {COMUNA}, {CIUDAD}

Características:
🛏️ {DORMITORIOS} dorms | 🚿 {BANOS} baños
🚗 {ESTACIONAMIENTOS} estac. | 📦 {BODEGAS} bodegas
{CARACTERISTICAS_DESTACADAS}

📞 {TELEFONO_CORREDOR} | ✉️ {EMAIL_CORREDOR}

#PropiedadesChile #{COMUNA} #BienesRaices #InversiónInmobiliaria

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 2. PORTAL INMOBILIARIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TÍTULO: {TIPO_PROPIEDAD} en {UBICACION} - {METROS} m²

DESCRIPCIÓN:
{DESCRIPCION_PORTAL}

DETALLES:
- Superficie: {METROS} m² / {METROS_UTILES} m² útiles
- Dormitorios: {DORMITORIOS} | Baños: {BANOS}
- Estacionamientos: {ESTACIONAMIENTOS} | Bodegas: {BODEGAS}
- Año: {ANO_CONSTRUCCION} | Orientación: {ORIENTACION}

UBICACIÓN: {DIRECCION}, {COMUNA}, {CIUDAD}
PRECIO: ${"{PRECIO}"} | G.C.: ${"{GASTOS_COMUNES}"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 3. PORTALINMUEBLES.COM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{TIPO_PROPIEDAD} EN VENTA | {UBICACION}

UF {PRECIO_UF} (${"{PRECIO_CLP}"})

✓ {METROS} m² | {DORMITORIOS} dorms | {BANOS} baños
✓ {ESTACIONAMIENTOS} estac. | {BODEGAS} bodegas
✓ {SERVICIOS_ESPECIALES}

📍 {DIRECCION}, {COMUNA}
🚌 Metro/Bus: {TRANSPORTE}
🏪 Cerca: {SERVICIOS_CERCANOS}

ROL: {NUMERO_ROL}
G.C.: ${"{GASTOS_COMUNES}"} | Contrib.: ${"{CONTRIBUCIONES}"}

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
□ Yapo.cl
□ Grupo Facebook propiedades

RESPONSABLE: {NOMBRE_CORREDOR}
FECHA: {FECHA_PUBLICACION}`,
      variables: [
        "TIPO_PROPIEDAD",
        "UBICACION",
        "METROS",
        "PRECIO",
        "PRECIO_UF",
        "PRECIO_CLP",
        "COMUNA",
        "CIUDAD",
        "DORMITORIOS",
        "BANOS",
        "ESTACIONAMIENTOS",
        "BODEGAS",
        "CARACTERISTICAS_DESTACADAS",
        "TELEFONO_CORREDOR",
        "EMAIL_CORREDOR",
        "DESCRIPCION_PORTAL",
        "METROS_UTILES",
        "ANO_CONSTRUCCION",
        "ORIENTACION",
        "DIRECCION",
        "GASTOS_COMUNES",
        "SERVICIOS_ESPECIALES",
        "TRANSPORTE",
        "SERVICIOS_CERCANOS",
        "NUMERO_ROL",
        "CONTRIBUCIONES",
        "NOMBRE_CORREDOR",
        "FECHA_PUBLICACION",
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

Comparecen:

MANDANTE: {NOMBRE_PROPIETARIO}, RUT: {RUT_PROPIETARIO}
Dirección: {DIRECCION_PROPIETARIO}
Email: {EMAIL_PROPIETARIO}
Teléfono: {TELEFONO_PROPIETARIO}

MANDATARIO: Sur-Realista
RUT: {RUT_EMPRESA}
Representada por: {NOMBRE_CORREDOR}

PROPIEDAD:
Rol: {ROL_PROPIEDAD}
Dirección: {DIRECCION_PROPIEDAD}
Comuna: {COMUNA_PROPIEDAD}
Superficie: {METROS_PROPIEDAD} m²

PRECIO DE VENTA: ${"{PRECIO_VENTA}"}
COMISIÓN: {COMISION}%
VIGENCIA: {DURACION} meses desde la fecha

El mandante otorga facultad exclusiva al mandatario para:
- Publicitar la propiedad en medios digitales y físicos
- Realizar visitas con potenciales compradores
- Negociar el precio dentro del rango acordado
- Gestionar la documentación necesaria

Firmado en conformidad,

_________________          _________________
{NOMBRE_PROPIETARIO}       {NOMBRE_CORREDOR}
Mandante                   Mandatario`,
      variables: [
        "CIUDAD",
        "FECHA",
        "NOMBRE_PROPIETARIO",
        "RUT_PROPIETARIO",
        "DIRECCION_PROPIETARIO",
        "EMAIL_PROPIETARIO",
        "TELEFONO_PROPIETARIO",
        "RUT_EMPRESA",
        "NOMBRE_CORREDOR",
        "ROL_PROPIEDAD",
        "DIRECCION_PROPIEDAD",
        "COMUNA_PROPIEDAD",
        "METROS_PROPIEDAD",
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

Espero que se encuentre muy bien.

Le escribo para darle seguimiento a su búsqueda de {TIPO_PROPIEDAD} en {UBICACION}.

Tenemos {NUEVAS_PROPIEDADES} nuevas propiedades que coinciden con sus criterios:

{LISTA_PROPIEDADES}

¿Le gustaría agendar una visita para conocerlas? Estoy disponible {FECHAS_DISPONIBLES}.

Quedo atento a su respuesta.

Saludos cordiales,

{NOMBRE_CORREDOR}
{CARGO_CORREDOR}
Sur-Realista
📱 {TELEFONO_CORREDOR}
✉️ {EMAIL_CORREDOR}`,
      variables: [
        "NOMBRE_CLIENTE",
        "TIPO_PROPIEDAD",
        "UBICACION",
        "NUEVAS_PROPIEDADES",
        "LISTA_PROPIEDADES",
        "FECHAS_DISPONIBLES",
        "NOMBRE_CORREDOR",
        "CARGO_CORREDOR",
        "TELEFONO_CORREDOR",
        "EMAIL_CORREDOR",
      ],
    },
    {
      id: "whatsapp-quick",
      name: "WhatsApp - Consulta Rápida",
      type: "whatsapp",
      icon: MessageSquare,
      category: "comunicacion_clientes",
      template: `Hola {NOMBRE_CLIENTE} 👋

Te escribo sobre la propiedad en {UBICACION} que consultaste.

📍 {DIRECCION_PROPIEDAD}
💰 Precio: ${"{PRECIO}"}
📊 {METROS} m²

¿Te gustaría más información o agendar una visita?

Saludos,
{NOMBRE_CORREDOR}`,
      variables: ["NOMBRE_CLIENTE", "UBICACION", "DIRECCION_PROPIEDAD", "PRECIO", "METROS", "NOMBRE_CORREDOR"],
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
          <h4 className="font-semibold text-gray-900">Completar Campos</h4>
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

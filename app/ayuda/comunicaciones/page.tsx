'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Mail, Copy, Zap } from "lucide-react"
import Link from "next/link"

export default function ComunicacionesGuidePage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-4xl space-y-8 px-4">
        {/* Back Button */}
        <Button variant="outline" asChild>
          <Link href="/ayuda">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Centro de Ayuda
          </Link>
        </Button>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-teal-600" />
            <h1 className="text-4xl font-bold text-foreground">Guía: COMUNICACIONES - Mensajes y Email</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Mantén comunicación fluida con tus clientes desde una sola plataforma
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-teal-600" />
                Enviar emails desde la plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 list-decimal list-inside">
                <li>Navega a COMUNICACIONES desde el menú principal</li>
                <li>Haz clic en "+ Nuevo Email"</li>
                <li>Selecciona los clientes destinatarios (puedes elegir múltiples)</li>
                <li>Completa los campos:
                  <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Asunto: Sé claro y conciso</li>
                    <li>Cuerpo del email: Usa el editor de texto enriquecido</li>
                    <li>Adjuntos: Puedes subir hasta 5 archivos</li>
                  </ul>
                </li>
                <li>Haz clic en "Enviar" o "Programar" para una fecha futura</li>
              </ol>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-900">
                  <strong>Consejo:</strong> Usa variables como {'{nombre}'} y {'{ubicacion}'} para personalizar automáticamente cada email
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5 text-teal-600" />
                Plantillas de comunicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Ahorra tiempo usando plantillas predefinidas:</p>
              <ol className="space-y-3 list-decimal list-inside">
                <li>Haz clic en "Plantillas" en la barra lateral</li>
                <li>Selecciona una plantilla existente o crea una nueva</li>
                <li>Para crear nueva:
                  <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Haz clic en "+ Nueva Plantilla"</li>
                    <li>Asigna un nombre descriptivo</li>
                    <li>Completa el contenido</li>
                    <li>Guarda para reutilizar</li>
                  </ul>
                </li>
              </ol>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-900">
                  <strong>Sugerencia:</strong> Crea plantillas para situaciones comunes: primer contacto, seguimiento, propuesta, agradecimiento
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-teal-600" />
                Historial de mensajes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Accede a toda la conversación con cada cliente:</p>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                <li>Haz clic en un cliente para ver su conversación completa</li>
                <li>Todos los emails se organizan cronológicamente</li>
                <li>Puedes buscar por palabra clave dentro de la conversación</li>
                <li>Exporta la conversación como PDF si es necesario</li>
                <li>Marca conversaciones como favoritas para acceso rápido</li>
              </ul>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-900">
                  <strong>Nota:</strong> El historial se sincroniza automáticamente con tu bandeja de email personal
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-teal-600" />
                Automatización de respuestas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Configura respuestas automáticas para ahorrar tiempo:</p>
              <ol className="space-y-3 list-decimal list-inside">
                <li>Ve a Configuración {'>'} Automatización</li>
                <li>Haz clic en "+ Nueva Regla de Automatización"</li>
                <li>Define los criterios de activación:
                  <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Por palabra clave en el asunto</li>
                    <li>Por tipo de cliente (Hot/Warm/Cold)</li>
                    <li>Por región o campo específico</li>
                  </ul>
                </li>
                <li>Selecciona la plantilla de respuesta</li>
                <li>Activa la regla</li>
              </ol>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-900">
                  <strong>Ejemplo:</strong> Crea una respuesta automática para confirmación de recepción de consultas
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        <Button variant="outline" asChild>
          <Link href="/ayuda">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Centro de Ayuda
          </Link>
        </Button>
      </div>
    </div>
  )
}

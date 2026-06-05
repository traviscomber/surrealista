'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Plus, Tag, History } from "lucide-react"
import Link from "next/link"

export default function ClientesGuidePage() {
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
            <Users className="h-8 w-8 text-teal-600" />
            <h1 className="text-4xl font-bold text-foreground">Guía: CLIENTES - Gestión de Contactos</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Organiza y gestiona la información de tus clientes de forma eficiente
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-teal-600" />
                Crear un nuevo cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 list-decimal list-inside">
                <li>Dirígete a la sección CLIENTES en el menú principal</li>
                <li>Haz clic en el botón "+ Nuevo Cliente"</li>
                <li>Completa los campos requeridos:
                  <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Nombre completo o nombre de empresa</li>
                    <li>Correo electrónico y número de teléfono</li>
                    <li>Dirección (opcional)</li>
                    <li>Notas o comentarios adicionales</li>
                  </ul>
                </li>
                <li>Haz clic en "Guardar Cliente"</li>
              </ol>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-900">
                  <strong>Consejo:</strong> Puedes importar múltiples clientes desde un archivo CSV en lugar de ingresarlos uno a uno
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-teal-600" />
                Asignar ubicaciones de interés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Vincula tus campos con los clientes interesados en ellos:</p>
              <ol className="space-y-3 list-decimal list-inside">
                <li>Abre el perfil del cliente</li>
                <li>Desplázate hasta la sección "Ubicaciones de Interés"</li>
                <li>Haz clic en "+ Agregar Ubicación"</li>
                <li>Selecciona los campos o regiones que le interesan</li>
                <li>Haz clic en "Confirmar"</li>
              </ol>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-900">
                  <strong>Nota:</strong> Los clientes verán tus campos en el mapa cuando accedan a sus ubicaciones de interés
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-teal-600" />
                Clasificación por estado (Hot/Warm/Cold)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Clasifica tus clientes según su nivel de interés:</p>
              <ul className="space-y-3">
                <li>
                  <strong className="text-red-600">🔴 Hot (Caliente):</strong>
                  <p className="text-sm text-muted-foreground ml-4">Cliente muy interesado, seguimiento frecuente, posible cierre próximo</p>
                </li>
                <li>
                  <strong className="text-yellow-600">🟡 Warm (Tibio):</strong>
                  <p className="text-sm text-muted-foreground ml-4">Cliente moderadamente interesado, seguimiento regular recomendado</p>
                </li>
                <li>
                  <strong className="text-blue-600">🔵 Cold (Frío):</strong>
                  <p className="text-sm text-muted-foreground ml-4">Cliente con interés bajo o contacto inactivo, revisar periódicamente</p>
                </li>
              </ul>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-900">
                  <strong>Sugerencia:</strong> Usa los filtros para ver todos tus clientes Hot juntos y priorizar tu tiempo de seguimiento
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-teal-600" />
                Historial de contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Mantén un registro completo de todas tus interacciones:</p>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                <li>Cada email enviado se registra automáticamente</li>
                <li>Puedes añadir notas manuales de llamadas o reuniones</li>
                <li>El historial muestra fechas y detalles de cada contacto</li>
                <li>Exporta el historial para análisis o reportes</li>
              </ul>
              <ol className="mt-4 space-y-2 list-decimal list-inside text-muted-foreground">
                <li>Abre el perfil del cliente</li>
                <li>Desplázate hasta "Historial de Contacto"</li>
                <li>Haz clic en "+ Agregar Nota" para registrar una interacción manual</li>
                <li>Completa los detalles (fecha, tipo de contacto, notas)</li>
                <li>Haz clic en "Guardar"</li>
              </ol>
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

'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckSquare, Plus, Zap, Clock } from "lucide-react"
import Link from "next/link"

export default function TareasGuidePage() {
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
            <CheckSquare className="h-8 w-8 text-teal-600" />
            <h1 className="text-4xl font-bold text-foreground">Guía: TAREAS - Organización de Trabajo</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Gestiona tus tareas, deadlines y seguimiento de progreso en un solo lugar
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-teal-600" />
                Crear una nueva tarea
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 list-decimal list-inside">
                <li>Navega a TAREAS desde el menú principal</li>
                <li>Haz clic en "+ Nueva Tarea"</li>
                <li>Completa la información:
                  <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Título: Descripción clara de la tarea</li>
                    <li>Descripción: Detalles adicionales</li>
                    <li>Fecha de vencimiento: Deadline de entrega</li>
                    <li>Etiquetas: Para categorizar (proyecto, tipo, etc.)</li>
                    <li>Relacionada con: Cliente, campo u otra tarea</li>
                  </ul>
                </li>
                <li>Haz clic en "Crear Tarea"</li>
              </ol>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-900">
                  <strong>Consejo:</strong> Las tareas pueden estar vinculadas a clientes específicos para contexto rápido
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-teal-600" />
                Asignar prioridades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Cada tarea puede tener un nivel de prioridad:</p>
              <ul className="space-y-3">
                <li>
                  <strong className="text-red-600">🔴 Urgente:</strong>
                  <p className="text-sm text-muted-foreground ml-4">Debe completarse hoy o mañana</p>
                </li>
                <li>
                  <strong className="text-yellow-600">🟡 Alta:</strong>
                  <p className="text-sm text-muted-foreground ml-4">Esta semana, importante para el negocio</p>
                </li>
                <li>
                  <strong className="text-blue-600">🔵 Media:</strong>
                  <p className="text-sm text-muted-foreground ml-4">En los próximos días, importante</p>
                </li>
                <li>
                  <strong className="text-green-600">🟢 Baja:</strong>
                  <p className="text-sm text-muted-foreground ml-4">Puede esperar, opcional</p>
                </li>
              </ul>
              <ol className="mt-4 space-y-2 list-decimal list-inside text-muted-foreground">
                <li>Abre la tarea</li>
                <li>Haz clic en el selector de prioridad</li>
                <li>Selecciona el nivel deseado</li>
                <li>Los cambios se guardan automáticamente</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-teal-600" />
                Seguimiento de progreso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Monitorea el avance de tus tareas:</p>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                <li>Marca tareas como completadas haciendo clic en el checkbox</li>
                <li>Actualiza el porcentaje de progreso (0-100%)</li>
                <li>Añade comentarios para notas del progreso</li>
                <li>Adjunta archivos relacionados con la tarea</li>
                <li>Ve un historial de todos los cambios</li>
              </ul>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-900">
                  <strong>Vista de tablero:</strong> Usa la vista Kanban para ver tareas por estado (Pendiente, En Progreso, Completada)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-teal-600" />
                Recordatorios automáticos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Configura notificaciones para no perder ninguna tarea:</p>
              <ol className="space-y-3 list-decimal list-inside">
                <li>Abre una tarea</li>
                <li>Haz clic en "Recordatorios"</li>
                <li>Selecciona cuándo recibir recordatorios:
                  <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                    <li>El día del deadline</li>
                    <li>1 día antes</li>
                    <li>3 días antes</li>
                    <li>1 semana antes</li>
                    <li>Personalizado</li>
                  </ul>
                </li>
                <li>Elige cómo recibir recordatorios (email, notificación, SMS)</li>
              </ol>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-900">
                  <strong>Consejo:</strong> Configura recordatorios 3 días antes para tareas críticas, eso te da tiempo de reacción
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tips Section */}
          <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardHeader>
              <CardTitle>Tips de Productividad</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc list-inside text-teal-900">
                <li>Revisa tu lista de tareas cada mañana para planificar el día</li>
                <li>Agrupa tareas relacionadas con el mismo cliente o proyecto</li>
                <li>Usa la vista de calendario para visualizar deadlines</li>
                <li>Completa tareas pequeñas primero para generar momentum</li>
                <li>Divide proyectos grandes en subtareas más manejables</li>
              </ul>
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

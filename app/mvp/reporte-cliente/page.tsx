"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Download,
  FileText,
  Target,
  Zap,
  Users,
  BarChart3,
  AlertCircle,
} from "lucide-react"

export default function ReporteClientePage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            Reporte Semanal para Cliente
          </h1>
          <p className="text-gray-600 mt-2">Semana 7 de 12 - Actualizado: 8 de Febrero, 2025</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-green-500 text-white px-4 py-2 text-lg">85% Completado</Badge>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Resumen Ejecutivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg">
            El proyecto Sur-Realista MVP avanza según lo planificado con un <strong>85% de completación general</strong>
            . La Etapa 1 (Ordenamiento del Repositorio) está <strong>100% completada</strong> y la Etapa 2
            (Estandarización de Material) alcanza un <strong>80% de avance</strong> en la semana 7.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-green-100 rounded-lg border-2 border-green-300">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">Etapa 1</div>
              <div className="text-sm text-green-600">100% Completada</div>
            </div>
            <div className="text-center p-4 bg-blue-100 rounded-lg border-2 border-blue-300">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">Etapa 2</div>
              <div className="text-sm text-blue-600">80% En Progreso</div>
            </div>
            <div className="text-center p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
              <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-700">Etapa 3</div>
              <div className="text-sm text-gray-600">Pendiente</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Logros de Esta Semana
          </CardTitle>
          <CardDescription>Funcionalidades implementadas y mejoras realizadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Explorador de Archivos de Google Drive</h4>
                <p className="text-sm text-green-700 mt-1">
                  Visualización completa de archivos indexados, navegación en tiempo real y búsqueda avanzada
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Sistema de Búsqueda Inteligente Mejorado</h4>
                <p className="text-sm text-green-700 mt-1">
                  Scoring de relevancia, filtros avanzados y sugerencias en tiempo real
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Automatización de Flujos de Trabajo</h4>
                <p className="text-sm text-green-700 mt-1">
                  Clasificación automática, etiquetado inteligente y procesamiento en lotes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Sistema de Monitoreo y Métricas</h4>
                <p className="text-sm text-green-700 mt-1">
                  Dashboard en tiempo real, seguimiento de rendimiento y alertas automáticas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Development Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Métricas de Desarrollo
          </CardTitle>
          <CardDescription>Indicadores técnicos y de calidad del proyecto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">15,420</div>
              <p className="text-sm text-blue-700">Líneas de Código</p>
              <p className="text-xs text-green-600 mt-1">+1,100 esta semana</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">72%</div>
              <p className="text-sm text-green-700">Cobertura Tests</p>
              <p className="text-xs text-green-600 mt-1">+12.4%</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">81</div>
              <p className="text-sm text-purple-700">Performance Score</p>
              <p className="text-xs text-green-600 mt-1">+7 puntos</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">99.2%</div>
              <p className="text-sm text-orange-700">Uptime</p>
              <p className="text-xs text-gray-600 mt-1">Estable</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            Cronograma Actualizado
          </CardTitle>
          <CardDescription>Fechas clave y próximos hitos del proyecto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div className="w-0.5 h-full bg-green-200 mt-2"></div>
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">Etapa 1: Ordenamiento del Repositorio</h4>
                  <Badge className="bg-green-100 text-green-800">Completada</Badge>
                </div>
                <p className="text-sm text-gray-600">5 Ago - 13 Sep 2025</p>
                <Progress value={100} className="mt-2 h-2" />
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <div className="w-0.5 h-full bg-blue-200 mt-2"></div>
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">Etapa 2: Estandarización de Material</h4>
                  <Badge className="bg-blue-100 text-blue-800">En Progreso - Semana 7</Badge>
                </div>
                <p className="text-sm text-gray-600">16 Sep - 11 Oct 2025</p>
                <Progress value={80} className="mt-2 h-2" />
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">Etapa 3: Vinculación con Compradores</h4>
                  <Badge className="bg-gray-100 text-gray-800">Pendiente</Badge>
                </div>
                <p className="text-sm text-gray-600">14 Oct - 8 Nov 2025</p>
                <Progress value={0} className="mt-2 h-2" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-purple-800">Entrega Final</h4>
            </div>
            <p className="text-sm text-purple-700">15 de Noviembre, 2025 - Sistema MVP completo en producción</p>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            Próximos Pasos (Semana 8)
          </CardTitle>
          <CardDescription>Prioridades inmediatas para la próxima semana</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">Completar Funcionalidades Pendientes de Etapa 2</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Finalizar búsqueda inteligente, automatización de flujos y sistema de monitoreo
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">Pruebas y Validación</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Pruebas de integración exhaustivas, validación de rendimiento y pruebas de usuario
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">Documentación</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Manual de usuario completo, documentación técnica y guías de capacitación
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <h4 className="font-medium">Preparación Etapa 3</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Diseño de arquitectura de vinculación, planificación de integraciones y definición de requisitos CRM
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-2 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Recomendaciones
          </CardTitle>
          <CardDescription>Sugerencias para maximizar el éxito del proyecto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5"></div>
              <p>
                <strong>Capacitación Temprana:</strong> Iniciar capacitación de usuarios clave en Semana 8 para preparar
                equipo para Etapa 3
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5"></div>
              <p>
                <strong>Feedback Continuo:</strong> Mantener sesiones de revisión semanales y ajustes basados en uso
                real
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5"></div>
              <p>
                <strong>Integración CRM:</strong> Definir CRM a integrar en Etapa 3 y preparar credenciales y accesos
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5"></div>
              <p>
                <strong>Datos de Prueba:</strong> Proporcionar datos reales para testing y validar casos de uso
                específicos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Contacto y Soporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-1">Email</p>
              <p className="text-gray-600">desarrollo@sur-realista.cl</p>
            </div>
            <div>
              <p className="font-medium mb-1">Reuniones</p>
              <p className="text-gray-600">Martes y Jueves 10:00 AM</p>
            </div>
            <div>
              <p className="font-medium mb-1">Dashboard de Seguimiento</p>
              <a href="/mvp/seguimiento" className="text-blue-600 hover:underline">
                Ver Seguimiento MVP
              </a>
            </div>
            <div>
              <p className="font-medium mb-1">Actualizaciones</p>
              <a href="/mvp/updates" className="text-blue-600 hover:underline">
                Ver Updates & Releases
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

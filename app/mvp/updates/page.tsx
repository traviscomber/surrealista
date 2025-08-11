"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitBranch, Tag, Calendar, User, CheckCircle, AlertCircle, Info, Zap, Bug, Plus, Rocket, Brain, Database, Shield, TrendingUp, Clock, Download, ExternalLink } from 'lucide-react'

interface Release {
  version: string
  date: string
  type: "major" | "minor" | "patch" | "hotfix"
  status: "released" | "beta" | "alpha" | "planned"
  title: string
  description: string
  author: string
  features: {
    id: string
    title: string
    description: string
    type: "feature" | "improvement" | "bugfix" | "security"
    impact: "high" | "medium" | "low"
  }[]
  breaking?: boolean
  migration?: string
}

const releases: Release[] = [
  {
    version: "1.2.0",
    date: "2024-02-08",
    type: "minor",
    status: "released",
    title: "Consultas IA Complejas y Mejoras UX",
    description: "Nueva capacidad de análisis complejo con IA y mejoras significativas en la experiencia de usuario",
    author: "Equipo Desarrollo",
    features: [
      {
        id: "1",
        title: "Consultas IA Complejas",
        description: "Asistente puede manejar análisis de inversión, proyecciones de mercado y consultas multi-variable",
        type: "feature",
        impact: "high",
      },
      {
        id: "2",
        title: "Interface Chat Mejorada",
        description: "Chat expandido con sidebar informativo y ejemplos de consultas complejas",
        type: "improvement",
        impact: "medium",
      },
      {
        id: "3",
        title: "Badges de Análisis",
        description: "Identificación visual de consultas complejas con indicadores de confianza",
        type: "feature",
        impact: "low",
      },
      {
        id: "4",
        title: "Optimización Rendimiento",
        description: "Mejoras en tiempo de respuesta para consultas complejas (3s promedio)",
        type: "improvement",
        impact: "medium",
      },
    ],
  },
  {
    version: "1.1.5",
    date: "2024-02-01",
    type: "patch",
    status: "released",
    title: "Correcciones y Estabilidad",
    description: "Corrección de bugs críticos y mejoras de estabilidad en el sistema",
    author: "Equipo QA",
    features: [
      {
        id: "1",
        title: "Fix Importación Propiedades",
        description: "Corregido error en importación masiva de propiedades desde Google Sheets",
        type: "bugfix",
        impact: "high",
      },
      {
        id: "2",
        title: "Optimización Base de Datos",
        description: "Mejoras en consultas SQL para mejor rendimiento",
        type: "improvement",
        impact: "medium",
      },
      {
        id: "3",
        title: "Validación Formularios",
        description: "Mejorada validación de campos en formularios de propiedades",
        type: "improvement",
        impact: "low",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2024-01-25",
    type: "minor",
    status: "released",
    title: "Integraciones CIREN y SII",
    description: "Nuevas integraciones con fuentes oficiales de datos y dashboard CIREN",
    author: "Equipo Integraciones",
    features: [
      {
        id: "1",
        title: "Dashboard CIREN",
        description: "Panel completo para análisis de riesgos empresariales con IA",
        type: "feature",
        impact: "high",
      },
      {
        id: "2",
        title: "API SII Chile",
        description: "Integración con Servicio de Impuestos Internos para datos fiscales",
        type: "feature",
        impact: "high",
      },
      {
        id: "3",
        title: "Análisis Integral",
        description: "Herramienta de análisis combinando múltiples fuentes de datos",
        type: "feature",
        impact: "medium",
      },
      {
        id: "4",
        title: "Conexiones en Tiempo Real",
        description: "Monitoreo de estado de conexiones con APIs externas",
        type: "improvement",
        impact: "medium",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2024-01-15",
    type: "major",
    status: "released",
    title: "Lanzamiento MVP - Fase 1",
    description: "Primera versión estable del MVP con funcionalidades core completas",
    author: "Equipo Completo",
    features: [
      {
        id: "1",
        title: "Sistema de Propiedades",
        description: "CRUD completo para gestión de propiedades inmobiliarias",
        type: "feature",
        impact: "high",
      },
      {
        id: "2",
        title: "Organizador de Datos",
        description: "Importación y estandarización desde Google Drive",
        type: "feature",
        impact: "high",
      },
      {
        id: "3",
        title: "Asistente IA Básico",
        description: "Chat inteligente para consultas sobre propiedades",
        type: "feature",
        impact: "high",
      },
      {
        id: "4",
        title: "Panel de Administración",
        description: "Interface completa para gestión del sistema",
        type: "feature",
        impact: "medium",
      },
    ],
  },
  {
    version: "1.3.0",
    date: "2024-02-20",
    type: "minor",
    status: "beta",
    title: "Análisis Predictivo y Machine Learning",
    description: "Nuevos modelos de ML para predicción de precios y análisis de tendencias",
    author: "Equipo IA",
    features: [
      {
        id: "1",
        title: "Predicción de Precios",
        description: "Modelo ML para estimar valores futuros de propiedades",
        type: "feature",
        impact: "high",
      },
      {
        id: "2",
        title: "Análisis de Tendencias",
        description: "Identificación automática de patrones en el mercado",
        type: "feature",
        impact: "medium",
      },
      {
        id: "3",
        title: "Recomendaciones Personalizadas",
        description: "Sistema de recomendaciones basado en perfil del usuario",
        type: "feature",
        impact: "medium",
      },
    ],
  },
  {
    version: "2.0.0",
    date: "2024-03-15",
    type: "major",
    status: "planned",
    title: "Plataforma Multi-tenant y API Pública",
    description: "Evolución hacia plataforma multi-tenant con API pública para terceros",
    author: "Equipo Arquitectura",
    breaking: true,
    migration: "Se requiere migración de base de datos y actualización de configuraciones",
    features: [
      {
        id: "1",
        title: "Arquitectura Multi-tenant",
        description: "Soporte para múltiples organizaciones en una sola instancia",
        type: "feature",
        impact: "high",
      },
      {
        id: "2",
        title: "API Pública v1",
        description: "API REST completa para integraciones externas",
        type: "feature",
        impact: "high",
      },
      {
        id: "3",
        title: "Sistema de Permisos Avanzado",
        description: "Control granular de acceso por roles y recursos",
        type: "feature",
        impact: "medium",
      },
    ],
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "released":
      return "bg-green-100 text-green-800"
    case "beta":
      return "bg-blue-100 text-blue-800"
    case "alpha":
      return "bg-purple-100 text-purple-800"
    case "planned":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "major":
      return "bg-red-100 text-red-800"
    case "minor":
      return "bg-blue-100 text-blue-800"
    case "patch":
      return "bg-green-100 text-green-800"
    case "hotfix":
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getFeatureIcon = (type: string) => {
  switch (type) {
    case "feature":
      return <Plus className="h-4 w-4 text-green-500" />
    case "improvement":
      return <TrendingUp className="h-4 w-4 text-blue-500" />
    case "bugfix":
      return <Bug className="h-4 w-4 text-red-500" />
    case "security":
      return <Shield className="h-4 w-4 text-purple-500" />
    default:
      return <Info className="h-4 w-4 text-gray-500" />
  }
}

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "high":
      return "bg-red-100 text-red-800"
    case "medium":
      return "bg-yellow-100 text-yellow-800"
    case "low":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function MVPUpdatesPage() {
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null)

  const releasedVersions = releases.filter(r => r.status === "released")
  const betaVersions = releases.filter(r => r.status === "beta" || r.status === "alpha")
  const plannedVersions = releases.filter(r => r.status === "planned")

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <GitBranch className="h-8 w-8 text-blue-600" />
            Updates & Releases
          </h1>
          <p className="text-gray-600 mt-2">
            Historial completo de actualizaciones y nuevas funcionalidades
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-green-500 text-white px-4 py-2 text-lg">
            v{releases.find(r => r.status === "released")?.version || "1.2.0"}
          </Badge>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Descargar Release
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Versión Actual</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">v1.2.0</div>
            <p className="text-xs text-muted-foreground">
              Lanzada hace 3 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Releases</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{releasedVersions.length}</div>
            <p className="text-xs text-muted-foreground">
              versiones estables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Beta</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{betaVersions.length}</div>
            <p className="text-xs text-muted-foreground">
              versiones de prueba
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planificadas</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{plannedVersions.length}</div>
            <p className="text-xs text-muted-foreground">
              próximas versiones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Releases Timeline */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas las Versiones</TabsTrigger>
          <TabsTrigger value="released">Estables</TabsTrigger>
          <TabsTrigger value="beta">Beta/Alpha</TabsTrigger>
          <TabsTrigger value="planned">Planificadas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="space-y-6">
            {releases.map((release) => (
              <Card key={release.version} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full ${
                          release.status === "released" ? "bg-green-500" :
                          release.status === "beta" ? "bg-blue-500" :
                          release.status === "alpha" ? "bg-purple-500" :
                          "bg-gray-300"
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">v{release.version}</CardTitle>
                          <Badge className={getStatusColor(release.status)}>
                            {release.status}
                          </Badge>
                          <Badge className={getTypeColor(release.type)}>
                            {release.type}
                          </Badge>
                          {release.breaking && (
                            <Badge className="bg-red-100 text-red-800">
                              Breaking Changes
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg text-gray-900 mb-1">
                          {release.title}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {release.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-4 w-4" />
                        {release.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {release.author}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {release.breaking && release.migration && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-800">Cambios Importantes</h4>
                          <p className="text-sm text-red-700 mt-1">{release.migration}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Nuevas Funcionalidades:</h4>
                    <div className="grid gap-3">
                      {release.features.map((feature) => (
                        <div key={feature.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          {getFeatureIcon(feature.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-gray-900">{feature.title}</h5>
                              <Badge className={getImpactColor(feature.impact)} variant="outline">
                                {feature.impact} impact
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Ver Changelog Completo
                    </Button>
                    {release.status === "released" && (
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Descargar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="released" className="space-y-6">
          <div className="space-y-6">
            {releasedVersions.map((release) => (
              <Card key={release.version} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">v{release.version}</CardTitle>
                        <Badge className="bg-green-100 text-green-800">Estable</Badge>
                        <Badge className={getTypeColor(release.type)}>
                          {release.type}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg text-gray-900 mb-1">
                        {release.title}
                      </CardTitle>
                      <CardDescription>{release.description}</CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {release.date}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {release.features.map((feature) => (
                      <div key={feature.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                        {getFeatureIcon(feature.type)}
                        <div>
                          <h5 className="font-medium text-sm">{feature.title}</h5>
                          <p className="text-xs text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="beta" className="space-y-6">
          <div className="space-y-6">
            {betaVersions.map((release) => (
              <Card key={release.version} className="overflow-hidden border-blue-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">v{release.version}</CardTitle>
                        <Badge className={getStatusColor(release.status)}>
                          {release.status}
                        </Badge>
                        <Badge className={getTypeColor(release.type)}>
                          {release.type}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg text-gray-900 mb-1">
                        {release.title}
                      </CardTitle>
                      <CardDescription>{release.description}</CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {release.date}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">Versión en Pruebas</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Esta versión está disponible para testing. Puede contener bugs o funcionalidades incompletas.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {release.features.map((feature) => (
                      <div key={feature.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                        {getFeatureIcon(feature.type)}
                        <div>
                          <h5 className="font-medium text-sm">{feature.title}</h5>
                          <p className="text-xs text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="planned" className="space-y-6">
          <div className="space-y-6">
            {plannedVersions.map((release) => (
              <Card key={release.version} className="overflow-hidden border-gray-200 bg-gray-50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl text-gray-700">v{release.version}</CardTitle>
                        <Badge className="bg-gray-100 text-gray-800">Planificada</Badge>
                        <Badge className={getTypeColor(release.type)}>
                          {release.type}
                        </Badge>
                        {release.breaking && (
                          <Badge className="bg-red-100 text-red-800">
                            Breaking Changes
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg text-gray-800 mb-1">
                        {release.title}
                      </CardTitle>
                      <CardDescription>{release.description}</CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {release.date}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {release.breaking && release.migration && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800">Cambios Importantes Planificados</h4>
                          <p className="text-sm text-yellow-700 mt-1">{release.migration}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {release.features.map((feature) => (
                      <div key={feature.id} className="flex items-start gap-2 p-2 bg-white rounded border">
                        {getFeatureIcon(feature.type)}
                        <div>
                          <h5 className="font-medium text-sm">{feature.title}</h5>
                          <p className="text-xs text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

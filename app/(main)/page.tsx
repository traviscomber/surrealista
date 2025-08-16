"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Home, BarChart3, Users, Calendar, CheckCircle } from "lucide-react"

import HeroSection from "@/components/home/hero-section"
import AnimatedFeaturedProperties from "@/components/home/animated-featured-properties"
import FeaturesSection from "@/components/home/features-section"
import AIAssistantSection from "@/components/home/ai-assistant-section"
import TestimonialsSection from "@/components/home/testimonials-section"

import GoogleDriveIntegration from "@/components/mvp/google-drive-integration"

const mockProperties = [
  {
    id: "1",
    title: "Casa Moderna en Valdivia",
    description: "Hermosa casa con vista al río",
    price: 180000000,
    location: "Centro Valdivia",
    city: "Valdivia",
    region: "Los Ríos",
    bedrooms: 3,
    bathrooms: 2,
    square_meters: 120,
    property_type: "casa",
    status: "active",
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Departamento Puerto Montt",
    description: "Moderno departamento con vista al mar",
    price: 95000000,
    location: "Puerto Montt Centro",
    city: "Puerto Montt",
    region: "Los Lagos",
    bedrooms: 2,
    bathrooms: 1,
    square_meters: 75,
    property_type: "departamento",
    status: "active",
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Parcela en Osorno",
    description: "Amplia parcela con casa patronal",
    price: 250000000,
    location: "Osorno Rural",
    city: "Osorno",
    region: "Los Lagos",
    bedrooms: 4,
    bathrooms: 3,
    square_meters: 200,
    property_type: "parcela",
    status: "active",
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function MVPDashboard() {
  const currentDate = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header MVP */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                MVP Sur-Realista
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Etapa 1 - Activa
                </Badge>
              </h1>
              <p className="text-gray-600 mt-1">{currentDate}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Progreso General</div>
                <div className="text-2xl font-bold text-blue-600">11%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Casos de Éxito</p>
                <p className="text-3xl font-bold text-green-600">5</p>
                <p className="text-xs text-gray-500 mt-1">Identificados en Drive</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Google Drive</p>
                <p className="text-3xl font-bold text-blue-600">Lista</p>
                <p className="text-xs text-gray-500 mt-1">Para configurar</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documentos</p>
                <p className="text-3xl font-bold text-orange-600">~45</p>
                <p className="text-xs text-gray-500 mt-1">Por procesar</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Próximo Hito</p>
                <p className="text-3xl font-bold text-purple-600">25 Ago</p>
                <p className="text-xs text-gray-500 mt-1">Configurar API</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Integración Google Drive */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <GoogleDriveIntegration />
        </div>
      </div>
    </div>
  )
}

function WebsiteContent() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Propiedades Destacadas</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubre las mejores propiedades en ubicaciones exclusivas del sur de Chile
            </p>
          </div>
          <AnimatedFeaturedProperties properties={mockProperties} />
        </div>
      </section>
      <FeaturesSection />
      <AIAssistantSection />
      <TestimonialsSection />
    </main>
  )
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("mvp")

  return (
    <div className="min-h-screen">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="container mx-auto px-4">
            <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
              <TabsTrigger value="mvp" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                MVP Dashboard
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
                  11%
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="website" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Sitio Web
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="mvp" className="mt-0">
          <MVPDashboard />
        </TabsContent>

        <TabsContent value="website" className="mt-0">
          <WebsiteContent />
        </TabsContent>
      </Tabs>
    </div>
  )
}

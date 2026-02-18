'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, MapPin, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function KMZHome() {
  const features = [
    {
      title: 'Búsqueda Simple',
      description: 'Busca ubicaciones por palabra clave',
      icon: Search,
      href: '/kmz-search',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Búsqueda Avanzada',
      description: 'Busca con filtros por región, categoría y fecha',
      icon: BarChart3,
      href: '/kmz-search-advanced',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Mapa Interactivo',
      description: 'Visualiza todas las ubicaciones en un mapa',
      icon: MapPin,
      href: '/kmz-map',
      color: 'from-green-500 to-green-600',
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Sistema de Búsqueda KMZ</h1>
          <p className="text-xl text-blue-100">
            Busca, visualiza y gestiona tus archivos KMZ con múltiples opciones de búsqueda
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Link key={feature.href} href={feature.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className={`bg-gradient-to-br ${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{feature.description}</p>
                    <Button className="mt-4 w-full" variant="outline">
                      Ir a {feature.title}
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Info Section */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>¿Cómo funciona?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700">
            <p>
              El sistema está diseñado para ayudarte a encontrar ubicaciones dentro de tus archivos KMZ de manera rápida y eficiente.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong>Búsqueda Simple:</strong> Ideal para búsquedas rápidas por nombre o término</li>
              <li><strong>Búsqueda Avanzada:</strong> Usa filtros específicos para resultados más precisos</li>
              <li><strong>Mapa Interactivo:</strong> Visualiza las ubicaciones geográficamente y obtén más contexto</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">
              Todas las ubicaciones se indexan automáticamente cuando cargas archivos KMZ, por lo que están disponibles para buscar inmediatamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

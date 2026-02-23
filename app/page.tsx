"use client"

import Link from "next/link"
import { MapPin, Database, Search, Settings, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-200/50 backdrop-blur-sm sticky top-0 z-50 bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Surrealista
              </h1>
            </div>
            <Link href="/busqueda">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-4 text-balance">
            Gestión Integral de KMZ
          </h2>
          <p className="text-xl text-slate-600 mb-8 text-balance max-w-3xl mx-auto">
            Busca, indexa y gestiona tus archivos KMZ con coordenadas precisas de las regiones de Chile
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* KMZ Search Card */}
          <Link href="/kmz-search">
            <div className="h-full group cursor-pointer">
              <div className="relative bg-white rounded-2xl border border-slate-200 p-8 hover:border-emerald-400 transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Search className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Búsqueda de Ubicaciones
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Busca y explora ubicaciones indexadas de 338 archivos KMZ. Soporta búsqueda sin acentos en todas las regiones de Chile.
                  </p>
                  
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold group-hover:gap-4 transition-all">
                    Acceder
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Admin KMZ Collection Card */}
          <Link href="/admin/kmz-collection">
            <div className="h-full group cursor-pointer">
              <div className="relative bg-white rounded-2xl border border-slate-200 p-8 hover:border-blue-400 transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Database className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Administración de Colección
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Gestiona y visualiza la colección de 338 archivos KMZ. Carga, indexa y administra las ubicaciones de todos tus archivos.
                  </p>
                  
                  <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-4 transition-all">
                    Administrar
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="font-semibold text-slate-900 mb-2">338 KMZ Indexados</h4>
            <p className="text-sm text-slate-600">Todas las ubicaciones extraídas y listas para buscar con coordenadas precisas</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-slate-900 mb-2">Búsqueda Inteligente</h4>
            <p className="text-sm text-slate-600">Busca por regiones, ciudades y ubicaciones. Funciona con o sin acentos</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-slate-600" />
            </div>
            <h4 className="font-semibold text-slate-900 mb-2">Admin Panel</h4>
            <p className="text-sm text-slate-600">Herramientas de administración para gestionar y actualizar tu colección KMZ</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 mb-6">
            ¿Listo para explorar tus archivos KMZ?
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/kmz-search">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                Buscar Ubicaciones
              </Button>
            </Link>
            <Link href="/admin/kmz-collection">
              <Button size="lg" variant="outline">
                Panel de Administración
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-slate-600 text-sm">
            Surrealista © 2026 - Gestión Integral de Información Geoespacial
          </p>
        </div>
      </footer>
    </div>
  )
}

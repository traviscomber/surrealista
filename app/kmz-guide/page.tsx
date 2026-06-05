import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MapPin, Search, Database, Zap, FileText, Map } from "lucide-react"

export default function KMZGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <MapPin className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-3">Sistema de Búsqueda de KMZ</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Busca ubicaciones en más de 180 archivos KMZ y encuentra exactamente lo que necesitas
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="bg-white/80 backdrop-blur border-blue-100">
            <CardContent className="pt-6 text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-3xl font-bold text-slate-900">180+</p>
              <p className="text-sm text-slate-600">Archivos KMZ</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur border-green-100">
            <CardContent className="pt-6 text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-3xl font-bold text-slate-900">Automático</p>
              <p className="text-sm text-slate-600">Indexación cada hora</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur border-purple-100">
            <CardContent className="pt-6 text-center">
              <Search className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-3xl font-bold text-slate-900">Rápido</p>
              <p className="text-sm text-slate-600">Resultados instantáneos</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Search Card */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Buscar Ubicaciones</CardTitle>
                  <CardDescription>Encuentra ubicaciones en tus KMZ</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="font-bold text-blue-600 mt-0.5">1.</span>
                  <span>Ingresa el nombre de la ubicación que buscas</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-blue-600 mt-0.5">2.</span>
                  <span>Selecciona si buscas por Ubicación, Región o Archivo</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-blue-600 mt-0.5">3.</span>
                  <span>Haz clic en Buscar y obtén resultados instantáneos</span>
                </li>
              </ul>
              <Link href="/kmz-search" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  Ir a Búsqueda de KMZ
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Examples Card */}
          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Ejemplos de Búsqueda</CardTitle>
                  <CardDescription>Qué puedes buscar</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-white/50 p-3 rounded border border-indigo-200">
                <p className="font-semibold text-slate-900 text-sm">Por Ubicación:</p>
                <p className="text-slate-600 text-xs">Centro, Parque, Mercado, Calle Principal</p>
              </div>
              <div className="bg-white/50 p-3 rounded border border-indigo-200">
                <p className="font-semibold text-slate-900 text-sm">Por Región:</p>
                <p className="text-slate-600 text-xs">Metropolitana, Valparaíso, Antofagasta</p>
              </div>
              <div className="bg-white/50 p-3 rounded border border-indigo-200">
                <p className="font-semibold text-slate-900 text-sm">Por Archivo:</p>
                <p className="text-slate-600 text-xs">nombre_del_kmz.kmz</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <Card className="border-2 border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-slate-600 p-2 rounded-lg">
                <Map className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Gestión de Archivos</CardTitle>
                <CardDescription>Administra tu colección de KMZ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/kmz-collection" className="block">
                <Button variant="outline" className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  Ver Colección KMZ
                </Button>
              </Link>
              <Link href="/admin/kmz" className="block">
                <Button variant="outline" className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Estado Indexación
                </Button>
              </Link>
              <Link href="/busqueda" className="block">
                <Button variant="outline" className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Búsqueda Unificada
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-slate-700">
            <span className="font-semibold text-slate-900">💡 Tip:</span> El sistema indexa automáticamente todos los KMZ cada hora. 
            Los nuevos archivos se indexan inmediatamente después de cargarlos. Si no encuentras resultados, 
            espera a que se complete la indexación o visita el panel de administración.
          </p>
        </div>
      </div>
    </div>
  )
}

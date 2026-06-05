'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, MapPin, Zap, Database } from "lucide-react"

export default function KMZAutoIndexingInfo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-slate-900">Indexación Automática de KMZ</h1>
          <p className="text-xl text-slate-600">
            Todas tus ubicaciones se indexan automáticamente. Sin botones. Sin esperas.
          </p>
        </div>

        <div className="grid gap-6">
          {/* How it Works */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-blue-600" />
                Cómo funciona
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-sm font-bold text-blue-600">1</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Cargas un KMZ</h3>
                    <p className="text-slate-600">Subes un archivo KMZ en cualquier lugar del sistema</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <span className="text-sm font-bold text-green-600">2</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Se guarda automáticamente</h3>
                    <p className="text-slate-600">El archivo se almacena en la colección con sus ubicaciones</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                      <span className="text-sm font-bold text-purple-600">3</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Se indexa automáticamente</h3>
                    <p className="text-slate-600">Las ubicaciones se guardan en el índice de búsqueda inmediatamente</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                      <span className="text-sm font-bold text-indigo-600">4</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Listo para buscar</h3>
                    <p className="text-slate-600">Todas las ubicaciones están disponibles en la búsqueda</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What Gets Indexed */}
          <Card className="border-2 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-3">
                <Database className="h-6 w-6 text-green-600" />
                Qué se indexa automáticamente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Colección KMZ Principal</h4>
                    <p className="text-slate-600 text-sm">Archivos subidos en /admin/kmz-collection</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Documentos KMZ</h4>
                    <p className="text-slate-600 text-sm">Archivos en comunicaciones y documentación</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Ubicaciones de Google Drive</h4>
                    <p className="text-slate-600 text-sm">Archivos escaneados desde Google Drive</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <Card className="border-2 border-purple-200">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-purple-600" />
                Cómo buscar
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ol className="space-y-3 list-decimal list-inside text-slate-700">
                <li>Ve a <strong>/kmz-search</strong></li>
                <li>Ingresa un término (nombre de ubicación, región, o archivo)</li>
                <li>Haz clic en Buscar</li>
                <li>Obtén todos los resultados de todas las fuentes</li>
              </ol>
              <p className="mt-4 p-3 bg-purple-50 rounded text-sm text-slate-700">
                <strong>Nota:</strong> La búsqueda es automática y en tiempo real. No necesitas indexar manualmente.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Todo es automático</h2>
          <p className="text-slate-700">
            Simplemente carga tus KMZ y empieza a buscar. No hay nada más que hacer.
          </p>
        </div>
      </div>
    </div>
  )
}

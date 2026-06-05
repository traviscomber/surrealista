'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Filter, Download, Layers } from "lucide-react"
import Link from "next/link"

export default function CamposGuidePage() {
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
            <MapPin className="h-8 w-8 text-teal-600" />
            <h1 className="text-4xl font-bold text-foreground">Guía: CAMPOS - Exploración de Datos Geográficos</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Aprende a gestionar, buscar y visualizar tus campos y ubicaciones
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-teal-600" />
                ¿Cómo seleccionar múltiples regiones?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 list-decimal list-inside">
                <li>Accede a la sección CAMPOS desde el menú principal</li>
                <li>Localiza el panel de filtros en la parte izquierda</li>
                <li>Haz clic en "Seleccionar Regiones" para abrir el selector</li>
                <li>Marca las regiones que deseas incluir (puedes seleccionar múltiples)</li>
                <li>Haz clic en "Aplicar Filtros" para actualizar la vista</li>
              </ol>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-900">
                  <strong>Consejo:</strong> Para deseleccionar todo rápidamente, haz clic en "Limpiar filtros"
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-teal-600" />
                Búsqueda avanzada por ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>La búsqueda avanzada te permite filtrar campos por múltiples criterios:</p>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                <li><strong>Por nombre:</strong> Busca campos por su nombre exacto o parcial</li>
                <li><strong>Por región:</strong> Filtra por región geográfica específica</li>
                <li><strong>Por tamaño:</strong> Rango de hectáreas/m²</li>
                <li><strong>Por tipo:</strong> Agrícola, urbano, industrial, etc.</li>
                <li><strong>Por estado:</strong> Activo, inactivo, en revisión</li>
              </ul>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-900">
                  <strong>Nota:</strong> Puedes combinar múltiples filtros y guardar búsquedas frecuentes como favoritas
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-teal-600" />
                Interpretación del mapa interactivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>El mapa interactivo muestra tus campos en tiempo real con múltiples capas:</p>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                <li><strong>Capa de campos:</strong> Visualiza todas tus ubicaciones</li>
                <li><strong>Capa de clientes:</strong> Muestra las ubicaciones de interés de clientes</li>
                <li><strong>Capa de oportunidades:</strong> Identifica áreas potenciales</li>
                <li><strong>Zoom:</strong> Usa el scroll o los controles para acercarte/alejarte</li>
                <li><strong>Información emergente:</strong> Haz clic en cualquier marcador para ver detalles</li>
              </ul>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-900">
                  <strong>Sugerencia:</strong> Usa los botones de capas en la esquina superior izquierda para controlar qué se muestra
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-teal-600" />
                Exportación de datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Puedes exportar tus datos de campos en varios formatos:</p>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                <li><strong>CSV:</strong> Para análisis en Excel o herramientas similares</li>
                <li><strong>KMZ:</strong> Para usar en Google Earth o GIS</li>
                <li><strong>PDF:</strong> Para reportes y presentaciones</li>
                <li><strong>GeoJSON:</strong> Para aplicaciones SIG avanzadas</li>
              </ul>
              <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
                <li>Selecciona los campos que deseas exportar (o todos si aplica)</li>
                <li>Haz clic en el botón "Exportar"</li>
                <li>Elige el formato deseado</li>
                <li>La descarga comenzará automáticamente</li>
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

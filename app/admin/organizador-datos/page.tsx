"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Upload, BarChart3, Settings } from "lucide-react"
import GoogleSheetsImporter from "@/components/data-management/google-sheets-importer"
import PropertyDataOrganizer from "@/components/data-management/property-data-organizer"

export default function DataOrganizerPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Organizador de Datos - Etapa 1</h1>
        <p className="text-gray-600 text-lg">
          Sistema para organizar y gestionar los datos de propiedades desde Google Drive
        </p>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar Datos
          </TabsTrigger>
          <TabsTrigger value="organize" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Organizar Datos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Importación desde Google Sheets
              </CardTitle>
              <CardDescription>
                Importa datos de propiedades desde archivos CSV con la estructura de Google Sheets. El sistema validará
                automáticamente los datos y calculará puntuaciones de calidad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleSheetsImporter />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Organización y Gestión de Datos
              </CardTitle>
              <CardDescription>
                Visualiza, filtra y organiza las propiedades importadas. Utiliza filtros avanzados para encontrar
                propiedades específicas y exporta datos organizados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyDataOrganizer />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Guía de Uso - Etapa 1</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">1. Importar Datos</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Descarga la plantilla CSV con la estructura de Google Sheets</li>
                <li>• Completa los datos siguiendo el formato exacto</li>
                <li>• Sube el archivo y revisa la vista previa</li>
                <li>• El sistema validará automáticamente los datos</li>
                <li>• Importa solo las propiedades válidas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Organizar Datos</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Visualiza estadísticas generales de tus propiedades</li>
                <li>• Filtra por región, derechos de agua, calidad de datos</li>
                <li>• Busca propiedades por nombre, contacto o ubicación</li>
                <li>• Revisa la calidad de datos con puntuaciones automáticas</li>
                <li>• Exporta datos organizados en formato CSV</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

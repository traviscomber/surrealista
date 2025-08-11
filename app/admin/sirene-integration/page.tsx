import type { Metadata } from "next"
import { CompanySearch } from "@/components/sirene/company-search"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, TrendingUp, Users, DollarSign } from "lucide-react"

export const metadata: Metadata = {
  title: "Integración SIRENE | Sur Realista Admin",
  description: "Acceso a información empresarial oficial de Chile",
}

export default function SIRENEIntegrationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integración SIRENE</h1>
          <p className="text-gray-500">Acceso a información empresarial oficial de Chile</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Demo Activo
        </Badge>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empresas Inmobiliarias</p>
                <p className="text-2xl font-bold">156</p>
                <p className="text-xs text-gray-500">Región Los Lagos</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nuevas este mes</p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-green-600">+8.5% vs mes anterior</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empleos Sector</p>
                <p className="text-2xl font-bold">2,340</p>
                <p className="text-xs text-gray-500">Trabajadores activos</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inversión Total</p>
                <p className="text-2xl font-bold">$45B</p>
                <p className="text-xs text-gray-500">CLP 2024</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Componente principal de búsqueda */}
      <CompanySearch />

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos Demo Disponibles</CardTitle>
            <CardDescription>Prueba con estos ejemplos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900">Inmobiliaria Patagonia SPA</h4>
                <p className="text-sm text-blue-700">RUT: 76.123.456-7</p>
                <p className="text-xs text-blue-600">Empresa activa con proyectos en Puerto Varas</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900">Desarrollos del Sur Ltda</h4>
                <p className="text-sm text-green-700">RUT: 96.234.567-8</p>
                <p className="text-xs text-green-600">Constructora con torres terminadas</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900">Costa Azul Properties</h4>
                <p className="text-sm text-purple-700">Búsqueda por nombre</p>
                <p className="text-xs text-purple-600">Inmobiliaria especializada en costa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades Disponibles</CardTitle>
            <CardDescription>Capacidades de la integración</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Búsqueda por RUT</h4>
                  <p className="text-sm text-gray-600">Información completa de empresa específica</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Datos Financieros</h4>
                  <p className="text-sm text-gray-600">Estados financieros y clasificación</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Proyectos Inmobiliarios</h4>
                  <p className="text-sm text-gray-600">Desarrollos activos y historial</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Análisis con IA</h4>
                  <p className="text-sm text-gray-600">Insights automáticos y recomendaciones</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

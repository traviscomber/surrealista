"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Building,
  Users,
  Settings,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { SalesHeatmap } from "@/components/features/heatmap-sales/heatmap-sales"

const StatCard = ({ title, value, trend, trendValue, icon: Icon, color }) => {
  const colorMap = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    green: { bg: "bg-green-100", text: "text-green-600" },
    purple: { bg: "bg-purple-100", text: "text-purple-600" },
    orange: { bg: "bg-orange-100", text: "text-orange-600" },
    red: { bg: "bg-red-100", text: "text-red-600" },
    amber: { bg: "bg-amber-100", text: "text-amber-600" },
  }

  const colorClasses = colorMap[color] || colorMap.blue

  return (
    <Card className="border-l-4 border-l-gray-200 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
            <Icon className={`h-5 w-5 ${colorClasses.text}`} />
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}
          >
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{trendValue}</span>
          </div>
        </div>
        <div className="text-2xl font-bold mb-1 text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
      </CardContent>
    </Card>
  )
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Panel de Administración</h1>
          <p className="text-gray-500">Gestiona propiedades, usuarios y analíticas de Sur-Realista</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="gap-2 bg-transparent">
            <Link href="/admin/propiedades/nueva">
              <PlusCircle className="h-4 w-4" />
              Nueva Propiedad
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/admin/propiedades">
              <Building className="h-4 w-4" />
              Ver Propiedades
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden md:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden md:inline">Propiedades</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden md:inline">Analíticas</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Configuración</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Propiedades"
              value="248"
              trend="up"
              trendValue="12% vs mes anterior"
              icon={Building}
              color="blue"
            />
            <StatCard
              title="Usuarios Registrados"
              value="1,842"
              trend="up"
              trendValue="8% vs mes anterior"
              icon={Users}
              color="green"
            />
            <StatCard
              title="Visitas a Propiedades"
              value="12,546"
              trend="up"
              trendValue="24% vs mes anterior"
              icon={Eye}
              color="purple"
            />
            <StatCard
              title="Valor Promedio"
              value="$245,800"
              trend="down"
              trendValue="3% vs mes anterior"
              icon={DollarSign}
              color="amber"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Últimas acciones en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-sm">Nueva propiedad ingresada</p>
                        <p className="text-xs text-gray-500">Fundo Los Robles - 45 ha</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">Hace 2 horas</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-sm">Venta completada</p>
                        <p className="text-xs text-gray-500">Parcela San José - UF 5.200</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">Hace 4 horas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-sm">Usuario registrado</p>
                        <p className="text-xs text-gray-500">Juan Carlos Pérez</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">Hace 6 horas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acceso Rápido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full justify-start" variant="ghost">
                  <Link href="/admin/propiedades">
                    <Building className="w-4 h-4 mr-2" />
                    Ver Propiedades
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="ghost">
                  <Link href="/admin/usuarios">
                    <Users className="w-4 h-4 mr-2" />
                    Gestionar Usuarios
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="ghost">
                  <Link href="/admin/propiedades/nueva">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Nueva Propiedad
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="mt-0">
          <Card>
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gestión de Propiedades</CardTitle>
                  <CardDescription>Administra todas las propiedades de Sur-Realista</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/admin/propiedades/nueva" className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Agregar Propiedad
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium">Propiedades Activas</div>
                    <div className="text-2xl font-bold text-blue-900 mt-1">187</div>
                    <div className="text-xs text-blue-600 mt-2">+12 esta semana</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                    <div className="text-sm text-yellow-600 font-medium">Pendientes de Revisión</div>
                    <div className="text-2xl font-bold text-yellow-900 mt-1">23</div>
                    <div className="text-xs text-yellow-600 mt-2">Requieren atención</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600 font-medium">Vendidas Este Mes</div>
                    <div className="text-2xl font-bold text-green-900 mt-1">8</div>
                    <div className="text-xs text-green-600 mt-2">UF 42.500 total</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button asChild>
                  <Link href="/admin/propiedades">Ver Todas las Propiedades</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Administra usuarios, roles y permisos</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium">Total Usuarios</div>
                    <div className="text-2xl font-bold text-blue-900 mt-1">1,842</div>
                    <div className="text-xs text-blue-600 mt-2">+145 este mes</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium">Brokers Activos</div>
                    <div className="text-2xl font-bold text-purple-900 mt-1">42</div>
                    <div className="text-xs text-purple-600 mt-2">38 en línea</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600 font-medium">Inversionistas</div>
                    <div className="text-2xl font-bold text-green-900 mt-1">156</div>
                    <div className="text-xs text-green-600 mt-2">Verificados</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <div className="text-sm text-orange-600 font-medium">Pendientes</div>
                    <div className="text-2xl font-bold text-orange-900 mt-1">18</div>
                    <div className="text-xs text-orange-600 mt-2">Verificación</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button asChild>
                  <Link href="/admin/usuarios">Ver Todos los Usuarios</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <SalesHeatmap />
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Configuración del Sistema</CardTitle>
              <CardDescription>Personaliza la plataforma Sur-Realista</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-900">Configuración General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button asChild variant="outline" className="justify-start h-auto p-4">
                    <Link href="/admin/configuracion/general" className="flex flex-col items-start">
                      <span className="font-medium text-sm">Configuración General</span>
                      <span className="text-xs text-gray-500 mt-1">Nombre, logo, dominio</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start h-auto p-4">
                    <Link href="/admin/configuracion/comisiones" className="flex flex-col items-start">
                      <span className="font-medium text-sm">Comisiones y Precios</span>
                      <span className="text-xs text-gray-500 mt-1">Estructura de comisiones</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start h-auto p-4">
                    <Link href="/admin/configuracion/notificaciones" className="flex flex-col items-start">
                      <span className="font-medium text-sm">Notificaciones</span>
                      <span className="text-xs text-gray-500 mt-1">Canales y preferencias</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start h-auto p-4">
                    <Link href="/admin/configuracion/integraciones" className="flex flex-col items-start">
                      <span className="font-medium text-sm">Integraciones</span>
                      <span className="text-xs text-gray-500 mt-1">APIs y webhooks</span>
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold text-sm text-gray-900 mb-4">Estado del Sistema</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="text-sm font-medium text-green-900">API Activa</p>
                      <p className="text-xs text-green-700">Todos los servicios operativos</p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="text-sm font-medium text-green-900">Base de Datos</p>
                      <p className="text-xs text-green-700">Conexión estable</p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

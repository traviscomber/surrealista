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
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Map,
  Eye,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Componente para las tarjetas de estadísticas
const StatCard = ({ title, value, trend, trendValue, icon: Icon, color }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-${color}-100`}>
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}
          >
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{trendValue}</span>
          </div>
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </CardContent>
    </Card>
  )
}

// Componente para las propiedades recientes
const RecentProperty = ({ image, title, price, location, views, status }) => {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        <Image src={image || "/placeholder.svg"} alt={title} fill className="object-cover" />
      </div>
      <div className="flex-grow min-w-0">
        <h4 className="font-medium text-sm truncate">{title}</h4>
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <Map className="h-3 w-3" />
          <span className="truncate">{location}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="font-semibold text-sm">{price}</div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Eye className="h-3 w-3" />
              <span>{views}</span>
            </div>
            <div
              className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                status === "Activa"
                  ? "bg-green-100 text-green-800"
                  : status === "Pendiente"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {status}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para las actividades recientes
const ActivityItem = ({ user, action, property, time, image }) => {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        <Image src={image || "/placeholder.svg"} alt={user} fill className="object-cover" />
      </div>
      <div className="flex-grow">
        <p className="text-sm">
          <span className="font-medium">{user}</span>
          <span className="text-gray-600"> {action} </span>
          <span className="font-medium">{property}</span>
        </p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Panel de Administración</h1>
          <p className="text-gray-500">Gestiona propiedades, usuarios y analíticas de Sur-Realista</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="gap-2">
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

        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Rendimiento de Propiedades</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                    <Link href="/admin/analytics">
                      Ver Detalles
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
                <CardDescription>Visitas y consultas en los últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full relative">
                  <Image
                    src="/property-performance-chart.png"
                    alt="Gráfico de rendimiento de propiedades"
                    fill
                    className="object-contain"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Propiedades Recientes</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                    <Link href="/admin/propiedades">
                      Ver Todas
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
                <CardDescription>Últimas propiedades agregadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <RecentProperty
                    image="/images/property-sample-1.png"
                    title="Casa con Vista al Lago"
                    price="$320,000"
                    location="Puerto Varas, Los Lagos"
                    views="124"
                    status="Activa"
                  />
                  <RecentProperty
                    image="/images/property-sample-2.png"
                    title="Parcela en Frutillar"
                    price="$180,000"
                    location="Frutillar, Los Lagos"
                    views="86"
                    status="Pendiente"
                  />
                  <RecentProperty
                    image="/images/property-sample-3.png"
                    title="Cabaña en Pucón"
                    price="$145,000"
                    location="Pucón, La Araucanía"
                    views="210"
                    status="Destacada"
                  />
                  <RecentProperty
                    image="/images/property-sample-4.png"
                    title="Departamento Centro"
                    price="$98,500"
                    location="Valdivia, Los Ríos"
                    views="65"
                    status="Activa"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Actividad Reciente</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Ver Todo
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
                <CardDescription>Últimas acciones en la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 divide-y">
                  <ActivityItem
                    user="Carlos Mendoza"
                    action="agregó una nueva propiedad"
                    property="Casa en Puerto Varas"
                    time="Hace 35 minutos"
                    image="/images/testimonials/carlos-maria.png"
                  />
                  <ActivityItem
                    user="María González"
                    action="actualizó los detalles de"
                    property="Parcela en Frutillar"
                    time="Hace 2 horas"
                    image="/images/testimonials/valentina.png"
                  />
                  <ActivityItem
                    user="Juan Pérez"
                    action="marcó como destacada"
                    property="Cabaña en Pucón"
                    time="Hace 4 horas"
                    image="/placeholder.svg?height=50&width=50&query=profile+picture+of+man"
                  />
                  <ActivityItem
                    user="Valentina Soto"
                    action="respondió consulta sobre"
                    property="Departamento Centro"
                    time="Hace 6 horas"
                    image="/images/testimonials/valentina.png"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Distribución de Propiedades</CardTitle>
                </div>
                <CardDescription>Por tipo y ubicación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px] w-full relative mb-4">
                  <Image
                    src="/placeholder.svg?height=220&width=400&query=donut+chart+showing+property+distribution+by+type+with+blue+and+green+segments"
                    alt="Gráfico de distribución de propiedades"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Casas (42%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Departamentos (28%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Parcelas (18%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span>Otros (12%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Acciones Rápidas</CardTitle>
                </div>
                <CardDescription>Accesos directos a funciones comunes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    asChild
                  >
                    <Link href="/admin/propiedades/nueva">
                      <PlusCircle className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">Nueva Propiedad</span>
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    asChild
                  >
                    <Link href="/admin/usuarios">
                      <Users className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Gestionar Usuarios</span>
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    asChild
                  >
                    <Link href="/admin/mensajes">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium">Ver Mensajes</span>
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    asChild
                  >
                    <Link href="/admin/reportes">
                      <BarChart3 className="h-5 w-5 text-amber-600" />
                      <span className="text-sm font-medium">Generar Reportes</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Propiedades</CardTitle>
              <CardDescription>Administra todas las propiedades de Sur-Realista</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Gestión de Propiedades</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Desde aquí puedes ver, editar, agregar y eliminar propiedades. También puedes gestionar imágenes,
                  detalles y configurar propiedades destacadas.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button asChild>
                    <Link href="/admin/propiedades">Ver Todas las Propiedades</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/propiedades/nueva">Agregar Nueva Propiedad</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Administra usuarios y permisos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Gestión de Usuarios</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Administra usuarios, asigna roles y permisos, y supervisa la actividad de los usuarios en la
                  plataforma.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button asChild>
                    <Link href="/admin/usuarios">Ver Todos los Usuarios</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/usuarios/nuevo">Agregar Nuevo Usuario</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Analíticas y Reportes</CardTitle>
              <CardDescription>Visualiza el rendimiento de la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Analíticas y Reportes</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Accede a informes detallados, estadísticas y métricas de rendimiento para tomar decisiones basadas en
                  datos.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button asChild>
                    <Link href="/admin/analytics">Ver Analíticas</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/reportes">Generar Reportes</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
              <CardDescription>Personaliza la plataforma Sur-Realista</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Configuración del Sistema</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Configura parámetros del sistema, opciones de visualización, integraciones y preferencias generales.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button asChild>
                    <Link href="/admin/configuracion">Configuración General</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/configuracion/integraciones">Integraciones</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

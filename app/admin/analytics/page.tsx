"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Eye,
  MessageSquare,
  DollarSign,
  Users,
  Map,
  Home,
  ArrowRight,
  ArrowUpRight,
  Filter,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import Image from "next/image"

// Componente para las tarjetas de métricas
const MetricCard = ({ title, value, trend, trendValue, icon: Icon, color }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-${color}-100`}>
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}
            >
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingUp className="h-3 w-3 transform rotate-180" />
              )}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Analíticas</h1>
          <p className="text-gray-500">Métricas y estadísticas de Sur-Realista</p>
        </div>
        <div className="flex gap-3">
          <div className="w-40">
            <Select defaultValue="30days">
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 días</SelectItem>
                <SelectItem value="30days">Últimos 30 días</SelectItem>
                <SelectItem value="90days">Últimos 90 días</SelectItem>
                <SelectItem value="year">Último año</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Rango de Fechas
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden md:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden md:inline">Propiedades</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span className="hidden md:inline">Ubicaciones</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard title="Visitas Totales" value="24,521" trend="up" trendValue="18%" icon={Eye} color="blue" />
            <MetricCard
              title="Consultas"
              value="1,463"
              trend="up"
              trendValue="12%"
              icon={MessageSquare}
              color="green"
            />
            <MetricCard title="Usuarios Nuevos" value="842" trend="up" trendValue="9%" icon={Users} color="purple" />
            <MetricCard
              title="Valor Promedio"
              value="$245,800"
              trend="down"
              trendValue="3%"
              icon={DollarSign}
              color="amber"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Tendencias de Visitas</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <Filter className="h-3 w-3" />
                      Filtrar
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                      Ver Detalles
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CardDescription>Visitas diarias a propiedades en los últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full relative">
                  <Image
                    src="/placeholder.svg?height=300&width=600&query=line+chart+showing+daily+visits+with+blue+line+and+grid"
                    alt="Gráfico de tendencias de visitas"
                    fill
                    className="object-contain"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Fuentes de Tráfico</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Ver Detalles
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
                <CardDescription>Principales fuentes de visitas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full relative">
                  <Image
                    src="/placeholder.svg?height=300&width=300&query=donut+chart+showing+traffic+sources+with+blue+green+and+purple+segments"
                    alt="Gráfico de fuentes de tráfico"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>Búsqueda Orgánica</span>
                    </div>
                    <span className="font-medium">42%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Redes Sociales</span>
                    </div>
                    <span className="font-medium">28%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span>Referidos</span>
                    </div>
                    <span className="font-medium">18%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span>Directo</span>
                    </div>
                    <span className="font-medium">12%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Propiedades Más Visitadas</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Ver Todas
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
                <CardDescription>Propiedades con mayor número de visitas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="relative w-16 h-12 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={`/images/property-sample-${i}.png`}
                          alt={`Propiedad ${i}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-medium text-sm truncate">Casa con Vista al Lago en Puerto Varas</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{1200 - i * 150} visitas</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{80 - i * 10} consultas</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${320000 - i * 20000}</div>
                        <div className="text-xs text-gray-500">Los Lagos</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Conversiones por Tipo</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Ver Detalles
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
                <CardDescription>Tasa de conversión por tipo de propiedad</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full relative mb-4">
                  <Image
                    src="/placeholder.svg?height=250&width=500&query=horizontal+bar+chart+showing+conversion+rates+by+property+type+with+blue+bars"
                    alt="Gráfico de conversiones por tipo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">Casas de Lago</div>
                    <div className="text-sm font-medium">8.4%</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">Parcelas</div>
                    <div className="text-sm font-medium">6.2%</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">Casas en Ciudad</div>
                    <div className="text-sm font-medium">5.1%</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">Departamentos</div>
                    <div className="text-sm font-medium">4.7%</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">Cabañas</div>
                    <div className="text-sm font-medium">3.9%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Analíticas de Propiedades</CardTitle>
              <CardDescription>Rendimiento detallado de las propiedades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Analíticas de Propiedades</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Accede a métricas detalladas sobre el rendimiento de las propiedades, incluyendo visitas, consultas,
                  tiempo de permanencia y tasas de conversión.
                </p>
                <Button asChild>
                  <Link href="/admin/analytics/propiedades">
                    Ver Analíticas de Propiedades
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Analíticas de Usuarios</CardTitle>
              <CardDescription>Comportamiento y demografía de usuarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Analíticas de Usuarios</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Explora datos demográficos, patrones de comportamiento y preferencias de los usuarios para optimizar
                  la experiencia y aumentar las conversiones.
                </p>
                <Button asChild>
                  <Link href="/admin/analytics/usuarios">
                    Ver Analíticas de Usuarios
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Analíticas de Ubicaciones</CardTitle>
              <CardDescription>Rendimiento por ubicación geográfica</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Map className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Analíticas de Ubicaciones</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Visualiza el rendimiento de propiedades por ubicación geográfica, identifica zonas de alta demanda y
                  optimiza tu estrategia regional.
                </p>
                <Button asChild>
                  <Link href="/admin/analytics/ubicaciones">
                    Ver Analíticas de Ubicaciones
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

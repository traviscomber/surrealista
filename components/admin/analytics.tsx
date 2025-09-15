"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Users, Eye } from "lucide-react"

export function Analytics() {
  const metrics = [
    {
      title: "Visitas Totales",
      value: "12,345",
      change: "+12.5%",
      icon: Eye,
    },
    {
      title: "Usuarios Activos",
      value: "2,341",
      change: "+8.2%",
      icon: Users,
    },
    {
      title: "Conversiones",
      value: "156",
      change: "+23.1%",
      icon: TrendingUp,
    },
    {
      title: "Tiempo Promedio",
      value: "4:32",
      change: "+5.4%",
      icon: BarChart3,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-600">Métricas y estadísticas de la plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              <p className="text-xs text-green-600 mt-1">{metric.change} desde el mes pasado</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tráfico por Páginas</CardTitle>
            <CardDescription>Páginas más visitadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { page: "/propiedades", visits: 4521, percentage: 35 },
                { page: "/", visits: 3210, percentage: 25 },
                { page: "/contacto", visits: 2156, percentage: 17 },
                { page: "/sobre-nosotros", visits: 1432, percentage: 11 },
                { page: "/blog", visits: 987, percentage: 8 },
              ].map((item) => (
                <div key={item.page} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.page}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 ml-4">{item.visits}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispositivos</CardTitle>
            <CardDescription>Distribución por tipo de dispositivo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { device: "Desktop", percentage: 65, color: "bg-blue-600" },
                { device: "Mobile", percentage: 28, color: "bg-green-600" },
                { device: "Tablet", percentage: 7, color: "bg-yellow-600" },
              ].map((item) => (
                <div key={item.device} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.device}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

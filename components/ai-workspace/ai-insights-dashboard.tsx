"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Download, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react"

// Datos de ejemplo para el dashboard
const marketTrendsData = [
  { month: "Ene", precio: 320, demanda: 240, oferta: 180 },
  { month: "Feb", precio: 332, demanda: 250, oferta: 189 },
  { month: "Mar", precio: 345, demanda: 267, oferta: 195 },
  { month: "Abr", precio: 350, demanda: 280, oferta: 210 },
  { month: "May", precio: 365, demanda: 290, oferta: 220 },
  { month: "Jun", precio: 370, demanda: 300, oferta: 230 },
]

const propertyInsightsData = [
  { name: "Vista al lago", value: 35 },
  { name: "Terraza", value: 25 },
  { name: "Piscina", value: 15 },
  { name: "Acceso a playa", value: 12 },
  { name: "Cerca de centro", value: 8 },
  { name: "Otros", value: 5 },
]

const clientPreferencesData = [
  { name: "Familias", value: 40 },
  { name: "Inversionistas", value: 30 },
  { name: "Jubilados", value: 15 },
  { name: "Extranjeros", value: 10 },
  { name: "Otros", value: 5 },
]

const keyInsights = [
  {
    id: 1,
    title: "Aumento en demanda de propiedades con vista al lago",
    description:
      "Se ha detectado un incremento del 15% en búsquedas de propiedades con vista al lago en los últimos 3 meses.",
    impact: "high",
    type: "opportunity",
  },
  {
    id: 2,
    title: "Disminución en tiempo de venta",
    description: "El tiempo promedio de venta ha disminuido de 120 a 90 días, indicando un mercado más activo.",
    impact: "medium",
    type: "positive",
  },
  {
    id: 3,
    title: "Aumento en costos de construcción",
    description:
      "Los costos de construcción han aumentado un 12% en el último trimestre, afectando los márgenes de proyectos nuevos.",
    impact: "high",
    type: "warning",
  },
  {
    id: 4,
    title: "Mayor interés de inversionistas extranjeros",
    description:
      "Se ha detectado un aumento del 20% en consultas de inversionistas extranjeros, principalmente de EE.UU. y Europa.",
    impact: "medium",
    type: "opportunity",
  },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"]

export function AIInsightsDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Insights IA</h2>
          <p className="text-gray-500">Visualiza insights clave generados por IA para tomar mejores decisiones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {keyInsights.map((insight) => (
          <Card
            key={insight.id}
            className={`border-l-4 ${
              insight.type === "opportunity"
                ? "border-l-blue-500"
                : insight.type === "positive"
                  ? "border-l-green-500"
                  : "border-l-amber-500"
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{insight.title}</CardTitle>
                {insight.type === "opportunity" && <TrendingUp className="h-5 w-5 text-blue-500" />}
                {insight.type === "positive" && <TrendingUp className="h-5 w-5 text-green-500" />}
                {insight.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-2">{insight.description}</p>
              <Badge
                variant={insight.impact === "high" ? "default" : insight.impact === "medium" ? "secondary" : "outline"}
              >
                Impacto {insight.impact === "high" ? "alto" : insight.impact === "medium" ? "medio" : "bajo"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="market" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="market">Tendencias de Mercado</TabsTrigger>
          <TabsTrigger value="properties">Insights de Propiedades</TabsTrigger>
          <TabsTrigger value="clients">Preferencias de Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="market">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Mercado</CardTitle>
              <CardDescription>Evolución de precios, demanda y oferta en los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={marketTrendsData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="precio" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="demanda" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="oferta" stroke="#ffc658" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle>Características más Valoradas</CardTitle>
              <CardDescription>Características de propiedades más buscadas por los clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={propertyInsightsData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {propertyInsightsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Segmentación de Clientes</CardTitle>
              <CardDescription>Distribución de clientes por perfil</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={clientPreferencesData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

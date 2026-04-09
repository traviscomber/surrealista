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

          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Panel de Administración</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Bienvenido al panel de administración de Sur-Realista. Desde aquí puedes gestionar todas las funciones de
              la plataforma.
            </p>
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
                  Desde aquí puedes ver, editar, agregar y eliminar propiedades.
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
                <p className="text-gray-500 max-w-md mx-auto mb-6">Administra usuarios, asigna roles y permisos.</p>
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
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
              <CardDescription>Personaliza la plataforma Sur-Realista</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Configuración del Sistema</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">Configura parámetros del sistema y preferencias.</p>
                <Button asChild>
                  <Link href="/admin/configuracion">Configuración General</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

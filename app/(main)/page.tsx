import { AppHeader } from "@/components/layout/app-header"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Users, MessageSquare, ClipboardList, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  Sur-Realista - Plataforma Integral
                </h1>
                <p className="text-gray-600 mt-1">Sistema de gestión para CAMPOS, Clientes, Comunicaciones y Tareas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/busqueda">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Search className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">Búsqueda</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Sistema integrado de búsqueda para CAMPOS, Clientes, Comunicaciones y Tareas
                  </p>
                  <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">Ir a Búsqueda</Button>
                </CardContent>
              </Card>
            </Link>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full opacity-75">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Clientes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Gestión completa de clientes y sus propiedades</p>
                <Button className="w-full mt-4 bg-transparent" variant="outline" disabled>
                  Próximamente
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full opacity-75">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Comunicaciones</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Centro de mensajes y comunicaciones con clientes</p>
                <Button className="w-full mt-4 bg-transparent" variant="outline" disabled>
                  Próximamente
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full opacity-75">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <ClipboardList className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Tareas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Gestión de tareas y seguimiento de actividades</p>
                <Button className="w-full mt-4 bg-transparent" variant="outline" disabled>
                  Próximamente
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

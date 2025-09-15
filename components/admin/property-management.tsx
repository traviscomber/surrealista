"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react"

interface Property {
  id: string
  title: string
  price: number
  location: string
  status: "active" | "pending" | "sold"
  type: string
  createdAt: string
}

export function PropertyManagement() {
  const [properties] = useState<Property[]>([
    {
      id: "1",
      title: "Casa Moderna en Las Condes",
      price: 450000000,
      location: "Las Condes, Santiago",
      status: "active",
      type: "Casa",
      createdAt: "2024-01-10",
    },
    {
      id: "2",
      title: "Departamento Vista al Mar",
      price: 320000000,
      location: "Viña del Mar",
      status: "pending",
      type: "Departamento",
      createdAt: "2024-01-12",
    },
    {
      id: "3",
      title: "Casa Familiar en Providencia",
      price: 380000000,
      location: "Providencia, Santiago",
      status: "sold",
      type: "Casa",
      createdAt: "2024-01-08",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")

  const filteredProperties = properties.filter(
    (property) =>
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: Property["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activa</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "sold":
        return <Badge className="bg-gray-100 text-gray-800">Vendida</Badge>
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Propiedades</h2>
          <p className="text-gray-600">Administra el inventario de propiedades</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Propiedad
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar propiedades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">Filtros</Button>
        <Button variant="outline">Exportar</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Propiedades</CardTitle>
          <CardDescription>{filteredProperties.length} propiedades encontradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProperties.map((property) => (
              <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{property.title}</h3>
                    {getStatusBadge(property.status)}
                    <Badge variant="outline">{property.type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{property.location}</p>
                  <p className="text-lg font-semibold text-blue-600 mt-1">{formatPrice(property.price)}</p>
                  <p className="text-xs text-gray-500">
                    Creada: {new Date(property.createdAt).toLocaleDateString("es-CL")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Propiedades Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {properties.filter((p) => p.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {properties.filter((p) => p.status === "pending").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">
              {properties.filter((p) => p.status === "sold").length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

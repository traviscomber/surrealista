"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Mail, Phone } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: "admin" | "agent" | "client"
  status: "active" | "inactive"
  createdAt: string
  lastLogin?: string
}

export function UserManagement() {
  const [users] = useState<User[]>([
    {
      id: "1",
      name: "Juan Pérez",
      email: "juan@example.com",
      phone: "+56 9 1234 5678",
      role: "admin",
      status: "active",
      createdAt: "2024-01-01",
      lastLogin: "2024-01-15 09:30",
    },
    {
      id: "2",
      name: "María González",
      email: "maria@example.com",
      phone: "+56 9 8765 4321",
      role: "agent",
      status: "active",
      createdAt: "2024-01-05",
      lastLogin: "2024-01-14 16:45",
    },
    {
      id: "3",
      name: "Carlos Silva",
      email: "carlos@example.com",
      role: "client",
      status: "inactive",
      createdAt: "2024-01-10",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
      case "agent":
        return <Badge className="bg-blue-100 text-blue-800">Agente</Badge>
      case "client":
        return <Badge className="bg-green-100 text-green-800">Cliente</Badge>
    }
  }

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-600">Administra usuarios, agentes y clientes</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar usuarios..."
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
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>{filteredUsers.length} usuarios encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{user.name}</h3>
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.status)}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {user.phone}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    <span>Registrado: {new Date(user.createdAt).toLocaleDateString("es-CL")}</span>
                    {user.lastLogin && (
                      <span className="ml-4">
                        Último acceso: {new Date(user.lastLogin).toLocaleDateString("es-CL")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{users.filter((u) => u.role === "admin").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{users.filter((u) => u.role === "agent").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{users.filter((u) => u.role === "client").length}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

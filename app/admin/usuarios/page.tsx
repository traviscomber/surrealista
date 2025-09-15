"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  PlusCircle,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Mail,
  UserPlus,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

// Datos de ejemplo para usuarios
const usersData = [
  {
    id: 1,
    name: "Carlos Mendoza",
    email: "carlos@ejemplo.com",
    role: "Administrador",
    status: "Activo",
    lastLogin: "Hace 2 horas",
    avatar: "/images/testimonials/carlos-maria.png",
  },
  {
    id: 2,
    name: "María González",
    email: "maria@ejemplo.com",
    role: "Agente",
    status: "Activo",
    lastLogin: "Hace 1 día",
    avatar: "/images/testimonials/valentina.png",
  },
  {
    id: 3,
    name: "Juan Pérez",
    email: "juan@ejemplo.com",
    role: "Usuario",
    status: "Inactivo",
    lastLogin: "Hace 2 semanas",
    avatar: "/placeholder.svg?height=50&width=50&query=profile+picture+of+man",
  },
  {
    id: 4,
    name: "Valentina Soto",
    email: "valentina@ejemplo.com",
    role: "Agente",
    status: "Activo",
    lastLogin: "Hace 3 días",
    avatar: "/images/testimonials/valentina.png",
  },
  {
    id: 5,
    name: "Roberto Álvarez",
    email: "roberto@ejemplo.com",
    role: "Usuario",
    status: "Activo",
    lastLogin: "Hace 5 días",
    avatar: "/placeholder.svg?height=50&width=50&query=profile+picture+of+man+with+glasses",
  },
  {
    id: 6,
    name: "Ana Martínez",
    email: "ana@ejemplo.com",
    role: "Usuario",
    status: "Pendiente",
    lastLogin: "Nunca",
    avatar: "/placeholder.svg?height=50&width=50&query=profile+picture+of+woman+with+short+hair",
  },
  {
    id: 7,
    name: "Diego Flores",
    email: "diego@ejemplo.com",
    role: "Agente",
    status: "Activo",
    lastLogin: "Hace 1 hora",
    avatar: "/placeholder.svg?height=50&width=50&query=profile+picture+of+young+man",
  },
  {
    id: 8,
    name: "Camila Rojas",
    email: "camila@ejemplo.com",
    role: "Usuario",
    status: "Activo",
    lastLogin: "Hace 4 días",
    avatar: "/placeholder.svg?height=50&width=50&query=profile+picture+of+woman+with+long+hair",
  },
]

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Filtrar usuarios basados en búsqueda y filtros
  const filteredUsers = usersData.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter.toLowerCase()
    const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Gestión de Usuarios</h1>
          <p className="text-gray-500">Administra usuarios, roles y permisos</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/admin/usuarios/importar">
              <UserPlus className="h-4 w-4" />
              Importar
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/admin/usuarios/nuevo">
              <PlusCircle className="h-4 w-4" />
              Nuevo Usuario
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar usuarios..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <div className="w-full md:w-40">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="agente">Agente</SelectItem>
                    <SelectItem value="usuario">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-40">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center">
            <CardTitle>Usuarios</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
          <CardDescription>{filteredUsers.length} usuarios encontrados</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-gray-500">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                      Usuario
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium text-gray-500">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                      Email
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium text-gray-500">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                      Rol
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium text-gray-500">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                      Estado
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium text-gray-500">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                      Último Acceso
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="text-right p-4 font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                          <Image
                            src={user.avatar || "/placeholder.svg"}
                            alt={user.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          user.role === "Administrador" ? "default" : user.role === "Agente" ? "secondary" : "outline"
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          user.status === "Activo" ? "success" : user.status === "Inactivo" ? "destructive" : "warning"
                        }
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-gray-600">{user.lastLogin}</td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar mensaje
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Shield className="h-4 w-4 mr-2" />
                            Cambiar permisos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 cursor-pointer">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="text-sm text-gray-500">
              Mostrando <span className="font-medium">1</span> a <span className="font-medium">8</span> de{" "}
              <span className="font-medium">8</span> resultados
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="bg-blue-50">
                1
              </Button>
              <Button variant="outline" size="icon" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import React from "react"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Search, Settings, User, LogOut, HelpCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/dashboard": "Dashboard",
    "/admin/propiedades": "Propiedades",
    "/admin/propiedades/nueva": "Nueva Propiedad",
    "/admin/importar-propiedades": "Importar Propiedades",
    "/admin/verificar-destacadas": "Verificar Destacadas",
    "/admin/usuarios": "Gestión de Usuarios",
    "/admin/mensajes": "Centro de Mensajes",
    "/admin/analytics": "Analytics y Reportes",
    "/admin/ia-workspace": "IA Workspace",
    "/admin/analisis-integral": "Análisis Integral",
    "/admin/conexiones-datos": "Conexiones de Datos",
    "/admin/ciren-dashboard": "Dashboard CIREN",
    "/admin/ciren-demo": "Demo CIREN",
    "/admin/ciren-integration": "Integración CIREN",
    "/admin/seed": "Seed Database",
    "/admin/scraper-guide": "Guía de Scraper",
    "/admin/import-data": "Importar Datos",
    "/admin/kmz-vecindario": "Análisis de Vecindario KMZ",
  }

  return routes[pathname] || "Panel de Administración"
}

const getBreadcrumbs = (pathname: string): Array<{ label: string; href?: string }> => {
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs = [{ label: "Admin", href: "/admin" }]

  if (segments.length > 1) {
    const currentPage = getPageTitle(pathname)
    breadcrumbs.push({ label: currentPage })
  }

  return breadcrumbs
}

export function AdminHeader() {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Title and Breadcrumbs */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.label}>
                {index > 0 && <span>/</span>}
                <span className={index === breadcrumbs.length - 1 ? "text-gray-900 font-medium" : ""}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input type="search" placeholder="Buscar propiedades, usuarios..." className="pl-10 pr-4 w-full" />
          </div>
        </div>

        {/* Right side - Actions and Profile */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
              3
            </Badge>
          </Button>

          {/* Help */}
          <Button variant="ghost" size="sm">
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="h-5 w-5" />
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Admin" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                    AD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Administrador</p>
                  <p className="text-xs leading-none text-muted-foreground">admin@sur-realista.cl</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  Settings,
  Database,
  ChevronDown,
  ChevronRight,
  Upload,
  Home,
  Eye,
  FileText,
  Bell,
  Search,
  User,
  LogOut,
  HelpCircle,
  Activity,
  FolderOpen,
  MapPin,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MenuItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  badgeColor?: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Búsqueda Unificada",
    href: "/busqueda",
    icon: Search,
    badge: "New",
    badgeColor: "bg-green-500",
  },
  {
    title: "Colección KMZ",
    href: "/admin/kmz-collection",
    icon: MapPin,
    badge: "New",
    badgeColor: "bg-blue-500",
  },
  {
    title: "Comunicaciones",
    icon: Mail,
    badge: "Nuevo",
    badgeColor: "bg-blue-500",
    children: [
      {
        title: "Enviar Emails",
        href: "/comunicaciones/email",
        icon: Mail,
        badge: "Feature",
        badgeColor: "bg-blue-500",
      },
      {
        title: "Historial",
        href: "/comunicaciones/email",
        icon: FileText,
        badge: "Logs",
        badgeColor: "bg-gray-500",
      },
    ],
  },
  {
    title: "Gestión Documentos",
    icon: FileText,
    badge: "Etapa 1",
    badgeVariant: "default",
    badgeColor: "bg-orange-500",
    children: [
      {
        title: "Google Drive Integration",
        href: "/admin/google-drive-integration",
        icon: Database,
        badge: "API Ready",
        badgeColor: "bg-green-500",
      },
      {
        title: "Organización Carpetas",
        href: "/admin/organizacion-carpetas-demo",
        icon: Eye,
        badge: "Demo",
        badgeColor: "bg-blue-500",
      },
      {
        title: "Método PARA",
        href: "/admin/documentacion-para-method",
        icon: HelpCircle,
        badge: "Guía",
        badgeColor: "bg-indigo-500",
      },
      {
        title: "Migración Data Real",
        href: "/admin/migracion-data-real",
        icon: Upload,
        badge: "Ready",
        badgeColor: "bg-purple-500",
      },
    ],
  },
]

const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    "/admin": "Dashboard",
    "/busqueda": "Búsqueda Unificada",
    "/campos": "Vista CAMPOS",
    "/admin/kmz-collection": "Colección KMZ",
    "/admin/sii-extractor": "Extractor de Coordenadas SII",
    "/admin/file-explorer": "Explorador de Archivos",
    "/admin/kmz-vecindario": "Análisis de Vecindario KMZ",
    "/mvp/seguimiento": "Seguimiento MVP",
    "/admin/fase-1-mvp": "Fase 1 MVP",
    "/admin/fase-2-mvp": "Fase 2 MVP",
    "/admin/fase-3-mvp": "Fase 3 MVP",
    "/mvp/analytics-completo": "Analytics MVP",
    "/admin/google-drive-integration": "Google Drive Integration",
    "/admin/organizacion-carpetas-demo": "Organización Carpetas",
    "/admin/documentacion-para-method": "Método PARA - Documentación",
    "/admin/migracion-data-real": "Migración Data Real",
    "/admin/mensajes": "Centro de Mensajes",
    "/comunicaciones/email": "Enviar Emails",
  }

  return routes[pathname] || "Panel de Administración"
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [openItems, setOpenItems] = useState<string[]>(["Gestión Documentos"])
  const pageTitle = getPageTitle(pathname)

  const toggleItem = (title: string) => {
    setOpenItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(href + "/")
  }

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isOpen = openItems.includes(item.title)
    const isItemActive = item.href ? isActive(item.href) : false

    if (hasChildren) {
      return (
        <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleItem(item.title)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-10 px-3 font-medium text-sm",
                level > 0 && "ml-4 w-[calc(100%-1rem)]",
                "hover:bg-blue-50 hover:text-blue-700 transition-colors",
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-left truncate">{item.title}</span>
              {item.badge && (
                <Badge
                  variant={item.badgeVariant || "secondary"}
                  className={cn("text-xs px-1.5 py-0.5 h-5", item.badgeColor && `${item.badgeColor} text-white`)}
                >
                  {item.badge}
                </Badge>
              )}
              {isOpen ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      )
    }

    return (
      <Link key={item.title} href={item.href || "#"}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-10 px-3 font-medium text-sm transition-colors",
            level > 0 && "ml-4 w-[calc(100%-1rem)]",
            isItemActive ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : "hover:bg-blue-50 hover:text-blue-700",
          )}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 text-left truncate">{item.title}</span>
          {item.badge && (
            <Badge
              variant={item.badgeVariant || "secondary"}
              className={cn("text-xs px-1.5 py-0.5 h-5", item.badgeColor && `${item.badgeColor} text-white`)}
            >
              {item.badge}
            </Badge>
          )}
        </Button>
      </Link>
    )
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Panel de Administración</h2>
            <p className="text-sm text-gray-500">Sur-Realista</p>
          </div>
        </div>

        {/* Current Page Title */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input type="search" placeholder="Buscar..." className="pl-10 pr-4 w-full h-9" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">{menuItems.map((item) => renderMenuItem(item))}</nav>

      <Separator />

      {/* Quick Actions */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 px-3">Acciones Rápidas</h3>
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/admin/google-drive-integration">
              <Database className="h-4 w-4" />
              Google Drive
              <Badge className="ml-auto bg-green-500 text-white text-xs">API Ready</Badge>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/mvp/seguimiento">
              <Activity className="h-4 w-4" />
              Seguimiento MVP
              <Badge className="ml-auto bg-blue-500 text-white text-xs">85%</Badge>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/admin/migracion-data-real">
              <Upload className="h-4 w-4" />
              Migración Data
              <Badge className="ml-auto bg-purple-500 text-white text-xs">Ready</Badge>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/admin/documentacion-para-method">
              <HelpCircle className="h-4 w-4" />
              Método PARA
              <Badge className="ml-auto bg-indigo-500 text-white text-xs">Guía</Badge>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/admin/sii-extractor">
              <Search className="h-4 w-4" />
              Extractor SII
              <Badge className="ml-auto bg-orange-500 text-white text-xs">Beta</Badge>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/admin/file-explorer">
              <FolderOpen className="h-4 w-4" />
              Explorador de Archivos
              <Badge className="ml-auto bg-purple-500 text-white text-xs">New</Badge>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/admin/kmz-collection">
              <MapPin className="h-4 w-4" />
              Colección KMZ
              <Badge className="ml-auto bg-blue-500 text-white text-xs">New</Badge>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/admin/kmz-vecindario">
              <MapPin className="h-4 w-4" />
              Análisis Vecindario KMZ
              <Badge className="ml-auto bg-blue-500 text-white text-xs">New</Badge>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/busqueda">
              <Search className="h-4 w-4" />
              Búsqueda Unificada
              <Badge className="ml-auto bg-green-500 text-white text-xs">New</Badge>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/campos">
              <FolderOpen className="h-4 w-4" />
              Vista CAMPOS
              <Badge className="ml-auto bg-blue-500 text-white text-xs">New</Badge>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/comunicaciones/email">
              <Mail className="h-4 w-4" />
              Comunicaciones
              <Badge className="ml-auto bg-blue-500 text-white text-xs">Nuevo</Badge>
            </Link>
          </Button>
          {/* Added email sending to quick actions */}
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/comunicaciones/email">
              <Mail className="h-4 w-4" />
              Enviar Emails
              <Badge className="ml-auto bg-blue-500 text-white text-xs">Nuevo</Badge>
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* User Profile & Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Admin" />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs">
                AD
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900">Administrador</p>
              <p className="text-xs text-gray-500">admin@sur-realista.cl</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                3
              </Badge>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Ayuda</span>
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

        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-9" asChild>
          <Link href="/">
            <Home className="h-4 w-4" />
            Volver al Sitio
          </Link>
        </Button>
      </div>
    </div>
  )
}

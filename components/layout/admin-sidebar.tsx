"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Database,
  Brain,
  Globe,
  Zap,
  ChevronDown,
  ChevronRight,
  Plus,
  Upload,
  Shield,
  Home,
  Eye,
  TrendingUp,
  FileText,
  Bell,
  Search,
  User,
  LogOut,
  HelpCircle,
  Rocket,
  Activity,
  GitBranch,
  BookOpen,
  Code,
  Monitor,
  Target,
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
    title: "MVP & Desarrollo",
    icon: Rocket,
    badge: "Live",
    badgeVariant: "default",
    badgeColor: "bg-green-500",
    children: [
      {
        title: "MVP Dashboard",
        href: "/admin/mvp-completo",
        icon: Rocket,
        badge: "Live",
        badgeColor: "bg-green-500",
      },
      {
        title: "Seguimiento MVP",
        href: "/mvp/seguimiento",
        icon: Activity,
        badge: "11%",
        badgeColor: "bg-blue-500",
      },
      {
        title: "Updates & Releases",
        href: "/mvp/updates",
        icon: GitBranch,
        badge: "v1.2",
        badgeColor: "bg-purple-500",
      },
      {
        title: "Roadmap",
        href: "/mvp/roadmap",
        icon: TrendingUp,
      },
      {
        title: "Fase 1 MVP",
        href: "/admin/fase-1-mvp",
        icon: Target,
      },
    ],
  },
  {
    title: "Propiedades",
    icon: Building2,
    badge: "12",
    badgeVariant: "secondary",
    children: [
      {
        title: "Lista de Propiedades",
        href: "/admin/propiedades",
        icon: Eye,
      },
      {
        title: "Nueva Propiedad",
        href: "/admin/propiedades/nueva",
        icon: Plus,
      },
      {
        title: "Importar Propiedades",
        href: "/admin/importar-propiedades",
        icon: Upload,
      },
      {
        title: "Verificar Destacadas",
        href: "/admin/verificar-destacadas",
        icon: Shield,
      },
      {
        title: "Organizador de Datos",
        href: "/admin/organizador-datos",
        icon: Database,
      },
    ],
  },
  {
    title: "Usuarios",
    href: "/admin/usuarios",
    icon: Users,
    badge: "3",
    badgeVariant: "secondary",
  },
  {
    title: "Mensajes",
    href: "/admin/mensajes",
    icon: MessageSquare,
    badge: "5",
    badgeVariant: "destructive",
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "IA Workspace",
    icon: Brain,
    badge: "NEW",
    badgeVariant: "default",
    children: [
      {
        title: "Dashboard IA",
        href: "/admin/ia-workspace",
        icon: Brain,
      },
      {
        title: "Análisis Integral",
        href: "/admin/analisis-integral",
        icon: TrendingUp,
      },
      {
        title: "Conexiones de Datos",
        href: "/admin/conexiones-datos",
        icon: Database,
      },
    ],
  },
  {
    title: "Integraciones",
    icon: Globe,
    children: [
      {
        title: "Dashboard CIREN",
        href: "/admin/ciren-dashboard",
        icon: Shield,
        badge: "LIVE",
        badgeVariant: "default",
      },
      {
        title: "Demo CIREN",
        href: "/admin/ciren-demo",
        icon: Zap,
      },
      {
        title: "Integración CIREN",
        href: "/admin/ciren-integration",
        icon: Database,
      },
    ],
  },
  {
    title: "Documentación",
    icon: BookOpen,
    badge: "Docs",
    badgeVariant: "outline",
    children: [
      {
        title: "Documentación Técnica",
        href: "/docs/tecnica",
        icon: Code,
      },
      {
        title: "Guías de Usuario",
        href: "/docs/usuario",
        icon: FileText,
      },
      {
        title: "Documentación IA",
        href: "/docs/ia",
        icon: Brain,
        badge: "IA",
      },
      {
        title: "API Reference",
        href: "/docs/api",
        icon: Settings,
      },
      {
        title: "Arquitectura Sistema",
        href: "/docs/arquitectura",
        icon: Monitor,
      },
    ],
  },
  {
    title: "Herramientas",
    icon: Settings,
    children: [
      {
        title: "Seed Database",
        href: "/admin/seed",
        icon: Database,
      },
      {
        title: "Scraper Guide",
        href: "/admin/scraper-guide",
        icon: FileText,
      },
      {
        title: "Import Data",
        href: "/admin/import-data",
        icon: Upload,
      },
      {
        title: "Verificar Esquema",
        href: "/admin/verificar-esquema",
        icon: Shield,
      },
    ],
  },
]

const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/dashboard": "Dashboard",
    "/admin/mvp-completo": "MVP Dashboard",
    "/mvp/seguimiento": "Seguimiento MVP",
    "/mvp/updates": "Updates & Releases",
    "/mvp/roadmap": "Roadmap MVP",
    "/admin/fase-1-mvp": "Fase 1 MVP",
    "/admin/propiedades": "Propiedades",
    "/admin/propiedades/nueva": "Nueva Propiedad",
    "/admin/importar-propiedades": "Importar Propiedades",
    "/admin/verificar-destacadas": "Verificar Destacadas",
    "/admin/organizador-datos": "Organizador de Datos",
    "/admin/usuarios": "Gestión de Usuarios",
    "/admin/mensajes": "Centro de Mensajes",
    "/admin/analytics": "Analytics y Reportes",
    "/admin/ia-workspace": "IA Workspace",
    "/admin/analisis-integral": "Análisis Integral",
    "/admin/conexiones-datos": "Conexiones de Datos",
    "/admin/ciren-dashboard": "Dashboard CIREN",
    "/admin/ciren-demo": "Demo CIREN",
    "/admin/ciren-integration": "Integración CIREN",
    "/docs/tecnica": "Documentación Técnica",
    "/docs/usuario": "Guías de Usuario",
    "/docs/ia": "Documentación IA",
    "/docs/api": "API Reference",
    "/docs/arquitectura": "Arquitectura del Sistema",
    "/admin/seed": "Seed Database",
    "/admin/scraper-guide": "Guía de Scraper",
    "/admin/import-data": "Importar Datos",
    "/admin/verificar-esquema": "Verificar Esquema",
  }

  return routes[pathname] || "Panel de Administración"
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [openItems, setOpenItems] = useState<string[]>([
    "MVP & Desarrollo",
    "Propiedades",
    "IA Workspace",
    "Integraciones",
    "Documentación",
  ])
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
            <Link href="/admin/mvp-completo">
              <Rocket className="h-4 w-4" />
              MVP Dashboard
              <Badge className="ml-auto bg-green-500 text-white text-xs">Live</Badge>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/admin/propiedades/nueva">
              <Plus className="h-4 w-4" />
              Nueva Propiedad
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/mvp/seguimiento">
              <Activity className="h-4 w-4" />
              Seguimiento MVP
              <Badge className="ml-auto bg-blue-500 text-white text-xs">11%</Badge>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 bg-transparent" asChild>
            <Link href="/docs/tecnica">
              <BookOpen className="h-4 w-4" />
              Documentación
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

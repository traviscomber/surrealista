"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Database,
  Brain,
  FileText,
  TrendingUp,
  Shield,
  Globe,
  Zap,
  ChevronDown,
  ChevronRight,
  Plus,
  Upload,
  Eye,
  Tag,
  Building2, // Import Building2 icon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Usuarios",
    href: "/admin/usuarios",
    icon: Users,
    badge: "3",
  },
  {
    title: "Mensajes",
    href: "/admin/mensajes",
    icon: MessageSquare,
    badge: "5",
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Tags Transversales",
    icon: Tag,
    badge: "NEW",
    children: [
      {
        title: "Gestión de Tags",
        href: "/admin/tags",
        icon: Tag,
      },
      {
        title: "Vincular Tags",
        href: "/admin/tags/vincular",
        icon: Plus,
      },
    ],
  },
  {
    title: "Gestión Documentos",
    icon: FileText,
    badge: "NEW",
    children: [
      {
        title: "Organización Carpetas",
        href: "/admin/organizacion-carpetas-demo",
        icon: FileText,
        badge: "Demo",
      },
      {
        title: "Google Drive Integration",
        href: "/admin/google-drive-integration",
        icon: Database,
        badge: "Etapa 1",
      },
      {
        title: "Importar desde Drive",
        href: "/admin/google-drive-importer",
        icon: Upload,
      },
    ],
  },
  {
    title: "IA Workspace",
    icon: Brain,
    badge: "NEW",
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
    ],
  },
]

export function AdminMenu() {
  const pathname = usePathname()
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (title: string) => {
    setOpenItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  const isActive = (href: string) => {
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
                "w-full justify-start gap-2 h-10",
                level > 0 && "ml-4",
                isItemActive && "bg-blue-100 text-blue-700",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <Badge variant={item.badge === "NEW" ? "default" : "secondary"} className="text-xs">
                  {item.badge}
                </Badge>
              )}
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
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
            "w-full justify-start gap-2 h-10",
            level > 0 && "ml-4",
            isItemActive && "bg-blue-100 text-blue-700 font-medium",
          )}
        >
          <item.icon className="h-4 w-4" />
          <span className="flex-1 text-left">{item.title}</span>
          {item.badge && (
            <Badge
              variant={item.badge === "NEW" || item.badge === "LIVE" ? "default" : "secondary"}
              className={cn("text-xs", item.badge === "LIVE" && "bg-green-500 text-white")}
            >
              {item.badge}
            </Badge>
          )}
        </Button>
      </Link>
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Panel de Administración</h2>
        <p className="text-sm text-gray-500">Sur-Realista</p>
      </div>

      <nav className="p-4 space-y-1">{menuItems.map((item) => renderMenuItem(item))}</nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 mt-auto">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Acciones Rápidas</h3>
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-transparent" asChild>
            <Link href="/admin/tags">
              <Tag className="h-4 w-4" />
              Gestión Tags
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-transparent" asChild>
            <Link href="/admin/ciren-dashboard">
              <Shield className="h-4 w-4" />
              Dashboard CIREN
            </Link>
          </Button>
        </div>
      </div>

      {/* Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Admin
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>Panel de Administración</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admin/tags" className="flex items-center">
              <Tag className="mr-2 h-4 w-4" />
              <span>Tags</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admin/usuarios" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              <span>Usuarios</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admin/mensajes" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Mensajes</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

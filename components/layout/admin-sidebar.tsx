"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Mail,
  MapPin,
  Search,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"

interface MenuItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    title: "Panel principal",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Explorador de Campos",
    href: "/",
    icon: Search,
  },
  {
    title: "Datos geográficos KMZ",
    icon: MapPin,
    children: [
      {
        title: "Estado de indexación",
        href: "/admin/kmz-status",
        icon: AlertCircle,
      },
      {
        title: "Guía de uso",
        href: "/kmz-guide",
        icon: HelpCircle,
      },
      {
        title: "Administrar archivos KMZ",
        href: "/admin/kmz-collection",
        icon: Database,
      },
      {
        title: "Indexar ubicaciones",
        href: "/admin/kmz",
        icon: MapPin,
      },
      {
        title: "Buscar por ubicación",
        href: "/kmz-search",
        icon: Search,
      },
    ],
  },
  {
    title: "Comunicaciones",
    icon: Mail,
    children: [
      {
        title: "Enviar correos",
        href: "/comunicaciones/email",
        icon: Mail,
      },
      {
        title: "Historial de envíos",
        href: "/comunicaciones/email",
        icon: FileText,
      },
    ],
  },
  {
    title: "Explorador de roles SII",
    href: "/admin/sii-rol-explorer",
    icon: Database,
  },
  {
    title: "Descubrimiento de propietarios",
    href: "/admin/owner-discovery",
    icon: Users,
    badge: "285",
    badgeVariant: "default",
  },
]

const PAGE_TITLES: Record<string, string> = {
  "/": "Explorador de Campos",
  "/admin": "Panel principal",
  "/busqueda": "Explorador de Campos",
  "/campos": "Mapa de campos",
  "/admin/kmz-status": "Estado de indexación KMZ",
  "/admin/kmz-collection": "Administrar archivos KMZ",
  "/admin/kmz": "Indexar ubicaciones KMZ",
  "/kmz-search": "Buscar por ubicación KMZ",
  "/kmz-guide": "Guía de datos KMZ",
  "/admin/sii-rol-explorer": "Explorador de roles SII",
  "/admin/owner-discovery": "Descubrimiento de propietarios",
  "/comunicaciones/email": "Comunicaciones por correo",
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pageTitle = PAGE_TITLES[pathname] || "Panel de Administración"
  const isKMZCollection = pathname === "/admin/kmz-collection"

  const toggleItem = (title: string) => {
    setExpandedItems((current) => current.includes(title)
      ? current.filter((item) => item !== title)
      : [...current, title])
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "/busqueda"
    if (href === "/admin") return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = Boolean(item.children?.length)
    const isOpen = expandedItems.includes(item.title)

    if (hasChildren) {
      return (
        <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleItem(item.title)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-10 w-full justify-start gap-3 px-3 text-sm font-medium",
                level > 0 && "ml-4 w-[calc(100%-1rem)]",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate text-left">{item.title}</span>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      )
    }

    return (
      <Button
        key={item.title}
        asChild
        variant="ghost"
        className={cn(
          "h-10 w-full justify-start gap-3 px-3 text-sm font-medium",
          level > 0 && "ml-4 w-[calc(100%-1rem)]",
          item.href && isActive(item.href) && "bg-primary/10 text-primary",
        )}
      >
        <Link href={item.href || "#"}>
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate text-left">{item.title}</span>
          {item.badge && <Badge variant={item.badgeVariant || "secondary"}>{item.badge}</Badge>}
        </Link>
      </Button>
    )
  }

  return (
    <aside className="flex h-full w-80 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Panel de Administración</h2>
            <p className="text-sm text-muted-foreground">Sur-Realista</p>
          </div>
        </div>

        <h1 className="mb-4 text-xl font-semibold">{pageTitle}</h1>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Buscar sección..." className="h-9 pl-10" />
        </label>
      </div>

      {!isKMZCollection ? (
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
      ) : (
        <div className="flex-1" />
      )}

      <div className="border-t border-border p-4 text-sm text-muted-foreground">
        Panel interno Sur-Realista
      </div>
    </aside>
  )
}

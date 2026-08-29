"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Building2,
  Calculator,
  ChevronRight,
  CircleHelp,
  Database,
  FolderOpen,
  LayoutDashboard,
  MapPinned,
  Radar,
  Search,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const domains = [
  { label: "Inicio", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Campos", href: "/campos", icon: FolderOpen },
  { label: "Mercado", href: "/busqueda", icon: Search },
  { label: "Inteligencia", href: "/admin/inteligencia-territorial", icon: MapPinned },
  { label: "Oportunidades", href: "/home-spotter", icon: Radar },
  { label: "Valorización", href: "/cotizador", icon: Calculator },
]

const secondary = [
  { label: "Inventario Sur Realista", href: "/admin/surealista", icon: Building2 },
  { label: "Fuentes y datos", href: "/admin/dashboard?tab=scrapers", icon: Database },
  { label: "Mercado Inciti", href: "/admin/inciti-market", icon: BarChart3 },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => {
    const cleanHref = href.split("?")[0]
    if (cleanHref === "/admin/dashboard") return pathname === "/admin/dashboard"
    return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`)
  }

  return (
    <aside className="hidden min-h-screen w-[244px] shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
      <div className="border-b border-border px-5 py-5">
        <Link href="/admin/dashboard" className="block leading-tight">
          <div className="text-sm font-semibold tracking-tight">Sur Realista</div>
          <div className="mt-1 text-xs text-muted-foreground">Operación interna</div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Áreas del producto">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Producto operativo</p>
        <div className="space-y-1">
          {domains.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex min-h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                  active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {active ? <ChevronRight className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> : null}
              </Link>
            )
          })}
        </div>

        <div className="my-5 border-t border-border" />
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Datos</p>
        <div className="space-y-1">
          {secondary.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <Link href="/admin" className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
          <Settings className="h-4 w-4" aria-hidden="true" />Administración
        </Link>
        <Link href="/ayuda" className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
          <CircleHelp className="h-4 w-4" aria-hidden="true" />Ayuda
        </Link>
      </div>
    </aside>
  )
}

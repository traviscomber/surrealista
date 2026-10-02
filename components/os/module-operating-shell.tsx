"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"
import {
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckSquare2,
  ChevronLeft,
  ChevronRight,
  Files,
  ImageIcon,
  LayoutDashboard,
  MapPinned,
  Settings,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Inicio", href: "/", icon: LayoutDashboard, match: (path: string) => path === "/" },
  { label: "Campos", href: "/campos", icon: MapPinned, match: (path: string) => path.startsWith("/campos") || path.startsWith("/kmz-analisis") || path.startsWith("/mapas") },
  { label: "Clientes", href: "/gestion-clientes", icon: Users, match: (path: string) => path.startsWith("/gestion-clientes") },
  { label: "Multimedia", href: "/comunicaciones", icon: ImageIcon, match: (path: string) => path.startsWith("/comunicaciones") },
  { label: "Documentos", href: "/documentacion", icon: Files, match: (path: string) => path.startsWith("/documentacion") },
  { label: "Mercado", href: "/mercado", icon: BriefcaseBusiness, match: (path: string) => path.startsWith("/mercado") || path.startsWith("/prospeccion") || path.startsWith("/propiedades") },
]

function moduleLabel(pathname: string) {
  return NAV_ITEMS.find((item) => item.match(pathname))?.label || "Operación"
}

export function ModuleOperatingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(true)
  const currentModule = useMemo(() => moduleLabel(pathname), [pathname])

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border/80 bg-card transition-[width] duration-200 lg:flex lg:flex-col",
          collapsed ? "w-[68px]" : "w-[244px]",
        )}
      >
        <div className="flex h-[60px] items-center border-b border-border/80 px-3">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-3" aria-label="Sur Realista · Inicio">
            <div className="grid h-9 w-9 shrink-0 place-items-center border border-border bg-background">
              <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Sur Realista</p>
                <p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Operating System</p>
              </div>
            ) : null}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Módulos de Sur Realista">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = item.match(pathname)
            return (
              <Link
                key={item.label}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                  active
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} aria-hidden="true" />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-1 border-t border-border/80 p-3">
          <Link
            href="/admin/dashboard"
            title={collapsed ? "Administración" : undefined}
            className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed ? <span>Administración</span> : null}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={collapsed ? "Expandir navegación" : "Colapsar navegación"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
            {!collapsed ? <span>Colapsar</span> : null}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sur Realista OS</p>
            <h1 className="truncate text-base font-semibold tracking-tight">{currentModule}</h1>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/gestion-tareas"
              className="flex min-h-9 items-center gap-2 rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <CheckSquare2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Tareas</span>
            </Link>
            <Link
              href="/asistente-ia"
              className="flex min-h-9 items-center gap-2 rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Bot className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Asistente IA</span>
            </Link>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

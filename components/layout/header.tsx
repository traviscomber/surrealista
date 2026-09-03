"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Activity,
  BookOpen,
  Calculator,
  CheckSquare,
  Database,
  FileText,
  FolderOpen,
  HelpCircle,
  MapPin,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react"
import { GlobalCommandPalette } from "@/components/search/global-command-palette"
import { ThemeToggle } from "@/components/ui/theme-toggle"

type MenuItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  badge?: string
}

const operationItems: MenuItem[] = [
  { title: "Campos", href: "/campos", icon: FolderOpen, description: "Mapa, inventario KMZ, regiones, vecinos y propietarios.", badge: "Principal" },
  { title: "Inteligencia territorial", href: "/kmz-analisis", icon: MapPin, description: "KMZ, vecindario, roles, capas y lectura territorial." },
  { title: "Mercado y comparables", href: "/mercado", icon: Search, description: "Inventario externo real, búsqueda comercial y comparables." },
  { title: "Valorización", href: "/cotizador", icon: Calculator, description: "Estimación basada en comparables y contexto disponible." },
  { title: "Clientes", href: "/clientes", icon: Users, description: "Ficha y seguimiento de clientes con datos reales." },
  { title: "Tareas", href: "/gestion-tareas", icon: CheckSquare, description: "Trabajo operativo y seguimientos registrados." },
  { title: "Comunicaciones", href: "/comunicaciones", icon: MessageSquare, description: "Historial y trazabilidad de comunicaciones." },
]

const adminItems: MenuItem[] = [
  { title: "Centro operativo", href: "/admin/dashboard", icon: Activity, description: "Excepciones, estado de datos y procesos activos." },
  { title: "Colección KMZ", href: "/admin/kmz-collection", icon: Database, description: "Inventario y estado de archivos territoriales." },
  { title: "Configuración", href: "/admin", icon: Settings, description: "Accesos y mantenimiento del panel." },
]

const docsItems: MenuItem[] = [
  { title: "Ayuda", href: "/ayuda", icon: HelpCircle, description: "Guías operativas y preguntas frecuentes." },
  { title: "Guía de usuario", href: "/docs/usuario", icon: FileText, description: "Uso interno paso a paso." },
  { title: "Documentación técnica", href: "/docs/tecnica", icon: BookOpen, description: "Arquitectura, flujos y APIs." },
]

export function Header() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const renderMenuItem = (item: MenuItem) => (
    <DropdownMenuItem key={item.title} asChild>
      <Link href={item.href} className={cn("flex items-start gap-3 rounded-md px-3 py-2", isActive(item.href) && "bg-accent text-accent-foreground")}>
        <item.icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">
          <span className="flex items-center gap-2 font-medium">
            {item.title}
            {item.badge ? <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px] uppercase tracking-wide">{item.badge}</Badge> : null}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{item.description}</span>
        </span>
      </Link>
    </DropdownMenuItem>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link href="/campos" className="min-w-0 leading-tight" aria-label="Ir a Campos">
          <div className="truncate text-sm font-semibold tracking-tight">Sur Realista</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">Inteligencia territorial</div>
        </Link>

        <div className="hidden items-center gap-2 xl:flex">
          <Button asChild variant={pathname.startsWith("/campos") ? "secondary" : "ghost"} className="h-10 gap-2 px-3">
            <Link href="/campos"><FolderOpen className="h-4 w-4" aria-hidden="true" />Campos</Link>
          </Button>
          <GlobalCommandPalette />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 px-3"><Search className="h-4 w-4" aria-hidden="true" />Más funciones</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel>Funciones operativas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {operationItems.map(renderMenuItem)}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 px-3"><Shield className="h-4 w-4" aria-hidden="true" />Admin</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel>Operación y calidad de datos</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {adminItems.map(renderMenuItem)}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 px-3"><BookOpen className="h-4 w-4" aria-hidden="true" />Docs</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Documentación interna</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {docsItems.map(renderMenuItem)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <div className="xl:hidden"><GlobalCommandPalette /></div>
          <ThemeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="xl:hidden">
              <Button variant="ghost" size="sm"><Menu className="h-5 w-5" aria-hidden="true" /><span className="sr-only">Abrir menú</span></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="mt-4 space-y-6">
                <Link href="/campos" onClick={() => setIsOpen(false)} className="block border-b pb-4 leading-tight">
                  <div className="text-sm font-semibold tracking-tight">Sur Realista</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Inteligencia territorial</div>
                </Link>

                <div className="space-y-2">
                  <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Operación</p>
                  {operationItems.map((item) => (
                    <Link key={item.title} href={item.href} onClick={() => setIsOpen(false)} className={cn("flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent", isActive(item.href) && "bg-accent text-accent-foreground")}>
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      <span className="flex-1">{item.title}</span>
                      {item.badge ? <Badge variant="secondary" className="rounded-full">{item.badge}</Badge> : null}
                    </Link>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Admin</p>
                  {adminItems.map((item) => (
                    <Link key={item.title} href={item.href} onClick={() => setIsOpen(false)} className={cn("flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent", isActive(item.href) && "bg-accent text-accent-foreground")}>
                      <item.icon className="h-4 w-4" aria-hidden="true" /><span className="flex-1">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

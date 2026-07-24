"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
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
  Bot,
  BookOpen,
  Building2,
  Calculator,
  Database,
  FileText,
  HelpCircle,
  MapPin,
  Menu,
  Search,
  Shield,
  Store,
  Users,
} from "lucide-react"
import { GlobalCommandPalette } from "@/components/search/global-command-palette"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"

const toolsItems = [
  {
    title: "Explorador de Campos",
    href: "/",
    icon: Search,
    description: "Reúne campos, clientes, tareas, documentos, mapas y antecedentes territoriales.",
  },
  {
    title: "Cotizador",
    href: "/cotizador",
    icon: Calculator,
    description: "Prepara una referencia de valor con los antecedentes disponibles de una propiedad.",
  },
  {
    title: "Asistente de análisis",
    href: "/asistente-ia",
    icon: Bot,
    description: "Apoya consultas internas sobre propiedades, documentos y datos disponibles.",
  },
  {
    title: "Explorador de roles SII",
    href: "/admin/sii-rol-explorer",
    icon: Database,
    description: "Consulta roles territoriales y sus relaciones con los registros disponibles.",
  },
  {
    title: "Descubrimiento de propietarios",
    href: "/admin/owner-discovery",
    icon: Users,
    description: "Organiza candidatos, evidencias públicas y pendientes de validación.",
  },
  {
    title: "Gestor de descubrimiento de propiedades",
    href: "/admin/dashboard",
    icon: Database,
    description: "Panel de datos, scrapers activos e inventario consolidado de propiedades.",
  },
]

const adminItems = [
  { title: "Panel de datos", href: "/admin/dashboard", icon: Database },
  { title: "Inventario Sur Realista", href: "/admin/surealista", icon: Store },
  { title: "Gestión de propiedades", href: "/admin/propiedades", icon: Building2 },
  { title: "Fuentes y sincronización", href: "/admin/dashboard?tab=scrapers", icon: Database },
  { title: "Archivos territoriales KMZ", href: "/admin/kmz-collection", icon: MapPin },
]

const docsItems = [
  {
    title: "Centro de ayuda",
    href: "/ayuda",
    icon: HelpCircle,
    description: "Orientaciones para resolver tareas habituales dentro de la plataforma.",
  },
  {
    title: "Guías de usuario",
    href: "/docs/usuario",
    icon: FileText,
    description: "Procedimientos operativos para utilizar las herramientas principales.",
  },
  {
    title: "Documentación técnica",
    href: "/docs/tecnica",
    icon: BookOpen,
    description: "Arquitectura, integraciones, fuentes y criterios de funcionamiento.",
  },
]

function isActivePath(pathname: string, href: string) {
  const cleanHref = href.split("?")[0]
  if (cleanHref === "/") return pathname === "/"
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`)
}

function ToolLink({
  item,
  pathname,
  onClick,
}: {
  item: (typeof toolsItems)[number]
  pathname: string
  onClick?: () => void
}) {
  const active = isActivePath(pathname, item.href)

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group block select-none rounded-md border p-3 no-underline transition-colors",
        active
          ? "border-primary/25 bg-primary/5"
          : "border-transparent hover:border-border hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-2">
        <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
        <span className="text-sm font-medium leading-none text-foreground">{item.title}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{item.description}</p>
    </Link>
  )
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const toolsActive = toolsItems.some((item) => isActivePath(pathname, item.href))
  const docsActive = docsItems.some((item) => isActivePath(pathname, item.href))
  const adminActive = adminItems.some((item) => isActivePath(pathname, item.href))

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Ir al espacio de trabajo Sur Realista">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/25 bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="leading-none">
            <span className="block font-serif text-lg font-semibold tracking-tight text-foreground">Sur Realista</span>
            <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Espacio interno</span>
          </div>
        </Link>

        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="space-x-1">
            <NavigationMenuItem>
              <GlobalCommandPalette />
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className={cn("h-10", toolsActive && "bg-muted text-foreground")}>
                <Building2 className="mr-2 h-4 w-4" />
                Herramientas
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[620px] grid-cols-2 gap-2 p-4">
                  {toolsItems.map((item) => <ToolLink key={item.title} item={item} pathname={pathname} />)}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className={cn("h-10", docsActive && "bg-muted text-foreground")}>
                <BookOpen className="mr-2 h-4 w-4" />
                Documentación
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[540px] grid-cols-2 gap-2 p-4">
                  {docsItems.map((item) => {
                    const active = isActivePath(pathname, item.href)
                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "rounded-md border p-3 transition-colors",
                          active ? "border-primary/25 bg-primary/5" : "border-transparent hover:border-border hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <item.icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                          {item.title}
                        </div>
                        <p className="mt-2 text-sm leading-5 text-muted-foreground">{item.description}</p>
                      </Link>
                    )
                  })}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-3">
          <div className="lg:hidden"><GlobalCommandPalette /></div>
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={cn("hidden bg-transparent md:flex", adminActive && "border-primary/30 bg-primary/5")}>
                <Shield className="mr-2 h-4 w-4" />
                Administración
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72" align="end">
              <DropdownMenuLabel>
                <span className="block">Operaciones internas</span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">Datos, inventario y fuentes de información.</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {adminItems.map((item) => {
                const active = isActivePath(pathname, item.href)
                return (
                  <DropdownMenuItem key={item.title} asChild>
                    <Link href={item.href} aria-current={active ? "page" : undefined} className={cn("flex items-center py-2.5", active && "bg-muted")}>
                      <item.icon className={cn("mr-2 h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                      <span>{item.title}</span>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <div className="mt-4 space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/25 bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="block font-serif text-lg font-semibold">Sur Realista</span>
                    <span className="text-xs text-muted-foreground">Espacio interno</span>
                  </div>
                </div>

                <section>
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Herramientas</h3>
                  <div className="space-y-1">
                    {toolsItems.map((item) => <ToolLink key={item.title} item={item} pathname={pathname} onClick={() => setIsOpen(false)} />)}
                  </div>
                </section>

                <section className="border-t pt-4">
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Administración</h3>
                  {adminItems.map((item) => {
                    const active = isActivePath(pathname, item.href)
                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                          active ? "bg-muted text-foreground" : "hover:bg-muted"
                        )}
                      >
                        <item.icon className={cn("mr-2 h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />{item.title}
                      </Link>
                    )
                  })}
                </section>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

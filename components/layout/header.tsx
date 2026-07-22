"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

const badgeColorMap: Record<string, string> = {
  Gratis: "bg-blue-500",
  IA: "bg-cyan-500",
  Mercado: "bg-violet-500",
}

const toolsItems = [
  {
    title: "Explorador de Campos",
    href: "/",
    icon: Search,
    description: "Accede a campos, clientes, tareas, documentos y mapas en un solo lugar.",
    badge: "Mercado",
  },
  {
    title: "Cotizador",
    href: "/cotizador",
    icon: Calculator,
    description: "Calcula una referencia de valor para una propiedad.",
    badge: "Gratis",
  },
  {
    title: "Asistente IA",
    href: "/asistente-ia",
    icon: Bot,
    description: "Realiza consultas inteligentes sobre propiedades y antecedentes.",
    badge: "IA",
  },
  {
    title: "Explorador de roles SII",
    href: "/admin/sii-rol-explorer",
    icon: Database,
    description: "Consulta y relaciona roles territoriales disponibles.",
  },
  {
    title: "Descubrir propietarios",
    href: "/admin/owner-discovery",
    icon: Users,
    description: "Investiga posibles propietarios y relaciones documentales.",
  },
]

const adminItems = [
  { title: "Panel de datos", href: "/admin/dashboard", icon: Database },
  { title: "Inventario Sur Realista", href: "/admin/surealista", icon: Store },
  { title: "Gestión de propiedades", href: "/admin/propiedades", icon: Building2 },
  { title: "Scrapers y sincronización", href: "/admin/dashboard?tab=scrapers", icon: Database },
  { title: "Administrar archivos KMZ", href: "/admin/kmz-collection", icon: MapPin },
]

const docsItems = [
  {
    title: "Centro de Ayuda",
    href: "/ayuda",
    icon: HelpCircle,
    description: "Guías, tutoriales y preguntas frecuentes.",
  },
  {
    title: "Guías de usuario",
    href: "/docs/usuario",
    icon: FileText,
    description: "Manuales para usar las herramientas principales.",
  },
  {
    title: "Documentación técnica",
    href: "/docs/tecnica",
    icon: BookOpen,
    description: "Arquitectura, integraciones y especificaciones.",
  },
]

function ToolLink({ item, onClick }: { item: (typeof toolsItems)[number]; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent"
    >
      <div className="flex items-center gap-2">
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium leading-none">{item.title}</span>
        {item.badge && (
          <Badge className={cn("ml-auto text-xs text-white", badgeColorMap[item.badge] || "bg-slate-500")}>
            {item.badge}
          </Badge>
        )}
      </div>
      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{item.description}</p>
    </Link>
  )
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-forest">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-primary to-forest bg-clip-text font-serif text-xl font-semibold text-transparent">
            Sur-Realista
          </span>
        </Link>

        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="space-x-1">
            <NavigationMenuItem>
              <GlobalCommandPalette />
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-10">
                <Building2 className="mr-2 h-4 w-4" />
                Herramientas
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[620px] grid-cols-2 gap-2 p-4">
                  {toolsItems.map((item) => <ToolLink key={item.title} item={item} />)}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-10">
                <BookOpen className="mr-2 h-4 w-4" />
                Documentación
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[540px] grid-cols-2 gap-2 p-4">
                  {docsItems.map((item) => (
                    <Link key={item.title} href={item.href} className="space-y-1 rounded-md p-3 transition-colors hover:bg-accent">
                      <div className="flex items-center gap-2 text-sm font-medium"><item.icon className="h-4 w-4" />{item.title}</div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </Link>
                  ))}
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
              <Button variant="outline" size="sm" className="hidden bg-transparent md:flex">
                <Shield className="mr-2 h-4 w-4" />Admin
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuLabel>Operaciones internas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {adminItems.map((item) => (
                <DropdownMenuItem key={item.title} asChild>
                  <Link href={item.href} className="flex items-center">
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
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
                <div className="flex items-center gap-2 border-b pb-4">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-serif text-lg font-semibold">Sur-Realista</span>
                </div>

                <section>
                  <h3 className="mb-2 px-3 text-sm font-semibold text-muted-foreground">Herramientas</h3>
                  <div className="space-y-1">
                    {toolsItems.map((item) => <ToolLink key={item.title} item={item} onClick={() => setIsOpen(false)} />)}
                  </div>
                </section>

                <section className="border-t pt-4">
                  <h3 className="mb-2 px-3 text-sm font-semibold text-muted-foreground">Administración</h3>
                  {adminItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      <item.icon className="mr-2 h-4 w-4" />{item.title}
                    </Link>
                  ))}
                </section>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

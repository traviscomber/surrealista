"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Building2,
  Menu,
  Calculator,
  Bot,
  Brain,
  MapPin,
  FileText,
  TrendingUp,
  Rocket,
  BookOpen,
  GitBranch,
  Activity,
  Settings,
  BarChart3,
  Shield,
  FolderOpen,
  Map,
  Search,
  Tag,
} from "lucide-react"
import { GlobalCommandPalette } from "@/components/search/global-command-palette"
// import { DriveStatusIndicator } from "@/components/google-drive/drive-status-indicator"

const toolsItems = [
  {
    title: "Cotizador",
    href: "/cotizador",
    icon: Calculator,
    description: "Calcula el valor de tu propiedad",
    badge: "Gratis",
  },
  {
    title: "Asistente IA",
    href: "/asistente-ia",
    icon: Bot,
    description: "Consulta inteligente sobre propiedades",
    badge: "IA",
  },
  {
    title: "Agentes Documentales",
    href: "/admin/agentes",
    icon: Brain,
    description: "Sistema agéntico para gestión documental automática",
    badge: "Nuevo",
    badgeColor: "bg-purple-500",
  },
  {
    title: "Lector KMZ",
    href: "/admin/kmz-reader",
    icon: Map,
    description: "Procesamiento múltiple de archivos KMZ geoespaciales",
    badge: "Beta",
    badgeColor: "bg-orange-500",
  },
  {
    title: "Tecnología IA",
    href: "/tecnologia-ia",
    icon: Brain,
    description: "Descubre nuestras capacidades de IA",
    badge: "Nuevo",
  },
  {
    title: "Mapas Interactivos",
    href: "/mapas",
    icon: MapPin,
    description: "Explora ubicaciones en mapas detallados",
  },
  {
    title: "Google Drive Integration",
    href: "/admin/google-drive-integration",
    icon: FolderOpen,
    description: "Integración completa con Google Drive - PRIORIDAD",
    badge: "Activo",
    badgeColor: "bg-green-500",
  },
  {
    title: "Organización Carpetas",
    href: "/admin/organizacion-carpetas-demo",
    icon: FolderOpen,
    description: "Demo de organización profesional de carpetas",
    badge: "Demo",
  },
  {
    title: "Análisis de Vecindario KMZ",
    href: "/kmz-analisis",
    icon: MapPin,
    description: "Identifica roles vecinos, accesos y distancias",
    badge: "Análisis",
    badgeColor: "bg-emerald-500",
  },
]

const mvpItems = [
  {
    title: "Seguimiento MVP",
    href: "/mvp/seguimiento",
    icon: Activity,
    description: "Estado actual y progreso completo del desarrollo",
    badge: "85%",
    badgeColor: "bg-blue-500",
  },
  {
    title: "Fase 1 - MVP",
    href: "/admin/fase-1-mvp",
    icon: Rocket,
    description: "Gestión documental y organización de carpetas",
    badge: "Fase 1",
    badgeColor: "bg-green-500",
  },
  {
    title: "Fase 2 - MVP",
    href: "/admin/fase-2-mvp",
    icon: TrendingUp,
    description: "Automatización y análisis inteligente",
    badge: "Fase 2",
    badgeColor: "bg-orange-500",
  },
  {
    title: "Fase 3 - MVP",
    href: "/admin/fase-3-mvp",
    icon: BarChart3,
    description: "Optimización y escalabilidad",
    badge: "Fase 3",
    badgeColor: "bg-purple-500",
  },
  {
    title: "Agentes Documentales",
    href: "/admin/agentes",
    icon: Brain,
    description: "Sistema agéntico para automatización documental",
    badge: "Semana 4",
    badgeColor: "bg-purple-500",
  },
  {
    title: "Updates & Releases",
    href: "/mvp/updates",
    icon: GitBranch,
    description: "Historial de actualizaciones y nuevas funciones",
    badge: "v1.2",
    badgeColor: "bg-purple-500",
  },
  {
    title: "Roadmap",
    href: "/mvp/roadmap",
    icon: TrendingUp,
    description: "Hoja de ruta y próximas funcionalidades",
  },
]

const docsItems = [
  {
    title: "Documentación Técnica",
    href: "/docs/tecnica",
    icon: BookOpen,
    description: "Arquitectura, APIs y especificaciones técnicas",
  },
  {
    title: "Guías de Usuario",
    href: "/docs/usuario",
    icon: FileText,
    description: "Manuales y tutoriales para usuarios",
  },
  {
    title: "Documentación IA",
    href: "/docs/ia",
    icon: Brain,
    description: "Modelos, algoritmos y capacidades de IA",
    badge: "IA",
  },
  {
    title: "API Reference",
    href: "/docs/api",
    icon: Settings,
    description: "Documentación completa de APIs",
  },
]

export function Header() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-forest">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-serif font-semibold bg-gradient-to-r from-primary to-forest bg-clip-text text-transparent">
            Sur-Realista
          </span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="space-x-1">
            <NavigationMenuItem>
              <GlobalCommandPalette />
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/busqueda">
                <Button variant={isActive("/busqueda") ? "default" : "ghost"} size="sm" className="h-10">
                  <Search className="mr-2 h-4 w-4" />
                  Búsqueda
                  <Badge className="ml-2 text-xs bg-green-500 text-white">New</Badge>
                </Button>
              </Link>
            </NavigationMenuItem>

            {/* Tools Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-10">
                <Building2 className="mr-2 h-4 w-4" />
                Herramientas
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {toolsItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <div className="text-sm font-medium leading-none">{item.title}</div>
                        {item.badge && (
                          <Badge className={cn("text-xs text-white", item.badgeColor || "bg-blue-500")}>
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{item.description}</p>
                    </Link>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Documentation Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-10">
                <BookOpen className="mr-2 h-4 w-4" />
                Documentación
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {docsItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <div className="text-sm font-medium leading-none">{item.title}</div>
                        {item.badge && (
                          <Badge className={cn("text-xs text-white", item.badgeColor || "bg-blue-500")}>
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{item.description}</p>
                    </Link>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Admin Access */}
        <div className="flex items-center space-x-4">
          <div className="lg:hidden">
            <GlobalCommandPalette />
          </div>

          {/* Drive status indicator */}
          {/* <DriveStatusIndicator /> */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden md:flex bg-transparent">
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Panel de Administración</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/busqueda" className="flex items-center">
                  <Search className="mr-2 h-4 w-4" />
                  <span>Búsqueda Unificada</span>
                  <Badge className="ml-auto bg-green-500 text-white text-xs">New</Badge>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/tags" className="flex items-center">
                  <Tag className="mr-2 h-4 w-4" />
                  <span>Tags</span>
                  <Badge className="ml-auto bg-green-500 text-white text-xs">NEW</Badge>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/ia-workspace" className="flex items-center">
                  <Brain className="mr-2 h-4 w-4" />
                  <span>IA Workspace</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/agentes" className="flex items-center">
                  <Brain className="mr-2 h-4 w-4" />
                  <span>Agentes Documentales</span>
                  <Badge className="ml-auto bg-purple-500 text-white text-xs">Nuevo</Badge>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/kmz-analisis" className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>Análisis de Vecindario KMZ</span>
                  <Badge className="ml-auto bg-emerald-500 text-white text-xs">Nuevo</Badge>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-4 mt-4">
                <div className="flex items-center space-x-2 pb-4 border-b">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-forest">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-serif font-semibold">Sur-Realista</span>
                </div>

                <div className="space-y-2">
                  <Link
                    href="/busqueda"
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent bg-green-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4" />
                      <span>Búsqueda Unificada</span>
                    </div>
                    <Badge className="bg-green-500 text-white text-xs">New</Badge>
                  </Link>
                </div>

                {/* Mobile Tools */}
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-muted-foreground px-3">Herramientas</h3>
                  {toolsItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>

                {/* Mobile Documentation */}
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-muted-foreground px-3">Documentación</h3>
                  {docsItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>

                {/* Mobile Admin */}
                <div className="space-y-2 pt-4 border-t">
                  <Link
                    href="/admin/tags"
                    className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    <Tag className="h-4 w-4" />
                    <span>Tags</span>
                    <Badge className="ml-auto bg-green-500 text-white text-xs">NEW</Badge>
                  </Link>
                  <Link
                    href="/admin/ia-workspace"
                    className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    <Brain className="h-4 w-4" />
                    <span>IA Workspace</span>
                  </Link>
                  <Link
                    href="/admin/agentes"
                    className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    <span>Agentes Documentales</span>
                    <Badge className="ml-auto bg-purple-500 text-white text-xs">Nuevo</Badge>
                  </Link>
                  <Link
                    href="/kmz-analisis"
                    className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>Análisis de Vecindario KMZ</span>
                    <Badge className="ml-auto bg-emerald-500 text-white text-xs">Nuevo</Badge>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

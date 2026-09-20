"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  BookOpen,
  Calculator,
  CheckSquare,
  FolderOpen,
  HelpCircle,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Search,
  Settings,
  Sprout,
  Users,
} from "lucide-react"
import { GlobalCommandPalette } from "@/components/search/global-command-palette"
import { ThemeToggle } from "@/components/ui/theme-toggle"

type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const primaryItems: NavItem[] = [
  { title: "Campos", href: "/campos", icon: FolderOpen },
  { title: "Prospección", href: "/prospeccion", icon: Sprout },
  { title: "Mercado", href: "/mercado", icon: Search },
  { title: "Clientes", href: "/clientes", icon: Users },
]

const moreItems: NavItem[] = [
  { title: "Valorización", href: "/cotizador", icon: Calculator, description: "Estimar valor con comparables y contexto." },
  { title: "Tareas", href: "/gestion-tareas", icon: CheckSquare, description: "Seguimientos y trabajo operativo." },
  { title: "Comunicaciones", href: "/comunicaciones", icon: MessageSquare, description: "Historial comercial y trazabilidad." },
]

const supportItems: NavItem[] = [
  { title: "Centro operativo", href: "/admin/dashboard", icon: Settings },
  { title: "Ayuda", href: "/ayuda", icon: HelpCircle },
  { title: "Guía de usuario", href: "/docs/usuario", icon: BookOpen },
]

function sectionLabel(pathname: string) {
  if (pathname.startsWith("/prospeccion")) return "Prospección"
  if (pathname.startsWith("/campos")) return "Campos"
  if (pathname.startsWith("/mercado") || pathname.startsWith("/busqueda")) return "Mercado"
  if (pathname.startsWith("/clientes")) return "Clientes"
  if (pathname.startsWith("/cotizador")) return "Valorización"
  if (pathname.startsWith("/admin")) return "Centro operativo"
  return "Sur Realista"
}

export function Header({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/campos" className="min-w-0 leading-tight" aria-label="Ir a Campos">
          <div className="truncate text-sm font-semibold tracking-tight">{compact ? sectionLabel(pathname) : "Sur Realista"}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{compact ? "Sur Realista" : "Inteligencia territorial"}</div>
        </Link>

        {!compact ? (
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegación principal">
            {primaryItems.map((item) => (
              <Button key={item.href} asChild variant={isActive(item.href) ? "secondary" : "ghost"} className="h-10 gap-2 px-3">
                <Link href={item.href}><item.icon className="h-4 w-4" aria-hidden="true" />{item.title}</Link>
              </Button>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 px-3"><MoreHorizontal className="h-4 w-4" aria-hidden="true" />Más</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Trabajo comercial</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {moreItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-start gap-3 px-3 py-2">
                      <item.icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        <span className="block font-medium">{item.title}</span>
                        <span className="block text-xs text-muted-foreground">{item.description}</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {supportItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center gap-3"><item.icon className="h-4 w-4" aria-hidden="true" />{item.title}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          <GlobalCommandPalette />
          <ThemeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="sm"><Menu className="h-5 w-5" aria-hidden="true" /><span className="sr-only">Abrir menú</span></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="mt-4 space-y-6">
                <Link href="/campos" onClick={() => setIsOpen(false)} className="block border-b pb-4 leading-tight">
                  <div className="text-sm font-semibold tracking-tight">Sur Realista</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Inteligencia territorial</div>
                </Link>

                <div className="space-y-2">
                  <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Principal</p>
                  {primaryItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={cn("flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent", isActive(item.href) && "bg-accent font-medium text-accent-foreground")}>
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Trabajo</p>
                  {moreItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={cn("flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent", isActive(item.href) && "bg-accent font-medium text-accent-foreground")}>
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-1">
                  {supportItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.title}</span>
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

"use client"

import Link from "next/link"
import { Building2, LayoutDashboard, ListTodo, Menu, Plus, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const NAV_ITEMS = [
  { href: "/", label: "Sitio público" },
  { href: "/busqueda", label: "Buscar propiedades", icon: ListTodo },
  { href: "/nueva-tarea", label: "Nueva búsqueda", icon: Plus },
  { href: "/admin/dashboard", label: "Panel de datos", icon: LayoutDashboard },
  { href: "/admin/surealista", label: "Inventario Sur Realista", icon: Store },
  { href: "/admin/propiedades", label: "Gestión de propiedades", icon: Building2 },
]

function NavLink({ href, label, icon: Icon }: (typeof NAV_ITEMS)[number]) {
  return (
    <Link href={href} className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors hover:text-primary">
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </Link>
  )
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">Sur-Realista</span>
          </Link>

          <nav className="hidden items-center gap-5 xl:flex">
            {NAV_ITEMS.map((item) => <NavLink key={item.href} {...item} />)}
          </nav>
        </div>

        <Sheet>
          <SheetTrigger asChild className="xl:hidden">
            <Button variant="ghost" size="icon" aria-label="Abrir navegación">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="mt-8 flex flex-col gap-5">
              {NAV_ITEMS.map((item) => <NavLink key={item.href} {...item} />)}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

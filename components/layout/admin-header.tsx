"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, BarChart3, Database, Home, Map, Package } from "lucide-react"

import { Button } from "@/components/ui/button"

const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    "/admin": "Administración",
    "/admin/dashboard": "Panel de datos",
    "/admin/propiedades": "Propiedades",
    "/admin/propiedades/nueva": "Nueva propiedad",
    "/admin/importar-propiedades": "Importar propiedades",
    "/admin/verificar-destacadas": "Verificar destacadas",
    "/admin/usuarios": "Usuarios",
    "/admin/mensajes": "Mensajes",
    "/admin/analytics": "Análisis y reportes",
    "/admin/ia-workspace": "Espacio de IA",
    "/admin/analisis-integral": "Análisis integral",
    "/admin/conexiones-datos": "Conexiones de datos",
    "/admin/ciren-dashboard": "Panel CIREN",
    "/admin/ciren-demo": "Demostración CIREN",
    "/admin/ciren-integration": "Integración CIREN",
    "/admin/seed": "Datos iniciales",
    "/admin/scraper-guide": "Guía de extracción",
    "/admin/import-data": "Importar datos",
    "/admin/kmz-vecindario": "Análisis de vecindario KMZ",
    "/admin/kmz-collection": "Colección KMZ",
    "/admin/clientes": "Administración de clientes",
    "/admin/clientes/nuevo": "Nuevo cliente",
  }

  return routes[pathname] || "Administración"
}

const getBreadcrumbs = (pathname: string): Array<{ label: string; href?: string }> => {
  const breadcrumbs: Array<{ label: string; href?: string }> = [{ label: "Administración", href: "/admin" }]
  if (pathname !== "/admin") breadcrumbs.push({ label: getPageTitle(pathname) })
  return breadcrumbs
}

const quickNavItems = [
  { label: "Inicio", href: "/", icon: Home },
  { label: "Campos", href: "/campos", icon: Map },
  { label: "Panel de datos", href: "/admin/dashboard", icon: BarChart3 },
  { label: "Colección KMZ", href: "/admin/kmz-collection", icon: Package },
  { label: "Conexiones", href: "/admin/conexiones-datos", icon: Database },
]

export function AdminHeader() {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="border-b border-border bg-card">
      <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="flex items-start gap-4">
          <Button asChild variant="outline" size="icon" aria-label="Volver a Campos">
            <Link href="/campos">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>

          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={`${crumb.label}-${index}`}>
                  {index > 0 && <span aria-hidden="true">/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition-colors hover:text-foreground">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <p className="sr-meta uppercase tracking-[0.18em]">Operación interna</p>
            <h1 className="mt-1 sr-page-title">{pageTitle}</h1>
          </div>
        </div>

        <nav className="flex max-w-full gap-1 overflow-x-auto border-b border-border" aria-label="Navegación administrativa">
          {quickNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-sm transition-colors ${
                  isActive
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

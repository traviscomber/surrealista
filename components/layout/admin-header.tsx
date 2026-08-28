"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    "/admin": "Administración",
    "/admin/dashboard": "Centro operativo",
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

export function AdminHeader() {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="border-b border-border bg-card">
      <div className="flex min-h-16 items-center gap-4 px-5 py-3 lg:px-8">
        <Button asChild variant="ghost" size="icon" aria-label="Volver a Campos">
          <Link href="/campos">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>

        <div className="min-w-0">
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
          <h1 className="sr-page-title truncate">{pageTitle}</h1>
        </div>
      </div>
    </header>
  )
}

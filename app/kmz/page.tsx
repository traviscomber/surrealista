'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, MapPin, Search } from 'lucide-react'

import { ModuleTasksDock } from '@/components/tasks/module-tasks-dock'
import { WorkspaceHeading } from '@/components/ui/workspace-heading'

const features = [
  {
    title: 'Búsqueda simple',
    description: 'Encuentra campos y elementos KMZ por nombre o término.',
    icon: Search,
    href: '/kmz-search',
  },
  {
    title: 'Búsqueda avanzada',
    description: 'Refina resultados por región, categoría y otros criterios disponibles.',
    icon: BarChart3,
    href: '/kmz-search-advanced',
  },
  {
    title: 'Mapa KMZ',
    description: 'Revisa geometrías y ubicaciones en una vista territorial dedicada.',
    icon: MapPin,
    href: '/kmz-map',
  },
]

export default function KMZHome() {
  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHeading
        eyebrow="Campos · Herramientas"
        title="Herramientas KMZ"
        description="Accede a búsqueda, filtros y mapa sin salir del contexto operativo de Campos."
        outcome="Localiza el campo correcto y vuelve a la ficha canónica para continuar la operación."
      />

      <section aria-labelledby="kmz-tools-heading">
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">01 · Accesos</p>
          <h2 id="kmz-tools-heading" className="mt-1 text-xl font-semibold">Explorar inventario KMZ</h2>
        </div>

        <div className="border-y border-border/70">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="group grid min-h-[88px] items-center gap-4 border-b border-border/70 px-1 py-4 transition-colors last:border-b-0 hover:bg-secondary/45 sm:grid-cols-[38px_180px_minmax(0,1fr)_24px] sm:px-3"
              >
                <span aria-hidden="true" className="font-mono text-[10px] text-muted-foreground">
                  0{index + 1}
                </span>
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="text-[15px] font-semibold">{feature.title}</h3>
                </div>
                <p className="text-[13px] leading-5 text-muted-foreground">{feature.description}</p>
                <ArrowRight className="hidden h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="border-l border-border/70 pl-5 text-sm leading-6 text-muted-foreground">
        Las herramientas KMZ son vistas de apoyo. La fuente operativa sigue siendo <Link href="/campos" className="font-medium text-foreground hover:underline">Campos</Link>.
      </section>

      <ModuleTasksDock module="campos" />
    </main>
  )
}

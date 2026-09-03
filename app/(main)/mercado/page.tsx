import Link from "next/link"
import { ArrowRight, Calculator, Search } from "lucide-react"

import { ScrapedPropertiesDashboard } from "@/components/admin/scraped-properties-dashboard"
import { Button } from "@/components/ui/button"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

export const dynamic = "force-dynamic"

export default function MarketWorkspacePage() {
  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <WorkspaceHeading
          eyebrow="Inteligencia comercial"
          title="Mercado y comparables"
          description="Explora el inventario externo activo, filtra por fuente, ubicación y tipo de propiedad, y prepara comparables para una decisión comercial o valorización."
          outcome="Convierte señales de mercado reales en una lista corta de propiedades comparables y próximos pasos verificables."
        />
        <div className="flex flex-wrap gap-2 lg:pb-1">
          <Button asChild variant="outline">
            <Link href="/busqueda">
              <Search className="h-4 w-4" aria-hidden="true" />
              Centro operativo
            </Link>
          </Button>
          <Button asChild>
            <Link href="/cotizador">
              <Calculator className="h-4 w-4" aria-hidden="true" />
              Ir a Valorización
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      <ScrapedPropertiesDashboard mode="full" />
    </main>
  )
}

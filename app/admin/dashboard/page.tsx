"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { BarChart3, Building, Globe, PlusCircle, Store } from "lucide-react"
import { AppHeader } from "@/components/layout/app-header"
import { ScrapersPanel } from "@/components/admin/scrapers-panel"
import { ScrapedPropertiesDashboard } from "@/components/admin/scraped-properties-dashboard"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

const VALID_TABS = ["overview", "properties", "scrapers"]

export default function AdminDashboard() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const showFavorites = searchParams.get("favorites") === "true"
  const [activeTab, setActiveTab] = useState(
    VALID_TABS.includes(tabParam ?? "") ? (tabParam as string) : "overview",
  )

  useEffect(() => {
    const requestedTab = searchParams.get("tab")
    if (requestedTab && VALID_TABS.includes(requestedTab)) setActiveTab(requestedTab)
  }, [searchParams])

  return (
    <>
      <AppHeader />
      <main className="container mx-auto space-y-8 px-4 py-8 md:py-10">
        <WorkspaceHeading
          eyebrow="Operaciones internas"
          title="Panel de datos e inventario"
          description="Centraliza el control del inventario inmobiliario, las propiedades provenientes de fuentes externas y los procesos de sincronización que mantienen la información vigente."
          outcome="Obtienes una visión única del estado de los datos, puedes revisar propiedades activas y administrar las fuentes que alimentan el sistema."
          actions={
            <>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/admin/propiedades/nueva">
                  <PlusCircle className="h-4 w-4" />
                  Nueva propiedad
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/admin/surealista">
                  <Store className="h-4 w-4" />
                  Inventario Sur Realista
                </Link>
              </Button>
              <Button asChild className="gap-2">
                <Link href="/propiedades">
                  <Building className="h-4 w-4" />
                  Ver propiedades
                </Link>
              </Button>
            </>
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid h-auto grid-cols-1 gap-1 bg-muted/50 p-1 md:grid-cols-3">
            <TabsTrigger value="overview" className="flex min-h-11 items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Resumen operativo</span>
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex min-h-11 items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Inventario consolidado</span>
            </TabsTrigger>
            <TabsTrigger value="scrapers" className="flex min-h-11 items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Fuentes y sincronización</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="mb-4 max-w-3xl">
              <h2 className="font-serif text-xl font-semibold">Estado general</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Revisa los principales indicadores del inventario y detecta rápidamente qué áreas requieren actualización o seguimiento.
              </p>
            </div>
            <ScrapedPropertiesDashboard mode="summary" initialShowFavorites={showFavorites} />
          </TabsContent>

          <TabsContent value="properties" className="mt-0">
            <div className="mb-4 max-w-3xl">
              <h2 className="font-serif text-xl font-semibold">Propiedades disponibles</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Consulta y filtra el inventario consolidado para comparar propiedades, revisar favoritos y verificar la fuente de cada registro.
              </p>
            </div>
            <ScrapedPropertiesDashboard mode="full" initialShowFavorites={showFavorites} />
          </TabsContent>

          <TabsContent value="scrapers" className="mt-0">
            <div className="mb-4 max-w-3xl">
              <h2 className="font-serif text-xl font-semibold">Fuentes de información</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Supervisa las conexiones que incorporan información externa y ejecuta sincronizaciones solo cuando la fuente esté autorizada y disponible.
              </p>
            </div>
            <ScrapersPanel />
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}

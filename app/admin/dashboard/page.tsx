"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, BarChart3, Building, Globe, MapPinned } from "lucide-react"
import { MarketGeocodeHealth } from "@/components/admin/market-geocode-health"
import { ScrapersPanel } from "@/components/admin/scrapers-panel"
import { ScrapedPropertiesDashboard } from "@/components/admin/scraped-properties-dashboard"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

const VALID_TABS = ["overview", "properties", "scrapers"]

function AdminDashboardContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const showFavorites = searchParams.get("favorites") === "true"
  const [activeTab, setActiveTab] = useState(VALID_TABS.includes(tabParam ?? "") ? (tabParam as string) : "overview")
  useEffect(() => { const requestedTab = searchParams.get("tab"); if (requestedTab && VALID_TABS.includes(requestedTab)) setActiveTab(requestedTab) }, [searchParams])

  return <main className="container mx-auto space-y-8 px-4 py-8 md:py-10">
    <WorkspaceHeading eyebrow="Soporte a Campos" title="Centro operativo" description="Revisa excepciones, calidad de datos y sincronizaciones que afectan la vista principal de Campos. Los procesos sanos siguen trabajando en segundo plano." outcome="Si no hay errores ni excepciones críticas, vuelve a Campos y continúa la operación territorial." actions={
      <Button asChild className="gap-2"><Link href="/campos"><MapPinned className="h-4 w-4"/>Volver a Campos</Link></Button>
    }/>
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6 grid h-auto grid-cols-1 gap-1 bg-muted/50 p-1 md:grid-cols-3">
        <TabsTrigger value="overview" className="flex min-h-11 items-center gap-2"><AlertTriangle className="h-4 w-4"/><span>Atención</span></TabsTrigger>
        <TabsTrigger value="properties" className="flex min-h-11 items-center gap-2"><Building className="h-4 w-4"/><span>Inventario</span></TabsTrigger>
        <TabsTrigger value="scrapers" className="flex min-h-11 items-center gap-2"><Globe className="h-4 w-4"/><span>Fuentes</span></TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-0 space-y-6">
        <div className="max-w-3xl"><h2 className="text-xl font-semibold">Qué requiere atención</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Primero se muestran calidad geográfica y deuda operativa porque afectan directamente lo que ves y analizas en Campos.</p></div>
        <MarketGeocodeHealth/>
        <ScrapedPropertiesDashboard mode="summary" initialShowFavorites={showFavorites}/>
      </TabsContent>
      <TabsContent value="properties" className="mt-0"><div className="mb-4 max-w-3xl"><h2 className="text-xl font-semibold">Inventario consolidado</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Consulta y filtra propiedades y procedencia de cada registro.</p></div><ScrapedPropertiesDashboard mode="full" initialShowFavorites={showFavorites}/></TabsContent>
      <TabsContent value="scrapers" className="mt-0 space-y-6"><div className="max-w-3xl"><h2 className="text-xl font-semibold">Fuentes y sincronización</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Ejecuta una fuente solo cuando sea necesario. El estado de Portal distingue terrenos válidos del legado excluido.</p></div><ScrapersPanel/><div className="flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link href="/admin/inciti-market"><BarChart3 className="mr-2 h-4 w-4"/>Mercado Inciti</Link></Button></div></TabsContent>
    </Tabs>
  </main>
}

export default function AdminDashboard(){return <Suspense fallback={<div className="container mx-auto px-4 py-10 text-sm text-muted-foreground">Cargando centro operativo…</div>}><AdminDashboardContent/></Suspense>}

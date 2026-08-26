"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, BarChart3, BriefcaseBusiness, Building, Calculator, ChevronRight, FolderOpen, Globe, MapPinned, PlusCircle, Radar, Search, Store, Users } from "lucide-react"
import { AppHeader } from "@/components/layout/app-header"
import { MarketGeocodeHealth } from "@/components/admin/market-geocode-health"
import { ScrapersPanel } from "@/components/admin/scrapers-panel"
import { ScrapedPropertiesDashboard } from "@/components/admin/scraped-properties-dashboard"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

const VALID_TABS = ["overview", "properties", "scrapers"]

const CAPABILITIES = [
  { title: "Campos", description: "Inventario propio, campos, propietarios y relaciones territoriales.", icon: FolderOpen, links: [["Explorar campos", "/campos"], ["Inventario Sur Realista", "/admin/surealista"], ["Nueva propiedad", "/admin/propiedades/nueva"]] },
  { title: "Mercado", description: "Inventario externo, búsqueda, comparables y fuentes comerciales.", icon: Search, links: [["Buscar mercado", "/busqueda"], ["Inventario externo", "/admin/dashboard?tab=properties"], ["Fuentes y scrapers", "/admin/dashboard?tab=scrapers"], ["Mercado Inciti", "/admin/inciti-market"]] },
  { title: "Inteligencia", description: "KMZ, capas, mapas, roles, geocoding y contexto territorial.", icon: MapPinned, links: [["Inteligencia territorial", "/admin/inteligencia-territorial"], ["Análisis KMZ", "/kmz-analisis"], ["Colección KMZ", "/admin/kmz-collection"]] },
  { title: "Oportunidades", description: "Detección, seguimiento, pipeline y señales que requieren acción.", icon: Radar, links: [["Oportunidades", "/home-spotter"], ["Pipeline", "/opportunities/pipeline"], ["Guardados", "/opportunities/saved"]] },
  { title: "Comercial", description: "Clientes, tareas, comunicaciones y seguimiento diario.", icon: Users, links: [["Operaciones comerciales", "/admin/operaciones-comerciales"], ["Clientes", "/clientes"], ["Tareas", "/gestion-tareas"], ["Email", "/comunicaciones/email"]] },
  { title: "Valorización", description: "Cotización, análisis de mercado y soporte para decisiones de precio.", icon: Calculator, links: [["Cotizador", "/cotizador"], ["Nueva valorización", "/cotizador"]] },
]

function CapabilityMap() {
  return (
    <section className="space-y-5 border-t border-border pt-8">
      <div className="max-w-3xl">
        <p className="sr-meta uppercase tracking-[0.16em]">Mapa del producto</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Todas las herramientas</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">La plataforma completa organizada por trabajo, no por tecnología. Cada función queda a uno o dos clics.</p>
      </div>
      <div className="divide-y divide-border border-y border-border">
        {CAPABILITIES.map((area) => {
          const Icon = area.icon
          return (
            <div key={area.title} className="grid gap-4 py-5 md:grid-cols-[220px_1fr] md:items-start">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card"><Icon className="h-4 w-4 text-primary" aria-hidden="true" /></div>
                <div><h3 className="font-semibold">{area.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{area.description}</p></div>
              </div>
              <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-4">
                {area.links.map(([label, href]) => (
                  <Link key={`${area.title}-${label}`} href={href} className="group flex min-h-10 items-center justify-between rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
                    <span>{label}</span><ChevronRight className="h-3.5 w-3.5 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function AdminDashboardContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const showFavorites = searchParams.get("favorites") === "true"
  const [activeTab, setActiveTab] = useState(VALID_TABS.includes(tabParam ?? "") ? (tabParam as string) : "overview")
  useEffect(() => { const requestedTab = searchParams.get("tab"); if (requestedTab && VALID_TABS.includes(requestedTab)) setActiveTab(requestedTab) }, [searchParams])

  return <><AppHeader/><main className="container mx-auto space-y-8 px-4 py-8 md:py-10">
    <WorkspaceHeading eyebrow="Operación interna" title="Centro operativo" description="Una portada para revisar excepciones, salud del mercado y acciones que requieren intervención. Los procesos sanos siguen trabajando en segundo plano." outcome="Si no hay errores ni excepciones críticas, no necesitas intervenir." actions={<>
      <Button asChild className="gap-2"><Link href="/admin/operaciones-comerciales"><BriefcaseBusiness className="h-4 w-4"/>Operaciones comerciales</Link></Button>
      <Button asChild variant="outline" className="gap-2"><Link href="/admin/propiedades/nueva"><PlusCircle className="h-4 w-4"/>Nueva propiedad</Link></Button>
      <Button asChild variant="outline" className="gap-2"><Link href="/admin/surealista"><Store className="h-4 w-4"/>Inventario propio</Link></Button>
      <Button asChild variant="outline" className="gap-2"><Link href="/admin/inteligencia-territorial"><MapPinned className="h-4 w-4"/>Territorio</Link></Button>
    </>}/>
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6 grid h-auto grid-cols-1 gap-1 bg-muted/50 p-1 md:grid-cols-3">
        <TabsTrigger value="overview" className="flex min-h-11 items-center gap-2"><AlertTriangle className="h-4 w-4"/><span>Atención</span></TabsTrigger>
        <TabsTrigger value="properties" className="flex min-h-11 items-center gap-2"><Building className="h-4 w-4"/><span>Inventario</span></TabsTrigger>
        <TabsTrigger value="scrapers" className="flex min-h-11 items-center gap-2"><Globe className="h-4 w-4"/><span>Fuentes</span></TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-0 space-y-8">
        <div className="max-w-3xl"><h2 className="text-xl font-semibold">Qué requiere atención</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Primero se muestran calidad geográfica y deuda operativa. El inventario general queda debajo como contexto, no como tarea.</p></div>
        <MarketGeocodeHealth/>
        <ScrapedPropertiesDashboard mode="summary" initialShowFavorites={showFavorites}/>
        <CapabilityMap />
      </TabsContent>
      <TabsContent value="properties" className="mt-0"><div className="mb-4 max-w-3xl"><h2 className="text-xl font-semibold">Inventario consolidado</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Consulta y filtra propiedades, favoritos y procedencia de cada registro.</p></div><ScrapedPropertiesDashboard mode="full" initialShowFavorites={showFavorites}/></TabsContent>
      <TabsContent value="scrapers" className="mt-0 space-y-6"><div className="max-w-3xl"><h2 className="text-xl font-semibold">Fuentes y sincronización</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Ejecuta una fuente solo cuando sea necesario. El estado de Portal distingue terrenos válidos del legado excluido.</p></div><ScrapersPanel/><div className="flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link href="/admin/inciti-market"><BarChart3 className="mr-2 h-4 w-4"/>Mercado Inciti</Link></Button><Button asChild variant="outline" size="sm"><Link href="/propiedades"><Building className="mr-2 h-4 w-4"/>Vista pública</Link></Button></div></TabsContent>
    </Tabs>
  </main></>
}

export default function AdminDashboard(){return <Suspense fallback={<div className="container mx-auto px-4 py-10 text-sm text-muted-foreground">Cargando centro operativo…</div>}><AdminDashboardContent/></Suspense>}

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
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Panel de Administración</h1>
            <p className="mt-1 text-muted-foreground">
              Inventario, propiedades externas y sincronización de fuentes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/propiedades/nueva">
                <PlusCircle className="h-4 w-4" />
                Nueva Propiedad
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
                Ver Propiedades
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 grid grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Propiedades</span>
            </TabsTrigger>
            <TabsTrigger value="scrapers" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Scrapers</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <ScrapedPropertiesDashboard mode="summary" initialShowFavorites={showFavorites} />
          </TabsContent>

          <TabsContent value="properties" className="mt-0">
            <ScrapedPropertiesDashboard mode="full" initialShowFavorites={showFavorites} />
          </TabsContent>

          <TabsContent value="scrapers" className="mt-0">
            <ScrapersPanel />
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}

import { Suspense } from "react"
import KMZMapClient from "@/components/kmz/kmz-map-client"

export const dynamic = "force-dynamic"

export default function KMZMapPage() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto px-4 py-8 text-sm text-muted-foreground">
          Cargando mapa territorial…
        </main>
      }
    >
      <KMZMapClient />
    </Suspense>
  )
}

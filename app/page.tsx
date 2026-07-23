import { Suspense } from "react"
import MainLayout from "./(main)/layout"
import UnifiedSearchPage from "./(main)/busqueda/page"

export default function HomePage() {
  return (
    <MainLayout>
      <Suspense fallback={<div className="container mx-auto px-4 py-10 text-sm text-muted-foreground">Cargando búsqueda territorial…</div>}>
        <UnifiedSearchPage />
      </Suspense>
    </MainLayout>
  )
}

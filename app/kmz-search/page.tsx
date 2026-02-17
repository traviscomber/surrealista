import { KMZLocationSearchComponent } from "@/components/kmz/kmz-location-search-component"

export const metadata = {
  title: "Búsqueda de Ubicaciones KMZ",
  description: "Busca ubicaciones en todos tus archivos KMZ",
}

export default function KMZSearchPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Búsqueda de Ubicaciones</h1>
          <p className="text-lg text-gray-600">Encuentra todas tus ubicaciones KMZ en un solo lugar</p>
        </div>

        <KMZLocationSearchComponent />
      </div>
    </main>
  )
}

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import AdvancedPropertyImporter from "@/scripts/advanced-property-importer"

export default function ImportPropertiesPage() {
  return (
    <main>
      <Header />

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Import Sur-Realista Properties</h1>
        <p className="text-gray-600 mb-8">
          Use these tools to import property data from sur-realista.cl using the provided CSV file of URLs.
        </p>

        <div className="grid grid-cols-1 gap-8">
          <AdvancedPropertyImporter />
        </div>
      </div>

      <Footer />
    </main>
  )
}

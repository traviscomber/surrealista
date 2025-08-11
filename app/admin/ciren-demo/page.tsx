import CirenDemoDataManager from "@/components/ciren/demo-data-manager"

export default function CirenDemoPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Datos Demo CIREN</h1>
        <p className="text-gray-600 mt-2">
          Gestiona y expande los datos de demostración para pruebas del sistema CIREN
        </p>
        <p className="text-sm text-blue-600 mt-1">
          Para datos reales, necesitas una API key de{" "}
          <a href="https://ciren.cl" target="_blank" rel="noopener noreferrer" className="underline">
            ciren.cl
          </a>
        </p>
      </div>

      <CirenDemoDataManager />
    </div>
  )
}

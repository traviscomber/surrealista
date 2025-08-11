import CirenCompanySearch from "@/components/ciren/company-search"

export default function CirenIntegrationPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Integración CIREN</h1>
        <p className="text-gray-600 mt-2">
          Centro de Información de Riesgos Empresariales de Chile - Análisis completo con IA
        </p>
        <p className="text-sm text-blue-600 mt-1">
          Conectado a{" "}
          <a href="https://ciren.cl" target="_blank" rel="noopener noreferrer" className="underline">
            ciren.cl
          </a>
        </p>
      </div>

      <CirenCompanySearch />
    </div>
  )
}

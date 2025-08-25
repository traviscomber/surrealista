import RolNumberExtractor from "@/components/data-processing/rol-number-extractor"

export default function ExtraccionRolPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Extracción de Números de Rol</h1>
        <p className="text-gray-600 mt-2">
          Procesamiento automático de documentos para extraer números de rol de propiedades
        </p>
      </div>
      <RolNumberExtractor />
    </div>
  )
}

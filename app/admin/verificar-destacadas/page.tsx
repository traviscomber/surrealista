import CheckFeaturedProperties from "@/scripts/check-featured-properties"

export default function VerifyFeaturedPropertiesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Verificar Propiedades Destacadas</h1>
      <p className="text-gray-600 mb-8">
        Utilice esta herramienta para verificar y gestionar las propiedades destacadas en la base de datos.
      </p>

      <CheckFeaturedProperties />
    </div>
  )
}

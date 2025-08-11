import { PropertyGallery } from "@/components/properties/property-gallery"
import { PropertyDetails } from "@/components/properties/property-details"
import { PropertyContactForm } from "@/components/properties/property-contact-form"
import { PropertyAIRecommendations } from "@/components/properties/property-ai-recommendations"
import { notFound } from "next/navigation"

interface PropertyPageProps {
  params: {
    id: string
  }
}

// Mock property data - in a real app this would come from your database
const properties = {
  "1": {
    id: 1,
    title: "Casa de Lujo Frente al Lago",
    location: "Pucón, Región de la Araucanía",
    address: "Av. Costanera 1250, Pucón",
    price: 650000000,
    bedrooms: 4,
    bathrooms: 3,
    square_meters: 280,
    property_type: "casa",
    condition: "excelente",
    description: `Esta espectacular casa de lujo ofrece una vista inigualable al Lago Villarrica y al majestuoso volcán del mismo nombre. 

Construida con los más altos estándares de calidad, la propiedad cuenta con amplios ventanales que permiten disfrutar del paisaje desde cada rincón de la casa.

La distribución incluye:
- Sala de estar principal con chimenea y vista panorámica
- Cocina gourmet completamente equipada
- 4 dormitorios, incluyendo suite principal con vestidor
- 3 baños completos con terminaciones de lujo
- Terraza amplia con acceso directo al jardín
- Quincho con parrilla y área de entretenimiento

El terreno de 800m² incluye jardines paisajísticos, sistema de riego automático y acceso privado al lago. La propiedad cuenta con calefacción central, sistema de seguridad y estacionamiento para 3 vehículos.

Ubicada en una de las zonas más exclusivas de Pucón, a solo 5 minutos del centro y con acceso directo a actividades acuáticas y de montaña.`,
    has_view: true,
    has_terrace: true,
    has_garden: true,
    has_pool: false,
    has_garage: true,
    garage_spaces: 3,
    features: [
      "Chimenea a leña",
      "Cocina gourmet",
      "Calefacción central",
      "Sistema de seguridad",
      "Acceso privado al lago",
      "Quincho con parrilla",
      "Jardín paisajístico",
      "Bodega",
    ],
    images: [
      { id: "1", url: "/images/property-pucon.png", is_main: true },
      { id: "2", url: "/images/property-detail-1-1.png", is_main: false },
      { id: "3", url: "/images/property-detail-1-2.png", is_main: false },
      { id: "4", url: "/images/property-detail-1-3.png", is_main: false },
    ],
    created_at: "2024-01-15T10:00:00Z",
    source_url: "https://www.portalinmobiliario.com/venta/casa/pucon",
  },
  "2": {
    id: 2,
    title: "Cabaña Premium con Vista al Volcán",
    location: "Puerto Varas, Región de Los Lagos",
    address: "Camino Ensenada Km 8, Puerto Varas",
    price: 480000000,
    bedrooms: 3,
    bathrooms: 2,
    square_meters: 220,
    property_type: "cabaña",
    condition: "excelente",
    description: `Cabaña de lujo construida en madera nativa con una vista privilegiada al Volcán Osorno y al Lago Llanquihue.

Esta propiedad única combina el encanto rústico de la arquitectura tradicional con todas las comodidades modernas.

Características destacadas:
- Construcción en madera de lenga y roble nativo
- Grandes ventanales con vista panorámica
- Chimenea central de piedra volcánica
- Cocina rústica completamente equipada
- 3 dormitorios con vista al lago o volcán
- 2 baños con terminaciones en piedra natural
- Terraza cubierta de 40m²
- Jardín nativo de 1200m²

La cabaña está ubicada en un entorno natural privilegiado, rodeada de bosque nativo y con acceso directo a senderos de trekking. Cuenta con sistema de agua caliente solar, calefacción a leña y generador de respaldo.

Perfecta para quienes buscan tranquilidad y conexión con la naturaleza, sin renunciar al confort y la elegancia.`,
    has_view: true,
    has_terrace: true,
    has_garden: true,
    has_pool: false,
    has_garage: true,
    garage_spaces: 2,
    features: [
      "Construcción en madera nativa",
      "Chimenea de piedra volcánica",
      "Sistema solar de agua caliente",
      "Generador de respaldo",
      "Acceso a senderos",
      "Jardín nativo",
      "Vista panorámica",
      "Terraza cubierta",
    ],
    images: [
      { id: "1", url: "/images/property-puerto-varas.png", is_main: true },
      { id: "2", url: "/images/property-detail-2-1.png", is_main: false },
      { id: "3", url: "/images/property-detail-2-2.png", is_main: false },
      { id: "4", url: "/images/property-detail-2-3.png", is_main: false },
    ],
    created_at: "2024-01-20T14:30:00Z",
    source_url: "https://www.portalinmobiliario.com/venta/cabana/puerto-varas",
  },
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const property = properties[params.id as keyof typeof properties]

  if (!property) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <PropertyGallery images={property.images} sourceUrl={property.source_url} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <PropertyDetails property={property} />
            </div>
            <div className="space-y-8">
              <PropertyContactForm propertyId={params.id} />
              <PropertyAIRecommendations propertyId={params.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

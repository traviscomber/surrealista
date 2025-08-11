import { Suspense } from "react"
import PropertiesClient from "./properties-client"

// Mock data for properties
const mockProperties = [
  {
    id: "1",
    title: "Casa con Vista al Lago Llanquihue",
    location: "Puerto Varas, Los Lagos",
    price: 350000000,
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    type: "casa",
    description: "Hermosa casa con vista panorámica al lago Llanquihue y volcán Osorno. Amplio jardín y acceso privado al lago.",
    featured: true,
    status: "active",
    images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center"]
  },
  {
    id: "2",
    title: "Parcela en Frutillar con Acceso al Lago",
    location: "Frutillar, Los Lagos",
    price: 280000000,
    bedrooms: 0,
    bathrooms: 0,
    area: 5000,
    type: "terreno",
    description: "Parcela de 5000m² con acceso directo al lago Llanquihue. Ideal para proyecto residencial o turístico.",
    featured: false,
    status: "active",
    images: ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&crop=center"]
  },
  {
    id: "3",
    title: "Departamento Vista a la Bahía",
    location: "Puerto Montt, Los Lagos",
    price: 180000000,
    bedrooms: 2,
    bathrooms: 2,
    area: 85,
    type: "departamento",
    description: "Moderno departamento en el centro de Puerto Montt con vista a la bahía. Completamente amoblado.",
    featured: false,
    status: "active",
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&crop=center"]
  },
  {
    id: "4",
    title: "Casa en Osorno con Amplio Jardín",
    location: "Osorno, Los Lagos",
    price: 220000000,
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    type: "casa",
    description: "Casa familiar en sector residencial de Osorno. Amplio jardín, quincho y estacionamiento para 2 vehículos.",
    featured: false,
    status: "active",
    images: ["https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&crop=center"]
  },
  {
    id: "5",
    title: "Casa Patrimonial en Valdivia",
    location: "Valdivia, Los Ríos",
    price: 320000000,
    bedrooms: 5,
    bathrooms: 3,
    area: 350,
    type: "casa",
    description: "Hermosa casa patrimonial restaurada en el centro histórico de Valdivia. Acceso al río Calle-Calle.",
    featured: true,
    status: "active",
    images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center"]
  },
  {
    id: "6",
    title: "Cabaña en Pucón con Vista al Volcán",
    location: "Pucón, La Araucanía",
    price: 195000000,
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    type: "casa",
    description: "Acogedora cabaña de madera con vista al volcán Villarrica. Ideal para turismo o residencia permanente.",
    featured: false,
    status: "active",
    images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center"]
  }
]

async function getProperties() {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockProperties
}

export default async function PropertiesPage() {
  const properties = await getProperties()

  return (
    <Suspense fallback={<div>Cargando propiedades...</div>}>
      <PropertiesClient initialProperties={properties} />
    </Suspense>
  )
}

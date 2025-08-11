"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Sample property data - replace with your actual data from sur-realista.cl
const sampleProperties = [
  {
    title: "Casa con Vista al Lago en Puerto Varas",
    description:
      "Hermosa casa con vista panorámica al Lago Llanquihue y al Volcán Osorno. Cuenta con amplios espacios, terraza y jardín.",
    price: 350000000,
    location: "Puerto Varas",
    address: "Calle del Lago 123, Puerto Varas",
    city: "Puerto Varas",
    region: "Los Lagos",
    bedrooms: 4,
    bathrooms: 3,
    area: 180,
    land_area: 800,
    property_type: "house",
    status: "available",
    featured: true,
    images: [
      { url: "/placeholder.svg?key=house1a", is_main: true },
      { url: "/placeholder.svg?key=house1b", is_main: false },
      { url: "/placeholder.svg?key=house1c", is_main: false },
    ],
  },
  {
    title: "Parcela en Frutillar con Acceso a Lago",
    description:
      "Espectacular parcela con acceso privado al lago. Ideal para construir la casa de tus sueños en un entorno natural privilegiado.",
    price: 280000000,
    location: "Frutillar",
    address: "Camino al Lago km 5, Frutillar",
    city: "Frutillar",
    region: "Los Lagos",
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    land_area: 5000,
    property_type: "land",
    status: "available",
    featured: true,
    images: [
      { url: "/placeholder.svg?key=land1a", is_main: true },
      { url: "/placeholder.svg?key=land1b", is_main: false },
    ],
  },
  {
    title: "Departamento en Puerto Montt con Vista a la Bahía",
    description:
      "Moderno departamento en el centro de Puerto Montt con espectacular vista a la bahía. Cercano a todos los servicios.",
    price: 180000000,
    location: "Puerto Montt",
    address: "Edificio Costanera, Piso 8, Puerto Montt",
    city: "Puerto Montt",
    region: "Los Lagos",
    bedrooms: 2,
    bathrooms: 2,
    area: 85,
    land_area: 0,
    property_type: "apartment",
    status: "available",
    featured: true,
    images: [
      { url: "/placeholder.svg?key=apt1a", is_main: true },
      { url: "/placeholder.svg?key=apt1b", is_main: false },
      { url: "/placeholder.svg?key=apt1c", is_main: false },
    ],
  },
  {
    title: "Casa en Osorno con Amplio Jardín",
    description:
      "Espaciosa casa familiar en sector residencial de Osorno. Cuenta con amplio jardín, quincho y estacionamiento para 3 vehículos.",
    price: 220000000,
    location: "Osorno",
    address: "Calle Los Robles 456, Osorno",
    city: "Osorno",
    region: "Los Lagos",
    bedrooms: 4,
    bathrooms: 3,
    area: 160,
    land_area: 600,
    property_type: "house",
    status: "available",
    featured: false,
    images: [
      { url: "/placeholder.svg?key=house2a", is_main: true },
      { url: "/placeholder.svg?key=house2b", is_main: false },
    ],
  },
  {
    title: "Terreno Comercial en Puerto Varas",
    description:
      "Excelente terreno comercial ubicado en zona de alta plusvalía en Puerto Varas. Ideal para proyecto hotelero o comercial.",
    price: 450000000,
    location: "Puerto Varas",
    address: "Av. Vicente Pérez Rosales 789, Puerto Varas",
    city: "Puerto Varas",
    region: "Los Lagos",
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    land_area: 2000,
    property_type: "commercial",
    status: "available",
    featured: false,
    images: [{ url: "/placeholder.svg?key=comm1a", is_main: true }],
  },
  {
    title: "Casa en Valdivia con Acceso al Río",
    description:
      "Hermosa casa con acceso directo al río Calle-Calle. Perfecta para amantes de los deportes náuticos y la naturaleza.",
    price: 320000000,
    location: "Valdivia",
    address: "Camino Riverside 234, Valdivia",
    city: "Valdivia",
    region: "Los Ríos",
    bedrooms: 3,
    bathrooms: 2,
    area: 140,
    land_area: 1200,
    property_type: "house",
    status: "available",
    featured: true,
    images: [
      { url: "/placeholder.svg?key=house3a", is_main: true },
      { url: "/placeholder.svg?key=house3b", is_main: false },
      { url: "/placeholder.svg?key=house3c", is_main: false },
    ],
  },
]

export default function SeedProperties() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSeedDatabase = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // Insert properties one by one and their images
      for (const property of sampleProperties) {
        const { images, ...propertyData } = property

        // Insert property
        const { data: propertyResult, error: propertyError } = await supabase
          .from("properties")
          .insert(propertyData)
          .select("id")
          .single()

        if (propertyError) throw propertyError

        // Insert images for this property
        if (propertyResult && images && images.length > 0) {
          const imagesWithPropertyId = images.map((image) => ({
            ...image,
            property_id: propertyResult.id,
          }))

          const { error: imagesError } = await supabase.from("property_images").insert(imagesWithPropertyId)

          if (imagesError) throw imagesError
        }
      }

      setResult({
        success: true,
        message: `Successfully added ${sampleProperties.length} properties to the database.`,
      })
    } catch (error: any) {
      console.error("Error seeding database:", error)
      setResult({
        success: false,
        message: `Error: ${error.message || "Unknown error occurred"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seed Properties Database</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          This will add {sampleProperties.length} sample properties to your database. Replace the sample data with
          actual data from sur-realista.cl before running in production.
        </p>

        <Button onClick={handleSeedDatabase} disabled={isLoading} className="mb-4">
          {isLoading ? "Adding Properties..." : "Add Sample Properties"}
        </Button>

        {result && (
          <div className={`p-4 rounded-md ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {result.message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

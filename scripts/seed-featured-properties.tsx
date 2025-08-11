"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, AlertCircle, Home, MapPin, DollarSign } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

interface PropertyData {
  title: string
  description: string
  price: number
  location: string
  address: string
  city: string
  region: string
  country: string
  property_type: string
  bedrooms: number
  bathrooms: number
  square_meters: number
  lot_size?: number
  year_built?: number
  status: string
  featured: boolean
  images: string[]
  amenities: string[]
  latitude: number
  longitude: number
}

const featuredProperties: PropertyData[] = [
  {
    title: "Casa de Lujo Frente al Lago Villarrica",
    description:
      "Espectacular casa de lujo ubicada en primera línea del Lago Villarrica con vista panorámica al volcán. Esta propiedad única combina elegancia moderna con la calidez de los materiales naturales de la región. Cuenta con amplios ventanales que permiten disfrutar de las vistas durante todo el día, una cocina gourmet completamente equipada, y espacios diseñados para el entretenimiento. El jardín privado se extiende hasta la orilla del lago, ofreciendo acceso directo para actividades acuáticas. La propiedad incluye una suite principal con vestidor y baño en suite, dos dormitorios adicionales para huéspedes, y un estudio que puede funcionar como oficina. Los acabados de primera calidad incluyen pisos de madera nativa, chimenea de piedra volcánica, y un sistema de calefacción radiante. La ubicación privilegiada permite fácil acceso a las pistas de esquí del volcán Villarrica, centros termales, y el vibrante centro de Pucón.",
    price: 850000000,
    location: "Pucón, Región de La Araucanía",
    address: "Camino Villarrica-Pucón Km 18",
    city: "Pucón",
    region: "La Araucanía",
    country: "Chile",
    property_type: "casa",
    bedrooms: 4,
    bathrooms: 3,
    square_meters: 280,
    lot_size: 1200,
    year_built: 2019,
    status: "active",
    featured: true,
    images: [
      "/images/property-pucon.png",
      "/images/property-detail-1-1.png",
      "/images/property-detail-1-2.png",
      "/images/property-detail-1-3.png",
    ],
    amenities: [
      "Vista al lago",
      "Vista al volcán",
      "Acceso directo al lago",
      "Jardín privado",
      "Chimenea",
      "Cocina gourmet",
      "Calefacción radiante",
      "Estacionamiento",
      "Quincho",
      "Muelle privado",
    ],
    latitude: -39.2706,
    longitude: -71.9728,
  },
  {
    title: "Cabaña Premium con Vista al Volcán Osorno",
    description:
      "Encantadora cabaña de estilo alemán ubicada en Puerto Varas con vista directa al majestuoso volcán Osorno y el lago Llanquihue. Esta propiedad combina la arquitectura tradicional alemana con comodidades modernas, creando un ambiente acogedor y sofisticado. La construcción en madera nativa incluye vigas expuestas, ventanas de doble vidrio, y una distribución inteligente que maximiza las vistas panorámicas. La sala principal cuenta con una imponente chimenea de piedra, perfecta para las noches de invierno. La cocina integrada está completamente equipada con electrodomésticos de alta gama y una isla central ideal para reuniones familiares. Los dormitorios ofrecen vistas espectaculares y cuentan con closets empotrados. El baño principal incluye una tina con vista al volcán. La terraza cubierta se extiende a lo largo de la fachada principal, proporcionando el espacio perfecto para disfrutar de los atardeceres sobre el lago. La propiedad incluye calefacción a leña, sistema de agua caliente solar, y un jardín paisajístico con especies nativas.",
    price: 420000000,
    location: "Puerto Varas, Región de Los Lagos",
    address: "Av. Vicente Pérez Rosales 1847",
    city: "Puerto Varas",
    region: "Los Lagos",
    country: "Chile",
    property_type: "cabaña",
    bedrooms: 3,
    bathrooms: 2,
    square_meters: 180,
    lot_size: 800,
    year_built: 2020,
    status: "active",
    featured: true,
    images: [
      "/images/property-puerto-varas.png",
      "/images/property-detail-2-1.png",
      "/images/property-detail-2-2.png",
      "/images/property-detail-2-3.png",
    ],
    amenities: [
      "Vista al volcán",
      "Vista al lago",
      "Arquitectura alemana",
      "Chimenea a leña",
      "Terraza cubierta",
      "Jardín paisajístico",
      "Calefacción a leña",
      "Agua caliente solar",
      "Estacionamiento",
      "Quincho",
    ],
    latitude: -41.3317,
    longitude: -72.9828,
  },
  {
    title: "Casa Patrimonial Restaurada en Castro",
    description:
      "Excepcional casa patrimonial completamente restaurada en el corazón histórico de Castro, Chiloé. Esta joya arquitectónica del siglo XIX ha sido cuidadosamente renovada respetando su carácter original mientras incorpora todas las comodidades modernas. La construcción tradicional en alerce y tejuela de Chiloé refleja la rica herencia cultural de la isla. Los interiores conservan elementos originales como vigas de madera centenaria, pisos de tablón ancho, y ventanas de guillotina restauradas. La distribución incluye amplios salones con techos altos, una cocina moderna integrada con muebles de madera nativa, y dormitorios con vistas al canal de Castro. La casa cuenta con un sistema de calefacción moderno, aislación térmica mejorada, y instalaciones eléctricas y sanitarias completamente renovadas. El patio interior incluye un jardín con especies endémicas de Chiloé y un área de quincho techada. La ubicación privilegiada permite caminar a los palafitos, el mercado local, y los principales atractivos turísticos de Castro. Esta propiedad representa una oportunidad única de poseer un pedazo de la historia chilota en perfectas condiciones.",
    price: 320000000,
    location: "Castro, Región de Los Lagos",
    address: "Calle Esmeralda 266",
    city: "Castro",
    region: "Los Lagos",
    country: "Chile",
    property_type: "casa",
    bedrooms: 3,
    bathrooms: 2,
    square_meters: 160,
    lot_size: 400,
    year_built: 1890,
    status: "active",
    featured: true,
    images: [
      "/images/property-chiloe.png",
      "/images/property-detail-3-1.png",
      "/images/property-detail-3-2.png",
      "/images/property-detail-3-3.png",
    ],
    amenities: [
      "Casa patrimonial",
      "Arquitectura chilota",
      "Construcción en alerce",
      "Completamente restaurada",
      "Ubicación céntrica",
      "Patio interior",
      "Jardín nativo",
      "Quincho techado",
      "Calefacción moderna",
      "Cerca de palafitos",
    ],
    latitude: -42.4827,
    longitude: -73.7615,
  },
  {
    title: "Parcela de Agrado con Casa en Valdivia",
    description:
      "Magnífica parcela de agrado de 5 hectáreas con casa principal y múltiples construcciones complementarias, ubicada a solo 15 minutos del centro de Valdivia. Esta propiedad única ofrece la tranquilidad del campo con la comodidad de estar cerca de todos los servicios urbanos. La casa principal de 220 m² combina diseño contemporáneo con materiales regionales, incluyendo amplios ventanales que conectan los espacios interiores con el paisaje natural. La distribución incluye un gran living-comedor con chimenea, cocina integral moderna, cuatro dormitorios (incluyendo suite principal), y dos baños completos. Las construcciones complementarias incluyen una cabaña de huéspedes, bodega, taller, y establos para animales menores. La propiedad cuenta con pozo profundo, sistema de riego tecnificado, huerto orgánico establecido, y praderas naturales ideales para ganadería menor. El paisaje incluye bosque nativo, un pequeño estero que atraviesa la propiedad, y múltiples especies de árboles frutales. La ubicación estratégica permite fácil acceso a Valdivia, la costa, y los principales atractivos turísticos de la región de Los Ríos.",
    price: 680000000,
    location: "Valdivia, Región de Los Ríos",
    address: "Camino a Niebla Km 8",
    city: "Valdivia",
    region: "Los Ríos",
    country: "Chile",
    property_type: "parcela",
    bedrooms: 4,
    bathrooms: 2,
    square_meters: 220,
    lot_size: 50000,
    year_built: 2018,
    status: "active",
    featured: true,
    images: [
      "/images/property-valdivia.png",
      "/images/property-detail-4-1.png",
      "/images/property-detail-4-2.png",
      "/images/property-detail-4-3.png",
    ],
    amenities: [
      "5 hectáreas",
      "Casa principal",
      "Cabaña de huéspedes",
      "Pozo profundo",
      "Riego tecnificado",
      "Huerto orgánico",
      "Bosque nativo",
      "Estero natural",
      "Establos",
      "Cerca de Valdivia",
    ],
    latitude: -39.8142,
    longitude: -73.2459,
  },
  {
    title: "Casa Moderna con Vista al Lago Llanquihue",
    description:
      "Impresionante casa moderna de diseño contemporáneo ubicada en Frutillar con vista panorámica al lago Llanquihue y los volcanes Osorno y Calbuco. Esta propiedad de arquitectura vanguardista combina líneas limpias, grandes ventanales, y materiales de alta calidad para crear un ambiente sofisticado y acogedor. El diseño de dos niveles maximiza las vistas espectaculares desde todos los ambientes principales. La planta baja incluye un gran living-comedor de doble altura, cocina gourmet con isla central, dormitorio principal en suite, y amplias terrazas cubiertas. El segundo nivel alberga dos dormitorios adicionales, un baño completo, y un estudio con vista panorámica. Los acabados incluyen pisos de hormigón pulido, carpintería en madera laminada, y un sistema de climatización centralizado. La propiedad cuenta con piscina temperada, jardín paisajístico de bajo mantenimiento, y un sistema domótico para control de iluminación y temperatura. La ubicación en Frutillar permite disfrutar de la rica vida cultural de la ciudad, incluyendo el famoso Teatro del Lago, mientras se mantiene la privacidad y tranquilidad de un entorno residencial exclusivo.",
    price: 750000000,
    location: "Frutillar, Región de Los Lagos",
    address: "Av. Philippi 1065",
    city: "Frutillar",
    region: "Los Lagos",
    country: "Chile",
    property_type: "casa",
    bedrooms: 3,
    bathrooms: 3,
    square_meters: 250,
    lot_size: 1000,
    year_built: 2021,
    status: "active",
    featured: true,
    images: [
      "/images/property-frutillar.png",
      "/images/property-detail-5-1.png",
      "/images/property-detail-5-2.png",
      "/images/property-detail-5-3.png",
    ],
    amenities: [
      "Diseño contemporáneo",
      "Vista panorámica",
      "Piscina temperada",
      "Sistema domótico",
      "Doble altura",
      "Cocina gourmet",
      "Jardín paisajístico",
      "Climatización central",
      "Cerca Teatro del Lago",
      "Ubicación exclusiva",
    ],
    latitude: -41.1281,
    longitude: -73.0444,
  },
  {
    title: "Terreno Industrial Estratégico en Osorno",
    description:
      "Excepcional terreno industrial de 2 hectáreas ubicado en la zona industrial consolidada de Osorno, con todos los servicios básicos disponibles y excelente conectividad. Esta propiedad representa una oportunidad única para desarrollos industriales, logísticos, o comerciales de gran escala. El terreno cuenta con topografía plana, suelo firme apto para construcciones pesadas, y acceso directo desde la ruta principal que conecta con la Ruta 5 Sur. Los servicios incluyen electricidad trifásica de alta tensión, agua potable, alcantarillado, gas natural, y fibra óptica. La zonificación industrial permite una amplia gama de actividades productivas, desde manufactura hasta centros de distribución. La ubicación estratégica en Osorno, capital de la Región de Los Lagos, ofrece acceso privilegiado a los mercados regionales y conexión directa con los puertos de la zona. El entorno industrial consolidado incluye empresas líderes del sector agroindustrial, forestal, y manufacturero. La propiedad cuenta con estudios de mecánica de suelos, factibilidad de servicios, y todos los permisos municipales al día. Esta inversión ofrece alto potencial de rentabilidad en una de las zonas de mayor crecimiento industrial del sur de Chile.",
    price: 450000000,
    location: "Osorno, Región de Los Lagos",
    address: "Ruta U-40, Sector Industrial",
    city: "Osorno",
    region: "Los Lagos",
    country: "Chile",
    property_type: "terreno",
    bedrooms: 0,
    bathrooms: 0,
    square_meters: 0,
    lot_size: 20000,
    year_built: 2018,
    status: "active",
    featured: true,
    images: [
      "/images/property-osorno.png",
      "/images/property-detail-6-1.png",
      "/images/property-detail-6-2.png",
      "/images/property-detail-6-3.png",
    ],
    amenities: [
      "2 hectáreas",
      "Zonificación industrial",
      "Todos los servicios",
      "Topografía plana",
      "Acceso ruta principal",
      "Electricidad trifásica",
      "Gas natural",
      "Fibra óptica",
      "Estudios técnicos",
      "Permisos al día",
    ],
    latitude: -40.5736,
    longitude: -73.1353,
  },
]

export default function SeedFeaturedProperties() {
  const [seeding, setSeeding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ success: boolean; message: string; property?: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  const seedProperties = async () => {
    setSeeding(true)
    setError(null)
    setResults([])
    setProgress(0)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase configuration missing")
      }

      const supabase = createClient(supabaseUrl, supabaseKey)
      const propertyResults: { success: boolean; message: string; property?: string }[] = []

      for (let i = 0; i < featuredProperties.length; i++) {
        const property = featuredProperties[i]

        try {
          // Check if property already exists
          const { data: existingProperty } = await supabase
            .from("properties")
            .select("id")
            .eq("title", property.title)
            .single()

          if (existingProperty) {
            propertyResults.push({
              success: false,
              message: "Ya existe",
              property: property.title,
            })
          } else {
            // Insert new property
            const { data, error: insertError } = await supabase.from("properties").insert([property]).select().single()

            if (insertError) {
              throw insertError
            }

            propertyResults.push({
              success: true,
              message: "Creada exitosamente",
              property: property.title,
            })
          }
        } catch (err) {
          console.error(`Error seeding property ${property.title}:`, err)
          propertyResults.push({
            success: false,
            message: err instanceof Error ? err.message : "Error desconocido",
            property: property.title,
          })
        }

        setProgress(((i + 1) / featuredProperties.length) * 100)
        setResults([...propertyResults])
      }
    } catch (err) {
      console.error("Seeding error:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setSeeding(false)
    }
  }

  const successCount = results.filter((r) => r.success).length
  const errorCount = results.filter((r) => !r.success).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Home className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold">Crear Propiedades Destacadas</h1>
          <p className="text-gray-600">Agrega 6 propiedades destacadas del sur de Chile a tu base de datos</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Propiedades a Crear
          </CardTitle>
          <CardDescription>
            Este proceso creará 6 propiedades destacadas con datos reales del mercado inmobiliario del sur de Chile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {featuredProperties.map((property, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {property.property_type === "casa" && <Home className="h-5 w-5 text-blue-500" />}
                      {property.property_type === "cabaña" && <Home className="h-5 w-5 text-green-500" />}
                      {property.property_type === "parcela" && <MapPin className="h-5 w-5 text-orange-500" />}
                      {property.property_type === "terreno" && <MapPin className="h-5 w-5 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm leading-tight mb-1">{property.title}</h3>
                      <p className="text-xs text-gray-600 mb-2">
                        {property.city}, {property.region}
                      </p>
                      <div className="flex items-center gap-1 mb-2">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium">${(property.price / 1000000).toFixed(0)}M CLP</span>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          {property.bedrooms} dorm
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {property.bathrooms} baños
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-4 mb-4">
            <Button onClick={seedProperties} disabled={seeding} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              {seeding ? "Creando Propiedades..." : "Crear Propiedades Destacadas"}
            </Button>
          </div>

          {seeding && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Progreso</span>
                <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Error al Crear Propiedades</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Creadas Exitosamente</p>
                        <p className="text-2xl font-bold text-green-600">{successCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-600">Errores</p>
                        <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Resultados Detallados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded border">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm font-medium">{result.property}</span>
                        </div>
                        <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
                          {result.message}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {successCount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">¡Propiedades Creadas!</span>
                  </div>
                  <p className="text-green-700 mt-1">
                    Se han creado {successCount} propiedades destacadas. Ahora puedes verlas en la página principal de
                    tu sitio web.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

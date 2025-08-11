"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"
import Image from "next/image"

const TESTIMONIALS = [
  {
    name: "Carlos & María González",
    location: "Santiago → Pucón",
    image: "/images/testimonials/carlos-maria.png",
    rating: 5,
    text: "Encontramos nuestra cabaña de ensueño frente al lago Villarrica gracias al asistente IA. Nos ayudó a filtrar exactamente lo que buscábamos: tranquilidad, vista al volcán y acceso al lago.",
    propertyType: "Cabaña Lacustre",
    highlight: "Proceso 100% digital desde Santiago",
  },
  {
    name: "Valentina Morales",
    location: "Concepción → Puerto Varas",
    image: "/images/testimonials/valentina.png",
    rating: 5,
    text: "Como inversionista, necesitaba datos precisos del mercado. El análisis IA me mostró que Puerto Varas tenía el mejor potencial de rentabilidad para turismo. Mi lodge ya tiene reservas completas.",
    propertyType: "Lodge Turístico",
    highlight: "ROI del 18% en el primer año",
  },
  {
    name: "Familia Martínez",
    location: "Valparaíso → Castro, Chiloé",
    image: "/images/testimonials/familia-martinez.png",
    rating: 5,
    text: "Queríamos escapar de la ciudad y encontrar un lugar auténtico. El asistente nos recomendó Chiloé y nos enamoramos. Ahora tenemos nuestra casa de campo con vista al mar.",
    propertyType: "Casa de Campo",
    highlight: "Cambio de vida completo",
  },
]

const LOCATIONS_STATS = [
  { city: "Pucón", properties: 120, avgPrice: "180M", highlight: "Lagos y volcanes" },
  { city: "Puerto Varas", properties: 95, avgPrice: "220M", highlight: "Turismo premium" },
  { city: "Castro", properties: 75, avgPrice: "95M", highlight: "Auténtico Chiloé" },
  { city: "Valdivia", properties: 110, avgPrice: "150M", highlight: "Ríos y naturaleza" },
  { city: "Frutillar", properties: 60, avgPrice: "200M", highlight: "Cultura y lagos" },
  { city: "Osorno", properties: 85, avgPrice: "120M", highlight: "Campo y montaña" },
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white via-blue-50 to-green-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
            Lo que dicen nuestros{" "}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">clientes</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Miles de familias han encontrado su hogar ideal en el sur de Chile. Estas son algunas de sus historias.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
          {TESTIMONIALS.map((testimonial, index) => (
            <Card
              key={index}
              className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg overflow-hidden transform hover:-translate-y-2 bg-white"
            >
              <CardContent className="p-0">
                {/* Header with image and rating */}
                <div className="relative bg-gradient-to-br from-blue-600 to-green-600 p-8 text-white">
                  <div className="absolute top-6 right-6">
                    <Quote className="h-12 w-12 text-white/30" />
                  </div>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white/30 shadow-lg">
                      <Image
                        src={testimonial.image || "/placeholder.svg"}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl">{testimonial.name}</h4>
                      <p className="text-blue-100">{testimonial.location}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-sm font-medium text-blue-100 mb-1">Propiedad adquirida:</div>
                    <div className="font-bold text-lg">{testimonial.propertyType}</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <blockquote className="text-gray-700 mb-6 leading-relaxed text-lg italic">
                    "{testimonial.text}"
                  </blockquote>

                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                      <span className="font-bold text-green-800">{testimonial.highlight}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Locations Overview */}
        <div className="bg-white rounded-3xl shadow-2xl p-12 border border-gray-100">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Nuestras Ubicaciones Principales</h3>
            <p className="text-lg text-gray-600">Datos actualizados del mercado inmobiliario en el sur de Chile</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {LOCATIONS_STATS.map((location, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 border border-blue-100 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-2xl font-bold text-gray-900 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-green-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                    {location.city}
                  </h4>
                  <span className="bg-gradient-to-r from-blue-600 to-green-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                    {location.properties} propiedades
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Precio promedio:</span>
                    <span className="font-bold text-xl text-gray-900">${location.avgPrice}</span>
                  </div>

                  <div className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent font-bold">
                    {location.highlight}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-10 text-white shadow-2xl">
              <h4 className="text-2xl font-bold mb-4">¿Listo para tu historia de éxito?</h4>
              <p className="text-blue-100 mb-8 text-lg">
                Únete a cientos de familias que han encontrado su hogar ideal en el sur de Chile
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg">
                  Ver Propiedades Disponibles
                </button>
                <button className="border-2 border-white text-white hover:bg-white hover:text-blue-900 font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg">
                  Hablar con un Asesor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

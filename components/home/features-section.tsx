"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Brain, Shield, Mountain, Waves, Trees } from "lucide-react"
import Image from "next/image"

const FEATURES = [
  {
    icon: MapPin,
    title: "Ubicaciones Exclusivas",
    description: "Propiedades en los destinos más codiciados del sur de Chile",
    image: "/images/ubicaciones-exclusivas.png",
    highlights: ["Lagos cristalinos", "Volcanes activos", "Bosques nativos", "Costas vírgenes"],
  },
  {
    icon: Brain,
    title: "Tecnología IA Avanzada",
    description: "Nuestro asistente de IA encuentra la propiedad perfecta para ti",
    image: "/images/tecnologia-ia.png",
    highlights: [
      "Búsqueda inteligente",
      "Recomendaciones personalizadas",
      "Análisis de mercado",
      "Valoraciones precisas",
    ],
  },
  {
    icon: Shield,
    title: "Soporte Personalizado",
    description: "Acompañamiento completo desde la búsqueda hasta la escrituración",
    image: "/images/soporte-personalizado.png",
    highlights: ["Asesoría legal", "Gestión de documentos", "Financiamiento", "Post-venta"],
  },
]

const PROPERTY_TYPES = [
  {
    icon: Waves,
    title: "Propiedades Lacustres",
    description: "Cabañas y casas frente a lagos Villarrica, Llanquihue y Ranco",
    locations: ["Pucón", "Puerto Varas", "Futrono"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Mountain,
    title: "Vista a Volcanes",
    description: "Propiedades con vistas panorámicas a volcanes activos",
    locations: ["Villarrica", "Osorno", "Calbuco"],
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Trees,
    title: "Inmersión en Naturaleza",
    description: "Parcelas y terrenos en bosques nativos y reservas",
    locations: ["Valdivia", "Castro", "Frutillar"],
    color: "from-green-500 to-emerald-500",
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Main Features */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
            ¿Por qué elegir{" "}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Sur Realista
            </span>
            ?
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Combinamos la belleza natural del sur de Chile con tecnología de vanguardia para ofrecerte la mejor
            experiencia inmobiliaria
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-24">
          {FEATURES.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg overflow-hidden transform hover:-translate-y-2 bg-white"
              >
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={feature.image || "/placeholder.svg"}
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <div className="bg-gradient-to-r from-blue-600 to-green-600 p-4 rounded-2xl shadow-lg">
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-green-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mr-3" />
                        <span className="font-medium">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Property Types */}
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Especialistas en{" "}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Propiedades del Sur
            </span>
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Conocemos cada rincón del sur de Chile y te ayudamos a encontrar la propiedad que se adapte a tu estilo de
            vida
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {PROPERTY_TYPES.map((type, index) => {
            const IconComponent = type.icon
            return (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg overflow-hidden transform hover:-translate-y-2 bg-white"
              >
                <CardContent className="p-0">
                  <div
                    className={`h-40 bg-gradient-to-br ${type.color} flex items-center justify-center relative overflow-hidden`}
                  >
                    <IconComponent className="h-20 w-20 text-white/90 group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" />
                  </div>
                  <div className="p-8">
                    <h4 className="text-2xl font-bold text-gray-900 mb-4 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-green-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {type.title}
                    </h4>
                    <p className="text-gray-600 mb-6 leading-relaxed">{type.description}</p>
                    <div className="flex flex-wrap gap-3">
                      {type.locations.map((location, idx) => (
                        <span
                          key={idx}
                          className="bg-gradient-to-r from-blue-100 to-green-100 text-gray-800 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200"
                        >
                          {location}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-20">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl p-12 text-white shadow-2xl">
            <h4 className="text-3xl font-bold mb-6">¿Listo para encontrar tu propiedad ideal?</h4>
            <p className="text-blue-100 mb-8 max-w-3xl mx-auto text-lg leading-relaxed">
              Nuestro equipo de expertos y tecnología IA están listos para ayudarte a descubrir las mejores
              oportunidades del sur de Chile
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg">
                Hablar con un Experto
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-blue-900 font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg">
                Probar Asistente IA
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

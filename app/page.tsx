"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Zap,
  BarChart3,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Leaf,
  Users,
  Lightbulb,
  Globe,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-green-700">Sur-Realista</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-gray-700 hover:text-green-600 font-medium">
              Cómo Funciona
            </a>
            <a href="#features" className="text-gray-700 hover:text-green-600 font-medium">
              Características
            </a>
            <a href="#faq" className="text-gray-700 hover:text-green-600 font-medium">
              Preguntas
            </a>
          </div>
          <Link href="/busqueda">
            <Button className="bg-green-600 hover:bg-green-700">
              Explorar Ahora
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6 text-balance">
              Descubre el poder de{" "}
              <span className="text-green-600">tus datos geográficos</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Sur-Realista convierte información compleja sobre ubicaciones, propiedades y campos en 
              herramientas simples y claras. Ya no necesitas ser un experto en datos para tomar decisiones 
              inteligentes sobre tus terrenos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/busqueda">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                Ver Demo
              </Button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl p-12 h-96 flex items-center justify-center">
            <div className="text-center">
              <Globe className="h-32 w-32 text-green-600 mx-auto mb-4 opacity-50" />
              <p className="text-green-700 font-semibold">Visualización de datos geográficos</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Cómo Funciona Sur-Realista?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Un proceso sencillo en 4 pasos para que entiendas y gestiones tus datos geográficos
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: MapPin,
                titulo: "1. Carga tus Mapas",
                descripcion: "Sube archivos KMZ con la información de tus campos y propiedades",
              },
              {
                icon: BarChart3,
                titulo: "2. Visualiza los Datos",
                descripcion: "Ve toda la información en mapas interactivos y claros",
              },
              {
                icon: Zap,
                titulo: "3. Busca y Filtra",
                descripcion: "Encuentra exactamente lo que necesitas por región, tipo o ubicación",
              },
              {
                icon: CheckCircle2,
                titulo: "4. Toma Decisiones",
                descripcion: "Accede a reportes que te ayudan a tomar decisiones más inteligentes",
              },
            ].map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-100">
                  <Icon className="h-12 w-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {step.titulo}
                  </h3>
                  <p className="text-gray-600">
                    {step.descripcion}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Lo que hace especial a Sur-Realista
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                titulo: "Para Todos",
                descripcion: "No necesitas ser experto en tecnología. Cualquiera puede usar Sur-Realista sin complicaciones.",
              },
              {
                icon: Lightbulb,
                titulo: "Inteligente",
                descripcion: "Análisis automático que te muestra lo importante. La IA simplifica los datos complejos.",
              },
              {
                icon: Globe,
                titulo: "Global pero Local",
                descripcion: "Funciona con datos de todo Chile. Desde La Antártida hasta Arica en un solo lugar.",
              },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="bg-white rounded-xl p-8 border border-green-100 hover:shadow-lg transition">
                  <div className="bg-green-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.titulo}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.descripcion}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-lg text-gray-600">
              Resolvemos tus dudas más comunes
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                pregunta: "¿Qué son los archivos KMZ?",
                respuesta: "Son archivos que contienen mapas e información geográfica. Google Maps, GPS y sistemas de cartografía los usan. Sur-Realista lee estos archivos y te los muestra de forma clara.",
              },
              {
                pregunta: "¿Es seguro subir mis datos?",
                respuesta: "Sí. Tus datos están encriptados y solo tú puedes acceder a ellos. No compartimos información con terceros.",
              },
              {
                pregunta: "¿Puedo buscar en múltiples regiones?",
                respuesta: "Claro. Selecciona las regiones que te interesen y busca en todas a la vez. Es como tener una herramienta de búsqueda global en tus manos.",
              },
              {
                pregunta: "¿Necesito entrenamiento?",
                respuesta: "No. La interfaz es tan intuitiva que cualquiera puede usar Sur-Realista. Si necesitas ayuda, estamos aquí.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {faq.pregunta}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {faq.respuesta}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para Explorar tus Datos?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Acceso gratuito a todas las herramientas. No necesitas tarjeta de crédito.
          </p>
          <Link href="/busqueda">
            <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 text-lg">
              Comenzar Ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="h-6 w-6 text-green-500" />
                <span className="font-bold text-white">Sur-Realista</span>
              </div>
              <p className="text-sm">
                Herramientas inteligentes para entender el territorio.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/busqueda" className="hover:text-green-400">Búsqueda</Link></li>
                <li><Link href="/campos" className="hover:text-green-400">Campos</Link></li>
                <li><Link href="/gestion-clientes" className="hover:text-green-400">Clientes</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/nosotros" className="hover:text-green-400">Sobre Nosotros</Link></li>
                <li><Link href="/contacto" className="hover:text-green-400">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Conecta</h4>
              <p className="text-sm">
                Preguntas? Escríbenos. Estamos aquí para ayudarte.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm">
            <p>&copy; 2026 Sur-Realista. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

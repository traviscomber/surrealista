import Link from "next/link"
import { Building2, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Empresa */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Sur-Realista</span>
            </div>
            <p className="text-gray-400 text-sm">
              La inmobiliaria líder en el sur de Chile, combinando experiencia local con tecnología de vanguardia para
              ofrecer el mejor servicio inmobiliario.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Enlaces Rápidos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/propiedades" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Propiedades
                </Link>
              </li>
              <li>
                <Link href="/nosotros" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/tecnologia-ia" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Tecnología IA
                </Link>
              </li>
            </ul>
          </div>

          {/* Servicios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Servicios</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/cotizador" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Cotizador IA
                </Link>
              </li>
              <li>
                <Link href="/asistente-ia" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Asistente IA
                </Link>
              </li>
              <li>
                <Link href="/mapas" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Mapas Interactivos
                </Link>
              </li>
              <li>
                <span className="text-gray-400 text-sm">Asesoría Personalizada</span>
              </li>
              <li>
                <span className="text-gray-400 text-sm">Análisis de Mercado</span>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-blue-400" />
                <span className="text-gray-400 text-sm">+56 9 1234 5678</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-gray-400 text-sm">info@sur-realista.cl</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="text-gray-400 text-sm">
                  <div>Puerto Varas</div>
                  <div>Región de Los Lagos, Chile</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 Sur-Realista. Todos los derechos reservados.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Política de Privacidad
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Términos de Servicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

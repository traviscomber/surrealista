import Link from "next/link"
import { Building2, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-card border-t text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Empresa */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Sur-Realista</span>
            </div>
            <p className="text-muted-foreground text-sm">
              La inmobiliaria líder en el sur de Chile, combinando experiencia local con tecnología de vanguardia para
              ofrecer el mejor servicio inmobiliario.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Enlaces Rápidos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/propiedades" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Propiedades
                </Link>
              </li>
              <li>
                <Link href="/nosotros" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/tecnologia-ia" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
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
                <Link href="/cotizador" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Cotizador IA
                </Link>
              </li>
              <li>
                <Link href="/asistente-ia" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Asistente IA
                </Link>
              </li>
              <li>
                <Link href="/mapas" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Mapas Interactivos
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground text-sm">Asesoría Personalizada</span>
              </li>
              <li>
                <span className="text-muted-foreground text-sm">Análisis de Mercado</span>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground text-sm">+56 9 1234 5678</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground text-sm">info@sur-realista.cl</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-muted-foreground text-sm">
                  <div>Puerto Varas</div>
                  <div>Región de Los Lagos, Chile</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">© 2024 Sur-Realista. Todos los derechos reservados.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Política de Privacidad
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Términos de Servicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

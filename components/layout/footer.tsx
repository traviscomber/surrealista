import Link from "next/link"
import { Building2, BookOpen, Search, Shield, MapPin } from "lucide-react"

const footerLinks = [
  { href: "/busqueda", label: "Operación", icon: Search },
  { href: "/admin/dashboard", label: "Admin", icon: Shield },
  { href: "/docs/usuario", label: "Docs", icon: BookOpen },
  { href: "/kmz-analisis", label: "KMZ", icon: MapPin },
]

export function Footer() {
  return (
    <footer className="border-t bg-card text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Sur-Realista interno</p>
              <p className="text-sm text-muted-foreground">
                Panel operativo para equipos de búsqueda, análisis y administración.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>Acceso interno protegido. Las rutas públicas se limitan a ayuda y documentación.</p>
          <p>Sur-Realista · Centro operativo</p>
        </div>
      </div>
    </footer>
  )
}

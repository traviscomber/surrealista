import Link from "next/link"
import { ArrowRight, BookOpen, MapPin, Search, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const quickLinks = [
  { title: "Operación diaria", description: "Búsqueda, clientes, tareas y comunicaciones.", href: "/busqueda", icon: Search },
  { title: "Administración", description: "Gestión interna, KMZ, IA y conexiones.", href: "/admin/dashboard", icon: Shield },
  { title: "Documentación", description: "Guías técnicas y de uso del sistema.", href: "/docs/usuario", icon: BookOpen },
  { title: "Análisis territorial", description: "Vecindario, roles, capas y mapas.", href: "/kmz-analisis", icon: MapPin },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b bg-card">
        <div className="mx-auto grid min-h-[64vh] w-full max-w-[1280px] gap-12 px-6 py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:px-12 lg:py-28">
          <div className="max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
              <Badge variant="secondary">Uso interno</Badge>
              <span className="text-sm text-muted-foreground">Centro operativo Sur Realista</span>
            </div>
            <p className="sr-meta mb-4">Territorio, datos y operación</p>
            <h1 className="max-w-3xl text-4xl font-medium leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
              Una entrada clara para trabajar con campos, clientes y territorio.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
              Accede a las herramientas de operación, administración, documentación y análisis geoespacial desde un único punto, sin capas visuales innecesarias.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/campos">Abrir CAMPOS <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/busqueda">Ir a búsqueda</Link>
              </Button>
            </div>
          </div>

          <div className="border-l border-border pl-6 lg:pl-10">
            <p className="sr-meta">Acceso principal</p>
            <p className="mt-4 text-2xl font-medium leading-snug tracking-tight">
              El territorio primero. La interfaz acompaña la decisión, no compite con ella.
            </p>
          </div>
        </div>
      </section>

      <section className="sr-section-secondary">
        <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-12">
          <div className="grid gap-8 border-b border-border pb-12 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <div>
              <p className="sr-meta">Herramientas</p>
              <h2 className="sr-section-title mt-3">Accesos de trabajo</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground md:justify-self-end">
              Cada acceso corresponde a una tarea real del equipo. La navegación secundaria mantiene la misma jerarquía y lenguaje visual del sistema principal.
            </p>
          </div>

          <div className="divide-y divide-border">
            {quickLinks.map((item) => (
              <Link key={item.title} href={item.href} className="group grid gap-4 py-7 transition-colors hover:bg-card/55 md:grid-cols-[56px_1fr_auto] md:items-center md:px-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Abrir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sr-section bg-card">
        <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-6 md:grid-cols-3 lg:px-12">
          <div>
            <p className="sr-meta">01</p>
            <h3 className="mt-3 text-lg font-semibold">Acceso protegido</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Sesión interna y rutas operativas separadas de la presentación pública.</p>
          </div>
          <div>
            <p className="sr-meta">02</p>
            <h3 className="mt-3 text-lg font-semibold">Operación conectada</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Búsqueda, tareas, comunicaciones y campos dentro del mismo flujo de trabajo.</p>
          </div>
          <div>
            <p className="sr-meta">03</p>
            <h3 className="mt-3 text-lg font-semibold">Datos territoriales</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">KMZ, roles, documentos y contexto geográfico organizados sin ruido visual.</p>
          </div>
        </div>
      </section>
    </main>
  )
}

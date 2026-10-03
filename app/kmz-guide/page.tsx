import Link from "next/link"
import { ArrowRight, Database, Map, Search, Zap } from "lucide-react"

import { WorkspaceHeading } from "@/components/ui/workspace-heading"

const actions = [
  {
    href: "/kmz-search",
    title: "Buscar KMZ",
    description: "Encuentra campos y elementos por nombre, región o descripción.",
    icon: Search,
  },
  {
    href: "/kmz-search-advanced",
    title: "Búsqueda avanzada",
    description: "Combina filtros cuando necesitas acotar un universo grande.",
    icon: Zap,
  },
  {
    href: "/kmz-map",
    title: "Mapa territorial",
    description: "Abre las geometrías y revisa contexto espacial.",
    icon: Map,
  },
  {
    href: "/admin/kmz-collection",
    title: "Colección KMZ",
    description: "Revisa inventario, procedencia y estado de los archivos.",
    icon: Database,
  },
]

export default function KMZGuidePage() {
  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHeading
        eyebrow="Campos · Guía"
        title="Trabajar con KMZ"
        description="Usa estas vistas como apoyo para localizar, revisar y entender archivos territoriales sin perder el contexto de Campos."
        outcome="Encuentra el archivo correcto, valida su geometría y continúa desde la ficha canónica."
      />

      <section aria-labelledby="kmz-guide-heading">
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">01 · Flujo</p>
          <h2 id="kmz-guide-heading" className="mt-1 text-xl font-semibold">Herramientas disponibles</h2>
        </div>

        <div className="border-y border-border/70">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group grid min-h-[88px] items-center gap-4 border-b border-border/70 px-1 py-4 transition-colors last:border-b-0 hover:bg-secondary/45 sm:grid-cols-[38px_180px_minmax(0,1fr)_24px] sm:px-3"
              >
                <span aria-hidden="true" className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="text-[15px] font-semibold">{action.title}</h3>
                </div>
                <p className="text-[13px] leading-5 text-muted-foreground">{action.description}</p>
                <ArrowRight className="hidden h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 border-y border-border/70 py-5 text-sm leading-6 text-muted-foreground md:grid-cols-3">
        <div><span className="font-mono text-[10px] text-muted-foreground">01</span><p className="mt-1 text-foreground">Busca primero por nombre, región o ROL.</p></div>
        <div><span className="font-mono text-[10px] text-muted-foreground">02</span><p className="mt-1 text-foreground">Abre el mapa sólo cuando necesites contexto espacial.</p></div>
        <div><span className="font-mono text-[10px] text-muted-foreground">03</span><p className="mt-1 text-foreground">Vuelve a <Link href="/campos" className="font-medium hover:underline">Campos</Link> para operar sobre la ficha canónica.</p></div>
      </section>
    </main>
  )
}

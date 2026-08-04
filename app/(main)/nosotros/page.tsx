import { CompanyInfo } from "@/components/about/company-info"
import { TeamSection } from "@/components/about/team-section"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-12 lg:py-24">
          <p className="sr-meta text-primary">Sur Realista</p>
          <h1 className="sr-page-title mt-4 max-w-4xl">Territorio, arquitectura y gestión inmobiliaria con contexto real.</h1>
          <p className="sr-body mt-6 max-w-3xl text-muted-foreground">
            Trabajamos con campos, propiedades y proyectos del sur de Chile integrando información territorial,
            documentación y conocimiento del entorno en un mismo proceso de análisis.
          </p>
        </div>
      </header>

      <CompanyInfo />
      <TeamSection />
    </main>
  )
}

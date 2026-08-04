import { AIAssistantChat } from "@/components/ai-assistant/ai-assistant-chat"
import { Database, FileSearch, FileText, FolderOpen, MapPin, Search, ShieldCheck } from "lucide-react"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

const capabilities = [
  {
    icon: FolderOpen,
    title: "Explorar archivos territoriales",
    description: "Localiza registros KMZ disponibles y resume sus antecedentes principales.",
  },
  {
    icon: FileText,
    title: "Consultar documentos",
    description: "Busca información por nombre o contenido cuando la fuente documental está disponible.",
  },
  {
    icon: MapPin,
    title: "Relacionar información territorial",
    description: "Apoya consultas sobre regiones, ubicaciones, roles y archivos asociados.",
  },
  {
    icon: Search,
    title: "Preparar una revisión",
    description: "Organiza hallazgos y señala qué antecedentes deben verificarse manualmente.",
  },
]

const examples = [
  "¿Qué archivos territoriales existen para esta región?",
  "Resume los antecedentes disponibles de este campo.",
  "¿Qué registros tienen ROL y cuáles siguen incompletos?",
  "Organiza los documentos relacionados con esta propiedad.",
]

export default function AsistenteIAPage() {
  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-6 px-4 py-5 sm:px-6 lg:px-8">
      <WorkspaceHeading
        eyebrow="Herramienta de apoyo"
        title="Asistente de análisis"
        description="Realiza consultas sobre los datos y documentos accesibles dentro de la plataforma. Las respuestas dependen de las fuentes disponibles y deben revisarse antes de utilizarlas en decisiones comerciales, técnicas o legales."
        outcome="Una síntesis inicial de la información encontrada, con referencias para continuar la revisión en los módulos correspondientes."
      />

      <div className="grid gap-0 border border-border/70 bg-card xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 border-b border-border/70 xl:border-b-0 xl:border-r">
          <AIAssistantChat />
        </section>

        <aside className="min-w-0 bg-background/55">
          <section className="border-b border-border/70 px-5 py-5">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <h2 className="sr-panel-title">Qué puede entregar</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Capacidades sujetas a la información realmente conectada.
            </p>

            <div className="mt-5 divide-y divide-border/60">
              {capabilities.map((capability) => (
                <div key={capability.title} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                  <capability.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{capability.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{capability.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border-b border-border/70 px-5 py-5">
            <div className="flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-primary" />
              <h2 className="sr-panel-title">Consultas sugeridas</h2>
            </div>
            <div className="mt-4 divide-y divide-border/60">
              {examples.map((example) => (
                <p key={example} className="py-3 text-sm leading-6 text-foreground first:pt-0 last:pb-0">
                  {example}
                </p>
              ))}
            </div>
          </section>

          <section className="px-5 py-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="sr-panel-title">Alcance de la respuesta</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              El asistente no acredita dominio, tasación, vigencia documental ni exactitud legal. Cuando una fuente no está disponible, debe indicarlo en lugar de completar información por inferencia.
            </p>
          </section>
        </aside>
      </div>
    </main>
  )
}

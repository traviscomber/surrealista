import { AIAssistantChat } from "@/components/ai-assistant/ai-assistant-chat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <WorkspaceHeading
          eyebrow="Herramienta de apoyo"
          title="Asistente de análisis"
          description="Realiza consultas sobre los datos y documentos accesibles dentro de la plataforma. Las respuestas dependen de las fuentes disponibles y deben revisarse antes de utilizarse en decisiones comerciales, técnicas o legales."
          outcome="Una síntesis inicial de la información encontrada, con referencias para continuar la revisión en los módulos correspondientes."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0">
            <AIAssistantChat />
          </section>

          <aside className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-4 w-4 text-primary" />
                  Qué puede entregar
                </CardTitle>
                <CardDescription>Capacidades sujetas a la información realmente conectada.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {capabilities.map((capability) => (
                  <div key={capability.title} className="flex items-start gap-3 border-b border-border/60 pb-4 last:border-0 last:pb-0">
                    <capability.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{capability.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{capability.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSearch className="h-4 w-4 text-primary" />
                  Consultas sugeridas
                </CardTitle>
                <CardDescription>Ejemplos orientados al trabajo interno.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {examples.map((example) => (
                  <div key={example} className="rounded-md border border-border/70 bg-muted/30 px-3 py-2.5 text-sm leading-5 text-foreground">
                    {example}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Alcance de la respuesta
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                El asistente no acredita dominio, tasación, vigencia documental ni exactitud legal. Cuando una fuente no está disponible, debe indicarlo en lugar de completar información por inferencia.
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  )
}

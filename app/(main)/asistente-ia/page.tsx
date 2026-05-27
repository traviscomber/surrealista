import { AIAssistantChat } from "@/components/ai-assistant/ai-assistant-chat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, FolderOpen, FileText, MapPin, Search, Database } from "lucide-react"

export default function AsistenteIAPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-primary">
              Asistente IA de Datos
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-4">
            Consulta conversacional sobre tus documentos y datos en Google Drive
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge variant="secondary">
              <Database className="h-3 w-3 mr-1" />
              Datos en Tiempo Real
            </Badge>
            <Badge variant="secondary">
              <FolderOpen className="h-3 w-3 mr-1" />
              Google Drive Integrado
            </Badge>
            <Badge variant="secondary">
              <Search className="h-3 w-3 mr-1" />
              Búsqueda Inteligente
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <AIAssistantChat />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Capacidades del Asistente
                </CardTitle>
                <CardDescription>Consulta conversacional sobre tus datos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FolderOpen className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <div className="font-medium text-sm">Exploración de Carpetas</div>
                      <div className="text-xs text-muted-foreground">Navega y consulta estructura de Drive</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <div className="font-medium text-sm">Búsqueda de Documentos</div>
                      <div className="text-xs text-muted-foreground">Encuentra archivos por contenido o nombre</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <div className="font-medium text-sm">Análisis de KMZ</div>
                      <div className="text-xs text-muted-foreground">Consulta sobre archivos de ubicación</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Search className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <div className="font-medium text-sm">Consultas Inteligentes</div>
                      <div className="text-xs text-muted-foreground">Pregunta en lenguaje natural</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ejemplos de Consultas</CardTitle>
                <CardDescription>Pregunta sobre tus datos en Drive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="p-3 bg-secondary rounded-lg">
                    <div className="font-medium text-secondary-foreground">Carpetas y Archivos</div>
                    <div className="text-xs text-muted-foreground">&quot;¿Qué carpetas tengo en CAMPOS?&quot;</div>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <div className="font-medium text-secondary-foreground">Búsqueda de Documentos</div>
                    <div className="text-xs text-muted-foreground">&quot;Busca contratos de Puerto Varas&quot;</div>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <div className="font-medium text-secondary-foreground">Archivos KMZ</div>
                    <div className="text-xs text-muted-foreground">&quot;¿Cuántos archivos KMZ tengo?&quot;</div>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <div className="font-medium text-secondary-foreground">Análisis de Datos</div>
                    <div className="text-xs text-muted-foreground">&quot;Resume los documentos del cliente X&quot;</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fuentes de Datos</CardTitle>
                <CardDescription>Información en tiempo real</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Google Drive</span>
                    <Badge variant="outline" className="text-xs">
                      Conectado
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Base de Datos Supabase</span>
                    <Badge variant="outline" className="text-xs">
                      Activo
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Archivos KMZ</span>
                    <Badge variant="outline" className="text-xs">
                      Sincronizado
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-3">Actualización en tiempo real</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

import { AIAssistantChat } from "@/components/ai-assistant/ai-assistant-chat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Brain, TrendingUp, Calculator, MapPin, DollarSign } from 'lucide-react'

export default function AsistenteIAPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Asistente IA Inmobiliario
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-4">
            El asistente inmobiliario más inteligente del sur de Chile
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Brain className="h-3 w-3 mr-1" />
              94.2% Precisión
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <TrendingUp className="h-3 w-3 mr-1" />
              50,000+ Análisis
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Calculator className="h-3 w-3 mr-1" />
              Análisis Complejos
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <AIAssistantChat />
          </div>

          {/* Capabilities Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  Capacidades IA
                </CardTitle>
                <CardDescription>
                  Análisis avanzado con inteligencia artificial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <div className="font-medium text-sm">Análisis Predictivo</div>
                      <div className="text-xs text-gray-600">Proyecciones de mercado 3-5 años</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calculator className="h-4 w-4 text-blue-600 mt-1" />
                    <div>
                      <div className="font-medium text-sm">Valoraciones Automáticas</div>
                      <div className="text-xs text-gray-600">Estimaciones precisas en 30 segundos</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-purple-600 mt-1" />
                    <div>
                      <div className="font-medium text-sm">Análisis Geográfico</div>
                      <div className="text-xs text-gray-600">Riesgos y oportunidades por zona</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-4 w-4 text-orange-600 mt-1" />
                    <div>
                      <div className="font-medium text-sm">Estrategias Financieras</div>
                      <div className="text-xs text-gray-600">Optimización de financiamiento</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consultas Complejas</CardTitle>
                <CardDescription>
                  Ejemplos de análisis avanzados disponibles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800">Análisis de Inversión</div>
                    <div className="text-xs text-blue-600">Cartera óptima, ROI, diversificación</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800">Proyecciones de Mercado</div>
                    <div className="text-xs text-green-600">Tendencias 10 años, factores macro</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="font-medium text-purple-800">Comparación Multi-variable</div>
                    <div className="text-xs text-purple-600">Análisis integral por ubicación</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="font-medium text-orange-800">Estrategia Financiera</div>
                    <div className="text-xs text-orange-600">Optimización tributaria y créditos</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fuentes de Datos</CardTitle>
                <CardDescription>
                  Información en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>SII (Servicio Impuestos)</span>
                    <Badge variant="outline" className="text-xs">Activo</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>CIREN (Catastro)</span>
                    <Badge variant="outline" className="text-xs">Activo</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Banco Central</span>
                    <Badge variant="outline" className="text-xs">Activo</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>OpenStreetMap</span>
                    <Badge variant="outline" className="text-xs">Activo</Badge>
                  </div>
                  <div className="text-xs text-gray-600 mt-3">
                    Actualización cada 15 minutos
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

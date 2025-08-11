"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart3,
  Lightbulb,
  Zap,
  Activity,
  DollarSign,
  MapPin,
  Clock,
  Users,
} from "lucide-react"
import { analysisService } from "@/lib/ai/analysis/analysis-service"
import type { PropertyAnalysis, MarketComparison, AIRecommendations } from "@/lib/ai/analysis/analysis-service"

interface DashboardStats {
  totalAnalyses: number
  avgScore: number
  highPotentialProperties: number
  activeRecommendations: number
  marketTrend: number
  aiAccuracy: number
}

export default function EnhancedIADashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentAnalyses, setRecentAnalyses] = useState<PropertyAnalysis[]>([])
  const [marketInsights, setMarketInsights] = useState<MarketComparison | null>(null)
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendations | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Simular carga de datos del dashboard
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Datos demo del dashboard
      setStats({
        totalAnalyses: 247,
        avgScore: 78.5,
        highPotentialProperties: 34,
        activeRecommendations: 89,
        marketTrend: 12.3,
        aiAccuracy: 94.2,
      })

      // Análisis recientes demo
      setRecentAnalyses([
        {
          propertyId: "1",
          overallScore: 92,
          marketValue: 285000000,
          investmentPotential: "HIGH",
          riskLevel: "LOW",
          recommendations: ["Optimizar precio", "Mejorar marketing"],
          marketTrends: { priceGrowth: 8.5, demandLevel: 85, competitionIndex: 45 },
          locationAnalysis: { walkabilityScore: 85, amenitiesScore: 90, transportScore: 75, safetyScore: 95 },
          financialProjection: {
            expectedROI: 8.2,
            paybackPeriod: 14.5,
            cashFlow: [12000000, 13000000, 14000000, 15000000, 16000000],
          },
          aiInsights: ["Ubicación premium", "Alta demanda turística"],
          lastUpdated: new Date().toISOString(),
        },
        {
          propertyId: "2",
          overallScore: 76,
          marketValue: 195000000,
          investmentPotential: "MEDIUM",
          riskLevel: "MEDIUM",
          recommendations: ["Mejorar amenidades", "Ajustar precio"],
          marketTrends: { priceGrowth: 6.2, demandLevel: 72, competitionIndex: 58 },
          locationAnalysis: { walkabilityScore: 70, amenitiesScore: 65, transportScore: 80, safetyScore: 85 },
          financialProjection: {
            expectedROI: 6.8,
            paybackPeriod: 16.2,
            cashFlow: [8000000, 9000000, 10000000, 11000000, 12000000],
          },
          aiInsights: ["Potencial de mejora", "Mercado estable"],
          lastUpdated: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeProperty = async (propertyId: string) => {
    setSelectedProperty(propertyId)
    setLoading(true)

    try {
      const [analysis, market, recommendations] = await Promise.all([
        analysisService.analyzeProperty(propertyId),
        analysisService.compareWithMarket(propertyId),
        analysisService.generateAIRecommendations(propertyId),
      ])

      // Actualizar con datos reales
      setRecentAnalyses((prev) => [analysis, ...prev.slice(0, 4)])
      setMarketInsights(market)
      setAiRecommendations(recommendations)
    } catch (error) {
      console.error("Error analyzing property:", error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getPotentialBadge = (potential: string) => {
    const colors = {
      HIGH: "bg-green-100 text-green-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      LOW: "bg-red-100 text-red-800",
    }
    return colors[potential as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Análisis Totales</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAnalyses}</div>
            <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Promedio IA</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgScore}</div>
            <Progress value={stats?.avgScore} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alto Potencial</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.highPotentialProperties}</div>
            <p className="text-xs text-muted-foreground">Propiedades identificadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precisión IA</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.aiAccuracy}%</div>
            <p className="text-xs text-muted-foreground">Modelo v2.1 activo</p>
          </CardContent>
        </Card>
      </div>

      {/* Análisis en tiempo real */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Análisis IA en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => analyzeProperty("sample-1")} disabled={loading} variant="outline">
                {loading ? "Analizando..." : "Analizar Propiedad Demo 1"}
              </Button>
              <Button onClick={() => analyzeProperty("sample-2")} disabled={loading} variant="outline">
                {loading ? "Analizando..." : "Analizar Propiedad Demo 2"}
              </Button>
            </div>

            {loading && selectedProperty && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <div>
                    <div className="font-medium">Procesando con IA...</div>
                    <div className="text-sm text-gray-600">Analizando datos de mercado, ubicación y tendencias</div>
                  </div>
                </div>
                <Progress value={75} className="h-2 mt-3" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Análisis recientes */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recent">Análisis Recientes</TabsTrigger>
          <TabsTrigger value="market">Comparación Mercado</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendaciones IA</TabsTrigger>
          <TabsTrigger value="insights">Insights Avanzados</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recentAnalyses.map((analysis, index) => (
              <Card key={analysis.propertyId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Propiedad #{analysis.propertyId}</span>
                    <Badge variant="outline" className={getPotentialBadge(analysis.investmentPotential)}>
                      {analysis.investmentPotential}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Score IA:</span>
                      <span className={`text-lg font-bold ${getScoreColor(analysis.overallScore)}`}>
                        {analysis.overallScore}/100
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Valor Estimado:</span>
                      <span className="font-medium">${(analysis.marketValue / 1000000).toFixed(0)}M</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ROI Esperado:</span>
                      <span className="font-medium text-green-600">{analysis.financialProjection.expectedROI}%</span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Análisis de Ubicación:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>Caminabilidad:</span>
                          <span>{analysis.locationAnalysis.walkabilityScore}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amenidades:</span>
                          <span>{analysis.locationAnalysis.amenitiesScore}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transporte:</span>
                          <span>{analysis.locationAnalysis.transportScore}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Seguridad:</span>
                          <span>{analysis.locationAnalysis.safetyScore}/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Insights IA:</div>
                      <div className="space-y-1">
                        {analysis.aiInsights.slice(0, 2).map((insight, i) => (
                          <div key={i} className="text-xs text-gray-600 flex items-start gap-2">
                            <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-500" />
                            {insight}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="market">
          {marketInsights ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Comparación con el Mercado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        ${(marketInsights.marketAverage.price / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-sm text-gray-600">Precio Promedio</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        ${marketInsights.marketAverage.pricePerSqm.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Precio por m²</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{Math.round(marketInsights.marketAverage.daysOnMarket)}</div>
                      <div className="text-sm text-gray-600">Días en Mercado</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Propiedades Similares:</h4>
                    {marketInsights.similarProperties.map((prop, index) => (
                      <div key={prop.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">{prop.title}</div>
                          <div className="text-sm text-gray-600">Similitud: {prop.similarity}%</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${(prop.price / 1000000).toFixed(1)}M</div>
                          <div className="text-sm text-gray-600">${prop.pricePerSqm.toLocaleString()}/m²</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-600">
                  Ejecuta un análisis para ver la comparación con el mercado
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations">
          {aiRecommendations ? (
            <div className="space-y-4">
              {aiRecommendations.recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        {rec.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            rec.priority === "HIGH"
                              ? "bg-red-100 text-red-800"
                              : rec.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          }
                        >
                          {rec.priority}
                        </Badge>
                        <Badge variant="outline">{rec.type}</Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{rec.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span>Impacto: +{rec.estimatedImpact}%</span>
                      </div>
                      {rec.estimatedCost && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span>Costo: ${(rec.estimatedCost / 1000000).toFixed(1)}M</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span>Tiempo: {rec.timeframe}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-600">Ejecuta un análisis para ver las recomendaciones de IA</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tendencias del Mercado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Crecimiento de Precios:</span>
                    <span className="font-bold text-green-600">+{stats?.marketTrend}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Demanda Regional:</span>
                    <span className="font-bold">Alta</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Inventario:</span>
                    <span className="font-bold text-yellow-600">Moderado</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tiempo Promedio Venta:</span>
                    <span className="font-bold">85 días</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Segmentación de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Inversores Locales:</span>
                    <span className="font-bold">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Compradores Extranjeros:</span>
                    <span className="font-bold">30%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Primera Vivienda:</span>
                    <span className="font-bold">15%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Uso Vacacional:</span>
                    <span className="font-bold">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Análisis Geográfico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Puerto Varas:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="h-2 w-20" />
                      <span className="text-sm">85%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pucón:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={78} className="h-2 w-20" />
                      <span className="text-sm">78%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Valdivia:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={72} className="h-2 w-20" />
                      <span className="text-sm">72%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Frutillar:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={68} className="h-2 w-20" />
                      <span className="text-sm">68%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas y Oportunidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <div className="font-medium text-green-800">Oportunidad</div>
                    <div className="text-sm text-green-700">
                      Incremento en búsquedas de propiedades con vista al lago (+25%)
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="font-medium text-yellow-800">Atención</div>
                    <div className="text-sm text-yellow-700">
                      Aumento en tiempo promedio de venta en segmento premium
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="font-medium text-blue-800">Tendencia</div>
                    <div className="text-sm text-blue-700">
                      Mayor interés en propiedades sustentables y eco-friendly
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

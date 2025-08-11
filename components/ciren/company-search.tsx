"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Building2, Search, TrendingUp, AlertTriangle, Shield, Brain, ExternalLink } from "lucide-react"
import { cirenService } from "@/lib/ciren/ciren-service"
import type { CirenCompany, CirenRiskProfile, CirenFinancialData, CirenAIInsight } from "@/lib/ciren/types"

export default function CirenCompanySearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<CirenCompany | null>(null)
  const [riskProfile, setRiskProfile] = useState<CirenRiskProfile | null>(null)
  const [financialData, setFinancialData] = useState<CirenFinancialData[]>([])
  const [aiInsights, setAiInsights] = useState<CirenAIInsight | null>(null)
  const [companies, setCompanies] = useState<CirenCompany[]>([])

  const searchCompanies = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      const result = await cirenService.searchCompanies({
        rut: searchTerm.includes("-") ? searchTerm : undefined,
        razonSocial: !searchTerm.includes("-") ? searchTerm : undefined,
      })
      setCompanies(result.empresas)

      // Si solo hay una empresa, seleccionarla automáticamente
      if (result.empresas.length === 1) {
        await selectCompany(result.empresas[0])
      }
    } catch (error) {
      console.error("Error searching companies:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectCompany = async (company: CirenCompany) => {
    setSelectedCompany(company)
    setLoading(true)

    try {
      // Cargar datos en paralelo
      const [risk, financial, insights] = await Promise.all([
        cirenService.getRiskProfile(company.rut),
        cirenService.getFinancialData(company.rut),
        cirenService.getAIInsights(company.rut),
      ])

      setRiskProfile(risk)
      setFinancialData(financial)
      setAiInsights(insights)
    } catch (error) {
      console.error("Error loading company data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (categoria: string) => {
    const colors: Record<string, string> = {
      AAA: "bg-green-100 text-green-800",
      AA: "bg-green-100 text-green-800",
      A: "bg-blue-100 text-blue-800",
      BBB: "bg-yellow-100 text-yellow-800",
      BB: "bg-orange-100 text-orange-800",
      B: "bg-red-100 text-red-800",
      CCC: "bg-red-100 text-red-800",
      CC: "bg-red-100 text-red-800",
      C: "bg-red-100 text-red-800",
      D: "bg-red-100 text-red-800",
    }
    return colors[categoria] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Búsqueda CIREN - Análisis de Riesgo Empresarial
            <a
              href="https://ciren.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              ciren.cl
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por RUT (76.123.456-7) o nombre de empresa"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && searchCompanies()}
              />
              <Button onClick={searchCompanies} disabled={loading || !searchTerm.trim()}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("76.123.456-7")
                  setTimeout(searchCompanies, 100)
                }}
              >
                Inmobiliaria Patagonia
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("96.234.567-8")
                  setTimeout(searchCompanies, 100)
                }}
              >
                Desarrollos del Sur
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("Construcción")
                  setTimeout(searchCompanies, 100)
                }}
              >
                Empresas Construcción
              </Button>
            </div>

            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
              <strong>CIREN</strong> - Centro de Información de Riesgos Empresariales de Chile proporciona análisis de
              riesgo crediticio y financiero para empresas chilenas con tecnología de IA avanzada.
            </div>
          </div>
        </CardContent>
      </Card>

      {companies.length > 0 && !selectedCompany && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Búsqueda CIREN</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companies.map((company) => (
                <div
                  key={company.rut}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => selectCompany(company)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{company.razonSocial}</div>
                      {company.nombreFantasia && <div className="text-sm text-gray-600">{company.nombreFantasia}</div>}
                      <div className="text-sm text-gray-600">RUT: {company.rut}</div>
                      <div className="text-sm text-gray-600">{company.giro}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{company.estado}</Badge>
                      <div className="text-sm text-gray-600 mt-1">{company.comuna}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCompany && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedCompany.razonSocial}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Análisis CIREN
                  </Badge>
                  <Button variant="outline" onClick={() => setSelectedCompany(null)}>
                    Nueva Búsqueda
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Información General</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">RUT:</span>
                      <span className="font-medium">{selectedCompany.rut}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre Fantasía:</span>
                      <span className="font-medium">{selectedCompany.nombreFantasia || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <Badge variant="outline">{selectedCompany.estado}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capital:</span>
                      <span className="font-medium">${selectedCompany.capital.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Contacto</h4>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Dirección:</span>
                      <div className="font-medium">{selectedCompany.direccion}</div>
                      <div className="text-gray-600">
                        {selectedCompany.comuna}, {selectedCompany.region}
                      </div>
                    </div>
                    {selectedCompany.telefono && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Teléfono:</span>
                        <span className="font-medium">{selectedCompany.telefono}</span>
                      </div>
                    )}
                    {selectedCompany.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedCompany.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-lg font-medium mb-2">Analizando con IA CIREN...</div>
                  <div className="text-sm text-gray-600 mb-4">Procesando datos de riesgo y generando insights</div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {riskProfile && aiInsights && (
            <Tabs defaultValue="risk" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="risk">Perfil de Riesgo</TabsTrigger>
                <TabsTrigger value="financial">Datos Financieros</TabsTrigger>
                <TabsTrigger value="ai-insights">Análisis IA</TabsTrigger>
                <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
              </TabsList>

              <TabsContent value="risk">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Score de Crédito CIREN
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{riskProfile.scoreCredito}</div>
                      <div className="text-sm text-gray-600">de 1000</div>
                      <Progress value={riskProfile.scoreCredito / 10} className="h-2 mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Categoría de Riesgo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="default" className={getRiskColor(riskProfile.categoriaRiesgo)}>
                        {riskProfile.categoriaRiesgo}
                      </Badge>
                      <div className="text-sm text-gray-600 mt-2">Tendencia: {riskProfile.tendencia}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Prob. Incumplimiento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{riskProfile.probabilidadIncumplimiento}%</div>
                      <div className="text-sm text-gray-600">Próximos 12 meses</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Límite de Crédito y Alertas CIREN</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Límite de Crédito</h4>
                        <div className="text-2xl font-bold text-green-600">
                          ${riskProfile.limiteCredito.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          Última evaluación: {new Date(riskProfile.fechaUltimaEvaluacion).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Alertas Activas</h4>
                        {riskProfile.alertas.length === 0 ? (
                          <div className="text-green-600">✓ Sin alertas activas</div>
                        ) : (
                          <div className="space-y-2">
                            {riskProfile.alertas.map((alerta) => (
                              <div key={alerta.id} className="border rounded p-2">
                                <div className="font-medium">{alerta.tipo}</div>
                                <div className="text-sm text-gray-600">{alerta.descripcion}</div>
                                <Badge variant="outline" className="mt-1">
                                  {alerta.estado}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolución Financiera - Datos CIREN</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {financialData.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {financialData.map((data) => (
                            <div key={data.ano} className="border rounded-lg p-4">
                              <div className="text-center mb-3">
                                <div className="text-lg font-bold">Año {data.ano}</div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Ingresos:</span>
                                  <span className="text-sm font-medium">${(data.ingresos / 1000000).toFixed(0)}M</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Patrimonio:</span>
                                  <span className="text-sm font-medium">
                                    ${(data.patrimonio / 1000000).toFixed(0)}M
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Utilidades:</span>
                                  <span className="text-sm font-medium">
                                    ${(data.utilidades / 1000000).toFixed(0)}M
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Liquidez:</span>
                                  <span className="text-sm font-medium">{data.liquidez.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-600">Cargando datos financieros...</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-insights">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Análisis IA CIREN - Resumen Ejecutivo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{aiInsights.scoreConfiabilidad}%</div>
                          <div className="text-sm text-gray-600">Confiabilidad IA</div>
                        </div>
                        <div className="text-center">
                          <Badge
                            variant="default"
                            className={
                              aiInsights.perspectiva === "POSITIVA"
                                ? "bg-green-100 text-green-800"
                                : aiInsights.perspectiva === "NEGATIVA"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {aiInsights.perspectiva}
                          </Badge>
                          <div className="text-sm text-gray-600 mt-1">Perspectiva</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{aiInsights.factoresRiesgo.length}</div>
                          <div className="text-sm text-gray-600">Factores de Riesgo</div>
                        </div>
                      </div>

                      <div className="prose max-w-none">
                        <p className="text-gray-700">{aiInsights.resumenEjecutivo}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-green-600">Fortalezas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {aiInsights.fortalezas.map((fortaleza, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                              <div className="text-sm">{fortaleza}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-red-600">Debilidades</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {aiInsights.debilidades.map((debilidad, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                              <div className="text-sm">{debilidad}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-blue-600">Oportunidades</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {aiInsights.oportunidades.map((oportunidad, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <div className="text-sm">{oportunidad}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-yellow-600">Amenazas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {aiInsights.amenazas.map((amenaza, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                              <div className="text-sm">{amenaza}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recommendations">
                <Card>
                  <CardHeader>
                    <CardTitle>Recomendaciones Estratégicas IA CIREN</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {aiInsights.recomendaciones.map((recomendacion, index) => (
                        <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div className="text-sm text-blue-800">{recomendacion}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Factores de Riesgo a Monitorear</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiInsights.factoresRiesgo.map((factor, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                      Análisis generado por IA de CIREN basado en datos oficiales y algoritmos de machine learning
                      especializados en riesgo empresarial chileno.
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Building2, MapPin, TrendingUp, Shield, Wallet, School, Hospital, ShoppingCart, Car } from "lucide-react"

export default function ComprehensivePropertyAnalysis() {
  const [rolAvaluo, setRolAvaluo] = useState("")
  const [loading, setLoading] = useState(false)
  const [analysisData, setAnalysisData] = useState<any>(null)

  const analyzeProperty = async () => {
    setLoading(true)

    // Simulación de análisis integral
    setTimeout(() => {
      setAnalysisData({
        sii: {
          avaluoFiscal: 300000000,
          propietario: "CARLOS MARTINEZ SILVA",
          contribuciones: "AL DIA",
        },
        cbr: {
          gravamenes: 1,
          hipoteca: 150000000,
          historialLimpio: true,
        },
        sirene: {
          empresasCercanas: 12,
          proyectosActivos: 3,
          inversionZona: 45000000000,
        },
        osm: {
          walkScore: 78,
          transitScore: 65,
          amenitiesCercanas: 24,
        },
        bancocentral: {
          valorUF: 8048,
          tendenciaUF: "CRECIENTE",
          tasaInteres: 11.25,
        },
        riskAnalysis: {
          riesgoInversion: "BAJO",
          potencialValorizacion: "ALTO",
          liquidez: "MEDIA",
        },
      })
      setLoading(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Análisis Integral de Propiedad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Ingresa rol de avalúo (ej: 125-8-0)"
              value={rolAvaluo}
              onChange={(e) => setRolAvaluo(e.target.value)}
              className="flex-1"
            />
            <Button onClick={analyzeProperty} disabled={loading || !rolAvaluo}>
              {loading ? "Analizando..." : "Analizar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium">Recopilando información...</h3>
                <p className="text-sm text-gray-600">Consultando múltiples bases de datos</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>SII - Datos fiscales</span>
                  <span>✓</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CBR - Historial legal</span>
                  <span>✓</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>SIRENE - Entorno empresarial</span>
                  <span>⏳</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>OSM - Amenidades</span>
                  <span>⏳</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Banco Central - Indicadores</span>
                  <span>⏳</span>
                </div>
              </div>
              <Progress value={60} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {analysisData && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
            <TabsTrigger value="market">Mercado</TabsTrigger>
            <TabsTrigger value="location">Ubicación</TabsTrigger>
            <TabsTrigger value="financial">Financiero</TabsTrigger>
            <TabsTrigger value="risk">Riesgo</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Valoración
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analysisData.sii.avaluoFiscal.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{analysisData.bancocentral.valorUF.toLocaleString()} UF</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Walk Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{analysisData.osm.walkScore}</div>
                  <div className="text-sm text-gray-600">Muy caminable</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Potencial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {analysisData.riskAnalysis.potencialValorizacion}
                  </Badge>
                  <div className="text-sm text-gray-600 mt-1">Valorización</div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Análisis IA - Recomendaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Excelente ubicación</p>
                      <p className="text-sm text-gray-600">
                        La propiedad está en una zona con alta demanda y buena conectividad.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Entorno empresarial activo</p>
                      <p className="text-sm text-gray-600">
                        {analysisData.sirene.empresasCercanas} empresas inmobiliarias operando en la zona.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Considerar hipoteca existente</p>
                      <p className="text-sm text-gray-600">
                        Existe una hipoteca por ${analysisData.cbr.hipoteca.toLocaleString()}.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal">
            <div className="space-y-6">
              {/* Resumen Legal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Estado Legal de la Propiedad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">✓</div>
                      <div className="text-sm font-medium">Historial Limpio</div>
                      <div className="text-xs text-gray-600">Sin observaciones</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">1</div>
                      <div className="text-sm font-medium">Gravamen Activo</div>
                      <div className="text-xs text-gray-600">Hipoteca vigente</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">3</div>
                      <div className="text-sm font-medium">Transferencias</div>
                      <div className="text-xs text-gray-600">Historial completo</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inscripción de Dominio */}
              <Card>
                <CardHeader>
                  <CardTitle>Inscripción de Dominio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Datos de Inscripción</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fojas:</span>
                          <span className="font-medium">1250</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Número:</span>
                          <span className="font-medium">890</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Año:</span>
                          <span className="font-medium">2023</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fecha:</span>
                          <span className="font-medium">15 de Agosto, 2023</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Conservador</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium">CONSERVADOR PUERTO VARAS</div>
                        <div className="text-sm text-gray-600">Región de Los Lagos</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Propietarios Actuales */}
              <Card>
                <CardHeader>
                  <CardTitle>Propietarios Actuales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">CARLOS EDUARDO MARTINEZ SILVA</div>
                          <div className="text-sm text-gray-600">RUT: 12.345.678-9</div>
                        </div>
                        <Badge variant="outline">60% Derecho</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="inline-block mr-4">Estado Civil: CASADO</span>
                        <span>Régimen: SOCIEDAD CONYUGAL</span>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">MARIA TERESA GONZALEZ LOPEZ</div>
                          <div className="text-sm text-gray-600">RUT: 98.765.432-1</div>
                        </div>
                        <Badge variant="outline">40% Derecho</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="inline-block mr-4">Estado Civil: CASADA</span>
                        <span>Régimen: SOCIEDAD CONYUGAL</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gravámenes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-red-500" />
                    Gravámenes Vigentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-red-800">HIPOTECA</div>
                        <div className="text-sm text-red-600">Gravamen de primer grado</div>
                      </div>
                      <Badge variant="destructive">VIGENTE</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Acreedor</div>
                        <div className="font-medium">BANCO DE CHILE</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Monto</div>
                        <div className="font-medium text-red-600">$150.000.000</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Fecha Inscripción</div>
                        <div className="font-medium">15 de Agosto, 2023</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Estado</div>
                        <div className="font-medium text-red-600">VIGENTE</div>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="text-sm text-yellow-800">
                        <strong>⚠️ Importante:</strong> Esta hipoteca debe ser considerada en cualquier transacción.
                        Representa el 50% del valor fiscal de la propiedad.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Historial de Dominio */}
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Transferencias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Transferencia más reciente */}
                    <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-green-800">COMPRAVENTA ACTUAL</div>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          15 Ago 2023
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Vendedor</div>
                          <div className="font-medium">INMOBILIARIA PATAGONIA SPA</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Comprador</div>
                          <div className="font-medium">CARLOS MARTINEZ Y MARIA GONZALEZ</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Precio</div>
                          <div className="font-medium text-green-600">$280.000.000</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Tipo</div>
                          <div className="font-medium">COMPRAVENTA</div>
                        </div>
                      </div>
                    </div>

                    {/* Transferencia anterior */}
                    <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-blue-800">COMPRAVENTA ANTERIOR</div>
                        <Badge variant="outline">15 Mar 2020</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Vendedor</div>
                          <div className="font-medium">CONSTRUCTORA DEL SUR LTDA</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Comprador</div>
                          <div className="font-medium">INMOBILIARIA PATAGONIA SPA</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Precio</div>
                          <div className="font-medium text-blue-600">$220.000.000</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Valorización</div>
                          <div className="font-medium text-green-600">+27.3% en 3 años</div>
                        </div>
                      </div>
                    </div>

                    {/* Análisis Detallado de Valorización */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          Análisis Detallado de Valorización
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Resumen de Crecimiento */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">+27.3%</div>
                              <div className="text-sm text-gray-600">Crecimiento Total</div>
                              <div className="text-xs text-gray-500">2020 → 2023</div>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">+7.5%</div>
                              <div className="text-sm text-gray-600">Anual Promedio</div>
                              <div className="text-xs text-gray-500">Compuesto</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">$60M</div>
                              <div className="text-sm text-gray-600">Ganancia Total</div>
                              <div className="text-xs text-gray-500">En 3 años</div>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                              <div className="text-2xl font-bold text-yellow-600">$20M</div>
                              <div className="text-sm text-gray-600">Ganancia Anual</div>
                              <div className="text-xs text-gray-500">Promedio</div>
                            </div>
                          </div>

                          {/* Evolución de Precios */}
                          <div>
                            <h4 className="font-medium mb-3">Evolución de Precios</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                  <div>
                                    <div className="font-medium">Marzo 2020 - Compra Original</div>
                                    <div className="text-sm text-gray-600">
                                      Constructora del Sur → Inmobiliaria Patagonia
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold">$220.000.000</div>
                                  <div className="text-sm text-gray-600">Base de cálculo</div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  <div>
                                    <div className="font-medium">Agosto 2023 - Venta Actual</div>
                                    <div className="text-sm text-gray-600">
                                      Inmobiliaria Patagonia → Propietarios Actuales
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-green-600">$280.000.000</div>
                                  <div className="text-sm text-green-600">+$60.000.000</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Comparativa con Mercado */}
                          <div>
                            <h4 className="font-medium mb-3">Comparativa con el Mercado</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="border rounded-lg p-4">
                                <div className="text-center mb-3">
                                  <div className="text-lg font-bold text-green-600">Esta Propiedad</div>
                                  <div className="text-sm text-gray-600">2020-2023</div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Crecimiento anual:</span>
                                    <span className="font-medium text-green-600">+7.5%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Crecimiento total:</span>
                                    <span className="font-medium text-green-600">+27.3%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Valorización:</span>
                                    <span className="font-medium text-green-600">Excelente</span>
                                  </div>
                                </div>
                              </div>

                              <div className="border rounded-lg p-4">
                                <div className="text-center mb-3">
                                  <div className="text-lg font-bold text-blue-600">Mercado Puerto Varas</div>
                                  <div className="text-sm text-gray-600">Promedio regional</div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Crecimiento anual:</span>
                                    <span className="font-medium text-blue-600">+5.2%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Crecimiento total:</span>
                                    <span className="font-medium text-blue-600">+16.4%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Valorización:</span>
                                    <span className="font-medium text-blue-600">Buena</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="text-sm text-green-800">
                                <strong>📈 Rendimiento Superior:</strong> Esta propiedad superó al mercado regional por
                                <strong> +2.3% anual</strong>, generando un <strong>+10.9% adicional</strong> en el
                                período.
                              </div>
                            </div>
                          </div>

                          {/* Factores de Valorización */}
                          <div>
                            <h4 className="font-medium mb-3">Factores que Impulsaron la Valorización</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                  <div>
                                    <div className="font-medium">Ubicación Premium</div>
                                    <div className="text-sm text-gray-600">Costanera del Lago con vista panorámica</div>
                                    <div className="text-xs text-green-600">Impacto: +8% valor</div>
                                  </div>
                                </div>

                                <div className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                  <div>
                                    <div className="font-medium">Desarrollo Turístico</div>
                                    <div className="text-sm text-gray-600">Crecimiento del turismo en Puerto Varas</div>
                                    <div className="text-xs text-blue-600">Impacto: +6% valor</div>
                                  </div>
                                </div>

                                <div className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                                  <div>
                                    <div className="font-medium">Infraestructura</div>
                                    <div className="text-sm text-gray-600">Mejoras en conectividad y servicios</div>
                                    <div className="text-xs text-purple-600">Impacto: +4% valor</div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                                  <div>
                                    <div className="font-medium">Demanda Internacional</div>
                                    <div className="text-sm text-gray-600">Interés de compradores extranjeros</div>
                                    <div className="text-xs text-yellow-600">Impacto: +5% valor</div>
                                  </div>
                                </div>

                                <div className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                                  <div>
                                    <div className="font-medium">Escasez de Terrenos</div>
                                    <div className="text-sm text-gray-600">
                                      Limitada disponibilidad en primera línea
                                    </div>
                                    <div className="text-xs text-red-600">Impacto: +4% valor</div>
                                  </div>
                                </div>

                                <div className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                                  <div>
                                    <div className="font-medium">Calidad Construcción</div>
                                    <div className="text-sm text-gray-600">Materiales premium y diseño moderno</div>
                                    <div className="text-xs text-indigo-600">Impacto: +3% valor</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Proyección Futura */}
                          <div>
                            <h4 className="font-medium mb-3">Proyección de Valorización (2024-2027)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center p-4 border rounded-lg">
                                <div className="text-lg font-bold text-green-600">Escenario Conservador</div>
                                <div className="text-2xl font-bold mt-2">+4.5%</div>
                                <div className="text-sm text-gray-600">Anual</div>
                                <div className="text-xs text-gray-500 mt-1">Valor 2027: $330M</div>
                              </div>

                              <div className="text-center p-4 border rounded-lg bg-blue-50">
                                <div className="text-lg font-bold text-blue-600">Escenario Probable</div>
                                <div className="text-2xl font-bold mt-2">+6.0%</div>
                                <div className="text-sm text-gray-600">Anual</div>
                                <div className="text-xs text-gray-500 mt-1">Valor 2027: $355M</div>
                              </div>

                              <div className="text-center p-4 border rounded-lg">
                                <div className="text-lg font-bold text-purple-600">Escenario Optimista</div>
                                <div className="text-2xl font-bold mt-2">+8.0%</div>
                                <div className="text-sm text-gray-600">Anual</div>
                                <div className="text-xs text-gray-500 mt-1">Valor 2027: $385M</div>
                              </div>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="text-sm text-blue-800">
                                <strong>🔮 Proyección IA:</strong> Basado en tendencias históricas, desarrollo regional
                                y factores macroeconómicos, se estima una valorización del <strong>6.0% anual</strong>
                                para los próximos 4 años.
                              </div>
                            </div>
                          </div>

                          {/* ROI Analysis */}
                          <div>
                            <h4 className="font-medium mb-3">Análisis de Retorno de Inversión (ROI)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="border rounded-lg p-4">
                                <div className="text-center mb-3">
                                  <div className="text-lg font-bold">ROI Histórico</div>
                                  <div className="text-sm text-gray-600">2020-2023</div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Inversión inicial:</span>
                                    <span className="font-medium">$220.000.000</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Valor actual:</span>
                                    <span className="font-medium">$280.000.000</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Ganancia:</span>
                                    <span className="font-medium text-green-600">$60.000.000</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-2">
                                    <span className="font-medium">ROI Total:</span>
                                    <span className="font-bold text-green-600">27.3%</span>
                                  </div>
                                </div>
                              </div>

                              <div className="border rounded-lg p-4">
                                <div className="text-center mb-3">
                                  <div className="text-lg font-bold">ROI Proyectado</div>
                                  <div className="text-sm text-gray-600">2024-2027</div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Valor actual:</span>
                                    <span className="font-medium">$280.000.000</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Valor proyectado:</span>
                                    <span className="font-medium">$355.000.000</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Ganancia esperada:</span>
                                    <span className="font-medium text-blue-600">$75.000.000</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-2">
                                    <span className="font-medium">ROI Esperado:</span>
                                    <span className="font-bold text-blue-600">26.8%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Recomendaciones Legales */}
              <Card>
                <CardHeader>
                  <CardTitle>Recomendaciones Legales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-green-800">Historial legal limpio</p>
                        <p className="text-sm text-gray-600">
                          No se encontraron prohibiciones, embargos o litigios pendientes.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-yellow-800">Verificar estado hipoteca</p>
                        <p className="text-sm text-gray-600">
                          Confirmar saldo actual y condiciones de la hipoteca con Banco de Chile.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-blue-800">Valorización consistente</p>
                        <p className="text-sm text-gray-600">
                          El historial muestra una valorización sostenida del 7.5% anual.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="location">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Puntuaciones de Movilidad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Walk Score</span>
                      <span className="text-sm font-medium">{analysisData.osm.walkScore}</span>
                    </div>
                    <Progress value={analysisData.osm.walkScore} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Transit Score</span>
                      <span className="text-sm font-medium">{analysisData.osm.transitScore}</span>
                    </div>
                    <Progress value={analysisData.osm.transitScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Amenidades Cercanas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">3 Colegios</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hospital className="h-4 w-4 text-red-500" />
                      <span className="text-sm">2 Hospitales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-green-500" />
                      <span className="text-sm">5 Comercios</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">4 Transporte</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Contexto Financiero</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">UF {analysisData.bancocentral.valorUF.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Valor en UF</div>
                    <Badge variant="outline" className="mt-1">
                      {analysisData.bancocentral.tendenciaUF}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysisData.bancocentral.tasaInteres}%</div>
                    <div className="text-sm text-gray-600">Tasa de interés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analysisData.riskAnalysis.liquidez}</div>
                    <div className="text-sm text-gray-600">Liquidez del mercado</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Riesgo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Riesgo de Inversión</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {analysisData.riskAnalysis.riesgoInversion}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Potencial de Valorización</span>
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      {analysisData.riskAnalysis.potencialValorizacion}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Liquidez</span>
                    <Badge variant="outline">{analysisData.riskAnalysis.liquidez}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

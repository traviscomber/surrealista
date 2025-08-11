"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import {
  Search,
  BarChart3,
  Globe,
  MessageSquare,
  FileText,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  Users,
  Brain,
  Target,
  TrendingUp,
  Database,
  Leaf,
  MapPin,
  DollarSign,
  Calendar,
  Eye,
  Star,
  Shield,
} from "lucide-react"

export function AIPracticalExamples() {
  const [activeTab, setActiveTab] = useState("busqueda")

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">IA en Acción: Ejemplos Prácticos</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Descubre cómo nuestra tecnología de inteligencia artificial transforma la experiencia inmobiliaria con
            ejemplos concretos, casos de uso reales y resultados medibles en el sur de Chile.
          </p>
        </div>

        <Tabs defaultValue="busqueda" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-8">
            <TabsTrigger value="busqueda" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Búsqueda</span>
            </TabsTrigger>
            <TabsTrigger value="valoracion" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Valoración</span>
            </TabsTrigger>
            <TabsTrigger value="asistente" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Asistente</span>
            </TabsTrigger>
            <TabsTrigger value="documentos" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Documentos</span>
            </TabsTrigger>
            <TabsTrigger value="internacional" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Internacional</span>
            </TabsTrigger>
            <TabsTrigger value="sostenibilidad" className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              <span>Sostenibilidad</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="busqueda">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Brain className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">PropertyAnalyst-GPT</h3>
                        <Badge variant="outline" className="mt-1">
                          95% Precisión en 30s
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Agente especializado en análisis integral de propiedades utilizando imágenes satelitales, datos
                      geoespaciales y machine learning para evaluaciones instantáneas.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full mt-1">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Análisis Instantáneo</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>30 segundos</strong> para procesar imágenes satelitales, topografía, accesos, recursos
                          hídricos y potencial de desarrollo
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full mt-1">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Precisión Valoración</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>95% de precisión</strong> comparado con avalúos tradicionales, con margen de error
                          &lt;5%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full mt-1">
                        <Zap className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Eficiencia Operacional</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>-92% reducción</strong> en tiempo de análisis vs. métodos tradicionales (de 2 semanas
                          a 30 segundos)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 rounded-xl overflow-hidden shadow-lg border border-gray-100">
                  <div className="relative h-[500px]">
                    <Image
                      src="/images/ai-futuristic-search.png"
                      alt="Interfaz futurista de búsqueda inteligente de propiedades"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Caso de Uso Detallado */}
              <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    Caso de Uso: Búsqueda de Terreno Agrícola en Valdivia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-blue-800">Consulta del Cliente:</h4>
                      <p className="text-sm bg-white p-3 rounded border-l-4 border-blue-500">
                        "Busco un terreno de 50-100 hectáreas cerca de Valdivia para cultivo de berries, con acceso a
                        agua, suelo bien drenado y cercanía a rutas principales para exportación."
                      </p>

                      <h4 className="font-semibold text-blue-800">Proceso de IA:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Análisis de 847 propiedades en radio de 50km</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Evaluación de calidad de suelo via imágenes satelitales</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Análisis de derechos de agua y disponibilidad</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Cálculo de distancias a puertos y centros logísticos</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-blue-800">Resultados en 30 segundos:</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-3">
                          <div className="text-2xl font-bold text-blue-600">3</div>
                          <div className="text-xs text-gray-600">Propiedades ideales identificadas</div>
                        </Card>
                        <Card className="p-3">
                          <div className="text-2xl font-bold text-green-600">94%</div>
                          <div className="text-xs text-gray-600">Match con criterios</div>
                        </Card>
                        <Card className="p-3">
                          <div className="text-2xl font-bold text-purple-600">$2.8M</div>
                          <div className="text-xs text-gray-600">Rango de precios USD</div>
                        </Card>
                        <Card className="p-3">
                          <div className="text-2xl font-bold text-orange-600">15km</div>
                          <div className="text-xs text-gray-600">Distancia promedio a puerto</div>
                        </Card>
                      </div>

                      <div className="bg-white p-3 rounded border-l-4 border-green-500">
                        <p className="text-sm font-medium text-green-800">Resultado:</p>
                        <p className="text-sm text-gray-600">
                          Cliente visitó las 3 propiedades recomendadas y compró la segunda opción, ahorrando 6 semanas
                          de búsqueda tradicional.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button asChild size="lg">
                  <Link href="/tecnologia-ia">
                    Probar PropertyAnalyst-GPT
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="valoracion">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 rounded-xl overflow-hidden shadow-lg border border-gray-100 order-2 lg:order-1">
                  <div className="relative h-[500px]">
                    <Image
                      src="/images/ai-valuation-premium.png"
                      alt="Dashboard de valoración de propiedades con IA"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-emerald-100 p-2 rounded-full">
                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">MarketTrend-AI</h3>
                        <Badge variant="outline" className="mt-1">
                          &lt;5% Error a 6 Meses
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Algoritmos de predicción que analizan tendencias del mercado, transacciones históricas y factores
                      económicos para valoraciones precisas y proyecciones futuras.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-emerald-100 p-2 rounded-full mt-1">
                        <BarChart3 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Precisión Predictiva</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>&lt;5% error</strong> en predicciones a 6 meses, basado en análisis de +10,000
                          transacciones históricas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-emerald-100 p-2 rounded-full mt-1">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Horizonte Temporal</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>6 meses</strong> de proyección confiable con actualizaciones mensuales automáticas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-emerald-100 p-2 rounded-full mt-1">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">ROI Cliente</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>+25% mejora</strong> en retorno de inversión promedio vs. decisiones sin IA
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Análisis Detallado de Valoración */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-emerald-200 bg-emerald-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-emerald-600" />
                      Variables Analizadas (50+)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Ubicación
                          </Badge>
                          <span>Proximidad servicios</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Suelo
                          </Badge>
                          <span>Calidad y aptitud</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Agua
                          </Badge>
                          <span>Derechos y acceso</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Clima
                          </Badge>
                          <span>Histórico y proyecciones</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Económico
                          </Badge>
                          <span>Indicadores regionales</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Legal
                          </Badge>
                          <span>Normativas y permisos</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-emerald-200 bg-emerald-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                      Caso: Fundo Forestal Pucón
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Superficie:</span>
                          <p>1,200 hectáreas</p>
                        </div>
                        <div>
                          <span className="font-medium">Valoración IA:</span>
                          <p className="text-emerald-600 font-bold">$4.2M USD</p>
                        </div>
                        <div>
                          <span className="font-medium">Avalúo tradicional:</span>
                          <p>$3.8M USD</p>
                        </div>
                        <div>
                          <span className="font-medium">Precio final:</span>
                          <p className="text-green-600 font-bold">$4.1M USD</p>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border-l-4 border-emerald-500">
                        <p className="text-xs text-emerald-800">
                          <strong>Precisión IA:</strong> 97.6% - La IA identificó potencial maderero premium no
                          considerado en avalúo tradicional
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Button asChild size="lg">
                  <Link href="/tecnologia-ia">
                    Solicitar Valoración con MarketTrend-AI
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="asistente">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-indigo-100 p-2 rounded-full">
                        <MessageSquare className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">ClientMatch-Bot</h3>
                        <Badge variant="outline" className="mt-1">
                          90% Sin Intervención Humana
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Asistente virtual 24/7 que responde consultas, programa visitas, proporciona recomendaciones
                      personalizadas y gestiona el proceso de compra inicial.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-100 p-2 rounded-full mt-1">
                        <Clock className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Tiempo de Respuesta</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>&lt;2 minutos</strong> promedio para consultas complejas, &lt;30 segundos para
                          consultas básicas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-100 p-2 rounded-full mt-1">
                        <Brain className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Resolución Automática</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>90% de consultas</strong> resueltas sin intervención humana, escalando solo casos
                          complejos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-100 p-2 rounded-full mt-1">
                        <Star className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Satisfacción Cliente</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>9.0/10 promedio</strong> en encuestas post-interacción (objetivo: 8.5/10)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 rounded-xl overflow-hidden shadow-lg border border-gray-100">
                  <div className="relative h-[500px]">
                    <Image
                      src="/images/ai-futuristic-assistant.png"
                      alt="Interfaz futurista del asistente virtual inmobiliario"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Conversación Ejemplo */}
              <Card className="border-indigo-200 bg-indigo-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                    Conversación Real: Inversionista Alemán
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Klaus (Inversionista)</span>
                        <span className="text-xs text-gray-500">14:23</span>
                      </div>
                      <p className="text-sm">
                        "Hallo, ich suche Waldgrundstücke in Chile für Kohlenstoffkredite. Können Sie mir helfen?"
                      </p>
                    </div>

                    <div className="bg-indigo-100 p-4 rounded-lg border-l-4 border-indigo-500">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-indigo-600" />
                        <span className="font-medium text-indigo-800">ClientMatch-Bot</span>
                        <span className="text-xs text-gray-500">14:23</span>
                      </div>
                      <p className="text-sm">
                        "Hallo Klaus! Gerne helfe ich Ihnen bei der Suche nach Waldgrundstücken für Kohlenstoffkredite.
                        Ich habe 47 geeignete Eigenschaften in unserem Portfolio identifiziert. Welche Region bevorzugen
                        Sie? Araucanía, Los Ríos oder Los Lagos?"
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Klaus</span>
                        <span className="text-xs text-gray-500">14:25</span>
                      </div>
                      <p className="text-sm">
                        "Los Ríos interessiert mich. Mindestens 500 Hektar, mit Araukarien wenn möglich."
                      </p>
                    </div>

                    <div className="bg-indigo-100 p-4 rounded-lg border-l-4 border-indigo-500">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-indigo-600" />
                        <span className="font-medium text-indigo-800">ClientMatch-Bot</span>
                        <span className="text-xs text-gray-500">14:25</span>
                      </div>
                      <p className="text-sm">
                        "Perfekt! Ich habe 3 Eigenschaften gefunden, die Ihren Kriterien entsprechen:
                        <br />🌲 Fundo Araucaria (850 ha) - 60% Araukarien, $2.1M USD
                        <br />🌲 Reserva Valdiviana (1,200 ha) - 40% Araukarien, $2.8M USD
                        <br />🌲 Bosque Nativo Plus (650 ha) - 80% Araukarien, $1.9M USD
                        <br />
                        <br />
                        Soll ich Ihnen detaillierte Berichte und Kohlenstoffpotential-Analysen senden?"
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <Card className="p-3 text-center">
                        <div className="text-lg font-bold text-indigo-600">1m 47s</div>
                        <div className="text-xs text-gray-600">Tiempo total conversación</div>
                      </Card>
                      <Card className="p-3 text-center">
                        <div className="text-lg font-bold text-green-600">3</div>
                        <div className="text-xs text-gray-600">Propiedades identificadas</div>
                      </Card>
                      <Card className="p-3 text-center">
                        <div className="text-lg font-bold text-purple-600">0</div>
                        <div className="text-xs text-gray-600">Intervención humana</div>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button asChild size="lg">
                  <Link href="/asistente-ia">
                    Conversar con ClientMatch-Bot
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="documentos">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 rounded-xl overflow-hidden shadow-lg border border-gray-100 order-2 lg:order-1">
                  <div className="relative h-[500px]">
                    <Image
                      src="/images/ai-futuristic-documents.png"
                      alt="Análisis futurista de documentos inmobiliarios con IA"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-amber-100 p-2 rounded-full">
                        <FileText className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">ContentCreator-AI</h3>
                        <Badge variant="outline" className="mt-1">
                          3 Idiomas en &lt;5min
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Genera automáticamente descripciones, fichas técnicas, material promocional multilingüe y análisis
                      de documentos legales para cada propiedad.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-2 rounded-full mt-1">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Tiempo de Generación</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>&lt;5 minutos</strong> para generar contenido completo en 3 idiomas + análisis legal
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-2 rounded-full mt-1">
                        <Globe className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Idiomas Soportados</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>ES/EN/PT</strong> con adaptación cultural automática para cada mercado objetivo
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-2 rounded-full mt-1">
                        <TrendingUp className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Aumento de Leads</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>+40% incremento</strong> en consultas por propiedades con contenido generado por IA
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ejemplo de Contenido Generado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-amber-200 bg-amber-50/30">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-600" />
                      Descripción Español
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <p className="font-medium">Fundo Los Arrayanes - Pucón</p>
                      <p className="text-gray-600">
                        Excepcional propiedad de 450 hectáreas ubicada en el corazón de la Araucanía, con bosque nativo
                        milenario y acceso directo al Lago Villarrica. Ideal para ecoturismo, conservación o desarrollo
                        sustentable.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          450 ha
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Lago
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Nativo
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50/30">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4 text-amber-600" />
                      Description English
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <p className="font-medium">Los Arrayanes Estate - Pucón</p>
                      <p className="text-gray-600">
                        Exceptional 450-hectare property in the heart of Araucanía, featuring ancient native forest and
                        direct access to Lake Villarrica. Perfect for ecotourism, conservation or sustainable
                        development.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          450 ha
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Lakefront
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Native
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50/30">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-600" />
                      Análisis Legal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span>Títulos verificados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span>Sin gravámenes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span>Derechos agua: 15 L/s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-orange-600" />
                        <span>Servidumbre paso: 50m</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Button asChild size="lg">
                  <Link href="/tecnologia-ia">
                    Generar Contenido con ContentCreator-AI
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="internacional">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">LeadScoring-AI</h3>
                        <Badge variant="outline" className="mt-1">
                          85% Precisión Conversión
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Analiza perfiles, comportamientos e intereses para identificar leads de alta conversión y
                      personalizar experiencias a nivel internacional.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full mt-1">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Precisión Scoring</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>85% precisión</strong> en identificar leads que convertirán en los próximos 90 días
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full mt-1">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Ciclo de Venta</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>90→45 días</strong> reducción promedio en tiempo de cierre de ventas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full mt-1">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Tasa de Conversión</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>+60% aumento</strong> en conversión de leads internacionales vs. métodos tradicionales
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 rounded-xl overflow-hidden shadow-lg border border-gray-100">
                  <div className="relative h-[500px]">
                    <Image
                      src="/images/ai-futuristic-global.png"
                      alt="Mapa futurista de alcance internacional de propiedades"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Casos Internacionales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      Caso: Fondo Alemán ESG
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                        <p>
                          <strong>Lead Score:</strong> 94/100 (Alto)
                        </p>
                        <p>
                          <strong>Perfil:</strong> Fondo de inversión ESG, €50M AUM
                        </p>
                        <p>
                          <strong>Interés:</strong> Conservación + Carbono
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Tiempo identificación:</span>
                          <p>3 días</p>
                        </div>
                        <div>
                          <span className="font-medium">Primera reunión:</span>
                          <p>7 días</p>
                        </div>
                        <div>
                          <span className="font-medium">Propuesta enviada:</span>
                          <p>14 días</p>
                        </div>
                        <div>
                          <span className="font-medium">Cierre:</span>
                          <p className="text-green-600 font-bold">28 días</p>
                        </div>
                      </div>
                      <div className="bg-green-100 p-2 rounded">
                        <p className="text-green-800 font-medium">Resultado: €3.2M inversión en 2,800 ha</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Caso: Productor Brasileño
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                        <p>
                          <strong>Lead Score:</strong> 78/100 (Medio-Alto)
                        </p>
                        <p>
                          <strong>Perfil:</strong> Productor berries, expansión internacional
                        </p>
                        <p>
                          <strong>Interés:</strong> Terrenos agrícolas premium
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Tiempo identificación:</span>
                          <p>5 días</p>
                        </div>
                        <div>
                          <span className="font-medium">Primera reunión:</span>
                          <p>12 días</p>
                        </div>
                        <div>
                          <span className="font-medium">Visita terreno:</span>
                          <p>35 días</p>
                        </div>
                        <div>
                          <span className="font-medium">Cierre:</span>
                          <p className="text-green-600 font-bold">52 días</p>
                        </div>
                      </div>
                      <div className="bg-green-100 p-2 rounded">
                        <p className="text-green-800 font-medium">Resultado: $1.8M USD en 320 ha</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Button asChild size="lg">
                  <Link href="/tecnologia-ia">
                    Activar LeadScoring-AI Internacional
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="sostenibilidad">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-green-100 p-2 rounded-full">
                        <Leaf className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">SustainabilityAnalyst-AI</h3>
                        <Badge variant="outline" className="mt-1">
                          Evaluación en 24h
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Evalúa el potencial ambiental, económico y social de cada propiedad, identificando oportunidades
                      de conservación y desarrollo sustentable.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 p-2 rounded-full mt-1">
                        <Clock className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Tiempo de Evaluación</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>24 horas</strong> para análisis completo de sostenibilidad vs. 2-3 semanas tradicional
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 p-2 rounded-full mt-1">
                        <Shield className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Certificación Sostenible</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>80% de propiedades</strong> califican para algún tipo de certificación ambiental
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 p-2 rounded-full mt-1">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Valor Agregado</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>+15% incremento</strong> promedio en valor por certificaciones ambientales
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 rounded-xl overflow-hidden shadow-lg border border-gray-100">
                  <div className="relative h-[500px]">
                    <Image
                      src="/araucaria-forest-chile.png"
                      alt="Análisis de sostenibilidad de bosque de araucarias"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Análisis de Sostenibilidad Detallado */}
              <Card className="border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    Análisis: Reserva Araucarias Milenarias - Lonquimay
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-green-800">Evaluación Ambiental</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Biodiversidad:</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Excepcional
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Carbono almacenado:</span>
                          <span className="font-medium">2,400 tCO2/ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Especies endémicas:</span>
                          <span className="font-medium">23 identificadas</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estado conservación:</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Pristino
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-green-800">Potencial Económico</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Créditos carbono/año:</span>
                          <span className="font-medium">$180,000 USD</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ecoturismo potencial:</span>
                          <span className="font-medium">$95,000 USD</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Investigación científica:</span>
                          <span className="font-medium">$25,000 USD</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total anual estimado:</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            $300,000 USD
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-green-800">Certificaciones Disponibles</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>FSC Forest Stewardship</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>VCS Carbon Standard</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>CCBS Biodiversity</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>UNESCO Biosphere</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-white rounded border-l-4 border-green-500">
                    <h5 className="font-medium text-green-800 mb-2">Recomendación IA:</h5>
                    <p className="text-sm text-gray-700">
                      Esta propiedad presenta un potencial excepcional para conservación con retorno económico. La
                      combinación de araucarias milenarias, alta biodiversidad y potencial de carbono la posiciona como
                      una inversión premium para fondos ESG internacionales. Valor estimado: +35% sobre precio base.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button asChild size="lg">
                  <Link href="/tecnologia-ia">
                    Solicitar Análisis de Sostenibilidad
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        <div className="mt-16 bg-gray-50 rounded-xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Resultados Comprobados de Nuestros Agentes IA</h3>
            <p className="text-gray-600">
              Métricas reales de rendimiento de nuestros 6 agentes de inteligencia artificial especializados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-t-4 border-t-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold text-blue-600">-92%</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-foreground font-medium">Reducción tiempo análisis</CardDescription>
                <p className="text-sm text-gray-500 mt-1">PropertyAnalyst-GPT: De 2 semanas a 30 segundos</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold text-emerald-600">95%</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-foreground font-medium">Precisión valoraciones</CardDescription>
                <p className="text-sm text-gray-500 mt-1">MarketTrend-AI: &lt;5% error en predicciones</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-indigo-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold text-indigo-600">90%</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-foreground font-medium">Resolución automática</CardDescription>
                <p className="text-sm text-gray-500 mt-1">ClientMatch-Bot: Sin intervención humana</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold text-amber-600">+40%</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-foreground font-medium">Aumento leads</CardDescription>
                <p className="text-sm text-gray-500 mt-1">ContentCreator-AI: Contenido multilingüe</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold text-purple-600">+60%</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-foreground font-medium">Conversión internacional</CardDescription>
                <p className="text-sm text-gray-500 mt-1">LeadScoring-AI: Identificación precisa</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold text-green-600">+15%</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-foreground font-medium">Valor agregado sostenible</CardDescription>
                <p className="text-sm text-gray-500 mt-1">SustainabilityAnalyst-AI: Certificaciones</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Button asChild size="lg">
            <Link href="/tecnologia-ia">
              Explorar todos los Agentes de IA
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Brain, Users, Globe, Database, BarChart, MessageSquare, Search, Map, FileText, Zap } from "lucide-react"

export function AICapabilities() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Inteligencia Artificial en Sur-Realista</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Implementamos tecnologías de IA para optimizar procesos, tomar decisiones más informadas y mejorar la
            experiencia de nuestros clientes en la búsqueda de propiedades.
          </p>
        </div>

        <Tabs defaultValue="objetivos" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-8">
            <TabsTrigger value="objetivos" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span>Objetivos</span>
            </TabsTrigger>
            <TabsTrigger value="sistema" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Sistema</span>
            </TabsTrigger>
            <TabsTrigger value="clientes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="datos" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span>Datos</span>
            </TabsTrigger>
            <TabsTrigger value="internacional" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Internacional</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="objetivos">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <motion.div variants={item}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Map className="h-5 w-5 text-primary" />
                      PropertyAnalyst-GPT
                    </CardTitle>
                    <Badge variant="outline" className="w-fit">
                      95% Precisión en 30s
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-foreground/80 mb-4">
                      Agente especializado en análisis integral de propiedades utilizando imágenes satelitales, datos
                      geoespaciales y machine learning.
                    </CardDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Tiempo de análisis:</span>
                        <span className="font-medium">30 segundos</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Precisión valoración:</span>
                        <span className="font-medium">95%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reducción tiempo:</span>
                        <span className="font-medium text-green-600">-92%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      ClientMatch-Bot
                    </CardTitle>
                    <Badge variant="outline" className="w-fit">
                      90% Sin Intervención Humana
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-foreground/80 mb-4">
                      Asistente virtual 24/7 que responde consultas, programa visitas y proporciona recomendaciones
                      personalizadas.
                    </CardDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Tiempo respuesta:</span>
                        <span className="font-medium">&lt;2 minutos</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Resolución automática:</span>
                        <span className="font-medium">90%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Satisfacción objetivo:</span>
                        <span className="font-medium text-green-600">9.0/10</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-primary" />
                      MarketTrend-AI
                    </CardTitle>
                    <Badge variant="outline" className="w-fit">
                      &lt;5% Error a 6 Meses
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-foreground/80 mb-4">
                      Algoritmos de predicción que analizan tendencias del mercado, transacciones históricas y factores
                      económicos.
                    </CardDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Precisión predicción:</span>
                        <span className="font-medium">&lt;5% error</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Horizonte temporal:</span>
                        <span className="font-medium">6 meses</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mejora ROI cliente:</span>
                        <span className="font-medium text-green-600">+25%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      ContentCreator-AI
                    </CardTitle>
                    <Badge variant="outline" className="w-fit">
                      3 Idiomas en &lt;5min
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-foreground/80 mb-4">
                      Genera automáticamente descripciones, fichas técnicas y material promocional multilingüe para cada
                      propiedad.
                    </CardDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Tiempo generación:</span>
                        <span className="font-medium">&lt;5 minutos</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Idiomas soportados:</span>
                        <span className="font-medium">ES/EN/PT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Aumento leads:</span>
                        <span className="font-medium text-green-600">+40%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      LeadScoring-AI
                    </CardTitle>
                    <Badge variant="outline" className="w-fit">
                      85% Precisión Conversión
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-foreground/80 mb-4">
                      Analiza perfiles, comportamientos e intereses para identificar leads de alta conversión y
                      personalizar experiencias.
                    </CardDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Precisión scoring:</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reducción ciclo venta:</span>
                        <span className="font-medium">90→45 días</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Aumento conversión:</span>
                        <span className="font-medium text-green-600">+60%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      SustainabilityAnalyst-AI
                    </CardTitle>
                    <Badge variant="outline" className="w-fit">
                      Evaluación en 24h
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-foreground/80 mb-4">
                      Evalúa el potencial ambiental, económico y social de cada propiedad, identificando oportunidades
                      de conservación.
                    </CardDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Tiempo evaluación:</span>
                        <span className="font-medium">24 horas</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Certificación sostenible:</span>
                        <span className="font-medium">80%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor agregado:</span>
                        <span className="font-medium text-green-600">+15%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="sistema">
            <Card>
              <CardHeader>
                <CardTitle>Sistema Central de Gestión con IA</CardTitle>
                <CardDescription>
                  Plataforma colaborativa que integra todos los aspectos del negocio con inteligencia artificial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Funciones Clave del Sistema</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <Database className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-medium">Panel de Control Inteligente</span>
                          <p className="text-sm text-muted-foreground">
                            Visualización en tiempo real del estado de cada proyecto, propiedad o cliente con alertas
                            predictivas
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-medium">Asignación Automática de Tareas</span>
                          <p className="text-sm text-muted-foreground">
                            IA que distribuye tareas según capacidad del equipo, prioridades y deadlines
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <BarChart className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-medium">Seguimiento Predictivo</span>
                          <p className="text-sm text-muted-foreground">
                            Monitoreo en tiempo real con predicción de retrasos y optimización automática de recursos
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-medium">Comunicación Inteligente</span>
                          <p className="text-sm text-muted-foreground">
                            Chat integrado con IA que sugiere respuestas y prioriza mensajes por urgencia
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-medium">Acceso Móvil Sincronizado</span>
                          <p className="text-sm text-muted-foreground">
                            App móvil para trabajadores en terreno con sincronización automática y modo offline
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Herramientas e Integraciones</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <Card className="border border-primary/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            Notion + ChatGPT Integration
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-xs">
                            Centraliza proyectos, propiedades y tareas con plantillas personalizadas e integración
                            directa con GPT-4 para automatización de contenido
                          </CardDescription>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <BarChart className="h-4 w-4" />
                            ClickUp + AI Workflows
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-xs">
                            Gestión de tareas, CRM y automatizaciones con IA que optimiza flujos de trabajo y predice
                            cuellos de botella
                          </CardDescription>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Airtable + GPT Analytics
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-xs">
                            Base de datos visual con campos inteligentes, análisis automático de tendencias y generación
                            de reportes con IA
                          </CardDescription>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Map className="h-4 w-4" />
                            QGIS + ML Spatial Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-xs">
                            Sistema GIS profesional con machine learning para análisis espacial avanzado y predicción de
                            valorización territorial
                          </CardDescription>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Zapier + AI Automation
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-xs">
                            Automatización inteligente que conecta +5000 apps con triggers basados en IA y workflows
                            adaptativos
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clientes">
            <Card>
              <CardHeader>
                <CardTitle>Estrategias Inteligentes para Captar Nuevos Clientes</CardTitle>
                <CardDescription>
                  Utilizamos inteligencia de mercado y tecnologías avanzadas para identificar y atraer clientes
                  potenciales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Search className="h-5 w-5 text-primary" />
                      Rastreo Inteligente de Interés
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          AI
                        </Badge>
                        <div>
                          <span className="font-medium">Publicidad Predictiva</span>
                          <p className="text-muted-foreground">
                            Algoritmos que identifican usuarios con alta probabilidad de compra basado en comportamiento
                            digital
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          SEO
                        </Badge>
                        <div>
                          <span className="font-medium">Contenido Optimizado con IA</span>
                          <p className="text-muted-foreground">
                            Generación automática de contenido SEO que se adapta a tendencias de búsqueda en tiempo real
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          Analytics
                        </Badge>
                        <div>
                          <span className="font-medium">Análisis Comportamental Avanzado</span>
                          <p className="text-muted-foreground">
                            Hotjar + Google Analytics + IA para mapear journey del cliente y optimizar conversión
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Inteligencia Comercial con IA
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          B2B
                        </Badge>
                        <div>
                          <span className="font-medium">Prospección Automatizada</span>
                          <p className="text-muted-foreground">
                            Kompass + Crunchbase + IA para identificar empresas activas con scoring automático de
                            potencial
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          Gov
                        </Badge>
                        <div>
                          <span className="font-medium">Monitoreo de Licitaciones</span>
                          <p className="text-muted-foreground">
                            IA que rastrea licitaciones públicas y movimientos corporativos relevantes al sector
                            inmobiliario
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          Social
                        </Badge>
                        <div>
                          <span className="font-medium">LinkedIn Sales Navigator + IA</span>
                          <p className="text-muted-foreground">
                            Identificación automática de decisores en fondos, exportadoras y corredoras con outreach
                            personalizado
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Automatización de Contacto
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          CRM
                        </Badge>
                        <div>
                          <span className="font-medium">Base de Datos Objetivo</span>
                          <p className="text-muted-foreground">
                            CRM inteligente con fondos de inversión, exportadoras e inmobiliarias con scoring automático
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          Content
                        </Badge>
                        <div>
                          <span className="font-medium">Contenido Personalizado con IA</span>
                          <p className="text-muted-foreground">
                            Brochures y videos generados automáticamente y adaptados a cada segmento de cliente
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          Email
                        </Badge>
                        <div>
                          <span className="font-medium">Email Marketing Inteligente</span>
                          <p className="text-muted-foreground">
                            Automatización con GPT para comunicaciones personalizadas y timing óptimo de envío
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="datos">
            <Card>
              <CardHeader>
                <CardTitle>Organización Inteligente de Datos con IA</CardTitle>
                <CardDescription>
                  Sistema avanzado para clasificar y analizar propiedades según múltiples criterios con machine learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border p-3 text-left">Categoría</th>
                        <th className="border p-3 text-left">Criterios de IA</th>
                        <th className="border p-3 text-left">Aplicación Inteligente</th>
                        <th className="border p-3 text-left">Integración</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-3 font-medium">Ubicación Geoespacial</td>
                        <td className="border p-3">
                          Análisis satelital, proximidad inteligente, accesibilidad predictiva
                        </td>
                        <td className="border p-3">
                          Mapas interactivos con IA, análisis de proximidad predictivo, scoring de ubicación
                        </td>
                        <td className="border p-3">
                          <Badge variant="outline">OpenStreetMap + ML</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="border p-3 font-medium">Aptitud Inteligente</td>
                        <td className="border p-3">
                          ML para clasificación agrícola, ganadero, forestal, inmobiliario, turístico, conservación
                        </td>
                        <td className="border p-3">
                          Segmentación automática, recomendaciones personalizadas con IA, valorización predictiva
                        </td>
                        <td className="border p-3">
                          <Badge variant="outline">TensorFlow + QGIS</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="border p-3 font-medium">Características Físicas</td>
                        <td className="border p-3">
                          Análisis de imágenes, topografía 3D, recursos hídricos, infraestructura con CV
                        </td>
                        <td className="border p-3">
                          Comparativas automáticas, evaluación de potencial con IA, fichas técnicas generadas
                        </td>
                        <td className="border p-3">
                          <Badge variant="outline">Computer Vision + Drone Data</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="border p-3 font-medium">Análisis Comercial</td>
                        <td className="border p-3">
                          Predicción de precios, análisis de transacciones, valorización con algoritmos
                        </td>
                        <td className="border p-3">
                          Análisis de tendencias automático, predicción de precios, estrategias de negociación IA
                        </td>
                        <td className="border p-3">
                          <Badge variant="outline">SII + Banco Central APIs</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="border p-3 font-medium">Due Diligence Legal</td>
                        <td className="border p-3">
                          OCR de títulos, análisis de permisos, derechos de agua, servidumbres con NLP
                        </td>
                        <td className="border p-3">
                          Due diligence automatizado con IA, alertas de cumplimiento, análisis de riesgo legal
                        </td>
                        <td className="border p-3">
                          <Badge variant="outline">OCR + NLP + Legal APIs</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="border p-3 font-medium">Historial Predictivo</td>
                        <td className="border p-3">
                          Análisis temporal, propietarios anteriores, uso histórico, transacciones con ML
                        </td>
                        <td className="border p-3">
                          Análisis de tendencias históricas, identificación de oportunidades, valorización temporal
                        </td>
                        <td className="border p-3">
                          <Badge variant="outline">Time Series ML + CBR</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="border p-3 font-medium">Network de Clientes</td>
                        <td className="border p-3">
                          Análisis de redes, propietarios cercanos, intereses similares, capacidad de inversión
                        </td>
                        <td className="border p-3">
                          Recomendaciones cruzadas con IA, estrategias de expansión, networking inteligente
                        </td>
                        <td className="border p-3">
                          <Badge variant="outline">Graph ML + CRM Analytics</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Database className="h-4 w-4 text-primary" />
                        Fuentes de Datos Integradas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            SII
                          </Badge>
                          <span>Datos fiscales y avalúos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            CIRENE
                          </Badge>
                          <span>Análisis de riesgo empresarial</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Banco Central
                          </Badge>
                          <span>Indicadores económicos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            INE
                          </Badge>
                          <span>Estadísticas demográficas</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart className="h-4 w-4 text-green-600" />
                        Procesamiento en Tiempo Real
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Velocidad análisis:</span>
                          <span className="font-medium">&lt;30 segundos</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Precisión ML:</span>
                          <span className="font-medium">95%+</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Datos procesados/día:</span>
                          <span className="font-medium">10,000+</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Actualización:</span>
                          <span className="font-medium">Tiempo real</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-600" />
                        Modelos de IA Implementados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            CV
                          </Badge>
                          <span>Computer Vision para imágenes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            NLP
                          </Badge>
                          <span>Procesamiento de documentos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            ML
                          </Badge>
                          <span>Predicción de precios</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Graph
                          </Badge>
                          <span>Análisis de redes sociales</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="internacional">
            <Card>
              <CardHeader>
                <CardTitle>Estrategias de Alcance Internacional con IA</CardTitle>
                <CardDescription>
                  Conectamos con inversionistas, productores y filántropos de todo el mundo usando inteligencia
                  artificial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Segmentos Objetivo con IA</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Inversionistas y Multinacionales
                          </CardTitle>
                          <Badge variant="outline" className="w-fit">
                            AI-Powered Targeting
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-foreground/80 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                ML
                              </Badge>
                              <span>Fondos de inversión agrícola identificados con algoritmos</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                NLP
                              </Badge>
                              <span>Análisis de comunicaciones de multinacionales (Cargill, BASF)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Predictive
                              </Badge>
                              <span>Empresas vitivinícolas con scoring de interés automático</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Graph
                              </Badge>
                              <span>Family offices mapeados por redes de inversión</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary" />
                            Filántropos y Conservación
                          </CardTitle>
                          <Badge variant="outline" className="w-fit">
                            Impact AI Matching
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-foreground/80 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Impact
                              </Badge>
                              <span>Fundaciones internacionales (Gates, Rockefeller) con IA de matching</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Conservation
                              </Badge>
                              <span>WWF, The Nature Conservancy con análisis de proyectos</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                ESG
                              </Badge>
                              <span>Inversionistas ESG identificados por algoritmos</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Biodiversity
                              </Badge>
                              <span>Filántropos de biodiversidad con scoring automático</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Map className="h-4 w-4 text-primary" />
                            Productores Extranjeros
                          </CardTitle>
                          <Badge variant="outline" className="w-fit">
                            Market Intelligence AI
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-foreground/80 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                AgTech
                              </Badge>
                              <span>Productores de berries con análisis de expansión IA</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Hospitality
                              </Badge>
                              <span>Empresas turísticas con scoring de potencial</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Development
                              </Badge>
                              <span>Desarrolladores inmobiliarios con matching inteligente</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Organic
                              </Badge>
                              <span>Productores orgánicos identificados por IA</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Canales y Estrategias con IA</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            Marketing Digital Internacional con IA
                            <Badge variant="outline" className="text-xs">
                              AI-Powered
                            </Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Sitio web multilingüe con traducción automática, SEO internacional optimizado por IA, y
                            campañas segmentadas con machine learning en Google Ads, LinkedIn y Facebook dirigidas a
                            países clave.
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              Auto-Translation
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              AI SEO
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Smart Targeting
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Database className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            Plataformas Globales con IA
                            <Badge variant="outline" className="text-xs">
                              ML-Enhanced
                            </Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Presencia optimizada en AgFunder y FarmTogether con scoring automático, portales
                            inmobiliarios internacionales con matching inteligente, y redes de filantropía global con
                            análisis predictivo.
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              Auto-Scoring
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Smart Matching
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Predictive Analytics
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            Networking Internacional con IA
                            <Badge variant="outline" className="text-xs">
                              AI-Assisted
                            </Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Participación estratégica en World Ag Expo y ExpoAgro con IA que identifica contactos clave,
                            conexiones automatizadas con multinacionales, y LinkedIn Sales Navigator potenciado con
                            algoritmos de prospección.
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              Contact AI
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Auto-Prospecting
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Event Intelligence
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            Contenido de Alto Valor con IA
                            <Badge variant="outline" className="text-xs">
                              AI-Generated
                            </Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Webinars internacionales con traducción simultánea IA, estudios de caso generados
                            automáticamente, blog técnico con contenido optimizado por machine learning, y material
                            educativo personalizado por región.
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              Auto-Translation
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Content AI
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Personalization
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Card className="border-blue-200 bg-blue-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="h-4 w-4 text-blue-600" />
                          Métricas de Expansión Internacional
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Países objetivo:</span>
                              <span className="font-medium">12</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Idiomas soportados:</span>
                              <span className="font-medium">8</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Leads internacionales:</span>
                              <span className="font-medium text-green-600">+150%</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Conversión IA:</span>
                              <span className="font-medium">35%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tiempo respuesta:</span>
                              <span className="font-medium">&lt;2h</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ROI internacional:</span>
                              <span className="font-medium text-green-600">+280%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

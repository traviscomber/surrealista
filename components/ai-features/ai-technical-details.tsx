"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, Database, Server, Layout, Shield, Zap, Layers, GitBranch, Cpu, Globe, LineChart } from "lucide-react"
import Image from "next/image"

export function AITechnicalDetails() {
  const [activeTab, setActiveTab] = useState("arquitectura")

  return (
    <div className="w-full">
      <Tabs defaultValue="arquitectura" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-center mb-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="arquitectura" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden md:inline">Arquitectura</span>
            </TabsTrigger>
            <TabsTrigger value="frontend" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              <span className="hidden md:inline">Frontend</span>
            </TabsTrigger>
            <TabsTrigger value="backend" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span className="hidden md:inline">Backend</span>
            </TabsTrigger>
            <TabsTrigger value="ia" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span className="hidden md:inline">IA</span>
            </TabsTrigger>
            <TabsTrigger value="datos" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden md:inline">Datos</span>
            </TabsTrigger>
            <TabsTrigger value="devops" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              <span className="hidden md:inline">DevOps</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="arquitectura" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                Arquitectura del Sistema
              </CardTitle>
              <CardDescription>Visión general de la arquitectura técnica de Sur-Realista</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 overflow-hidden">
                  <div className="text-xs text-gray-500 mb-2">Stack Tecnológico de Sur-Realista</div>
                  <div className="relative w-full h-[400px]">
                    <Image
                      src="/stack-tecnologico-sur-realista.png"
                      alt="Diagrama de arquitectura de Sur-Realista"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-medium mb-3">Principios de Arquitectura</h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-1 bg-blue-50">
                      Modular
                    </Badge>
                    <span>
                      Arquitectura basada en componentes independientes que facilitan el mantenimiento y la
                      escalabilidad.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-1 bg-green-50">
                      Serverless
                    </Badge>
                    <span>
                      Aprovechamos al máximo las capacidades serverless para optimizar costos y escalabilidad
                      automática.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-1 bg-purple-50">
                      API-First
                    </Badge>
                    <span>
                      Diseño centrado en APIs bien definidas que permiten la integración con múltiples clientes y
                      servicios.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-1 bg-amber-50">
                      Seguridad
                    </Badge>
                    <span>
                      Seguridad incorporada en cada capa de la aplicación, desde la autenticación hasta el acceso a
                      datos.
                    </span>
                  </li>
                </ul>

                <h3 className="text-lg font-medium mb-3">Flujo de Datos</h3>
                <p className="mb-4">
                  El sistema sigue un flujo de datos optimizado donde las solicitudes del cliente son procesadas a
                  través de Server Components y Server Actions, interactuando con la base de datos Supabase y los
                  servicios de IA según sea necesario. Los resultados son renderizados eficientemente utilizando una
                  combinación de renderizado en servidor (SSR) y estrategias de hidratación progresiva.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card className="bg-blue-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        Rendimiento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm pt-0">
                      Optimizado para Core Web Vitals con LCP &lt; 2.5s, FID &lt; 100ms y CLS &lt; 0.1
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4 text-green-600" />
                        Escalabilidad
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm pt-0">
                      Diseñado para escalar a miles de usuarios concurrentes con tiempos de respuesta consistentes
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-600" />
                        Seguridad
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm pt-0">
                      Implementación de OWASP Top 10, cifrado de datos sensibles y auditorías regulares
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frontend" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5 text-blue-600" />
                Frontend
              </CardTitle>
              <CardDescription>Tecnologías y patrones utilizados en la capa de presentación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Tecnologías Principales</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-black text-white">Next.js 14</Badge>
                      <div>
                        <p className="font-medium">Framework React con App Router</p>
                        <p className="text-sm text-gray-600">
                          Utilizamos las últimas características de Next.js 14 incluyendo Server Components, Server
                          Actions y Streaming.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-blue-600">React 18</Badge>
                      <div>
                        <p className="font-medium">Biblioteca UI con Hooks avanzados</p>
                        <p className="text-sm text-gray-600">
                          Aprovechamos Suspense, useTransition y otros hooks para una experiencia de usuario fluida.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-blue-500">TypeScript</Badge>
                      <div>
                        <p className="font-medium">Tipado estático</p>
                        <p className="text-sm text-gray-600">
                          100% de cobertura de tipos para prevenir errores y mejorar la mantenibilidad del código.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-cyan-600">Tailwind CSS</Badge>
                      <div>
                        <p className="font-medium">Framework CSS utilitario</p>
                        <p className="text-sm text-gray-600">
                          Diseño responsive con enfoque mobile-first y personalización mediante configuración.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-purple-600">Framer Motion</Badge>
                      <div>
                        <p className="font-medium">Biblioteca de animaciones</p>
                        <p className="text-sm text-gray-600">
                          Animaciones fluidas y transiciones para mejorar la experiencia de usuario.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Patrones y Prácticas</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Code className="h-4 w-4 text-blue-600" />
                        Componentes Atómicos
                      </h4>
                      <p className="text-sm text-gray-600">
                        Diseño de UI basado en componentes pequeños y reutilizables que se combinan para crear
                        interfaces complejas.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-600" />
                        Renderizado Híbrido
                      </h4>
                      <p className="text-sm text-gray-600">
                        Combinación estratégica de SSR, SSG e ISR según las necesidades de cada página para optimizar
                        rendimiento y SEO.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <LineChart className="h-4 w-4 text-green-600" />
                        Optimización de Rendimiento
                      </h4>
                      <p className="text-sm text-gray-600">
                        Lazy loading, code splitting, optimización de imágenes y prefetching inteligente para una carga
                        rápida.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-purple-600" />
                        Accesibilidad (a11y)
                      </h4>
                      <p className="text-sm text-gray-600">
                        Cumplimiento de WCAG 2.1 AA con pruebas regulares para garantizar una experiencia inclusiva.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg border border-blue-200 bg-blue-50">
                <h3 className="text-md font-medium mb-2 text-blue-800">Optimizaciones Específicas para Inmobiliaria</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Hemos implementado optimizaciones específicas para el sector inmobiliario:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Carga progresiva de galerías de imágenes de propiedades</li>
                  <li>• Renderizado optimizado de mapas interactivos con clustering</li>
                  <li>• Filtros de búsqueda con actualización instantánea</li>
                  <li>• Visualización 3D de propiedades con carga bajo demanda</li>
                  <li>• Interfaz adaptativa según el dispositivo y contexto del usuario</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backend" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-600" />
                Backend
              </CardTitle>
              <CardDescription>Infraestructura de servidor y lógica de negocio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Tecnologías Principales</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-green-600">Node.js</Badge>
                      <div>
                        <p className="font-medium">Runtime JavaScript</p>
                        <p className="text-sm text-gray-600">
                          Utilizamos la última versión LTS con soporte para ESM y las APIs más recientes.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-black text-white">Next.js Server</Badge>
                      <div>
                        <p className="font-medium">Server Components & Actions</p>
                        <p className="text-sm text-gray-600">
                          Aprovechamos el modelo de servidor de Next.js para operaciones seguras y eficientes.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-purple-600">API Routes</Badge>
                      <div>
                        <p className="font-medium">Endpoints RESTful</p>
                        <p className="text-sm text-gray-600">
                          APIs optimizadas con validación de entrada y manejo de errores robusto.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-blue-500">TypeScript</Badge>
                      <div>
                        <p className="font-medium">Tipado estricto</p>
                        <p className="text-sm text-gray-600">
                          Interfaces y tipos bien definidos para todas las operaciones de backend.
                        </p>
                      </div>
                    </li>
                  </ul>

                  <h3 className="text-lg font-medium mt-6 mb-3">Seguridad</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Autenticación JWT con rotación de tokens</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Protección CSRF en todas las mutaciones</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Sanitización de entradas y salidas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Rate limiting para prevenir abusos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Auditoría de acciones sensibles</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Arquitectura de Servicios</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <div className="relative w-full h-[250px]">
                      <Image
                        src="/inmobiliarios-microservicios-diagrama.png"
                        alt="Arquitectura de servicios de Sur-Realista"
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-medium mb-3">Servicios Principales</h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800">Servicio de Propiedades</h4>
                      <p className="text-sm text-gray-600">
                        Gestión completa del ciclo de vida de propiedades, incluyendo búsqueda, filtrado y
                        recomendaciones.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800">Servicio de Usuarios</h4>
                      <p className="text-sm text-gray-600">
                        Autenticación, perfiles, preferencias y gestión de permisos para diferentes roles.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800">Servicio de Análisis IA</h4>
                      <p className="text-sm text-gray-600">
                        Procesamiento de datos con modelos de IA para valoración, clasificación y recomendaciones.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800">Servicio Geoespacial</h4>
                      <p className="text-sm text-gray-600">
                        Análisis de ubicaciones, cálculo de distancias y visualización de datos geográficos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg border border-blue-200 bg-blue-50">
                <h3 className="text-md font-medium mb-2 text-blue-800">Optimizaciones de Rendimiento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
                  <div>
                    <h4 className="font-medium">Caché Inteligente</h4>
                    <p>
                      Estrategias de caché en múltiples niveles con invalidación selectiva para datos inmobiliarios.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Procesamiento Asíncrono</h4>
                    <p>Tareas pesadas como procesamiento de imágenes y análisis de datos ejecutadas en background.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Optimización de Consultas</h4>
                    <p>Consultas SQL optimizadas con índices estratégicos para búsquedas inmobiliarias complejas.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ia" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-600" />
                Inteligencia Artificial
              </CardTitle>
              <CardDescription>Modelos y algoritmos de IA implementados en Sur-Realista</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Modelos Principales</h3>
                  <ul className="space-y-4">
                    <li className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">OpenAI GPT-4</Badge>
                        <span className="text-sm text-gray-500">Procesamiento de Lenguaje Natural</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Implementado en el asistente virtual para responder consultas sobre propiedades, interpretar
                        requisitos de búsqueda en lenguaje natural y generar descripciones de propiedades.
                      </p>
                    </li>

                    <li className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">TensorFlow</Badge>
                        <span className="text-sm text-gray-500">Análisis de Imágenes y Predicción</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Modelos personalizados para clasificación automática de imágenes de propiedades, detección de
                        características y predicción de valoraciones basadas en datos visuales.
                      </p>
                    </li>

                    <li className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                          Algoritmos Predictivos
                        </Badge>
                        <span className="text-sm text-gray-500">Valoración de Propiedades</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Modelos de regresión avanzados que combinan datos históricos, tendencias de mercado y
                        características específicas para predecir el valor actual y futuro de propiedades.
                      </p>
                    </li>

                    <li className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                          Sistemas de Recomendación
                        </Badge>
                        <span className="text-sm text-gray-500">Matching de Propiedades</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Algoritmos de filtrado colaborativo e híbrido que analizan preferencias de usuarios y
                        comportamientos similares para recomendar propiedades relevantes.
                      </p>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Aplicaciones Prácticas</h3>

                  <div className="mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                      <h4 className="font-medium text-blue-800 mb-2">Análisis Geoespacial Inteligente</h4>
                      <p className="text-sm text-blue-700">Combinamos datos geoespaciales con IA para evaluar:</p>
                      <ul className="text-sm text-blue-700 mt-2 space-y-1">
                        <li>• Proximidad a servicios y amenidades</li>
                        <li>• Calidad de conectividad y transporte</li>
                        <li>• Potencial de desarrollo de zonas</li>
                        <li>• Riesgos ambientales y geológicos</li>
                        <li>• Tendencias de valorización por ubicación</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2">Procesamiento de Imágenes</h4>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="relative w-full h-[150px]">
                          <Image
                            src="/inmobiliaria-ia-analisis.png"
                            alt="Análisis de imágenes con IA"
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="relative w-full h-[150px]">
                          <Image
                            src="/inmobiliaria-ia-caracteristicas.png"
                            alt="Detección de características con IA"
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-green-700">
                        Nuestros modelos de visión por computadora detectan automáticamente características como: estado
                        de conservación, calidad de acabados, luminosidad, espacios abiertos, vistas, y elementos
                        arquitectónicos destacables.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium mb-3">Ética y Transparencia</h3>
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-3">
                      Nos comprometemos con el uso ético de la IA siguiendo estos principios:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="min-w-4 mt-1">✓</div>
                        <span>
                          <strong>Transparencia:</strong> Explicamos claramente cuándo y cómo se utiliza IA en nuestros
                          servicios.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="min-w-4 mt-1">✓</div>
                        <span>
                          <strong>Equidad:</strong> Monitorizamos y mitigamos sesgos en nuestros algoritmos.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="min-w-4 mt-1">✓</div>
                        <span>
                          <strong>Privacidad:</strong> No utilizamos datos personales para entrenar modelos sin
                          consentimiento explícito.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="min-w-4 mt-1">✓</div>
                        <span>
                          <strong>Supervisión humana:</strong> Todas las decisiones críticas son revisadas por expertos
                          humanos.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="datos" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Base de Datos y Almacenamiento
              </CardTitle>
              <CardDescription>Estructura y gestión de datos en Sur-Realista</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Tecnologías de Base de Datos</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-blue-600">Supabase</Badge>
                      <div>
                        <p className="font-medium">Plataforma de base de datos</p>
                        <p className="text-sm text-gray-600">
                          Utilizamos Supabase como nuestra plataforma principal para base de datos, autenticación y
                          almacenamiento.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-blue-800">PostgreSQL</Badge>
                      <div>
                        <p className="font-medium">Motor de base de datos relacional</p>
                        <p className="text-sm text-gray-600">
                          Base de datos relacional robusta con soporte para datos geoespaciales mediante PostGIS.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-amber-600">Row Level Security</Badge>
                      <div>
                        <p className="font-medium">Seguridad a nivel de fila</p>
                        <p className="text-sm text-gray-600">
                          Implementamos políticas de seguridad a nivel de fila para control de acceso granular a los
                          datos.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-green-600">Supabase Storage</Badge>
                      <div>
                        <p className="font-medium">Almacenamiento de archivos</p>
                        <p className="text-sm text-gray-600">
                          Gestión de imágenes y documentos con políticas de acceso y transformaciones automáticas.
                        </p>
                      </div>
                    </li>
                  </ul>

                  <div className="mt-6 p-4 rounded-lg border border-blue-200 bg-blue-50">
                    <h3 className="text-md font-medium mb-2 text-blue-800">Optimizaciones de Base de Datos</h3>
                    <ul className="text-sm text-blue-700 space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="min-w-4 mt-1">•</div>
                        <span>
                          <strong>Índices especializados</strong> para búsquedas geoespaciales y filtros complejos de
                          propiedades
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="min-w-4 mt-1">•</div>
                        <span>
                          <strong>Particionamiento de tablas</strong> para mejorar el rendimiento con grandes volúmenes
                          de datos
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="min-w-4 mt-1">•</div>
                        <span>
                          <strong>Vistas materializadas</strong> para consultas frecuentes y complejas
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="min-w-4 mt-1">•</div>
                        <span>
                          <strong>Funciones y triggers</strong> para mantener la integridad y consistencia de los datos
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Modelo de Datos</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <div className="relative w-full h-[300px]">
                      <Image
                        src="/inmobiliaria-modelo-datos.png"
                        alt="Modelo de datos de Sur-Realista"
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-medium mb-3">Entidades Principales</h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800">Propiedades</h4>
                      <p className="text-sm text-gray-600">
                        Almacena información detallada sobre cada propiedad, incluyendo características, ubicación,
                        precios y disponibilidad.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800">Usuarios</h4>
                      <p className="text-sm text-gray-600">
                        Perfiles de usuarios, preferencias, historial de búsquedas y favoritos.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800">Transacciones</h4>
                      <p className="text-sm text-gray-600">
                        Registro de interacciones, consultas, visitas y transacciones relacionadas con propiedades.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800">Análisis IA</h4>
                      <p className="text-sm text-gray-600">
                        Resultados de análisis de IA, valoraciones predictivas y clasificaciones automáticas.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800">Datos Geoespaciales</h4>
                      <p className="text-sm text-gray-600">
                        Información geográfica, puntos de interés, zonas y análisis de ubicaciones.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Estrategia de Migración y Respaldo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 className="font-medium text-blue-800 mb-1">Migraciones Automatizadas</h4>
                    <p className="text-sm text-gray-600">
                      Sistema de migraciones versionadas para evolución controlada del esquema de base de datos.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 className="font-medium text-blue-800 mb-1">Respaldos Programados</h4>
                    <p className="text-sm text-gray-600">
                      Respaldos diarios completos y respaldos incrementales cada 6 horas con retención configurable.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 className="font-medium text-blue-800 mb-1">Recuperación de Desastres</h4>
                    <p className="text-sm text-gray-600">
                      Plan de recuperación de desastres con RTO &lt; 1 hora y RPO &lt; 15 minutos.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devops" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-blue-600" />
                DevOps e Infraestructura
              </CardTitle>
              <CardDescription>Procesos de desarrollo, despliegue e infraestructura</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Infraestructura</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-black text-white">Vercel</Badge>
                      <div>
                        <p className="font-medium">Plataforma de despliegue</p>
                        <p className="text-sm text-gray-600">
                          Utilizamos Vercel para hosting, despliegue y Edge Functions, aprovechando su red global para
                          baja latencia.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-blue-600">Supabase</Badge>
                      <div>
                        <p className="font-medium">Base de datos y almacenamiento</p>
                        <p className="text-sm text-gray-600">
                          Infraestructura de base de datos PostgreSQL gestionada con alta disponibilidad.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge className="mt-1 bg-green-600">CDN</Badge>
                      <div>
                        <p className="font-medium">Red de distribución de contenido</p>
                        <p className="text-sm text-gray-600">
                          Distribución global de activos estáticos y caché de Edge para respuestas rápidas.
                        </p>
                      </div>
                    </li>
                  </ul>

                  <h3 className="text-lg font-medium mt-6 mb-3">Monitorización y Observabilidad</h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800 mb-1">Métricas de Rendimiento</h4>
                      <p className="text-sm text-gray-600">
                        Monitorización en tiempo real de tiempos de respuesta, uso de recursos y experiencia de usuario.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800 mb-1">Logging Centralizado</h4>
                      <p className="text-sm text-gray-600">
                        Sistema de logs estructurados con búsqueda avanzada y alertas configurables.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800 mb-1">Alertas Proactivas</h4>
                      <p className="text-sm text-gray-600">
                        Sistema de alertas basado en umbrales y anomalías con notificaciones a múltiples canales.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Flujo de Desarrollo</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <div className="relative w-full h-[250px]">
                      <Image
                        src="/devops-ci-cd-flujo.png"
                        alt="Flujo de CI/CD de Sur-Realista"
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-medium mb-3">Prácticas DevOps</h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800 mb-1">Integración Continua</h4>
                      <p className="text-sm text-gray-600">
                        Cada commit desencadena pruebas automatizadas, linting y verificación de tipos para garantizar
                        la calidad del código.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800 mb-1">Despliegue Continuo</h4>
                      <p className="text-sm text-gray-600">
                        Despliegues automáticos a entornos de preview para cada PR y a producción tras aprobación.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800 mb-1">Infraestructura como Código</h4>
                      <p className="text-sm text-gray-600">
                        Toda la infraestructura está definida como código para garantizar reproducibilidad y control de
                        versiones.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-blue-800 mb-1">Gestión de Secretos</h4>
                      <p className="text-sm text-gray-600">
                        Sistema seguro de gestión de secretos y variables de entorno con rotación automática.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg border border-blue-200 bg-blue-50">
                <h3 className="text-md font-medium mb-2 text-blue-800">Estrategia de Escalabilidad</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Nuestra arquitectura está diseñada para escalar horizontalmente en respuesta a la demanda:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
                  <div>
                    <h4 className="font-medium">Serverless por Diseño</h4>
                    <p>Arquitectura serverless que escala automáticamente según la demanda sin intervención manual.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Caché Distribuida</h4>
                    <p>
                      Sistema de caché en múltiples niveles (Edge, CDN, aplicación) para reducir la carga en servicios
                      principales.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Bases de Datos Elásticas</h4>
                    <p>
                      Capacidad para escalar verticalmente la base de datos según las necesidades de carga y
                      almacenamiento.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

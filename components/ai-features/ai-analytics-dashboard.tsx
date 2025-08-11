"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { BarChart, LineChart, PieChart } from "lucide-react"

export function AIAnalyticsDashboard() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  return (
    <div className="w-full">
      <Tabs defaultValue="rendimiento" className="w-full">
        <TabsList className="grid grid-cols-1 md:grid-cols-3 mb-8">
          <TabsTrigger value="rendimiento" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            <span>Rendimiento</span>
          </TabsTrigger>
          <TabsTrigger value="impacto" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span>Impacto en Ventas</span>
          </TabsTrigger>
          <TabsTrigger value="satisfaccion" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span>Satisfacción</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rendimiento">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Precisión de Clasificación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">94.7%</div>
                  <p className="text-sm text-gray-500 mt-1">Precisión en la clasificación de propiedades</p>
                  <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: "94.7%" }}></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Tiempo de Respuesta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">1.2s</div>
                  <p className="text-sm text-gray-500 mt-1">Tiempo promedio de respuesta del asistente virtual</p>
                  <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="bg-green-600 h-full rounded-full" style={{ width: "85%" }}></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Predicción de Precios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">92.3%</div>
                  <p className="text-sm text-gray-500 mt-1">Precisión en predicciones a 12 meses</p>
                  <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: "92.3%" }}></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Evolución del Rendimiento de IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full relative">
                  {/* Simulación de gráfico de líneas */}
                  <div className="absolute inset-0 flex items-end">
                    <div className="w-full h-full flex items-end justify-between px-4">
                      {[85, 87, 89, 86, 90, 92, 91, 93, 94, 95, 94, 96].map((value, i) => (
                        <div
                          key={i}
                          className="w-4 bg-blue-500 rounded-t"
                          style={{ height: `${value}%`, opacity: 0.7 + i * 0.02 }}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-200"></div>
                  <div className="absolute left-0 bottom-0 top-0 w-[1px] bg-gray-200"></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Ene</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Abr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Ago</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dic</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="impacto">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Reducción Tiempo de Venta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">-42%</div>
                  <p className="text-sm text-gray-500 mt-1">Reducción en días para concretar ventas</p>
                  <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full rounded-full" style={{ width: "42%" }}></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Aumento en Valor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">+18%</div>
                  <p className="text-sm text-gray-500 mt-1">Incremento promedio en valor de venta</p>
                  <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: "18%" }}></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Alcance Internacional</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-indigo-600">+215%</div>
                  <p className="text-sm text-gray-500 mt-1">Aumento en consultas internacionales</p>
                  <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: "100%" }}></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Ventas por Tipo de Propiedad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full relative flex items-center justify-center">
                  {/* Simulación de gráfico circular */}
                  <div className="relative w-64 h-64">
                    <div
                      className="absolute inset-0 rounded-full border-[32px] border-blue-500"
                      style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
                    ></div>
                    <div
                      className="absolute inset-0 rounded-full border-[32px] border-green-500"
                      style={{ clipPath: "polygon(50% 50%, 100% 0, 100% 50%)" }}
                    ></div>
                    <div
                      className="absolute inset-0 rounded-full border-[32px] border-amber-500"
                      style={{ clipPath: "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)" }}
                    ></div>
                    <div
                      className="absolute inset-0 rounded-full border-[32px] border-purple-500"
                      style={{ clipPath: "polygon(50% 50%, 50% 100%, 0 100%, 0 50%)" }}
                    ></div>
                  </div>
                  <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 mr-2"></div>
                        <span className="text-sm">Agrícola (35%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 mr-2"></div>
                        <span className="text-sm">Conservación (15%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-amber-500 mr-2"></div>
                        <span className="text-sm">Turístico (25%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 mr-2"></div>
                        <span className="text-sm">Inmobiliario (25%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="satisfaccion">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Satisfacción General</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">4.8/5</div>
                  <p className="text-sm text-gray-500 mt-1">Calificación promedio de clientes</p>
                  <div className="mt-4 flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${star <= 4.8 ? "text-yellow-400" : "text-gray-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Recomendaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">96%</div>
                  <p className="text-sm text-gray-500 mt-1">Clientes que nos recomendarían</p>
                  <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="bg-green-600 h-full rounded-full" style={{ width: "96%" }}></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Asistente Virtual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">4.6/5</div>
                  <p className="text-sm text-gray-500 mt-1">Satisfacción con respuestas del asistente</p>
                  <div className="mt-4 flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${star <= 4.6 ? "text-yellow-400" : "text-gray-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Comentarios de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: "Carlos Martínez",
                      role: "Inversionista Agrícola",
                      comment:
                        "El sistema de IA me ayudó a encontrar exactamente el tipo de terreno que buscaba para mi proyecto vitivinícola. La precisión de las recomendaciones fue impresionante.",
                      rating: 5,
                    },
                    {
                      name: "María González",
                      role: "Compradora Residencial",
                      comment:
                        "El asistente virtual respondió todas mis preguntas a cualquier hora del día. Me sentí acompañada durante todo el proceso de compra.",
                      rating: 4,
                    },
                    {
                      name: "Fundación Bosque Nativo",
                      role: "Organización de Conservación",
                      comment:
                        "La clasificación de terrenos con alto valor ecológico nos permitió identificar propiedades que realmente valían la pena para nuestros proyectos de conservación.",
                      rating: 5,
                    },
                  ].map((testimonial, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${star <= testimonial.rating ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-600 italic mb-2">"{testimonial.comment}"</p>
                      <div className="flex items-center">
                        <div className="font-medium">{testimonial.name}</div>
                        <span className="mx-2">•</span>
                        <div className="text-sm text-gray-500">{testimonial.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import Image from "next/image"

export function AICaseStudies() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Casos de Éxito</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Ejemplos reales de cómo nuestra tecnología ha transformado la experiencia de nuestros clientes.
          </p>
        </div>

        <Tabs defaultValue="conservacion" className="w-full">
          <TabsList className="grid grid-cols-1 md:grid-cols-3 mb-8">
            <TabsTrigger value="conservacion">Proyecto de Conservación</TabsTrigger>
            <TabsTrigger value="agricola">Inversión Agrícola</TabsTrigger>
            <TabsTrigger value="turismo">Desarrollo Turístico</TabsTrigger>
          </TabsList>

          <TabsContent value="conservacion">
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <Card>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="relative h-[300px] md:h-auto">
                      <Image
                        src="/araucaria-forest-chile.png"
                        alt="Reserva Natural Araucanía - Bosque nativo chileno con araucarias"
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-green-600">Conservación</Badge>
                      </div>
                    </div>
                    <div className="p-6 md:p-8">
                      <h3 className="text-2xl font-bold mb-2">Reserva Natural Araucanía</h3>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span>2.500 hectáreas</span>
                        <span className="mx-2">•</span>
                        <span>Región de La Araucanía</span>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Una fundación internacional buscaba adquirir terrenos para conservación en Chile. Utilizando
                        nuestro sistema de clasificación de terrenos con IA, identificamos una propiedad con alto valor
                        ecológico que no estaba siendo promocionada por su potencial de conservación.
                      </p>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start">
                          <div className="bg-green-100 p-1 rounded-full mt-1 mr-3">
                            <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <p className="text-sm">Análisis de biodiversidad reveló 4 especies en peligro de extinción</p>
                        </div>
                        <div className="flex items-start">
                          <div className="bg-green-100 p-1 rounded-full mt-1 mr-3">
                            <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <p className="text-sm">Potencial de captura de carbono valorado en $1.2M USD</p>
                        </div>
                        <div className="flex items-start">
                          <div className="bg-green-100 p-1 rounded-full mt-1 mr-3">
                            <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <p className="text-sm">Conectividad ecológica con áreas protegidas existentes</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <strong>Resultado:</strong> La fundación adquirió el terreno un 15% por debajo del valor de
                        mercado y estableció una reserva natural que ahora protege ecosistemas críticos y genera
                        ingresos por turismo sostenible y créditos de carbono.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="agricola">
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <Card>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="relative h-[300px] md:h-auto">
                      <Image
                        src="/images/case-study-vineyard.png"
                        alt="Inversión agrícola en viñedo chileno del Valle del Maule"
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-amber-600">Agrícola</Badge>
                      </div>
                    </div>
                    <div className="p-6 md:p-8">
                      <h3 className="text-2xl font-bold mb-2">Viñedos Valle del Maule</h3>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span>350 hectáreas</span>
                        <span className="mx-2">•</span>
                        <span>Región del Maule</span>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Un grupo inversor español buscaba expandir su producción vitivinícola en Chile. Utilizando
                        nuestros modelos predictivos, identificamos una propiedad con condiciones óptimas para
                        variedades premium y alto potencial de valorización.
                      </p>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start">
                          <div className="bg-amber-100 p-1 rounded-full mt-1 mr-3">
                            <svg className="h-3 w-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <p className="text-sm">Análisis de suelo y microclima ideal para Carmenere y Cabernet</p>
                        </div>
                        <div className="flex items-start">
                          <div className="bg-amber-100 p-1 rounded-full mt-1 mr-3">
                            <svg className="h-3 w-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <p className="text-sm">Predicción de valorización del 35% en 5 años</p>
                        </div>
                        <div className="flex items-start">
                          <div className="bg-amber-100 p-1 rounded-full mt-1 mr-3">
                            <svg className="h-3 w-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <p className="text-sm">Derechos de agua asegurados y certificados</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <strong>Resultado:</strong> El grupo adquirió la propiedad y en solo 3 años ha logrado producir
                        vinos premiados internacionalmente, con una valorización del terreno que ya supera el 20% de su
                        inversión inicial.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="turismo">
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <Card>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="relative h-[300px] md:h-auto">
                      <Image
                        src="/luxury-eco-lodge-patagonia.png"
                        alt="Desarrollo turístico en la Patagonia chilena - Lodge de lujo con vistas panorámicas"
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-blue-600">Turismo</Badge>
                      </div>
                    </div>
                    <div className="p-6 md:p-8">
                      <h3 className="text-2xl font-bold mb-2">Lodge Patagonia Sur</h3>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span>120 hectáreas</span>
                        <span className="mx-2">•</span>
                        <span>Región de Aysén</span>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Un desarrollador turístico internacional buscaba una propiedad para un proyecto de ecoturismo de
                        lujo. Nuestro sistema de IA identificó una propiedad con vistas panorámicas excepcionales y
                        accesibilidad privilegiada que no estaba siendo promocionada adecuadamente.
                      </p>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start">
                          <div className="bg-blue-100 p-1 rounded-full mt-1 mr-3">
                            <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <p className="text-sm">Análisis visual 3D reveló puntos óptimos para construcción</p>
                        </div>
                        <div className="flex items-start">
                          <div className="bg-blue-100 p-1 rounded-full mt-1 mr-3">
                            <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <p className="text-sm">Estudio de mercado proyectó ocupación del 85% en temporada alta</p>
                        </div>
                        <div className="flex items-start">
                          <div className="bg-blue-100 p-1 rounded-full mt-1 mr-3">
                            <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <p className="text-sm">Compatibilidad con normativa ambiental y turística</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <strong>Resultado:</strong> El desarrollador adquirió la propiedad y construyó un lodge de lujo
                        que ha sido reconocido entre los mejores de Sudamérica, con tarifas que superan los $1,000 USD
                        por noche y una valorización del 150% en 4 años.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

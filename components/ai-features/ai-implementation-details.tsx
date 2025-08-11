"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { BarChart3, Users, Brain, Globe, Database } from "lucide-react"
import { motion } from "framer-motion"

export function AIImplementationDetails() {
  const [activeTab, setActiveTab] = useState("clasificacion")

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  return (
    <Tabs defaultValue="clasificacion" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-8">
        <TabsTrigger value="clasificacion" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          <span>Clasificación</span>
        </TabsTrigger>
        <TabsTrigger value="atencion" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Atención</span>
        </TabsTrigger>
        <TabsTrigger value="prediccion" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span>Predicción</span>
        </TabsTrigger>
        <TabsTrigger value="contenido" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <span>Contenido</span>
        </TabsTrigger>
        <TabsTrigger value="internacional" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span>Internacional</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="clasificacion">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
        >
          <div>
            <h3 className="text-2xl font-bold mb-4">Clasificación Inteligente de Terrenos</h3>
            <p className="text-gray-600 mb-4">
              Utilizamos algoritmos de visión por computadora y aprendizaje profundo para analizar imágenes satelitales,
              datos topográficos y características ambientales de cada propiedad.
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">Análisis de Imágenes Satelitales</h4>
                <p className="text-sm">
                  Nuestros algoritmos procesan imágenes de múltiples fuentes (Sentinel, Landsat) para identificar
                  características del terreno, vegetación, cuerpos de agua y accesibilidad.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-700 mb-2">Evaluación de Potencial Agrícola</h4>
                <p className="text-sm">
                  Combinamos datos de suelo, clima, pendiente y acceso a agua para determinar la aptitud agrícola y los
                  cultivos óptimos para cada terreno.
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-700 mb-2">Valoración de Conservación</h4>
                <p className="text-sm">
                  Evaluamos la biodiversidad, conectividad ecológica y servicios ecosistémicos para identificar el valor
                  de conservación y potencial para proyectos de compensación de carbono.
                </p>
              </div>
            </div>
          </div>
          <div className="relative h-[400px] rounded-xl overflow-hidden shadow-xl">
            <Image
              src="/ai-property-classification.png"
              alt="Análisis de imágenes satelitales con IA"
              fill
              className="object-cover"
            />
          </div>
        </motion.div>
      </TabsContent>

      <TabsContent value="atencion">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
        >
          <div className="order-2 md:order-1 relative h-[400px] rounded-xl overflow-hidden shadow-xl">
            <Image
              src="/images/ai-futuristic-assistant.png"
              alt="Asistente virtual de atención al cliente"
              fill
              className="object-cover"
            />
          </div>
          <div className="order-1 md:order-2">
            <h3 className="text-2xl font-bold mb-4">Atención Automatizada 24/7</h3>
            <p className="text-gray-600 mb-4">
              Nuestro asistente virtual basado en IA está disponible las 24 horas para responder consultas, proporcionar
              información detallada sobre propiedades y programar visitas con nuestros agentes.
            </p>
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-semibold text-indigo-700 mb-2">Chatbot Multilingüe</h4>
                <p className="text-sm">
                  Atiende consultas en español, inglés, alemán y portugués, facilitando la comunicación con
                  inversionistas internacionales interesados en propiedades chilenas.
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-700 mb-2">Recomendaciones Personalizadas</h4>
                <p className="text-sm">
                  Analiza las preferencias y necesidades del cliente para sugerir propiedades que se ajusten a sus
                  criterios específicos, ahorrando tiempo en la búsqueda.
                </p>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <h4 className="font-semibold text-pink-700 mb-2">Integración con WhatsApp y Redes Sociales</h4>
                <p className="text-sm">
                  Disponible en múltiples canales de comunicación para mayor comodidad, manteniendo la continuidad de la
                  conversación independientemente del medio utilizado.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </TabsContent>

      <TabsContent value="prediccion">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
        >
          <div>
            <h3 className="text-2xl font-bold mb-4">Predicción de Precios y Tendencias</h3>
            <p className="text-gray-600 mb-4">
              Nuestros modelos de aprendizaje automático analizan datos históricos, tendencias del mercado y factores
              económicos para predecir la valorización de propiedades y detectar oportunidades de inversión.
            </p>
            <div className="space-y-4">
              <div className="bg-cyan-50 p-4 rounded-lg">
                <h4 className="font-semibold text-cyan-700 mb-2">Análisis de Series Temporales</h4>
                <p className="text-sm">
                  Estudiamos la evolución de precios por zona y tipo de propiedad para identificar patrones estacionales
                  y tendencias a largo plazo que afectan la valorización.
                </p>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg">
                <h4 className="font-semibold text-teal-700 mb-2">Modelos Predictivos</h4>
                <p className="text-sm">
                  Utilizamos regresión, redes neuronales y modelos de ensemble para predecir precios futuros con un
                  margen de error inferior al 8% en la mayoría de las propiedades.
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <h4 className="font-semibold text-emerald-700 mb-2">Alertas de Oportunidad</h4>
                <p className="text-sm">
                  El sistema identifica automáticamente propiedades subvaloradas o con alto potencial de apreciación,
                  generando alertas para inversores y compradores interesados.
                </p>
              </div>
            </div>
          </div>
          <div className="relative h-[400px] rounded-xl overflow-hidden shadow-xl">
            <Image
              src="/images/ai-property-valuation-hq.png"
              alt="Dashboard de predicción de precios inmobiliarios"
              fill
              className="object-cover"
              priority
            />
          </div>
        </motion.div>
      </TabsContent>

      <TabsContent value="contenido">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
        >
          <div className="order-2 md:order-1 relative h-[400px] rounded-xl overflow-hidden shadow-xl">
            <Image
              src="/images/ai-futuristic-documents.png"
              alt="Generación automática de contenido para propiedades"
              fill
              className="object-cover"
            />
          </div>
          <div className="order-1 md:order-2">
            <h3 className="text-2xl font-bold mb-4">Generación Automática de Contenido</h3>
            <p className="text-gray-600 mb-4">
              Utilizamos modelos de lenguaje avanzados para crear descripciones detalladas, fichas técnicas y material
              promocional personalizado para cada propiedad en múltiples idiomas.
            </p>
            <div className="space-y-4">
              <div className="bg-rose-50 p-4 rounded-lg">
                <h4 className="font-semibold text-rose-700 mb-2">Descripciones Persuasivas</h4>
                <p className="text-sm">
                  Generamos textos que destacan las características únicas de cada propiedad, adaptados al tipo de
                  comprador objetivo (inversionista, familia, conservacionista).
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-700 mb-2">Fichas Técnicas Completas</h4>
                <p className="text-sm">
                  Creamos automáticamente documentos detallados con información legal, técnica y comercial, incluyendo
                  análisis comparativos con propiedades similares.
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-700 mb-2">Contenido Multilingüe</h4>
                <p className="text-sm">
                  Traducimos y adaptamos culturalmente todo el material a inglés, alemán, chino y portugués para
                  facilitar la comunicación con inversionistas internacionales.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </TabsContent>

      <TabsContent value="internacional">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
        >
          <div>
            <h3 className="text-2xl font-bold mb-4">Alcance Internacional Inteligente</h3>
            <p className="text-gray-600 mb-4">
              Utilizamos IA para identificar y conectar con inversionistas, productores y filántropos internacionales
              interesados en propiedades chilenas, ampliando significativamente nuestro alcance global.
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">Segmentación Geográfica Avanzada</h4>
                <p className="text-sm">
                  Identificamos mercados internacionales con mayor interés en cada tipo de propiedad: conservación
                  (EE.UU., Alemania), agrícola (China, España), turístico (Brasil, Francia).
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-semibold text-indigo-700 mb-2">Campañas Personalizadas</h4>
                <p className="text-sm">
                  Creamos campañas específicas para cada segmento internacional, adaptando mensajes, canales y
                  propuestas de valor según preferencias culturales y objetivos de inversión.
                </p>
              </div>
              <div className="bg-violet-50 p-4 rounded-lg">
                <h4 className="font-semibold text-violet-700 mb-2">Análisis de Tendencias Globales</h4>
                <p className="text-sm">
                  Monitorizamos continuamente tendencias de inversión internacional en recursos naturales, identificando
                  oportunamente nuevos mercados y perfiles de inversionistas.
                </p>
              </div>
            </div>
          </div>
          <div className="relative h-[400px] rounded-xl overflow-hidden shadow-xl">
            <Image
              src="/images/ai-futuristic-global.png"
              alt="Mapa de inversiones internacionales en propiedades chilenas"
              fill
              className="object-cover"
            />
          </div>
        </motion.div>
      </TabsContent>
    </Tabs>
  )
}

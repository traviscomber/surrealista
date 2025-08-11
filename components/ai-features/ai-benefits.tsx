"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Clock, Search, TrendingUp, Shield, Users, Zap } from "lucide-react"

export function AIBenefits() {
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

  const benefits = [
    {
      icon: <Clock className="h-10 w-10 text-blue-500" />,
      title: "Ahorro de Tiempo",
      description:
        "Reducción del 70% en el tiempo de búsqueda de propiedades gracias a recomendaciones personalizadas y filtros inteligentes.",
      color: "blue-500",
    },
    {
      icon: <Search className="h-10 w-10 text-indigo-500" />,
      title: "Búsqueda Precisa",
      description:
        "Encuentra exactamente lo que buscas con criterios específicos como tipo de suelo, orientación solar o potencial de desarrollo.",
      color: "indigo-500",
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-purple-500" />,
      title: "Decisiones Informadas",
      description:
        "Accede a análisis de mercado, predicciones de valorización y comparativas detalladas para tomar mejores decisiones.",
      color: "purple-500",
    },
    {
      icon: <Shield className="h-10 w-10 text-green-500" />,
      title: "Seguridad y Transparencia",
      description: "Verificación automática de documentación legal y análisis de riesgos para cada propiedad.",
      color: "green-500",
    },
    {
      icon: <Users className="h-10 w-10 text-amber-500" />,
      title: "Atención Personalizada",
      description:
        "Combinamos la eficiencia de la IA con el trato humano de nuestros especialistas para una experiencia superior.",
      color: "amber-500",
    },
    {
      icon: <Zap className="h-10 w-10 text-rose-500" />,
      title: "Procesos Ágiles",
      description:
        "Automatización de trámites y documentación que agiliza significativamente los procesos de compra y venta.",
      color: "rose-500",
    },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {benefits.map((benefit, index) => (
        <motion.div key={index} variants={item}>
          <Card className={`h-full border-t-4 hover:shadow-lg transition-shadow duration-300 border-${benefit.color}`}>
            <CardHeader className="pb-2">
              <div className="mb-4">{benefit.icon}</div>
              <CardTitle className="text-xl">{benefit.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{benefit.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

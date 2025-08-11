"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

export function AIComparison() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  const comparisonItems = [
    {
      feature: "Clasificación de propiedades",
      traditional: {
        text: "Manual, basada en criterios limitados",
        icon: <X className="h-5 w-5 text-red-500" />,
      },
      ai: {
        text: "Análisis de múltiples variables y datos geoespaciales",
        icon: <Check className="h-5 w-5 text-green-500" />,
      },
    },
    {
      feature: "Atención al cliente",
      traditional: {
        text: "Horario limitado, dependiente de disponibilidad",
        icon: <X className="h-5 w-5 text-red-500" />,
      },
      ai: {
        text: "24/7, multilingüe, respuestas instantáneas",
        icon: <Check className="h-5 w-5 text-green-500" />,
      },
    },
    {
      feature: "Valoración de propiedades",
      traditional: {
        text: "Basada en comparables y criterio subjetivo",
        icon: <X className="h-5 w-5 text-red-500" />,
      },
      ai: {
        text: "Modelos predictivos con precisión del 92%",
        icon: <Check className="h-5 w-5 text-green-500" />,
      },
    },
    {
      feature: "Generación de contenido",
      traditional: {
        text: "Manual, limitada a un idioma, inconsistente",
        icon: <X className="h-5 w-5 text-red-500" />,
      },
      ai: {
        text: "Automática, multilingüe, personalizada",
        icon: <Check className="h-5 w-5 text-green-500" />,
      },
    },
    {
      feature: "Alcance internacional",
      traditional: {
        text: "Limitado a contactos existentes y ferias",
        icon: <X className="h-5 w-5 text-red-500" />,
      },
      ai: {
        text: "Segmentación avanzada y campañas personalizadas",
        icon: <Check className="h-5 w-5 text-green-500" />,
      },
    },
    {
      feature: "Tiempo de búsqueda",
      traditional: {
        text: "Semanas o meses para encontrar propiedades adecuadas",
        icon: <X className="h-5 w-5 text-red-500" />,
      },
      ai: {
        text: "Minutos para identificar opciones óptimas",
        icon: <Check className="h-5 w-5 text-green-500" />,
      },
    },
    {
      feature: "Análisis de potencial",
      traditional: {
        text: "Basado en experiencia y criterio personal",
        icon: <X className="h-5 w-5 text-red-500" />,
      },
      ai: {
        text: "Análisis multivariable con escenarios predictivos",
        icon: <Check className="h-5 w-5 text-green-500" />,
      },
    },
    {
      feature: "Documentación legal",
      traditional: {
        text: "Revisión manual, propensa a errores",
        icon: <X className="h-5 w-5 text-red-500" />,
      },
      ai: {
        text: "Verificación automática y alertas de inconsistencias",
        icon: <Check className="h-5 w-5 text-green-500" />,
      },
    },
  ]

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="py-4 px-6 bg-gray-50 text-left text-gray-600 font-medium">Característica</th>
            <th className="py-4 px-6 bg-red-50 text-left text-red-800 font-medium">Método Tradicional</th>
            <th className="py-4 px-6 bg-green-50 text-left text-green-800 font-medium">Sur-Realista con IA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {comparisonItems.map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="py-4 px-6 font-medium">{item.feature}</td>
              <td className="py-4 px-6">
                <div className="flex items-center">
                  {item.traditional.icon}
                  <span className="ml-2">{item.traditional.text}</span>
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center">
                  {item.ai.icon}
                  <span className="ml-2">{item.ai.text}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  )
}

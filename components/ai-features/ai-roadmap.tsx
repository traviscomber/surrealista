"use client"

import { motion } from "framer-motion"

export function AIRoadmap() {
  const roadmapItems = [
    {
      year: "2023",
      title: "Fundamentos de IA",
      description: "Implementación de sistemas básicos de clasificación de propiedades y asistente virtual.",
      completed: true,
      color: "bg-blue-500",
    },
    {
      year: "2024",
      title: "Expansión de Capacidades",
      description: "Mejora de modelos predictivos, generación de contenido multilingüe y alcance internacional.",
      completed: true,
      color: "bg-indigo-500",
    },
    {
      year: "2025",
      title: "Integración Avanzada",
      description: "Sistema central de gestión con IA, automatización de procesos y análisis predictivo mejorado.",
      completed: false,
      color: "bg-purple-500",
    },
    {
      year: "2026",
      title: "Experiencia Inmersiva",
      description:
        "Recorridos virtuales generados por IA, gemelos digitales de propiedades y simulaciones de desarrollo.",
      completed: false,
      color: "bg-pink-500",
    },
    {
      year: "2027",
      title: "Ecosistema Inteligente",
      description:
        "Plataforma completa con marketplace, financiamiento integrado y gestión automatizada de propiedades.",
      completed: false,
      color: "bg-rose-500",
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className="relative">
      {/* Línea vertical de conexión */}
      <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-1 bg-gray-200 -ml-0.5 hidden md:block"></div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="space-y-12 relative"
      >
        {roadmapItems.map((item, index) => (
          <motion.div key={index} variants={item} className="relative">
            <div className={`md:flex ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center`}>
              {/* Círculo indicador */}
              <div className="absolute left-0 md:left-1/2 w-14 h-14 flex items-center justify-center -ml-7 md:-ml-7 z-10">
                <div
                  className={`w-14 h-14 rounded-full ${item.color} text-white flex items-center justify-center font-bold shadow-lg`}
                >
                  {item.year}
                </div>
              </div>

              {/* Contenido */}
              <div className={`ml-20 md:ml-0 md:w-1/2 ${index % 2 === 0 ? "md:pr-16" : "md:pl-16"}`}>
                <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${item.color}`}>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                  {item.completed && (
                    <div className="mt-4 inline-flex items-center text-sm font-medium text-green-600">
                      <svg className="mr-1.5 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Implementado
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

"use client"

import { motion, type Variants } from "framer-motion"

export function AIRoadmap() {
  const roadmapItems = [
    {
      year: "2023",
      title: "Fundamentos de IA",
      description: "Clasificación de propiedades y asistencia virtual como base de exploración del producto.",
      color: "bg-blue-500",
    },
    {
      year: "2024",
      title: "Expansión de Capacidades",
      description: "Exploración de modelos predictivos, contenido multilingüe y alcance internacional.",
      color: "bg-indigo-500",
    },
    {
      year: "2025",
      title: "Integración Avanzada",
      description: "Gestión asistida por IA, automatización de procesos y análisis predictivo.",
      color: "bg-purple-500",
    },
    {
      year: "2026",
      title: "Experiencia Inmersiva",
      description: "Exploración de recorridos virtuales, gemelos digitales y simulaciones de desarrollo.",
      color: "bg-pink-500",
    },
    {
      year: "2027",
      title: "Ecosistema Inteligente",
      description: "Visión de plataforma integrada para marketplace, financiamiento y gestión de propiedades.",
      color: "bg-rose-500",
    },
  ]

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className="relative">
      <p className="mb-6 text-sm text-muted-foreground">
        Hoja de ruta referencial de producto. No representa por sí sola el estado operativo de cada capacidad.
      </p>

      <div className="absolute left-[28px] md:left-1/2 top-10 bottom-0 w-1 bg-gray-200 -ml-0.5 hidden md:block" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="space-y-12 relative"
      >
        {roadmapItems.map((roadmapItem, index) => (
          <motion.div key={roadmapItem.year} variants={itemVariants} className="relative">
            <div className={`md:flex ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center`}>
              <div className="absolute left-0 md:left-1/2 w-14 h-14 flex items-center justify-center -ml-7 md:-ml-7 z-10">
                <div
                  className={`w-14 h-14 rounded-full ${roadmapItem.color} text-white flex items-center justify-center font-bold shadow-lg`}
                >
                  {roadmapItem.year}
                </div>
              </div>

              <div className={`ml-20 md:ml-0 md:w-1/2 ${index % 2 === 0 ? "md:pr-16" : "md:pl-16"}`}>
                <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${roadmapItem.color}`}>
                  <h3 className="text-xl font-bold mb-2">{roadmapItem.title}</h3>
                  <p className="text-gray-600">{roadmapItem.description}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

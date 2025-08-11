"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Github, Linkedin, Twitter } from "lucide-react"

export function AITeam() {
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

  const team = [
    {
      name: "Dr. Alejandro Morales",
      role: "Director de IA",
      bio: "PhD en Inteligencia Artificial por la Universidad de Stanford. 10+ años de experiencia en machine learning aplicado a análisis geoespacial y visión por computadora.",
      image: "/placeholder-o3l7z.png",
      social: {
        linkedin: "#",
        twitter: "#",
        github: "#",
      },
    },
    {
      name: "Dra. Valentina Rojas",
      role: "Científica de Datos Senior",
      bio: "Especialista en modelos predictivos y análisis estadístico avanzado. Anteriormente trabajó en proyectos de valoración inmobiliaria para empresas internacionales.",
      image:
        "/placeholder.svg?height=400&width=400&query=professional headshot of female data scientist with dark hair",
      social: {
        linkedin: "#",
        twitter: "#",
        github: "#",
      },
    },
    {
      name: "Ing. Matías Fuentes",
      role: "Ingeniero de ML",
      bio: "Experto en desarrollo e implementación de modelos de machine learning. Especializado en procesamiento de lenguaje natural y sistemas de recomendación.",
      image: "/placeholder.svg?height=400&width=400&query=professional headshot of young male software engineer",
      social: {
        linkedin: "#",
        twitter: "#",
        github: "#",
      },
    },
    {
      name: "Ing. Camila Vega",
      role: "Especialista en GIS & IA",
      bio: "Ingeniera geomática con especialización en sistemas de información geográfica e integración con inteligencia artificial para análisis territorial.",
      image: "/placeholder.svg?height=400&width=400&query=professional headshot of female GIS specialist",
      social: {
        linkedin: "#",
        twitter: "#",
        github: "#",
      },
    },
  ]

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Nuestro Equipo de IA</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Conoce a los expertos detrás de nuestra tecnología de inteligencia artificial, un equipo multidisciplinario
          con amplia experiencia en ciencia de datos, machine learning y análisis geoespacial.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        {team.map((member, index) => (
          <motion.div key={index} variants={item}>
            <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-64 w-full">
                <Image
                  src={member.image || "/placeholder.svg"}
                  alt={`Foto de ${member.name}`}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-sm text-blue-600 font-medium mb-3">{member.role}</p>
                <p className="text-sm text-gray-600 mb-4">{member.bio}</p>
                <div className="flex space-x-3">
                  <a
                    href={member.social.linkedin}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label={`LinkedIn de ${member.name}`}
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a
                    href={member.social.twitter}
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                    aria-label={`Twitter de ${member.name}`}
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a
                    href={member.social.github}
                    className="text-gray-400 hover:text-gray-800 transition-colors"
                    aria-label={`GitHub de ${member.name}`}
                  >
                    <Github className="h-5 w-5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

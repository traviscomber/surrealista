"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, FileCheck, Server, UserCheck, RefreshCw } from "lucide-react"

export function AIDataSecurity() {
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

  const securityFeatures = [
    {
      icon: <Shield className="h-10 w-10 text-blue-500" />,
      title: "Encriptación Avanzada",
      description:
        "Todos los datos personales y de propiedades están protegidos con encriptación de nivel bancario, tanto en tránsito como en reposo.",
    },
    {
      icon: <Lock className="h-10 w-10 text-indigo-500" />,
      title: "Acceso Controlado",
      description:
        "Sistema de permisos granular que garantiza que solo personal autorizado pueda acceder a información sensible.",
    },
    {
      icon: <FileCheck className="h-10 w-10 text-green-500" />,
      title: "Cumplimiento Normativo",
      description:
        "Cumplimos con la legislación chilena de protección de datos y estándares internacionales como GDPR.",
    },
    {
      icon: <Server className="h-10 w-10 text-amber-500" />,
      title: "Infraestructura Segura",
      description:
        "Servidores alojados en centros de datos certificados con redundancia geográfica y protección contra desastres.",
    },
    {
      icon: <UserCheck className="h-10 w-10 text-purple-500" />,
      title: "Anonimización de Datos",
      description:
        "Los modelos de IA se entrenan con datos agregados y anonimizados para proteger la privacidad individual.",
    },
    {
      icon: <RefreshCw className="h-10 w-10 text-rose-500" />,
      title: "Auditorías Regulares",
      description:
        "Realizamos auditorías de seguridad periódicas y pruebas de penetración para identificar y corregir vulnerabilidades.",
    },
  ]

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Seguridad y Privacidad de Datos</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          En Sur-Realista, la protección de los datos de nuestros clientes es una prioridad absoluta. Implementamos las
          más estrictas medidas de seguridad para garantizar la confidencialidad e integridad de su información.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {securityFeatures.map((feature, index) => (
          <motion.div key={index} variants={item}>
            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-2">
                <div className="mb-4">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-12 bg-blue-50 p-6 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <div className="mr-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Nuestro Compromiso con la Privacidad</h3>
            <p className="text-blue-700">
              Sur-Realista se compromete a utilizar la inteligencia artificial de manera ética y responsable. Nunca
              vendemos datos personales a terceros y solo recopilamos la información necesaria para brindar nuestros
              servicios. Todos nuestros clientes tienen derecho a acceder, corregir o eliminar sus datos en cualquier
              momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

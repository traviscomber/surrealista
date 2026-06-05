import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, MapPin, Users, MessageSquare, CheckSquare, FileText, ExternalLink, Search } from "lucide-react"
import Link from "next/link"
import { ContextualHelp, QuickTips } from "@/components/educational/contextual-help"

export default function AyudaPage() {
  const sections = [
    {
      icon: MapPin,
      title: "CAMPOS - Exploración de Datos Geográficos",
      description: "Aprende a gestionar, buscar y visualizar tus campos y ubicaciones",
      topics: [
        "¿Cómo seleccionar múltiples regiones?",
        "Búsqueda avanzada por ubicación",
        "Interpretación del mapa interactivo",
        "Exportación de datos",
      ],
    },
    {
      icon: Users,
      title: "CLIENTES - Gestión de Contactos",
      description: "Organiza y gestiona la información de tus clientes",
      topics: [
        "Crear un nuevo cliente",
        "Asignar ubicaciones de interés",
        "Clasificación por estado (Hot/Warm/Cold)",
        "Historial de contacto",
      ],
    },
    {
      icon: MessageSquare,
      title: "COMUNICACIONES - Mensajes y Email",
      description: "Mantén comunicación fluida con tus clientes",
      topics: [
        "Enviar emails desde la plataforma",
        "Plantillas de comunicación",
        "Historial de mensajes",
        "Automatización de respuestas",
      ],
    },
    {
      icon: CheckSquare,
      title: "TAREAS - Organización de Trabajo",
      description: "Gestiona tus tareas y deadlines",
      topics: [
        "Crear una nueva tarea",
        "Asignar prioridades",
        "Seguimiento de progreso",
        "Recordatorios automáticos",
      ],
    },
  ]

  const generalHelp = [
    {
      question: "¿Cómo empiezo a usar Sur-Realista?",
      answer:
        "Comienza por la sección CAMPOS para cargar tus archivos KMZ. Luego puedes explorar tus datos geográficos, añadir clientes y gestionar comunicaciones.",
    },
    {
      question: "¿Qué datos puedo importar?",
      answer: "Puedes importar archivos KMZ (mapas), contactos en CSV, documentos en Google Drive y tareas desde tu calendario.",
    },
    {
      question: "¿Dónde se almacenan mis datos?",
      answer:
        "Todos tus datos se almacenan de forma segura en servidores cifrados. Puedes acceder desde cualquier dispositivo con acceso a internet.",
    },
    {
      question: "¿Cómo exporto mis datos?",
      answer:
        "En cada sección puedes exportar datos haciendo clic en el botón 'Exportar'. Los datos se descargarán en formato CSV o KMZ según corresponda.",
    },
    {
      question: "¿Puedo colaborar con otros usuarios?",
      answer: "Sí, puedes invitar a otros usuarios a tu workspace desde la sección de administración y asignarles diferentes niveles de acceso.",
    },
    {
      question: "¿Dónde encuentro más documentación?",
      answer: "Visita nuestra documentación completa en https://docs.sur-realista.com o contacta a nuestro equipo de soporte.",
    },
  ]

  const tips = [
    "Usa la búsqueda global (Cmd+K) para encontrar rápidamente lo que necesitas en cualquier sección",
    "Personaliza tus vistas creando filtros guardados para búsquedas frecuentes",
    "Activa las notificaciones para recibir alertas sobre nuevos clientes o cambios importantes",
    "Usa tags para organizar mejor tus campos y clientes por categoría",
    "Exporta tus reportes semanales para análisis y archivo",
  ]

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-5xl space-y-8 px-4">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-teal-600" />
            <h1 className="text-4xl font-bold text-foreground">Centro de Ayuda</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Aprende a usar Sur-Realista con nuestras guías, tutoriales y respuestas a preguntas frecuentes.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Busca en el centro de ayuda..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {/* Main Sections */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Guías Principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((section, index) => {
              const Icon = section.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <Icon className="h-6 w-6 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <CardDescription className="mt-1">{section.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.topics.map((topic, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="text-teal-600 font-bold mt-1">•</span>
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" className="w-full mt-4" asChild>
                      <Link href={`/ayuda/${section.title.split(" ")[0].toLowerCase()}`}>
                        Ver Guía Completa
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* General Help */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Preguntas Frecuentes</h2>
          <ContextualHelp title="Respuestas a preguntas comunes" items={generalHelp} defaultExpanded={true} />
        </div>

        {/* Quick Tips */}
        <QuickTips tips={tips} />

        {/* Support CTA */}
        <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold text-teal-900 mb-2">¿Necesitas más ayuda?</h3>
                <p className="text-teal-800 mb-4">
                  Si no encuentras la respuesta que necesitas, nuestro equipo de soporte está disponible para ayudarte.
                </p>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">Contactar Soporte</Button>
              </div>
              <div>
                <h3 className="text-xl font-bold text-teal-900 mb-2">Documentación Técnica</h3>
                <p className="text-teal-800 mb-4">
                  Accede a la documentación técnica completa para desarrolladores e integraciones.
                </p>
                <Button variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50">
                  Ver Documentación
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

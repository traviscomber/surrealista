'use client'

import { useState } from 'react'
import { AlertCircle, Bot, Calculator, Database, MapPin, ShieldCheck } from 'lucide-react'
import { WorkspaceHeading } from '@/components/ui/workspace-heading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const guides = {
  cotizador: {
    icon: Calculator,
    title: 'Referencia de valor',
    description: 'Cómo preparar una estimación interna sin confundirla con una tasación oficial.',
    steps: [
      'Selecciona el tipo de propiedad, región y superficie.',
      'Agrega solo características conocidas y verificables.',
      'Incluye atributos rurales cuando correspondan al inmueble.',
      'Ejecuta el cálculo y revisa rango, valor por m², confianza, metodología y fuentes declaradas.',
      'Contrasta el resultado con antecedentes comerciales y técnicos antes de utilizarlo.',
    ],
    caution: 'La herramienta entrega una referencia de trabajo. No reemplaza una tasación bancaria, tributaria, legal ni profesional.',
  },
  asistente: {
    icon: Bot,
    title: 'Asistente de análisis',
    description: 'Cómo formular consultas útiles y validar la respuesta obtenida.',
    steps: [
      'Indica el objeto concreto de la consulta: archivo, región, propiedad, rol o documento.',
      'Incluye contexto suficiente para evitar interpretaciones ambiguas.',
      'Revisa qué fuentes estaban disponibles durante la consulta.',
      'Abre los documentos o enlaces originales cuando la respuesta cite evidencia.',
      'No utilices una respuesta generada como confirmación legal, registral o comercial definitiva.',
    ],
    caution: 'La calidad de la respuesta depende de las fuentes y permisos disponibles. Un dato ausente no debe completarse mediante suposición.',
  },
  kmz: {
    icon: MapPin,
    title: 'Colección KMZ',
    description: 'Cómo interpretar y mantener los archivos territoriales internos.',
    steps: [
      'Busca por nombre de archivo, ruta, categoría o rol disponible.',
      'Revisa región, cantidad de elementos y fecha de actualización.',
      'Corrige asignaciones territoriales únicamente cuando exista evidencia suficiente.',
      'Utiliza las acciones masivas de proceso o reindexación solo cuando sea necesario.',
      'Verifica el resultado del proceso y los errores informados antes de continuar.',
    ],
    caution: 'Los límites, polígonos y roles extraídos deben contrastarse con antecedentes oficiales cuando se utilicen para decisiones sensibles.',
  },
  roles: {
    icon: Database,
    title: 'Roles SII y propietarios',
    description: 'Cómo trabajar con consultas territoriales y candidatos de investigación.',
    steps: [
      'Consulta un rol o registro específico.',
      'Revisa el estado de la investigación y el nivel de confianza informado.',
      'Abre la evidencia disponible y confirma que corresponda al inmueble correcto.',
      'Distingue siempre entre candidato, evidencia encontrada y antecedente confirmado.',
      'Utiliza certificados, escrituras y fuentes oficiales para acreditar propiedad o dominio.',
    ],
    caution: 'Una coincidencia de nombre, rol o ubicación no acredita dominio por sí sola.',
  },
}

type GuideKey = keyof typeof guides

export default function DocsUsuario() {
  const [activeGuide, setActiveGuide] = useState<GuideKey>('cotizador')

  return (
    <main className="container mx-auto space-y-8 px-4 py-8">
      <WorkspaceHeading
        eyebrow="Procedimientos internos"
        title="Guía de usuario"
        description="Instrucciones para operar las herramientas principales, interpretar sus resultados y reconocer cuándo se necesita validación adicional."
        outcome="Podrás completar los flujos principales sin confundir resultados de apoyo con antecedentes oficiales o confirmados."
      />

      <Tabs value={activeGuide} onValueChange={(value) => setActiveGuide(value as GuideKey)}>
        <TabsList className="grid h-auto w-full grid-cols-2 lg:grid-cols-4">
          {Object.entries(guides).map(([key, guide]) => (
            <TabsTrigger key={key} value={key} className="gap-2 py-3">
              <guide.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{guide.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(guides).map(([key, guide]) => (
          <TabsContent key={key} value={key} className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
                    <guide.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{guide.title}</CardTitle>
                    <CardDescription className="mt-1 leading-5">{guide.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ol className="space-y-3">
                  {guide.steps.map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm leading-6">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-semibold">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="flex gap-3 rounded-md border border-border/70 bg-muted/30 p-4 text-sm leading-6">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p><strong>Validación necesaria:</strong> {guide.caution}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="border-border/70">
        <CardContent className="flex gap-3 p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-semibold">Principio general</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              La plataforma debe mostrar información existente, estados reales y límites conocidos. Cuando un dato no esté disponible, debe indicarlo claramente en vez de inferirlo o completarlo.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

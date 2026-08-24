"use client"

import { useMemo, useState } from "react"
import { FileText, ListChecks, MessageSquare, Sparkles, Zap } from "lucide-react"

import { CommunicationsTracking } from "./communications-tracking"
import DocumentsManager from "./documents-manager"
import { TemplateLibrary } from "./template-library"
import { WhitepaperBuilder } from "@/components/corporate-documents/whitepaper-builder"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const sections = [
  { value: "documents", label: "Documentación", icon: FileText },
  { value: "tracking", label: "Seguimiento", icon: ListChecks },
  { value: "templates", label: "Plantillas", icon: Sparkles },
  { value: "whitepapers", label: "Generador", icon: Zap },
] as const

export function CommunicationsManager() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState("documents")

  const activeSection = useMemo(
    () => sections.find((section) => section.value === activeTab) || sections[0],
    [activeTab],
  )

  return (
    <section className="space-y-5 py-2">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="sr-meta">Centro documental y comercial</p>
          <div className="mt-1 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="sr-section-title">Comunicaciones</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Organiza documentos, seguimiento, plantillas y generación de contenidos desde un único flujo operativo.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="min-w-max justify-start">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <TabsTrigger key={section.value} value={section.value} className="gap-2 px-4 py-3">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {section.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        <div className="border-b border-border py-4">
          <p className="sr-meta">Sección activa</p>
          <p className="mt-1 text-sm font-medium text-foreground">{activeSection.label}</p>
        </div>

        <TabsContent value="documents" className="mt-5">
          <DocumentsManager />
        </TabsContent>

        <TabsContent value="tracking" className="mt-5">
          <CommunicationsTracking refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="templates" className="mt-5">
          <TemplateLibrary onCommunicationCreated={() => setRefreshTrigger((value) => value + 1)} />
        </TabsContent>

        <TabsContent value="whitepapers" className="mt-5">
          <WhitepaperBuilder />
        </TabsContent>
      </Tabs>
    </section>
  )
}

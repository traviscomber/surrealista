"use client"

import { useState } from "react"
import { FileText, ListChecks, MessageSquare, Presentation, Sparkles } from "lucide-react"

import { CommunicationsTracking } from "./communications-tracking"
import { CommercialPresentations } from "./commercial-presentations"
import DocumentsManager from "./documents-manager"
import { TemplateLibrary } from "./template-library"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const sections = [
  { value: "documents", label: "Documentación", icon: FileText },
  { value: "tracking", label: "Seguimiento", icon: ListChecks },
  { value: "templates", label: "Plantillas", icon: Sparkles },
  { value: "presentations", label: "Presentaciones comerciales", icon: Presentation },
] as const

export function CommunicationsManager() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState("documents")

  return (
    <section className="space-y-5 py-2">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="sr-meta">Centro documental y comercial</p>
          <div className="mt-1 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="sr-section-title">Multimedia</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Organiza contenido, seguimiento, plantillas, documentos y presentaciones desde un único flujo operativo.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="h-11 min-w-max justify-start gap-5 rounded-none bg-transparent p-0">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <TabsTrigger
                  key={section.value}
                  value={section.value}
                  className="relative h-11 gap-2 rounded-none border-0 bg-transparent px-0 text-[11px] font-medium text-muted-foreground shadow-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {section.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
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

        <TabsContent value="presentations" className="mt-5">
          <CommercialPresentations />
        </TabsContent>
      </Tabs>
    </section>
  )
}

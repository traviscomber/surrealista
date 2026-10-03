"use client"

import { useState } from "react"
import { ListChecks, Presentation, Sparkles } from "lucide-react"

import { CommunicationsTracking } from "./communications-tracking"
import { CommercialPresentations } from "./commercial-presentations"
import { TemplateLibrary } from "./template-library"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const sections = [
  { value: "templates", label: "Packs y plantillas", icon: Sparkles },
  { value: "tracking", label: "Seguimiento", icon: ListChecks },
  { value: "presentations", label: "Presentaciones", icon: Presentation },
] as const

export function CommunicationsManager() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState("templates")

  return (
    <section className="space-y-5">
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

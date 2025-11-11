"use client"

import { TabsContent } from "@/components/ui/tabs"

import { TabsTrigger } from "@/components/ui/tabs"

import { TabsList } from "@/components/ui/tabs"

import { Tabs } from "@/components/ui/tabs"

import { useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Sparkles, ListChecks } from "lucide-react"
import { TemplateLibrary } from "./template-library"
import { CommunicationsTracking } from "./communications-tracking"

interface Communication {
  id: string
  client_id?: string
  communication_type: string
  subject: string
  content: string
  communication_date: string
  direction: string
  created_by: string
  attachments?: any
}

interface CommunicationTemplate {
  id: string
  name: string
  type: string
  icon: any
  category: string
  template: string
  variables: string[]
}

export function CommunicationsManager() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCommunicationCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            Gestión de Comunicaciones
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Sistema completo de comunicaciones: Templates, Tracking y Seguimiento
          </p>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="templates" className="flex items-center gap-2 py-3">
            <Sparkles className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Biblioteca de Templates</div>
              <div className="text-xs text-muted-foreground">Crear desde plantillas</div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2 py-3">
            <ListChecks className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Gestión y Tracking</div>
              <div className="text-xs text-muted-foreground">Seguimiento completo</div>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <TemplateLibrary onCommunicationCreated={handleCommunicationCreated} />
        </TabsContent>

        <TabsContent value="tracking" className="mt-6">
          <CommunicationsTracking refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

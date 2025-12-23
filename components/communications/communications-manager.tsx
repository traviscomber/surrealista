"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Sparkles, ListChecks, FileText, Eye, EyeOff, Zap } from "lucide-react"
import { TemplateLibrary } from "./template-library"
import { CommunicationsTracking } from "./communications-tracking"
import DocumentsManager from "./documents-manager"
import { WhitepaperBuilder } from "@/components/corporate-documents/whitepaper-builder"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"

interface Task {
  id: string
  title: string
  description: string
  location: string
  priority: string
  status: string
  due_date: string
  created_at: string
}

export function CommunicationsManager() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showDemoData, setShowDemoData] = useState(false)
  const [activeTab, setActiveTab] = useState("documents")

  const supabase = createBrowserClient()

  useEffect(() => {
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      //setCurrentUser(user)
    } catch (error) {
      console.error("[v0] Error getting user:", error)
    }
  }

  const handleCommunicationCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const getContextualStats = () => {
    return []
  }

  const contextualStats = getContextualStats()

  return (
    <div className="space-y-6">
      <Card className="border-sage-dark/30 bg-gradient-to-r from-sage/5 to-sage-light/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-sage-dark" />
                Centro de Trabajo
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">Tu hub completo de tareas, documentos y comunicaciones</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDemoData(!showDemoData)}
              className="flex items-center gap-2"
            >
              {showDemoData ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {showDemoData ? "Ocultar" : "Mostrar"} Datos Demo
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger
            value="documents"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-sage data-[state=active]:text-white"
          >
            <FileText className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Documentación</div>
              <div className="text-xs text-muted-foreground">Archivos y carpetas</div>
            </div>
          </TabsTrigger>

          <TabsTrigger
            value="tracking"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-sage data-[state=active]:text-white"
          >
            <ListChecks className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Gestión y Tracking</div>
              <div className="text-xs text-muted-foreground">Comunicaciones</div>
            </div>
          </TabsTrigger>

          <TabsTrigger
            value="templates"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-sage data-[state=active]:text-white"
          >
            <Sparkles className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Biblioteca de Templates</div>
              <div className="text-xs text-muted-foreground">Plantillas reutilizables</div>
            </div>
          </TabsTrigger>

          <TabsTrigger
            value="whitepapers"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-sage data-[state=active]:text-white"
          >
            <Zap className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Generador de Documentos</div>
              <div className="text-xs text-muted-foreground">Crear documentos</div>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <div className="space-y-6">
            <DocumentsManager showDemoData={showDemoData} />
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="mt-6">
          <CommunicationsTracking refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplateLibrary onCommunicationCreated={handleCommunicationCreated} />
        </TabsContent>

        <TabsContent value="whitepapers" className="mt-6">
          <WhitepaperBuilder />
        </TabsContent>
      </Tabs>
    </div>
  )
}

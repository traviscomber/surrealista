"use client"

import { useState } from "react"
import { AgentList } from "./agent-list"
import { AgentForm } from "./agent-form"
import { AgentPerformance } from "./agent-performance"
import { AgentDriveProcessor } from "./agent-drive-processor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AgentDashboard() {
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreateAgent = () => {
    setSelectedAgent(null)
    setShowForm(true)
  }

  const handleSelectAgent = (agent: any) => {
    setSelectedAgent(agent)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedAgent(null)
  }

  const handleSave = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Agentes IA</h2>
          <p className="text-gray-600 mt-1">
            Gestiona y monitorea tus agentes inteligentes para organización de documentos
          </p>
        </div>
      </div>

      {/* Performance Stats */}
      <AgentPerformance key={refreshKey} />

      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agents">Gestión de Agentes</TabsTrigger>
          <TabsTrigger value="processor">Procesador de Carpetas</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          {/* Agent Form or Agent List */}
          {showForm ? (
            <AgentForm agent={selectedAgent} onClose={handleCloseForm} onSave={handleSave} />
          ) : (
            <AgentList
              key={refreshKey}
              onSelectAgent={handleSelectAgent}
              onCreateAgent={handleCreateAgent}
              onInitialize={handleSave}
            />
          )}

          {/* Agent Architecture Info */}
          <Card>
            <CardHeader>
              <CardTitle>Arquitectura del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg bg-blue-50">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    📁
                  </div>
                  <h3 className="font-semibold">Folder Agent</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Organización y estructura de carpetas según estándar Sur-Realista
                  </p>
                </div>

                <div className="text-center p-4 border rounded-lg bg-green-50">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    🔍
                  </div>
                  <h3 className="font-semibold">Extraction Agent</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    OCR y extracción de datos de documentos (ROL, fechas, montos)
                  </p>
                </div>

                <div className="text-center p-4 border rounded-lg bg-yellow-50">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    ✅
                  </div>
                  <h3 className="font-semibold">Validation Agent</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Validación de estándares PARA y estructura de 6 categorías
                  </p>
                </div>

                <div className="text-center p-4 border rounded-lg bg-purple-50">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    📄
                  </div>
                  <h3 className="font-semibold">Document Agent</h3>
                  <p className="text-xs text-gray-600 mt-1">Clasificación inteligente de documentos en categorías</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processor">
          <AgentDriveProcessor />
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderOpen, Users, MessageSquare, ListTodo } from "lucide-react"
import { CamposView } from "@/components/workspace/campos-view"
import { ClientesView } from "@/components/workspace/clientes-view"
import { ComunicacionesView } from "@/components/workspace/comunicaciones-view"
import { NuevasTareasView } from "@/components/workspace/nuevas-tareas-view"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("nuevas-tareas")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sur-Realista Workspace</h1>
              <p className="text-sm text-gray-600">Sistema integrado de gestión inmobiliaria</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="campos" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span>CAMPOS</span>
            </TabsTrigger>
            <TabsTrigger value="clientes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="comunicaciones" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Comunicaciones</span>
            </TabsTrigger>
            <TabsTrigger value="nuevas-tareas" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              <span>Nuevas Tareas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campos" className="mt-0">
            <CamposView />
          </TabsContent>

          <TabsContent value="clientes" className="mt-0">
            <ClientesView />
          </TabsContent>

          <TabsContent value="comunicaciones" className="mt-0">
            <ComunicacionesView />
          </TabsContent>

          <TabsContent value="nuevas-tareas" className="mt-0">
            <NuevasTareasView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

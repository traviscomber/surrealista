"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@supabase/ssr"
import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"

interface AgentFormProps {
  agent?: any
  onClose: () => void
  onSave: () => void
}

export function AgentForm({ agent, onClose, onSave }: AgentFormProps) {
  const [formData, setFormData] = useState({
    name: agent?.name || "",
    role: agent?.role || "",
    description: agent?.description || "",
    model: agent?.model || "gpt-4",
    capabilities: agent?.capabilities?.join(", ") || "",
    status: agent?.status || "active",
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    setSupabase(
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      )
    )
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const capabilities = formData.capabilities
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)

      const agentData = {
        name: formData.name,
        role: formData.role,
        description: formData.description,
        model: formData.model,
        capabilities,
        status: formData.status,
        success_rate: agent?.success_rate || 0,
        parameters: agent?.parameters || {},
        updated_at: new Date().toISOString(),
      }

      if (agent) {
        // Update existing agent
        const { error } = await supabase.from("ai_agents").update(agentData).eq("id", agent.id)

        if (error) throw error

        toast({
          title: "Agente actualizado",
          description: "Los cambios se guardaron exitosamente",
        })
      } else {
        // Create new agent
        const { error } = await supabase
          .from("ai_agents")
          .insert([{ ...agentData, created_at: new Date().toISOString() }])

        if (error) throw error

        toast({
          title: "Agente creado",
          description: "El nuevo agente se creó exitosamente",
        })
      }

      onSave()
      onClose()
    } catch (error) {
      console.error("[v0] Error saving agent:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el agente",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{agent ? "Editar Agente" : "Nuevo Agente"}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Agente</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Agente de Extracción de Datos"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="Ej: data-extraction"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe qué hace este agente..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modelo IA</Label>
            <select
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capabilities">Capacidades (separadas por comas)</Label>
            <Input
              id="capabilities"
              value={formData.capabilities}
              onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
              placeholder="Ej: OCR, extracción de texto, análisis de documentos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="training">En Entrenamiento</option>
            </select>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {saving ? "Guardando..." : agent ? "Actualizar Agente" : "Crear Agente"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

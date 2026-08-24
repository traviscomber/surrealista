"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"
import type { AgentRecord } from "./agent-list"

interface AgentFormProps {
  agent?: AgentRecord | null
  onClose: () => void
  onSave: () => void
}

type AgentFormState = {
  name: string
  role: string
  description: string
  model: string
  capabilities: string
  status: string
}

export function AgentForm({ agent, onClose, onSave }: AgentFormProps) {
  const [formData, setFormData] = useState<AgentFormState>({
    name: agent?.name || "",
    role: agent?.role || "",
    description: agent?.description || "",
    model: agent?.model || "gpt-4",
    capabilities: agent?.capabilities?.join(", ") || "",
    status: agent?.status || "active",
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    try {
      const capabilities = formData.capabilities
        .split(",")
        .map((capability: string) => capability.trim())
        .filter(Boolean)

      const agentData = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        description: formData.description.trim(),
        model: formData.model,
        capabilities,
        status: formData.status,
        success_rate: agent?.success_rate || 0,
        parameters: agent?.parameters || {},
        updated_at: new Date().toISOString(),
      }

      if (agent) {
        const { error } = await supabase.from("ai_agents").update(agentData).eq("id", agent.id)
        if (error) throw error
        toast({ title: "Agente actualizado", description: "Los cambios se guardaron exitosamente" })
      } else {
        const { error } = await supabase
          .from("ai_agents")
          .insert([{ ...agentData, created_at: new Date().toISOString() }])
        if (error) throw error
        toast({ title: "Agente creado", description: "El nuevo agente se creó exitosamente" })
      }

      onSave()
      onClose()
    } catch (error) {
      console.error("[agents] Error saving agent:", error)
      toast({ title: "Error", description: "No se pudo guardar el agente", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof AgentFormState, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{agent ? "Editar Agente" : "Nuevo Agente"}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar formulario">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Agente</Label>
            <Input id="name" value={formData.name} onChange={(event) => updateField("name", event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Input id="role" value={formData.role} onChange={(event) => updateField("role", event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Modelo configurado</Label>
            <Input id="model" value={formData.model} onChange={(event) => updateField("model", event.target.value)} required />
            <p className="text-xs text-muted-foreground">Este campo registra configuración; no certifica disponibilidad del proveedor.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="capabilities">Capacidades (separadas por comas)</Label>
            <Input
              id="capabilities"
              value={formData.capabilities}
              onChange={(event) => updateField("capabilities", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(event) => updateField("status", event.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="training">En Entrenamiento</option>
            </select>
          </div>
          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Guardando..." : agent ? "Actualizar Agente" : "Crear Agente"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

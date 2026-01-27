"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, Trash2, MapPin, Users, Mail, CheckSquare } from "lucide-react"

interface Tag {
  id: string
  name: string
}

interface TagEntity {
  type: "campo" | "client" | "communication" | "task"
  count: number
  entities: any[]
}

export default function TagsAdminPage() {
  const supabase = createBrowserClient()
  const [tags, setTags] = useState<Tag[]>([])
  const [tagEntities, setTagEntities] = useState<Record<string, TagEntity>>({})
  const [newTagName, setNewTagName] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    loadTags()
  }, [])

  useEffect(() => {
    if (selectedTag) {
      loadTagEntities(selectedTag)
    }
  }, [selectedTag])

  const loadTags = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("tags").select("id, name").order("name")
      if (error) throw error
      setTags(data || [])
      if (data && data.length > 0) {
        setSelectedTag(data[0].id)
      }
    } catch (error) {
      console.error("[v0] Error loading tags:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTagEntities = async (tagId: string) => {
    try {
      // Load KMZ files with this tag
      const { data: kmzWithTag } = await supabase
        .from("kmz_tags")
        .select("kmz_id, kmz_collection(id, file_name, region)")
        .eq("tag_id", tagId)
        .limit(50)

      // Load clients with this tag
      const { data: clientsWithTag } = await supabase
        .from("client_tags")
        .select("client_id, clients(id, first_name, last_name, email)")
        .eq("tag_id", tagId)
        .limit(50)

      // Load communications with this tag
      const { data: commsWithTag } = await supabase
        .from("communication_tags")
        .select("communication_id, client_communications(id, subject, communication_type)")
        .eq("tag_id", tagId)
        .limit(50)

      // Load tasks with this tag
      const { data: tasksWithTag } = await supabase
        .from("task_tags")
        .select("task_id, tasks(id, title, status)")
        .eq("tag_id", tagId)
        .limit(50)

      setTagEntities({
        campo: {
          type: "campo",
          count: kmzWithTag?.length || 0,
          entities: kmzWithTag?.map((item: any) => item.kmz_collection) || [],
        },
        client: {
          type: "client",
          count: clientsWithTag?.length || 0,
          entities: clientsWithTag?.map((item: any) => item.clients) || [],
        },
        communication: {
          type: "communication",
          count: commsWithTag?.length || 0,
          entities: commsWithTag?.map((item: any) => item.client_communications) || [],
        },
        task: {
          type: "task",
          count: tasksWithTag?.length || 0,
          entities: tasksWithTag?.map((item: any) => item.tasks) || [],
        },
      })
    } catch (error) {
      console.error("[v0] Error loading tag entities:", error)
    }
  }

  const createTag = async () => {
    if (!newTagName.trim()) return
    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({ name: newTagName.toLowerCase().trim() })
        .select()
      if (error) throw error
      setTags([...tags, data[0]])
      setNewTagName("")
    } catch (error) {
      console.error("[v0] Error creating tag:", error)
    }
  }

  const deleteTag = async (tagId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este tag?")) return
    try {
      const { error } = await supabase.from("tags").delete().eq("id", tagId)
      if (error) throw error
      setTags(tags.filter((t) => t.id !== tagId))
      if (selectedTag === tagId) {
        setSelectedTag(tags[0]?.id || null)
      }
    } catch (error) {
      console.error("[v0] Error deleting tag:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Administración de Tags</h1>
        <p className="text-gray-600">Gestiona tags transversales para campos, clientes, comunicaciones y tareas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear nuevo tag</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Nombre del tag (ej: arándanos, volcán)"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && createTag()}
          />
          <Button onClick={createTag} disabled={!newTagName.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Crear
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Tags disponibles ({tags.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tags.length === 0 ? (
              <p className="text-sm text-gray-500">No hay tags disponibles</p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-2 transition-colors ${
                    selectedTag === tag.id ? "border-sage bg-sage/10" : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedTag(tag.id)}
                >
                  <span className="text-sm font-medium">{tag.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteTag(tag.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">
              Entidades con tag:{" "}
              <Badge className="ml-2 bg-sage">{selectedTag ? tags.find((t) => t.id === selectedTag)?.name : ""}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTag ? (
              <Tabs defaultValue="campo" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="campo">
                    <MapPin className="mr-2 h-4 w-4" />
                    Campos ({tagEntities.campo?.count || 0})
                  </TabsTrigger>
                  <TabsTrigger value="client">
                    <Users className="mr-2 h-4 w-4" />
                    Clientes ({tagEntities.client?.count || 0})
                  </TabsTrigger>
                  <TabsTrigger value="communication">
                    <Mail className="mr-2 h-4 w-4" />
                    Comunicaciones ({tagEntities.communication?.count || 0})
                  </TabsTrigger>
                  <TabsTrigger value="task">
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Tareas ({tagEntities.task?.count || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="campo" className="space-y-2">
                  {tagEntities.campo?.entities?.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay campos con este tag</p>
                  ) : (
                    tagEntities.campo?.entities?.map((entity) => (
                      <div key={entity.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{entity.file_name}</p>
                          <p className="text-sm text-gray-600">{entity.region || "Sin región"}</p>
                        </div>
                        <MapPin className="h-4 w-4 text-gray-400" />
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="client" className="space-y-2">
                  {tagEntities.client?.entities?.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay clientes con este tag</p>
                  ) : (
                    tagEntities.client?.entities?.map((entity) => (
                      <div key={entity.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">
                            {entity.first_name} {entity.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{entity.email}</p>
                        </div>
                        <Users className="h-4 w-4 text-gray-400" />
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="communication" className="space-y-2">
                  {tagEntities.communication?.entities?.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay comunicaciones con este tag</p>
                  ) : (
                    tagEntities.communication?.entities?.map((entity) => (
                      <div key={entity.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{entity.subject}</p>
                          <p className="text-sm text-gray-600">{entity.communication_type}</p>
                        </div>
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="task" className="space-y-2">
                  {tagEntities.task?.entities?.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay tareas con este tag</p>
                  ) : (
                    tagEntities.task?.entities?.map((entity) => (
                      <div key={entity.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{entity.title}</p>
                          <p className="text-sm text-gray-600">{entity.status}</p>
                        </div>
                        <CheckSquare className="h-4 w-4 text-gray-400" />
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <p className="text-gray-500">Selecciona un tag para ver las entidades asociadas</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cómo probar la búsqueda universal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>1. Abre la búsqueda universal</strong> presionando <kbd className="rounded bg-gray-200 px-2 py-1">⌘K</kbd>{" "}
            (Mac) o <kbd className="rounded bg-gray-200 px-2 py-1">Ctrl+K</kbd> (Windows)
          </p>
          <p>
            <strong>2. Busca por nombre:</strong> Escribe "vial", "procasa" o cualquier cliente/campo existente
          </p>
          <p>
            <strong>3. Busca por tag:</strong> Escribe "arándanos", "volcán", "viña", "frutilla" o "hortalizas" para ver
            todos los campos, clientes, comunicaciones y tareas con ese tag
          </p>
          <p className="text-gray-600">
            Los resultados mostrarán entidades etiquetadas de forma transversal, agrupadas por tipo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

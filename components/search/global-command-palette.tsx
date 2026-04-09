"use client"

import type React from "react"
import { NeighborhoodAnalysisModal } from "@/components/kmz/neighborhood-analysis-modal"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Search, FileText, Users, MapPin, MessageSquare, CheckSquare, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { normalizeString, matchesQuery } from "@/lib/utils/normalize-string"
import { propertyDocuments } from "@/lib/data/documents" // Declare the variable here

interface SearchResult {
  id: string
  type: "client" | "campo" | "document" | "message" | "task" | "communication"
  title: string
  subtitle?: string
  description?: string
  metadata?: any
  url: string
  icon: React.ReactNode
}

export function GlobalCommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [selectedCampoForAnalysis, setSelectedCampoForAnalysis] = useState<any>(null)
  const [selectedCampoName, setSelectedCampoName] = useState<string | null>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      console.log("[v0] Search query too short:", searchQuery?.length)
      setResults([])
      return
    }

    console.log("[v0] Performing search for:", searchQuery)
    setIsSearching(true)
    const allResults: SearchResult[] = []
    const seenIds = new Set<string>() // Deduplication

    try {
      // Execute all searches in PARALLEL for better performance
      const [
        clientsResult,
        camposResult,
        docsResult,
        messagesResult,
        communicationsResult,
        tasksResult,
        tagsResult,
      ] = await Promise.all([
        // Search CLIENTS
        supabase
          .from("clients")
          .select("id, first_name, last_name, email, phone, company_name, status, main_interest")
          .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%,main_interest.ilike.%${searchQuery}%`)
          .limit(15),

        // Search CAMPOS (KMZ files)
        supabase
          .from("kmz_collection")
          .select("id, file_name, region, description, placemarks_count, category, tags")
          .or(`file_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,region.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
          .limit(15),

        // Search DOCUMENTS linked to KMZ
        supabase
          .from("document_kmz_links")
          .select(
            `document_id, documents(id, title, description, document_type, status, file_name, created_at), kmz_collection(id, file_name, region)`,
          )
          .or(
            `documents.title.ilike.%${searchQuery}%,documents.description.ilike.%${searchQuery}%,kmz_collection.file_name.ilike.%${searchQuery}%`,
          )
          .limit(8),

        // Search MESSAGES
        supabase
          .from("messages")
          .select("id, name, email, subject, message, status, created_at")
          .ilike("subject", `%${searchQuery}%`)
          .or(`message.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(5),

        // Search CLIENT COMMUNICATIONS
        supabase
          .from("client_communications")
          .select(
            `id, subject, content, communication_type, communication_date, created_by, client_id, 
             clients(first_name, last_name, company_name)`,
          )
          .ilike("subject", `%${searchQuery}%`)
          .or(
            `content.ilike.%${searchQuery}%,communication_type.ilike.%${searchQuery}%,created_by.ilike.%${searchQuery}%,clients.first_name.ilike.%${searchQuery}%,clients.last_name.ilike.%${searchQuery}%,clients.company_name.ilike.%${searchQuery}%`,
          )
          .order("communication_date", { ascending: false })
          .limit(15),

        // Search TASKS
        supabase
          .from("tasks")
          .select("id, title, description, status, priority, location, due_date")
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,status.ilike.%${searchQuery}%`)
          .limit(15),

        // Search TAGS
        supabase
          .from("tags")
          .select("id, name")
          .ilike("name", `%${searchQuery}%`)
          .limit(5),
      ])

      console.log("[v0] Search results - clients:", clientsResult.data?.length, "campos:", camposResult.data?.length, "docs:", docsResult.data?.length)

      // Process CLIENTS
      const clients = clientsResult.data || []
      clients.slice(0, 15).forEach((client) => {
        const id = `client-${client.id}`
        if (!seenIds.has(id)) {
          seenIds.add(id)
          allResults.push({
            id: client.id,
            type: "client" as const,
            title: `${client.first_name || ""} ${client.last_name || ""}`.trim() || client.company_name || "Cliente",
            subtitle: client.email || client.phone || "",
            description: client.main_interest || client.company_name || "",
            metadata: { status: client.status },
            url: `/gestion-clientes?client=${client.id}`,
            icon: <Users className="h-4 w-4" />,
          })
        }
      })

      // Process CAMPOS
      const campos = camposResult.data || []
      campos.slice(0, 15).forEach((campo) => {
        const id = `campo-${campo.id}`
        if (!seenIds.has(id)) {
          seenIds.add(id)
          allResults.push({
            id: campo.id,
            type: "campo" as const,
            title: campo.file_name,
            subtitle: campo.region || "Sin región",
            description: campo.description || `${campo.placemarks_count || 0} puntos de interés`,
            metadata: { category: campo.category, tags: campo.tags },
            url: `/campos?file=${campo.id}`,
            icon: <MapPin className="h-4 w-4" />,
          })
        }
      })

      // Process DOCUMENTS
      const docs = docsResult.data || []
      docs.slice(0, 15).forEach((link: any) => {
        if (link.documents && link.kmz_collection) {
          const id = `doc-${link.document_id}`
          if (!seenIds.has(id)) {
            seenIds.add(id)
            allResults.push({
              id: link.document_id,
              type: "document" as const,
              title: link.documents.title || link.documents.file_name || "Documento",
              subtitle: `${link.kmz_collection.file_name} • Documento`,
              description: link.documents.description || new Date(link.documents.created_at).toLocaleDateString("es-CL"),
              metadata: {
                status: link.documents.status,
                type: link.documents.document_type,
                kmzId: link.kmz_collection.id,
              },
              url: `/busqueda?doc=${link.document_id}`,
              icon: <FileText className="h-4 w-4" />,
            })
          }
        }
      })

      // Process MESSAGES
      const messages = messagesResult.data || []
      messages.slice(0, 5).forEach((msg) => {
        const id = `msg-${msg.id}`
        if (!seenIds.has(id)) {
          seenIds.add(id)
          allResults.push({
            id: msg.id.toString(),
            type: "message" as const,
            title: msg.subject || msg.name || "Mensaje",
            subtitle: msg.email || msg.name || "",
            description: msg.message?.substring(0, 60) || "",
            metadata: { status: msg.status },
            url: `/comunicaciones?message=${msg.id}`,
            icon: <MessageSquare className="h-4 w-4" />,
          })
        }
      })

      // Process COMMUNICATIONS
      const communications = communicationsResult.data || []
      communications.slice(0, 15).forEach((comm: any) => {
        const id = `comm-${comm.id}`
        if (!seenIds.has(id)) {
          seenIds.add(id)
          const clientName = comm.clients
            ? `${comm.clients.first_name || ""} ${comm.clients.last_name || ""}`.trim() || comm.clients.company_name
            : "Sin cliente"
          allResults.push({
            id: comm.id,
            type: "communication" as const,
            title: comm.subject || "Comunicación",
            subtitle: `${clientName} • ${comm.communication_type || "Comunicación"}`,
            description: comm.content?.substring(0, 70) || `Por: ${comm.created_by || "Sistema"}`,
            metadata: {
              type: comm.communication_type,
              created_by: comm.created_by,
              client_id: comm.client_id,
            },
            url: `/comunicaciones?comm=${comm.id}`,
            icon: <Mail className="h-4 w-4" />,
          })
        }
      })

      // Process TASKS
      const tasksList = tasksResult.data || []
      tasksList.slice(0, 15).forEach((task) => {
        const id = `task-${task.id}`
        if (!seenIds.has(id)) {
          seenIds.add(id)
          allResults.push({
            id: task.id,
            type: "task" as const,
            title: task.title || "Tarea",
            subtitle: task.location || task.status || "Tarea",
            description: task.description || (task.due_date ? `Vence: ${new Date(task.due_date).toLocaleDateString()}` : ""),
            metadata: { status: task.status, priority: task.priority },
            url: `/tareas?task=${task.id}`,
            icon: <CheckSquare className="h-4 w-4" />,
          })
        }
      })

      // Process TAGS - Search entities with matching tags
      const tags = tagsResult.data || []
      if (tags.length > 0) {
        for (const tag of tags) {
          // Search KMZ files with this tag
          const { data: kmzWithTag } = await supabase
            .from("kmz_tags")
            .select("kmz_id, kmz_collection(id, file_name, region, placemarks_count)")
            .eq("tag_id", tag.id)
            .limit(10)

          if (kmzWithTag) {
            kmzWithTag
              .filter((item: any) => item.kmz_collection)
              .slice(0, 5)
              .forEach((item: any) => {
                const id = `tag-kmz-${item.kmz_id}`
                if (!seenIds.has(id)) {
                  seenIds.add(id)
                  allResults.push({
                    id: item.kmz_id,
                    type: "campo" as const,
                    title: item.kmz_collection.file_name,
                    subtitle: `${item.kmz_collection.region || "Sin región"} • Tag: ${tag.name}`,
                    description: `${item.kmz_collection.placemarks_count || 0} puntos de interés`,
                    metadata: { region: item.kmz_collection.region, tag: tag.name },
                    url: `/campos?file=${item.kmz_id}`,
                    icon: <MapPin className="h-4 w-4" />,
                  })
                }
              })
          }

          // Search clients with this tag
          const { data: clientsWithTag } = await supabase
            .from("client_tags")
            .select("client_id, clients(id, first_name, last_name, email, phone, company_name)")
            .eq("tag_id", tag.id)
            .limit(10)

          if (clientsWithTag) {
            clientsWithTag
              .filter((item: any) => item.clients)
              .slice(0, 5)
              .forEach((item: any) => {
                const id = `tag-client-${item.client_id}`
                if (!seenIds.has(id)) {
                  seenIds.add(id)
                  allResults.push({
                    id: item.client_id,
                    type: "client" as const,
                    title: `${item.clients.first_name || ""} ${item.clients.last_name || ""}`.trim() || item.clients.company_name || item.clients.email,
                    subtitle: `${item.clients.email || ""} • Tag: ${tag.name}`,
                    description: item.clients.phone || item.clients.company_name || "",
                    metadata: { email: item.clients.email, tag: tag.name },
                    url: `/gestion-clientes?client=${item.client_id}`,
                    icon: <Users className="h-4 w-4" />,
                  })
                }
              })
          }

          // Search communications with this tag
          const { data: commsWithTag } = await supabase
            .from("communication_tags")
            .select(
              "communication_id, client_communications(id, subject, communication_type, created_by, clients(first_name, last_name))",
            )
            .eq("tag_id", tag.id)
            .limit(10)

          if (commsWithTag) {
            commsWithTag
              .filter((item: any) => item.client_communications)
              .slice(0, 5)
              .forEach((item: any) => {
                const id = `tag-comm-${item.communication_id}`
                if (!seenIds.has(id)) {
                  seenIds.add(id)
                  const comm = item.client_communications
                  allResults.push({
                    id: item.communication_id,
                    type: "communication" as const,
                    title: comm.subject || "Comunicación",
                    subtitle: `${comm.communication_type || "Comunicación"} • Tag: ${tag.name}`,
                    description: `Por: ${comm.created_by || "Sistema"}`,
                    metadata: { type: comm.communication_type, tag: tag.name },
                    url: `/comunicaciones?comm=${item.communication_id}`,
                    icon: <Mail className="h-4 w-4" />,
                  })
                }
              })
          }

          // Search tasks with this tag
          const { data: tasksWithTag } = await supabase
            .from("task_tags")
            .select("task_id, tasks(id, title, status, priority, due_date)")
            .eq("tag_id", tag.id)
            .limit(10)

          if (tasksWithTag) {
            tasksWithTag
              .filter((item: any) => item.tasks)
              .slice(0, 5)
              .forEach((item: any) => {
                const id = `tag-task-${item.task_id}`
                if (!seenIds.has(id)) {
                  seenIds.add(id)
                  const task = item.tasks
                  allResults.push({
                    id: item.task_id,
                    type: "task" as const,
                    title: task.title || "Tarea",
                    subtitle: `${task.status || "Tarea"} • Tag: ${tag.name}`,
                    description: task.due_date ? `Vence: ${new Date(task.due_date).toLocaleDateString()}` : "",
                    metadata: { status: task.status, priority: task.priority, tag: tag.name },
                    url: `/tareas?task=${item.task_id}`,
                    icon: <CheckSquare className="h-4 w-4" />,
                  })
                }
              })
          }
        }
      }

      setResults(allResults.slice(0, 100)) // Increase total limit to 100 for more comprehensive results
      console.log("[v0] Final results count:", allResults.length)
    } catch (error) {
      console.error("[v0] Search error:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, performSearch])

  const handleSelect = (result: SearchResult) => {
    if (result.type === "campo") {
      setSelectedCampoForAnalysis(result)
      setShowAnalysisModal(true)
      setOpen(false)
    } else {
      setOpen(false)
      setQuery("")
      router.push(result.url)
    }
  }

  const handleAnalyzeKMZ = () => {
    if (selectedCampoForAnalysis) {
      setShowAnalysisModal(false)
      setSelectedCampoForAnalysis(null)
      router.push("/kmz-analisis")
    }
  }

  const getTypeLabel = (type: SearchResult["type"]) => {
    const labels = {
      client: "Cliente",
      campo: "Campo",
      document: "Documento",
      message: "Mensaje",
      task: "Tarea",
      communication: "Comunicación",
    }
    return labels[type]
  }

  const getStatusColor = (status?: string) => {
    if (!status) return "default"
    const statusLower = status.toLowerCase()
    if (statusLower.includes("hot") || statusLower.includes("activ") || statusLower.includes("vigente"))
      return "destructive"
    if (statusLower.includes("warm") || statusLower.includes("pendiente")) return "default"
    if (statusLower.includes("cold") || statusLower.includes("archivado")) return "secondary"
    return "default"
  }

  // Group results by type
  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) acc[result.type] = []
      acc[result.type].push(result)
      return acc
    },
    {} as Record<SearchResult["type"], SearchResult[]>,
  )

  return (
    <>
      {/* Global search button in UI */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors border rounded-md hover:bg-accent"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar en todo...</span>
        <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <NeighborhoodAnalysisModal
        open={showAnalysisModal}
        onOpenChange={setShowAnalysisModal}
        kmzName={selectedCampoName || undefined}
      />

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar clientes, campos, documentos, mensajes..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>{isSearching ? "Buscando..." : "No se encontraron resultados."}</CommandEmpty>

          {Object.entries(groupedResults).map(([type, items], index) => (
            <div key={type}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={getTypeLabel(type as SearchResult["type"])}>
                {items.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.title}
                    onSelect={() => {
                      if (result.type === "campo") {
                        setSelectedCampoForAnalysis(result)
                        setShowAnalysisModal(true)
                        setOpen(false)
                      } else {
                        handleSelect(result)
                      }
                    }}
                    className="flex items-start gap-3 py-3"
                  >
                    <div className="mt-0.5">{result.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{result.title}</span>
                        {result.metadata?.status && (
                          <Badge variant={getStatusColor(result.metadata.status)} className="text-xs">
                            {result.metadata.status}
                          </Badge>
                        )}
                      </div>
                      {result.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                      )}
                      {result.description && (
                        <div className="text-xs text-muted-foreground/70 truncate mt-0.5">{result.description}</div>
                      )}
                      {result.type === "campo" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 text-xs h-6 bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCampoForAnalysis(result)
                            setShowAnalysisModal(true)
                            setOpen(false)
                          }}
                        >
                          Analizar Vecindario
                        </Button>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {getTypeLabel(result.type)}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}

          {results.length === 0 && query.length >= 2 && !isSearching && (
            <CommandGroup heading="Sugerencias">
              <CommandItem disabled className="text-sm text-muted-foreground">
                Intenta buscar por nombre, email, ubicación, o palabras clave
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}

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
      setResults([])
      return
    }

    setIsSearching(true)
    const allResults: SearchResult[] = []
    const normalizedQuery = normalizeString(searchQuery)

    try {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, first_name, last_name, email, phone, company_name, status, main_interest")
        .limit(100)

      if (clients) {
        const filteredClients = clients.filter((c) => {
          const searchString =
            `${c.first_name || ""} ${c.last_name || ""} ${c.email || ""} ${c.company_name || ""} ${c.phone || ""} ${c.main_interest || ""}`.toLowerCase()
          const normalizedQueryStr = searchQuery.toLowerCase()
          return searchString.includes(normalizedQueryStr)
        })

        const sortedClients = filteredClients.sort((a, b) => {
          const aName = `${a.first_name} ${a.last_name}`.toLowerCase()
          const bName = `${b.first_name} ${b.last_name}`.toLowerCase()
          const queryLower = searchQuery.toLowerCase()

          const aStarts = aName.startsWith(queryLower) ? 0 : 1
          const bStarts = bName.startsWith(queryLower) ? 0 : 1

          return aStarts - bStarts
        })

        allResults.push(
          ...sortedClients.slice(0, 15).map((client) => ({
            id: client.id,
            type: "client" as const,
            title:
              `${client.first_name || ""} ${client.last_name || ""}`.trim() ||
              client.company_name ||
              "Cliente sin nombre",
            subtitle: client.email || client.phone || "",
            description: client.main_interest || client.company_name || "",
            metadata: { status: client.status },
            url: `/gestion-clientes?client=${client.id}`,
            icon: <Users className="h-4 w-4" />,
          })),
        )
      }

      // Search CAMPOS (KMZ files)
      const { data: campos } = await supabase
        .from("kmz_collection")
        .select("id, file_name, region, description, placemarks_count, category, tags, coordinates")
        .limit(100)

      if (campos) {
        const filteredCampos = campos.filter((c) =>
          matchesQuery(`${c.file_name} ${c.description} ${c.region}`, searchQuery),
        )
        const sortedCampos = filteredCampos.sort((a, b) => {
          const aName = normalizeString(a.file_name)
          const bName = normalizeString(b.file_name)
          const normalizedQuery = normalizeString(searchQuery)

          const aStartsWith = aName.startsWith(normalizedQuery) ? 0 : 1
          const bStartsWith = bName.startsWith(normalizedQuery) ? 0 : 1

          return aStartsWith - bStartsWith
        })
        allResults.push(
          ...sortedCampos.slice(0, 10).map((campo) => {
            const locationDisplay = campo.region || "Sin región"

            if (campo.coordinates && Array.isArray(campo.coordinates) && campo.coordinates.length > 0) {
              const centerCoord = campo.coordinates[Math.floor(campo.coordinates.length / 2)]
              if (Array.isArray(centerCoord) && centerCoord.length >= 2) {
                // In the future, we can use reverseGeocoder here to get comuna
              }
            }

            return {
              id: campo.id,
              type: "campo" as const,
              title: campo.file_name,
              subtitle: locationDisplay,
              description: campo.description || `${campo.placemarks_count || 0} puntos de interés`,
              metadata: { category: campo.category, tags: campo.tags, coordinates: campo.coordinates },
              url: `/campos?file=${campo.id}`,
              icon: <MapPin className="h-4 w-4" />,
            }
          }),
        )
      }

      // Search DOCUMENTS linked to KMZ files (via document_kmz_links)
      const { data: linkedDocuments } = await supabase
        .from("document_kmz_links")
        .select(
          `
          document_id,
          documents (
            id,
            title,
            description,
            document_type,
            status,
            file_name,
            created_at
          ),
          kmz_collection (
            id,
            file_name,
            region
          )
        `,
        )
        .limit(100)

      if (linkedDocuments) {
        const filteredLinkedDocs = linkedDocuments
          .filter((link: any) => {
            const doc = link.documents
            const kmz = link.kmz_collection
            if (!doc || !kmz) return false
            const docSearchString = `${doc.title} ${doc.description} ${doc.file_name}`.toLowerCase()
            const kmzSearchString = `${kmz.file_name} ${kmz.region}`.toLowerCase()
            const queryLower = searchQuery.toLowerCase()
            return docSearchString.includes(queryLower) || kmzSearchString.includes(queryLower)
          })
          .map((link: any) => {
            const doc = link.documents
            const kmz = link.kmz_collection
            const aName = normalizeString(doc.title || "")
            const bQuery = normalizeString(searchQuery)
            const priority = aName.startsWith(bQuery) ? 0 : 1

            return {
              link,
              priority,
              title: doc.title || doc.file_name || "Documento sin título",
              subtitle: kmz.file_name || "Campo",
              description: doc.description || new Date(doc.created_at).toLocaleDateString("es-CL"),
            }
          })
          .sort((a, b) => a.priority - b.priority)
          .slice(0, 20)

        allResults.push(
          ...filteredLinkedDocs.map((item: any) => ({
            id: item.link.document_id,
            type: "document" as const,
            title: item.title,
            subtitle: `${item.subtitle} • Documento vinculado`,
            description: item.description,
            metadata: {
              status: item.link.documents.status,
              type: item.link.documents.document_type,
              kmzId: item.link.kmz_id,
              kmzName: item.subtitle,
            },
            url: `/busqueda?doc=${item.link.document_id}&kmz=${item.link.kmz_id}`,
            icon: <FileText className="h-4 w-4" />,
          })),
        )
      }

      // Search standalone DOCUMENTS (property_documents)

      if (propertyDocuments) {
        const filteredDocuments = propertyDocuments.filter((d) =>
          matchesQuery(`${d.title} ${d.description} ${d.file_name}`, searchQuery),
        )
        allResults.push(
          ...filteredDocuments.map((doc) => ({
            id: doc.id,
            type: "document" as const,
            title: doc.title || doc.file_name || "Documento sin título",
            subtitle: doc.document_type || "Documento",
            description: doc.description || new Date(doc.created_at).toLocaleDateString(),
            metadata: { status: doc.status, type: doc.document_type },
            url: `/busqueda?doc=${doc.id}`,
            icon: <FileText className="h-4 w-4" />,
          })),
        )
      }

      const { data: folders } = await supabase.from("folders").select("id, name, created_at").limit(10)

      if (folders) {
        const filteredFolders = folders.filter((f) => matchesQuery(`${f.name}`, searchQuery))
        allResults.push(
          ...filteredFolders.map((folder) => ({
            id: folder.id,
            type: "document" as const,
            title: folder.name,
            subtitle: "Carpeta",
            description: new Date(folder.created_at).toLocaleDateString(),
            metadata: { type: "folder" },
            url: `/busqueda?folder=${folder.id}`,
            icon: <FileText className="h-4 w-4" />,
          })),
        )
      }

      // Search MESSAGES
      const { data: messages } = await supabase
        .from("messages")
        .select("id, name, email, subject, message, status, created_at")
        .limit(10)

      if (messages) {
        const filteredMessages = messages.filter((m) =>
          matchesQuery(`${m.name} ${m.email} ${m.subject} ${m.message}`, searchQuery),
        )
        allResults.push(
          ...filteredMessages.map((msg) => ({
            id: msg.id.toString(),
            type: "message" as const,
            title: msg.subject || msg.name || "Mensaje sin asunto",
            subtitle: msg.email || msg.name || "",
            description: msg.message?.substring(0, 80) || new Date(msg.created_at).toLocaleDateString(),
            metadata: { status: msg.status },
            url: `/comunicaciones?message=${msg.id}`,
            icon: <MessageSquare className="h-4 w-4" />,
          })),
        )
      }

      // Search CLIENT COMMUNICATIONS - Enhanced with more fields
      const { data: communications } = await supabase
        .from("client_communications")
        .select("id, subject, content, communication_type, communication_date, created_by, client_id")
        .order("communication_date", { ascending: false })
        .limit(20)

      if (communications) {
        const filteredCommunications = communications.filter((c) =>
          matchesQuery(`${c.subject} ${c.content} ${c.created_by} ${c.communication_type}`, searchQuery),
        )
        const sortedCommunications = filteredCommunications.sort((a, b) => {
          const aSubject = normalizeString(a.subject || "")
          const bSubject = normalizeString(b.subject || "")
          const normalizedQuery = normalizeString(searchQuery)

          const aStartsWith = aSubject.startsWith(normalizedQuery) ? 0 : 1
          const bStartsWith = bSubject.startsWith(normalizedQuery) ? 0 : 1

          return aStartsWith - bStartsWith || new Date(b.communication_date).getTime() - new Date(a.communication_date).getTime()
        })
        
        allResults.push(
          ...sortedCommunications.slice(0, 10).map((comm) => ({
            id: comm.id,
            type: "communication" as const,
            title: comm.subject || "Comunicación sin asunto",
            subtitle: `${comm.communication_type || "Comunicación"} • ${comm.created_by || "Sistema"}`,
            description: comm.content?.substring(0, 100) || new Date(comm.communication_date).toLocaleDateString("es-CL"),
            metadata: { 
              type: comm.communication_type, 
              created_by: comm.created_by,
              communication_date: comm.communication_date,
              client_id: comm.client_id
            },
            url: `/comunicaciones?comm=${comm.id}`,
            icon: <Mail className="h-4 w-4" />,
          })),
        )
      }

      // Search TASKS
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, description, status, priority, location, due_date")
        .limit(10)

      if (tasks) {
        const filteredTasks = tasks.filter((t) =>
          matchesQuery(`${t.title} ${t.description} ${t.location}`, searchQuery),
        )
        allResults.push(
          ...filteredTasks.map((task) => ({
            id: task.id,
            type: "task" as const,
            title: task.title || "Tarea sin título",
            subtitle: task.location || task.status || "Tarea",
            description:
              task.description || (task.due_date ? `Vence: ${new Date(task.due_date).toLocaleDateString()}` : ""),
            metadata: { status: task.status, priority: task.priority },
            url: `/tareas?task=${task.id}`,
            icon: <CheckSquare className="h-4 w-4" />,
          })),
        )
      }

      // Search by TAGS across all entities
      const { data: allTags } = await supabase
        .from("tags")
        .select("id, name")
        .ilike("name", `%${searchQuery}%`)
        .limit(10)

      if (allTags && allTags.length > 0) {
        for (const tag of allTags) {
          // Search KMZ files with this tag
          const { data: kmzWithTag } = await supabase
            .from("kmz_tags")
            .select("kmz_id, kmz_collection(id, file_name, region, placemarks_count)")
            .eq("tag_id", tag.id)
            .limit(5)

          if (kmzWithTag) {
            allResults.push(
              ...kmzWithTag
                .filter((item: any) => item.kmz_collection)
                .map((item: any) => ({
                  id: `tag-kmz-${item.kmz_id}`,
                  type: "campo" as const,
                  title: item.kmz_collection.file_name,
                  subtitle: `${item.kmz_collection.region || "Sin región"} • Tag: ${tag.name}`,
                  description: `${item.kmz_collection.placemarks_count || 0} puntos de interés`,
                  metadata: { region: item.kmz_collection.region, tag: tag.name },
                  url: `/campos?file=${item.kmz_id}`,
                  icon: <MapPin className="h-4 w-4" />,
                })),
            )
          }

          // Search clients with this tag
          const { data: clientsWithTag } = await supabase
            .from("client_tags")
            .select("client_id, clients(id, first_name, last_name, email, phone)")
            .eq("tag_id", tag.id)
            .limit(5)

          if (clientsWithTag) {
            allResults.push(
              ...clientsWithTag
                .filter((item: any) => item.clients)
                .map((item: any) => ({
                  id: `tag-client-${item.client_id}`,
                  type: "client" as const,
                  title: `${item.clients.first_name || ""} ${item.clients.last_name || ""}`.trim() || item.clients.email,
                  subtitle: `${item.clients.email || "Sin email"} • Tag: ${tag.name}`,
                  description: item.clients.phone || "Sin teléfono",
                  metadata: { email: item.clients.email, phone: item.clients.phone, tag: tag.name },
                  url: `/gestion-clientes?client=${item.client_id}`,
                  icon: <Users className="h-4 w-4" />,
                })),
            )
          }

          // Search communications with this tag
          const { data: commsWithTag } = await supabase
            .from("communication_tags")
            .select("communication_id, client_communications(id, subject, communication_type, created_by)")
            .eq("tag_id", tag.id)
            .limit(5)

          if (commsWithTag) {
            allResults.push(
              ...commsWithTag
                .filter((item: any) => item.client_communications)
                .map((item: any) => ({
                  id: `tag-comm-${item.communication_id}`,
                  type: "communication" as const,
                  title: item.client_communications.subject,
                  subtitle: `${item.client_communications.communication_type || "Comunicación"} • Tag: ${tag.name}`,
                  description: item.client_communications.created_by || "Sistema",
                  metadata: { type: item.client_communications.communication_type, tag: tag.name },
                  url: `/comunicaciones?comm=${item.communication_id}`,
                  icon: <Mail className="h-4 w-4" />,
                })),
            )
          }
        }
      }

      setResults(allResults)
    } catch (error) {
      console.error("[v0] Global search error:", error)
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

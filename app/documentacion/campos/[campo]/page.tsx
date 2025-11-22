"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, ArrowLeft, Upload, Folder } from "lucide-react"
import Link from "next/link"

interface CampoDocument {
  id: string
  title: string
  description: string | null
  document_type: string
  category: string
  file_url: string
  file_type: string
  file_size: number | null
  tags: string[]
  created_at: string
  created_by: string | null
}

export default function CampoDocumentationPage() {
  const params = useParams()
  const campoName = params.campo as string
  const [documents, setDocuments] = useState<CampoDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [kmzName, setKmzName] = useState<string>("")

  const supabase = createBrowserClient()

  useEffect(() => {
    loadCampoDocuments()
  }, [campoName])

  const loadCampoDocuments = async () => {
    setLoading(true)
    try {
      const searchName = campoName.replace(/_/g, " ")

      // Search documents by title matching campo name
      const { data: docsByName, error: docsError } = await supabase
        .from("property_documents")
        .select("*")
        .ilike("title", `%${searchName}%`)
        .order("created_at", { ascending: false })

      if (docsError) throw docsError

      const { data: kmzFiles, error: kmzError } = await supabase
        .from("kmz_collection")
        .select("id, file_name")
        .ilike("file_name", `%${searchName}%`)

      let allDocs = docsByName || []

      if (!kmzError && kmzFiles && kmzFiles.length > 0) {
        const kmzId = kmzFiles[0].id
        setKmzName(kmzFiles[0].file_name)

        // Load documents linked to this KMZ by ID
        const { data: docsByKmz, error: linkedError } = await supabase
          .from("property_documents")
          .select("*")
          .contains("linked_kmz_ids", [kmzId])
          .order("created_at", { ascending: false })

        if (!linkedError && docsByKmz) {
          // Merge results, avoiding duplicates
          const existingIds = new Set(allDocs.map((d) => d.id))
          const newDocs = docsByKmz.filter((doc) => !existingIds.has(doc.id))
          allDocs = [...allDocs, ...newDocs]
        }
      }

      setDocuments(allDocs)
      console.log("[v0] Loaded", allDocs.length, "documents for campo:", searchName)
    } catch (error) {
      console.error("[v0] Error loading campo documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "N/A"
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      fotos: "bg-blue-500/10 text-blue-700 border-blue-300",
      documentos: "bg-sage/10 text-sage-dark border-sage",
      comunicaciones: "bg-purple-500/10 text-purple-700 border-purple-300",
      marketing: "bg-pink-500/10 text-pink-700 border-pink-300",
      kmz: "bg-cyan-500/10 text-cyan-700 border-cyan-300",
    }
    return colors[category] || "bg-gray-500/10 text-gray-700 border-gray-300"
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Link href="/busqueda">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a CAMPOS
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Folder className="h-6 w-6 text-sage" />
              Documentos del Campo
            </h1>
            <p className="text-muted-foreground mt-1">{kmzName || campoName.replace(/_/g, " ")}</p>
          </div>

          <Button className="bg-sage hover:bg-sage-dark text-white">
            <Upload className="h-4 w-4 mr-2" />
            Subir Documento
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
        </div>
      )}

      {!loading && documents.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
          <p className="text-muted-foreground mb-4">Aún no se han agregado documentos para este campo.</p>
          <Button className="bg-sage hover:bg-sage-dark text-white">
            <Upload className="h-4 w-4 mr-2" />
            Subir Primer Documento
          </Button>
        </Card>
      )}

      {!loading && documents.length > 0 && (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-sage/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-sage" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{doc.title}</h3>
                      {doc.description && <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>}

                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className={getCategoryColor(doc.category)}>
                          {doc.category}
                        </Badge>
                        <Badge variant="outline">{doc.document_type}</Badge>
                        <Badge variant="outline">{doc.file_type}</Badge>
                        <Badge variant="outline">{formatFileSize(doc.file_size)}</Badge>
                      </div>

                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-muted rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(doc.file_url, "_blank")}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.open(doc.file_url, "_blank")}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Creado: {new Date(doc.created_at).toLocaleDateString("es-CL")}
                    {doc.created_by && ` por ${doc.created_by}`}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
